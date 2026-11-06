import path from 'node:path';
import {
  getAllConfig,
  getSession,
  setSession,
  clearSession,
  createOrder,
  getLatestOrderByPhone
} from '../db.js';
import { sendInteractiveButtons, sendUpiQrCode, sendCarouselMessage } from './buttons.js';

export function findProductMatch(products, { buttonId, incomingText, productInfo, orderInfo }) {
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const normInput = norm(incomingText);
  const normButton = norm(buttonId);
  const normProductTitle = norm(productInfo?.title);
  const normProductDesc = norm(productInfo?.description);
  const normRetailerId = norm(productInfo?.retailerId);
  const normOrderId = norm(productInfo?.productId);
  const normOrderTitle = norm(orderInfo?.orderTitle);

  // 1. If order has products fetched from WhatsApp
  if (orderInfo?.products && orderInfo.products.length > 0) {
    for (const ordProd of orderInfo.products) {
      const normOrdName = norm(ordProd.name);
      for (const p of products) {
        const normPTitle = norm(p.title);
        if (normOrdName === normPTitle || normOrdName.includes(normPTitle) || normPTitle.includes(normOrdName)) {
          return p;
        }
      }
    }
  }

  // 2. Try matching against catalogue product click info first
  if (normProductTitle || normRetailerId || normOrderId) {
    for (const p of products) {
      const normPTitle = norm(p.title);
      const normPId = norm(p.id);

      if (normRetailerId && (normRetailerId === normPId || normRetailerId === normPTitle)) {
        return p;
      }
      if (normProductTitle && (normProductTitle === normPTitle || normProductTitle.includes(normPTitle) || normPTitle.includes(normProductTitle))) {
        return p;
      }
    }
  }

  // 3. Match by order total price (e.g. ₹14,999 matches Digital Marketing, ₹4,999 matches Web Dev)
  if (orderInfo?.totalAmountRaw) {
    const rawAmt = Number(orderInfo.totalAmountRaw);
    if (rawAmt > 0) {
      const priceMatched = products.find(p => {
        const pNum = Number((p.price || '').replace(/[^0-9.]/g, ''));
        return pNum && Math.abs(pNum - rawAmt) < 2;
      });
      if (priceMatched) {
        console.log(`[Handler] Matched product by cart amount (₹${rawAmt}): ${priceMatched.title}`);
        return priceMatched;
      }
    }
  }

  // 4. Try matching order title
  if (normOrderTitle) {
    for (const p of products) {
      const normPTitle = norm(p.title);
      if (normOrderTitle === normPTitle || normOrderTitle.includes(normPTitle) || normPTitle.includes(normOrderTitle)) {
        return p;
      }
    }
  }

  // 5. Try buttonId matching
  if (buttonId) {
    for (const p of products) {
      if (p.id === buttonId) return p;
      const normPId = norm(p.id);
      if (normButton === normPId || normButton.includes(normPId)) return p;
      const normPTitle = norm(p.title);
      if (normButton === normPTitle || normButton.includes(normPTitle)) return p;
    }
  }

  // 6. Try incomingText matching
  if (normInput) {
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (normInput === String(i + 1)) return p; // "1", "2", "3", "4"
      const normPTitle = norm(p.title);
      if (normInput === normPTitle || normInput.includes(normPTitle) || normPTitle.includes(normInput)) {
        return p;
      }
    }
  }

  // 7. Keyword heuristic fallback
  const combined = [normInput, normButton, normProductTitle, normProductDesc, normOrderTitle, orderInfo?.message].filter(Boolean).join(' ');

  if (combined.includes('meta') || combined.includes('facebook') || combined.includes('insta') || combined.includes('leadgen')) {
    return products.find(p => p.id.includes('meta')) || products[0];
  }
  if (combined.includes('digital') || combined.includes('marketing') || combined.includes('360') || combined.includes('omni')) {
    return products.find(p => p.id.includes('digital')) || products[1];
  }
  if (combined.includes('seo') || combined.includes('ranking') || combined.includes('googlemap') || combined.includes('gmb') || combined.includes('keyword')) {
    return products.find(p => p.id.includes('seo')) || products[2];
  }
  if (combined.includes('web') || combined.includes('site') || combined.includes('develop') || combined.includes('landing') || combined.includes('ecommerce')) {
    return products.find(p => p.id.includes('web')) || products[3];
  }

  return null;
}

export async function handleIncomingMessage(sock, msg) {
  if (!msg || msg.isGroup || msg.isNewsletter) return;

  const ownPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : null;
  const isSelfChat = msg.jid ? msg.jid.includes(ownPhone) : false;

  // Handle self-testing vs loops
  if (msg.fromMe) {
    if (!isSelfChat) return; // Ignore outgoing messages to other people
    // Don't reply to bot's own automated output or carousel messages
    if (
      msg.text.includes('Welcome to') ||
      msg.text.includes('Booked Successfully') ||
      msg.text.includes('Project Status Update') ||
      msg.text.includes('What is your Full Name') ||
      msg.text.includes('Tap an option') ||
      msg.text.includes('Service Booked') ||
      msg.text.includes('Swipe through') ||
      msg.text.includes('Official WhatsApp Catalogue') ||
      msg.text.includes('Selected:')
    ) {
      return;
    }
  }

  const jid = msg.jid;
  const phone = msg.phone;
  const incomingText = msg.text.trim();
  const lowerText = incomingText.toLowerCase();
  const buttonId = msg.buttonId;
  const productInfo = msg.productInfo;
  const orderInfo = msg.orderInfo;

  // Skip empty system stanzas or delivery confirmations
  if (!incomingText && !buttonId && !msg.hasImage && !productInfo && !orderInfo) {
    return;
  }

  console.log(`[Handler] Processing message from ${phone}: "${incomingText}" (buttonId: "${buttonId}", product: "${productInfo?.title || ''}")`);

  const config = getAllConfig();
  const products = config.products || [];
  const productFlows = config.product_flows || {};

  // 1. Check for Global Reset / Cancel / Menu / Catalogue commands
  const isResetCmd = 
    buttonId === 'menu' ||
    buttonId === 'cancel' ||
    buttonId === 'btn_menu' ||
    ['cancel', 'reset', 'menu', 'restart', 'stop', 'end', 'exit', 'quit', 'start', 'home', 'back', 'hi', 'hello', 'hey'].includes(lowerText) ||
    lowerText === 'main menu' ||
    lowerText === 'start over' ||
    lowerText === 'cancel order' ||
    lowerText === 'catalog' ||
    lowerText === 'catalogue';

  if (isResetCmd && !productInfo && !orderInfo) {
    clearSession(phone);
    await sendWelcomeMenu(sock, jid, config, msg.pushName);
    return;
  }

  // 2. Check for Order Tracking Request
  if (buttonId === 'btn_track' || lowerText === 'track' || lowerText === 'status' || lowerText.includes('order status')) {
    await handleOrderTracking(sock, jid, phone, config);
    return;
  }

  // 3. Get or initialize customer session
  let session = getSession(phone);
  let currentStep = session ? session.step : 'IDLE';
  let draft = session ? session.draft : {};

  // Check if this incoming message is an explicit product / cart selection
  const isExplicitProductClick = 
    Boolean(productInfo) || 
    Boolean(orderInfo) || 
    products.some(p => p.id === buttonId);

  const matchedProduct = findProductMatch(products, {
    buttonId,
    incomingText,
    productInfo,
    orderInfo
  });

  const shouldStartProductFlow = 
    (isExplicitProductClick && Boolean(matchedProduct)) || 
    (currentStep === 'IDLE' && Boolean(matchedProduct));

  if (shouldStartProductFlow && matchedProduct) {
    const flow = productFlows[matchedProduct.id] || {
      id: matchedProduct.id,
      title: matchedProduct.title,
      price: matchedProduct.price,
      step1_title: "Product Options",
      step1_prompt: "Please specify your requirements:",
      step1_options: [],
      photo_prompt: config.prompt_photo || "Please send your brief/photo for this product:"
    };

    draft = {
      product_id: matchedProduct.id,
      product_name: matchedProduct.title,
      product_price: matchedProduct.price,
      flow: flow,
      photos: []
    };

    // If product has dedicated Step 1 buttons
    if (flow.step1_options && flow.step1_options.length > 0) {
      setSession(phone, 'PRODUCT_STEP1', draft);
      const step1Buttons = flow.step1_options.map(opt => ({
        type: 'quick_reply',
        text: opt.text,
        id: opt.id
      }));
      step1Buttons.push({ type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' });

      await sendInteractiveButtons(sock, jid, {
        title: flow.step1_title || matchedProduct.title,
        body: `Selected: *${matchedProduct.title}* (${matchedProduct.price || ''}) 🛍️\n\n${flow.step1_prompt || 'Please choose an option:'}`,
        footer: "Tap an option or 'Main Menu' to reset",
        buttons: step1Buttons
      });
      return;
    } else {
      // Direct text prompt
      setSession(phone, 'PRODUCT_STEP1', draft);
      await sock.sendMessage(jid, {
        text: `Selected: *${matchedProduct.title}*\n\n${flow.step1_prompt || 'Please reply with your size or specifications:'}`
      });
      return;
    }
  }

  // STATE MACHINE
  switch (currentStep) {
    case 'IDLE': {
      await sendWelcomeMenu(sock, jid, config, msg.pushName);
      break;
    }

    case 'PRODUCT_STEP1': {
      const flow = draft.flow || productFlows[draft.product_id] || {};
      let selectedOption = null;

      if (flow.step1_options && flow.step1_options.length > 0) {
        // Match button ID or number choice
        selectedOption = flow.step1_options.find(o => o.id === buttonId || o.id === incomingText) ||
          flow.step1_options.find((o, idx) => incomingText === String(idx + 1) || lowerText.includes(o.text.toLowerCase()));
      }

      draft.step1_value = selectedOption ? selectedOption.text : incomingText;
      if (!draft.step1_value) {
        await sock.sendMessage(jid, { text: "Please select an option from above or reply with your choice:" });
        return;
      }

      // Check if product has Step 2
      if (flow.step2_options && flow.step2_options.length > 0) {
        setSession(phone, 'PRODUCT_STEP2', draft);
        const step2Buttons = flow.step2_options.map(opt => ({
          type: 'quick_reply',
          text: opt.text,
          id: opt.id
        }));
        step2Buttons.push({ type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' });

        await sendInteractiveButtons(sock, jid, {
          title: flow.step2_title || "Product Customization",
          body: `Selected: *${draft.step1_value}*\n\n${flow.step2_prompt || 'Please choose your finish/border:'}`,
          footer: "Tap an option or 'Main Menu' to reset",
          buttons: step2Buttons
        });
      } else if (flow.step2_prompt) {
        // Step 2 is a custom text prompt (e.g. quote for mug or engraving name for gift)
        setSession(phone, 'PRODUCT_STEP2', draft);
        await sock.sendMessage(jid, {
          text: `Selected: *${draft.step1_value}*\n\n${flow.step2_prompt}`
        });
      } else {
        // No Step 2; move directly to photo upload
        setSession(phone, 'AWAITING_PHOTO', draft);
        await sock.sendMessage(jid, {
          text: `Selected: *${draft.step1_value}*\n\n${flow.photo_prompt || config.prompt_photo}`
        });
      }
      break;
    }

    case 'PRODUCT_STEP2': {
      const flow = draft.flow || productFlows[draft.product_id] || {};
      let selectedOption = null;

      if (flow.step2_options && flow.step2_options.length > 0) {
        selectedOption = flow.step2_options.find(o => o.id === buttonId || o.id === incomingText) ||
          flow.step2_options.find((o, idx) => incomingText === String(idx + 1) || lowerText.includes(o.text.toLowerCase()));
      }

      draft.step2_value = selectedOption ? selectedOption.text : incomingText;

      setSession(phone, 'AWAITING_PHOTO', draft);
      const specSummary = [draft.step1_value, draft.step2_value].filter(Boolean).join(' • ');
      await sock.sendMessage(jid, {
        text: `Customization: *${specSummary}* ✅\n\n${flow.photo_prompt || config.prompt_photo}`
      });
      break;
    }

    case 'AWAITING_PHOTO': {
      if (msg.hasImage) {
        try {
          const media = await msg.downloadMedia();
          if (!draft.photos) draft.photos = [];
          draft.photos.push(media.relativePath);
          setSession(phone, 'AWAITING_NAME', draft);

          const promptName = (config.prompt_name || "Photo received! ✅ What is your Full Name?")
            .replace('{name}', msg.pushName || 'there');
          await sock.sendMessage(jid, { text: promptName });
        } catch (err) {
          console.error('[Handler] Error downloading customer photo:', err);
          await sock.sendMessage(jid, {
            text: "Failed to download image. Please try sending it again or type 'skip' to continue without photo."
          });
        }
      } else if (lowerText.includes('http://') || lowerText.includes('https://') || lowerText.includes('drive.google') || lowerText.includes('wetransfer')) {
        // Customer shared a cloud link (Google Drive / iCloud / WeTransfer for albums)
        draft.photos_link = incomingText;
        setSession(phone, 'AWAITING_NAME', draft);
        await sock.sendMessage(jid, {
          text: `Photos link noted! 📁\n\nWhat is your *Full Name*?`
        });
      } else if (['skip', 'no', 'later', 'none'].includes(lowerText)) {
        setSession(phone, 'AWAITING_NAME', draft);
        const promptName = (config.prompt_name || "What is your Full Name?")
          .replace('{name}', msg.pushName || 'there');
        await sock.sendMessage(jid, { text: promptName });
      } else {
        await sock.sendMessage(jid, {
          text: "📷 Please *send or upload an image* for printing (or reply with a Drive link, or reply *skip* to proceed):"
        });
      }
      break;
    }

    case 'AWAITING_NAME': {
      if (!incomingText) {
        await sock.sendMessage(jid, { text: "Please enter your *Full Name*:" });
        return;
      }

      draft.customer_name = incomingText;
      setSession(phone, 'AWAITING_ADDRESS', draft);

      const promptAddress = (config.prompt_address || "Please share your complete Delivery Address:")
        .replace('{name}', draft.customer_name);
      await sock.sendMessage(jid, { text: promptAddress });
      break;
    }

    case 'AWAITING_ADDRESS': {
      if (!incomingText) {
        await sock.sendMessage(jid, { text: "Please provide your delivery address (street, city, pincode):" });
        return;
      }

      draft.address = incomingText;
      setSession(phone, 'AWAITING_PAYMENT', draft);

      const promptPayment = config.prompt_payment || "Please choose your preferred Payment Method:";
      await sendInteractiveButtons(sock, jid, {
        title: "💳 Payment Method",
        body: promptPayment,
        footer: "Tap a button to complete your order or Main Menu to cancel",
        buttons: [
          { type: 'quick_reply', text: '📱 Instant UPI', id: 'pay_upi' },
          { type: 'quick_reply', text: '💵 Pay on Pickup', id: 'pay_cod' },
          { type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' }
        ]
      });
      break;
    }

    case 'AWAITING_PAYMENT': {
      let paymentType = '';
      if (buttonId === 'pay_upi' || lowerText.includes('upi') || lowerText.includes('online') || lowerText === '1') {
        paymentType = 'UPI / Online QR';
      } else if (buttonId === 'pay_cod' || lowerText.includes('cash') || lowerText.includes('cod') || lowerText.includes('delivery') || lowerText === '2') {
        paymentType = 'Pay on Delivery / Pickup';
      } else {
        await sendInteractiveButtons(sock, jid, {
          title: "💳 Payment Method",
          body: "Please choose your payment option below:",
          buttons: [
            { type: 'quick_reply', text: '📱 Instant UPI', id: 'pay_upi' },
            { type: 'quick_reply', text: '💵 Pay on Pickup', id: 'pay_cod' },
            { type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' }
          ]
        });
        return;
      }

      draft.payment_type = paymentType;

      // Construct detailed specifications string from steps
      let finalDetails = [draft.step1_value, draft.step2_value].filter(Boolean).join(' • ');
      if (draft.photos_link) {
        finalDetails += ` (Cloud Link: ${draft.photos_link})`;
      }

      // Generate Order / Project ID
      const orderId = 'PRJ-' + Math.floor(10000 + Math.random() * 90000);

      // Save order to Database
      createOrder({
        id: orderId,
        phone: phone,
        customer_name: draft.customer_name,
        product_id: draft.product_id,
        product_name: draft.product_name,
        details: finalDetails || 'Standard',
        photos: draft.photos || [],
        address: draft.address,
        payment_type: draft.payment_type,
        status: 'Pending'
      });

      // Clear Session
      clearSession(phone);

      // If UPI chosen, send Instant UPI QR Code image
      if (paymentType.includes('UPI')) {
        await sendUpiQrCode(sock, jid, {
          upiId: config.upi_id || '6369134270@okbizaxis',
          upiName: config.upi_name || config.studio_name || 'Software Agency',
          orderId: orderId,
          note: `Booking ${draft.product_name}`
        });
      }

      // Format Order Confirmation Template
      const confirmTemplate = config.order_confirmed_message ||
        "🎉 *Service Booked Successfully!*\n\n*Project ID:* #{order_id}\n*Client:* {name}\n*Service:* {product}\n*Specifications:* {details}\n*Location/Company:* {address}\n*Payment Mode:* {payment_type}\n\nOur strategist has received your brief and will initiate onboarding.";

      const confirmationText = confirmTemplate
        .replace('{order_id}', orderId)
        .replace('{name}', draft.customer_name)
        .replace('{product}', draft.product_name)
        .replace('{details}', finalDetails || 'Standard')
        .replace('{photo_count}', (draft.photos || []).length)
        .replace('{address}', draft.address)
        .replace('{payment_type}', draft.payment_type);

      // Send Order Placed Confirmation with post-order buttons (Track, Call, Location)
      await sendInteractiveButtons(sock, jid, {
        title: "✅ Booking Confirmed",
        body: confirmationText,
        footer: config.studio_name || "Digital Solutions Desk",
        buttons: [
          { type: 'quick_reply', text: '📊 Track Project', id: 'btn_track' },
          { type: 'call', text: '📞 Call Lead', phone: config.studio_phone || '+916369134270' },
          { type: 'copy', text: '📍 Office Location', code: config.studio_address || 'Office Address' }
        ]
      });

      break;
    }

    default: {
      clearSession(phone);
      await sendWelcomeMenu(sock, jid, config, msg.pushName);
      break;
    }
  }
}

export async function sendWelcomeMenu(sock, jid, config, pushName) {
  const ownPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '916369134270';
  const studioName = config.studio_name || 'Apex Software & Digital Marketing';
  const welcomeText = (config.welcome_message || "Welcome to *Software & Digital Marketing Solutions* 🚀💻\n\nWe build high-converting websites, run ROI-driven Meta ad campaigns, and rank your business on Google.\n\nSwipe through our service cards below to select a plan:")
    .replace('{name}', pushName || 'there');

  const fullBody = `${welcomeText}\n\n🛍️ *Official WhatsApp Catalogue:*\nhttps://wa.me/c/${ownPhone}`;

  const carouselCards = [
    {
      title: '🎯 Meta Ads (₹999)',
      imagePath: path.resolve('assets/services/meta_ads.jpg'),
      body: 'High-ROI Facebook & Instagram ad campaigns with targeted leads.',
      buttonText: '🎯 Select Meta Ads',
      buttonId: 'prod_meta_ads'
    },
    {
      title: '🚀 Digital Marketing (₹14,999)',
      imagePath: path.resolve('assets/services/digital_marketing.jpg'),
      body: 'Complete 360° omnichannel growth, brand scaling & management.',
      buttonText: '🚀 Select 360° Plan',
      buttonId: 'prod_digital_marketing'
    },
    {
      title: '📍 SEO Enhancement (₹999)',
      imagePath: path.resolve('assets/services/seo.jpg'),
      body: 'Google Search & Google Maps Page 1 local keyword ranking.',
      buttonText: '📍 Select SEO',
      buttonId: 'prod_seo'
    },
    {
      title: '💻 Web Development (₹4,999)',
      imagePath: path.resolve('assets/services/website_dev.jpg'),
      body: 'Fast, modern & responsive business website with WhatsApp chat.',
      buttonText: '💻 Select Web Dev',
      buttonId: 'prod_web_dev'
    }
  ];

  try {
    await sendCarouselMessage(sock, jid, {
      bodyText: fullBody,
      footerText: '◄ Swipe Left / Right to Choose ►',
      cards: carouselCards
    });
  } catch (err) {
    console.warn('[WelcomeMenu] Carousel fallback to buttons:', err.message);
    const buttons = [
      {
        type: 'catalog',
        text: '🛍️ View Catalogue',
        business_phone_number: ownPhone
      },
      {
        type: 'quick_reply',
        text: '🎯 Meta Ads (₹999)',
        id: 'prod_meta_ads'
      },
      {
        type: 'quick_reply',
        text: '🚀 Digital Marketing',
        id: 'prod_digital_marketing'
      },
      {
        type: 'quick_reply',
        text: '📍 SEO Management',
        id: 'prod_seo'
      },
      {
        type: 'quick_reply',
        text: '💻 Web Development',
        id: 'prod_web_dev'
      }
    ];

    await sendInteractiveButtons(sock, jid, {
      title: `🚀 ${studioName}`,
      body: fullBody,
      footer: 'Tap an option below to proceed',
      buttons
    });
  }
}

async function handleOrderTracking(sock, jid, phone, config) {
  const order = getLatestOrderByPhone(phone);
  if (!order) {
    await sendInteractiveButtons(sock, jid, {
      title: "📊 Project Tracking",
      body: "We couldn't find any recent projects or bookings placed from this WhatsApp number.\n\nWould you like to explore our services?",
      buttons: [
        { type: 'quick_reply', text: '🚀 Explore Services', id: 'menu' },
        { type: 'call', text: '📞 Call Agency', phone: config.studio_phone || '+916369134270' }
      ]
    });
    return;
  }

  const template = config.tracking_message ||
    "📊 *Project Status Update*\n\n*Project ID:* #{order_id}\n*Service:* {product}\n*Current Status:* *{status}*\n*Lead Specialist:* Assigned & Reviewing\n\nThank you for choosing our digital solutions! 🚀";

  const msg = template
    .replace('{order_id}', order.id)
    .replace('{product}', order.product_name)
    .replace('{status}', order.status.toUpperCase());

  await sendInteractiveButtons(sock, jid, {
    title: `📊 Project #${order.id}`,
    body: msg,
    footer: `Booked on: ${new Date(order.created_at).toLocaleDateString()}`,
    buttons: [
      { type: 'quick_reply', text: '🔄 Refresh Status', id: 'btn_track' },
      { type: 'call', text: '📞 Call Lead', phone: config.studio_phone || '+916369134270' },
      { type: 'quick_reply', text: '🚀 New Project', id: 'menu' }
    ]
  });
}
