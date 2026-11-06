import path from 'node:path';
import {
  getAllConfig,
  getSession,
  setSession,
  clearSession,
  createOrder,
  getLatestOrderByPhone,
  getAllOrdersByPhone
} from '../db.js';
import { sendInteractiveButtons, sendUpiQrCode, sendCarouselMessage } from './buttons.js';

export function extractPrice(str) {
  if (!str) return 0;
  const match = str.match(/₹\s*([0-9,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }
  const digits = str.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

export function findProductMatch(products, { buttonId, incomingText, productInfo, orderInfo }) {
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const normInput = norm(incomingText);
  const normButton = norm(buttonId);
  const normProductTitle = norm(productInfo?.title);
  const normProductDesc = norm(productInfo?.description);
  const normRetailerId = norm(productInfo?.retailerId);
  const normOrderId = norm(productInfo?.productId);
  const normOrderTitle = norm(orderInfo?.orderTitle);

  // Direct shortcuts from Price List
  if (buttonId === 'order_a4' || normInput === 'ordera4' || normInput === 'ordera4book') {
    return products.find(p => p.id === 'prod_photobook_a4') || products[0];
  }
  if (buttonId === 'order_a3' || normInput === 'ordera3' || normInput === 'ordera3jumbo') {
    return products.find(p => p.id === 'prod_photobook_a3') || products[1];
  }
  if (buttonId === 'order_frame' || normInput === 'orderframe') {
    return products.find(p => p.id === 'prod_frames') || products[2];
  }

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

  // 3. Match by order total price
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

  if (combined.includes('a4') || combined.includes('40 page') || combined.includes('60 photo') || combined.includes('1750')) {
    return products.find(p => p.id.includes('photobook_a4')) || products[0];
  }
  if (combined.includes('a3') || combined.includes('jumbo') || combined.includes('large') || combined.includes('wedding')) {
    return products.find(p => p.id.includes('photobook_a3')) || products[1];
  }
  if (combined.includes('frame') || combined.includes('acrylic') || combined.includes('wooden') || combined.includes('wall') || combined.includes('table')) {
    return products.find(p => p.id.includes('frames')) || products[2];
  }
  if (combined.includes('price') || combined.includes('rate') || combined.includes('cost') || combined.includes('offer') || combined.includes('sheet')) {
    return products.find(p => p.id.includes('price_list')) || products[3];
  }
  if (combined.includes('book') || combined.includes('album') || combined.includes('photo')) {
    return products[0];
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
      msg.text.includes('Order Status Tracking') ||
      msg.text.includes('What is your Full Name') ||
      msg.text.includes('Tap an option') ||
      msg.text.includes('Order Confirmed') ||
      msg.text.includes('Swipe through') ||
      msg.text.includes('Official WhatsApp Catalogue') ||
      msg.text.includes('Your InstaPics Cart') ||
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

  // 1. Check for Global Reset / Cancel / Menu commands
  const isResetCmd = 
    buttonId === 'menu' ||
    buttonId === 'cancel' ||
    buttonId === 'btn_menu' ||
    ['cancel', 'reset', 'menu', 'restart', 'stop', 'end', 'exit', 'quit', 'start', 'home', 'back', 'hi', 'hello', 'hey'].includes(lowerText) ||
    lowerText === 'main menu' ||
    lowerText === 'start over' ||
    lowerText === 'cancel order';

  if (isResetCmd && !productInfo && !orderInfo) {
    clearSession(phone);
    await sendWelcomeMenu(sock, jid, config, msg.pushName);
    return;
  }

  // 2. Check for Payment Info Request
  const isPaymentCmd =
    buttonId === 'btn_payment_info' ||
    ['payment', 'payments', 'upi', 'pay', 'bank', 'account', 'qr', 'gpay', 'phonepe'].some(k => lowerText === k || lowerText.includes(k + ' info') || lowerText.includes(k + ' details'));

  if (isPaymentCmd && !productInfo && !orderInfo) {
    await sendPaymentInfoMessage(sock, jid, config);
    return;
  }

  // 3. Check for Order Tracking & History Request
  const isTrackCmd =
    buttonId === 'btn_track' ||
    buttonId === 'btn_history' ||
    ['track', 'status', 'history', 'my orders', 'order history', 'orders'].some(k => lowerText === k || lowerText.includes(k));

  if (isTrackCmd && !productInfo && !orderInfo) {
    await handleOrderHistory(sock, jid, phone, config);
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
    products.some(p => p.id === buttonId) ||
    ['order_a4', 'order_a3', 'order_frame'].includes(buttonId);

  const matchedProduct = findProductMatch(products, {
    buttonId,
    incomingText,
    productInfo,
    orderInfo
  });

  const shouldStartProductFlow = 
    (isExplicitProductClick && Boolean(matchedProduct)) || 
    (currentStep === 'IDLE' && Boolean(matchedProduct)) ||
    (currentStep === 'CART_ADDING' && Boolean(matchedProduct)) ||
    (currentStep === 'CART_REVIEW' && isExplicitProductClick && Boolean(matchedProduct));

  if (shouldStartProductFlow && matchedProduct) {
    await startProductPageSelection(sock, jid, phone, matchedProduct, config, draft);
    return;
  }

  // STATE MACHINE
  switch (currentStep) {
    case 'IDLE': {
      await sendWelcomeMenu(sock, jid, config, msg.pushName);
      break;
    }

    case 'CART_ADDING': {
      // In cart adding mode, waiting for a product selection
      if (matchedProduct) {
        await startProductPageSelection(sock, jid, phone, matchedProduct, config, draft);
        return;
      }
      if (['checkout', 'order', 'upload', 'proceed', 'done', 'next', 'buy'].includes(lowerText)) {
        setSession(phone, 'AWAITING_PHOTO', draft);
        await sock.sendMessage(jid, {
          text: "📸 *Step 1/3: Send Photos* ✨\n\nGreat! Please upload your photos directly here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* (ensure link sharing is set to 'Anyone with link').\n\n_(Reply 'skip' if you wish to share photos after ordering)_"
        });
        return;
      }
      await sendWelcomeMenu(sock, jid, config, msg.pushName);
      break;
    }

    case 'PRODUCT_STEP1': {
      const flow = draft.flow || productFlows[draft.product_id] || {};
      let selectedOption = null;

      // Handle shortcuts if clicked from price list
      if (buttonId === 'order_a4' || incomingText === 'order_a4') {
        const a4 = products.find(p => p.id === 'prod_photobook_a4');
        if (a4) return startProductPageSelection(sock, jid, phone, a4, config, draft);
      }
      if (buttonId === 'order_a3' || incomingText === 'order_a3') {
        const a3 = products.find(p => p.id === 'prod_photobook_a3');
        if (a3) return startProductPageSelection(sock, jid, phone, a3, config, draft);
      }
      if (buttonId === 'order_frame' || incomingText === 'order_frame') {
        const frame = products.find(p => p.id === 'prod_frames');
        if (frame) return startProductPageSelection(sock, jid, phone, frame, config, draft);
      }

      if (flow.step1_options && flow.step1_options.length > 0) {
        selectedOption = flow.step1_options.find(o => o.id === buttonId || o.id === incomingText) ||
          flow.step1_options.find((o, idx) => incomingText === String(idx + 1) || lowerText.includes(o.text.toLowerCase()));
      }

      const optionText = selectedOption ? selectedOption.text : incomingText;
      if (!optionText) {
        await sock.sendMessage(jid, { text: "Please select an option from above or reply with your choice:" });
        return;
      }

      // Check if product has Step 2
      if (flow.step2_options && flow.step2_options.length > 0) {
        draft.step1_value = optionText;
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
        return;
      }

      // Add item to multi-product Cart!
      const itemPrice = extractPrice(optionText) || extractPrice(draft.product_price);
      if (!Array.isArray(draft.cart)) draft.cart = [];

      draft.cart.push({
        id: selectedOption ? selectedOption.id : ('item_' + Date.now()),
        productId: draft.product_id,
        productName: draft.product_name,
        option: optionText,
        price: itemPrice
      });

      // Clear current temporary product
      draft.product_id = null;
      draft.product_name = null;
      draft.flow = null;
      draft.step1_value = null;

      // Transition to CART_REVIEW
      setSession(phone, 'CART_REVIEW', draft);
      await sendCartReview(sock, jid, draft);
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
      const combinedSpec = [draft.step1_value, draft.step2_value].filter(Boolean).join(' • ');
      const itemPrice = extractPrice(draft.step1_value) || extractPrice(draft.step2_value) || extractPrice(draft.product_price);

      if (!Array.isArray(draft.cart)) draft.cart = [];
      draft.cart.push({
        id: 'item_' + Date.now(),
        productId: draft.product_id,
        productName: draft.product_name,
        option: combinedSpec,
        price: itemPrice
      });

      draft.product_id = null;
      draft.product_name = null;
      draft.flow = null;
      draft.step1_value = null;
      draft.step2_value = null;

      setSession(phone, 'CART_REVIEW', draft);
      await sendCartReview(sock, jid, draft);
      break;
    }

    case 'CART_REVIEW': {
      const isAddAnother =
        buttonId === 'btn_add_another' ||
        ['add', 'another', 'more', 'add item', 'add another', 'add product', '1', '+'].includes(lowerText);

      const isCheckout =
        buttonId === 'btn_checkout' ||
        ['order', 'checkout', 'upload', 'proceed', 'done', 'next', 'buy', 'yes', '2'].includes(lowerText);

      if (isAddAnother) {
        setSession(phone, 'CART_ADDING', draft);
        await sock.sendMessage(jid, {
          text: "✨ *Add Another Item to Your Order* 🛍️\n\nSwipe through our products below to choose your next item:"
        });
        await sendWelcomeMenu(sock, jid, config, msg.pushName);
        return;
      }

      if (isCheckout) {
        setSession(phone, 'AWAITING_PHOTO', draft);
        await sock.sendMessage(jid, {
          text: "📸 *Step 1/3: Send Photos* ✨\n\nGreat! Please upload your photos directly here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* (ensure link sharing is set to 'Anyone with link').\n\n_(Reply 'skip' if you wish to share photos after ordering)_"
        });
        return;
      }

      // If user typed something else, resend cart review
      await sendCartReview(sock, jid, draft);
      break;
    }

    case 'AWAITING_PHOTO': {
      if (msg.hasImage) {
        try {
          const media = await msg.downloadMedia();
          if (!draft.photos) draft.photos = [];
          draft.photos.push(media.relativePath);
          setSession(phone, 'AWAITING_NAME', draft);

          const promptName = (config.prompt_name || "Photos noted! ✨\n\n*Step 2/3: Customer Name*\nWhat is your *Full Name*?")
            .replace('{name}', msg.pushName || 'there');
          await sock.sendMessage(jid, { text: promptName });
        } catch (err) {
          console.error('[Handler] Error downloading customer photo:', err);
          await sock.sendMessage(jid, {
            text: "Failed to download image. Please try sending it again or type 'skip' to continue without photo."
          });
        }
      } else if (lowerText.includes('http://') || lowerText.includes('https://') || lowerText.includes('drive.google') || lowerText.includes('wetransfer') || lowerText.includes('photos.app.goo.gl')) {
        // Customer shared a cloud link (Google Drive / iCloud / WeTransfer for albums)
        draft.photos_link = incomingText;
        setSession(phone, 'AWAITING_NAME', draft);
        await sock.sendMessage(jid, {
          text: `Photos link noted! 📁\n\n*Step 2/3: Customer Name*\nWhat is your *Full Name*?`
        });
      } else if (['skip', 'no', 'later', 'none', 'after'].includes(lowerText)) {
        setSession(phone, 'AWAITING_NAME', draft);
        const promptName = (config.prompt_name || "*Step 2/3: Customer Name*\nWhat is your *Full Name*?")
          .replace('{name}', msg.pushName || 'there');
        await sock.sendMessage(jid, { text: promptName });
      } else {
        await sock.sendMessage(jid, {
          text: "📷 Please *upload your photos* directly here on WhatsApp, paste a *Google Drive / Cloud link*, or reply *skip* to proceed:"
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

      const promptAddress = (config.prompt_address || "Thank you, {name}! 🏠\n\n*Step 3/3: Delivery Address*\nPlease share your complete *Delivery Address with Pincode* for courier delivery:")
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

      const cart = Array.isArray(draft.cart) ? draft.cart : [];
      const cartTotal = cart.reduce((s, i) => s + (i.price || 0), 0);

      await sendInteractiveButtons(sock, jid, {
        title: "💳 Payment Method",
        body: `Order Total: *₹${cartTotal.toLocaleString('en-IN')}*\n\nPlease choose your preferred *Payment Method* to confirm your order:`,
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
        paymentType = 'Instant UPI / Online QR';
      } else if (buttonId === 'pay_cod' || lowerText.includes('cash') || lowerText.includes('cod') || lowerText.includes('delivery') || lowerText.includes('pickup') || lowerText === '2') {
        paymentType = 'Pay on Pickup / Delivery';
      } else {
        const cart = Array.isArray(draft.cart) ? draft.cart : [];
        const cartTotal = cart.reduce((s, i) => s + (i.price || 0), 0);

        await sendInteractiveButtons(sock, jid, {
          title: "💳 Payment Method",
          body: `Order Total: *₹${cartTotal.toLocaleString('en-IN')}*\n\nPlease choose your payment option below:`,
          buttons: [
            { type: 'quick_reply', text: '📱 Instant UPI', id: 'pay_upi' },
            { type: 'quick_reply', text: '💵 Pay on Pickup', id: 'pay_cod' },
            { type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' }
          ]
        });
        return;
      }

      draft.payment_type = paymentType;

      const cart = Array.isArray(draft.cart) ? draft.cart : [];
      const cartTotal = cart.reduce((s, i) => s + (i.price || 0), 0);

      const itemsList = cart.map((item, idx) => {
        return `${idx + 1}. *${item.productName}*\n   • ${item.option}`;
      }).join('\n\n');

      const productNames = cart.map(i => i.productName.replace(/[^\w\s]/gi, '').trim()).join(' + ') || 'Photobooks & Frames';

      let finalDetails = itemsList;
      if (draft.photos_link) {
        finalDetails += `\n\n📁 Cloud Photos: ${draft.photos_link}`;
      }

      // Generate Order ID
      const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

      // Save order to Database with 'Pending Approval' status (admin approval required)
      createOrder({
        id: orderId,
        phone: phone,
        customer_name: draft.customer_name,
        product_id: cart.map(i => i.productId).join(', '),
        product_name: productNames,
        details: finalDetails,
        photos: draft.photos || [],
        address: draft.address,
        payment_type: draft.payment_type,
        amount: cartTotal,
        status: 'Pending Approval'
      });

      // Clear Session
      clearSession(phone);

      // If UPI chosen, send Instant UPI QR Code image
      if (paymentType.includes('UPI')) {
        await sendUpiQrCode(sock, jid, {
          upiId: config.upi_id || '6369134270@okbizaxis',
          upiName: config.upi_name || config.studio_name || 'InstaPics Studio',
          amount: cartTotal,
          orderId: orderId,
          note: `InstaPics Order`
        });
      }

      const photoStatus = draft.photos_link 
        ? `Cloud Link: ${draft.photos_link}`
        : ((draft.photos || []).length > 0 ? `${(draft.photos || []).length} photo(s) uploaded` : 'Pending / Share after booking');

      // Format Order Confirmation Template (Awaiting Studio Approval)
      const confirmationText = 
        `🎉 *Order Request Received!* ⏳\n\n` +
        `*Order ID:* #${orderId}\n` +
        `*Customer:* ${draft.customer_name}\n\n` +
        `*Items Ordered:*\n${itemsList}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Total Amount:* *₹${cartTotal.toLocaleString('en-IN')}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*Photos:* ${photoStatus}\n` +
        `*Delivery Address:* ${draft.address}\n` +
        `*Payment Mode:* ${paymentType}\n` +
        `*Current Status:* 🟡 *PENDING STUDIO APPROVAL*\n\n` +
        `Our studio manager is reviewing your order details & photos. We will notify you here with an approval confirmation once accepted! 📸✨`;

      await sendInteractiveButtons(sock, jid, {
        title: "⏳ Order Awaiting Approval",
        body: confirmationText,
        footer: config.studio_name || "InstaPics Custom Print Studio",
        buttons: [
          { type: 'quick_reply', text: '📦 Track My Orders', id: 'btn_track' },
          { type: 'quick_reply', text: '💳 Payment Info', id: 'btn_payment_info' },
          { type: 'quick_reply', text: '🛍️ Shop More', id: 'menu' }
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

async function startProductPageSelection(sock, jid, phone, product, config, draft = {}) {
  const productFlows = config.product_flows || {};
  const flow = productFlows[product.id] || {
    id: product.id,
    title: product.title,
    price: product.price,
    step1_title: "Product Options",
    step1_prompt: "Please choose an option:",
    step1_options: []
  };

  const existingCart = Array.isArray(draft.cart) ? draft.cart : [];

  const updatedDraft = {
    ...draft,
    cart: existingCart,
    product_id: product.id,
    product_name: product.title,
    product_price: product.price,
    flow: flow
  };

  // If price list product was selected, present the offer price sheet with direct order buttons
  if (product.id === 'prod_price_list') {
    setSession(phone, 'PRODUCT_STEP1', updatedDraft);
    const buttons = [
      { type: 'quick_reply', text: '📘 Order A4 Book', id: 'order_a4' },
      { type: 'quick_reply', text: '📚 Order A3 Jumbo', id: 'order_a3' },
      { type: 'quick_reply', text: '🖼️ Order Frame', id: 'order_frame' },
      { type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' }
    ];

    await sendInteractiveButtons(sock, jid, {
      title: "🏷️ Photobook & Frame Offers",
      body: flow.step1_prompt || "Here are our current offer prices for Non-Tearable Photobooks & Frames. Tap below to choose your item:",
      footer: "Tap an option to start order",
      buttons
    });
    return;
  }

  // If product has dedicated Step 1 buttons (page counts & prices)
  if (flow.step1_options && flow.step1_options.length > 0) {
    setSession(phone, 'PRODUCT_STEP1', updatedDraft);
    const step1Buttons = flow.step1_options.map(opt => ({
      type: 'quick_reply',
      text: opt.text,
      id: opt.id
    }));
    step1Buttons.push({ type: 'quick_reply', text: '🔄 Main Menu', id: 'menu' });

    await sendInteractiveButtons(sock, jid, {
      title: flow.step1_title || product.title,
      body: `Selected: *${product.title}* (${product.price || ''}) 🛍️\n\n${flow.step1_prompt || 'Please choose your package / page count:'}`,
      footer: "Tap an option or 'Main Menu' to reset",
      buttons: step1Buttons
    });
  } else {
    setSession(phone, 'PRODUCT_STEP1', updatedDraft);
    await sock.sendMessage(jid, {
      text: `Selected: *${product.title}*\n\n${flow.step1_prompt || 'Please reply with your size or specifications:'}`
    });
  }
}

async function sendCartReview(sock, jid, draft) {
  const cart = Array.isArray(draft.cart) ? draft.cart : [];
  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const cartLines = cart.map((item, idx) => {
    return `${idx + 1}. *${item.productName}*\n   • ${item.option}`;
  }).join('\n\n');

  const itemCountText = `${cart.length} item${cart.length > 1 ? 's' : ''}`;

  const bodyText = `🛒 *Your InstaPics Cart:*\n\n${cartLines}\n\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total Cart Amount:* *₹${cartTotal.toLocaleString('en-IN')}* (${itemCountText})\n━━━━━━━━━━━━━━━━━━━━\n\nWould you like to add another item to your order, or proceed to upload photos & checkout?`;

  const buttons = [
    { type: 'quick_reply', text: '➕ Add Another Item', id: 'btn_add_another' },
    { type: 'quick_reply', text: '📸 Upload Photos & Order', id: 'btn_checkout' },
    { type: 'quick_reply', text: '🔄 Start Over', id: 'menu' }
  ];

  await sendInteractiveButtons(sock, jid, {
    title: `🛒 InstaPics Cart (${itemCountText})`,
    body: bodyText,
    footer: "Tap an option below",
    buttons
  });
}

export async function sendWelcomeMenu(sock, jid, config, pushName) {
  const ownPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '916369134270';
  const studioName = config.studio_name || 'InstaPics Photobooks & Frames';
  const welcomeText = (config.welcome_message || "Welcome to *InstaPics*! 📸✨\n\nWe craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.\n\nSwipe through our products below to choose your package:")
    .replace('{name}', pushName || 'there');

  const fullBody = `${welcomeText}\n\n🛍️ *Official WhatsApp Catalogue:*\nhttps://wa.me/c/${ownPhone}`;

  const carouselCards = [
    {
      title: '📖 A4 Photobook (₹1,750)',
      imagePath: path.resolve('assets/products/photobook_a4.jpg'),
      body: 'Non-tearable, waterproof pages with lifetime durability. Up to 140 photos.',
      buttonText: '📖 Select A4 Book',
      buttonId: 'prod_photobook_a4'
    },
    {
      title: '📚 A3 Jumbo Album (₹2,500)',
      imagePath: path.resolve('assets/products/photobook_a3.jpg'),
      body: 'Luxury oversized photobook for weddings & family memories. Up to 300 photos.',
      buttonText: '📚 Select A3 Jumbo',
      buttonId: 'prod_photobook_a3'
    },
    {
      title: '🖼️ Custom Frames (₹599)',
      imagePath: path.resolve('assets/products/photo_frame.jpg'),
      body: 'Crystal clear acrylic & wooden frames for table or wall decor.',
      buttonText: '🖼️ Select Frames',
      buttonId: 'prod_frames'
    },
    {
      title: '🏷️ Price List & Offers',
      imagePath: path.resolve('assets/products/price_list.jpg'),
      body: 'View complete non-tearable & waterproof photobook discount price list.',
      buttonText: '🏷️ View Offers',
      buttonId: 'prod_price_list'
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
        type: 'quick_reply',
        text: '📖 A4 Photobook (₹1,750)',
        id: 'prod_photobook_a4'
      },
      {
        type: 'quick_reply',
        text: '📚 A3 Jumbo (₹2,500)',
        id: 'prod_photobook_a3'
      },
      {
        type: 'quick_reply',
        text: '🖼️ Custom Frames (₹599)',
        id: 'prod_frames'
      },
      {
        type: 'quick_reply',
        text: '🏷️ Price List & Offers',
        id: 'prod_price_list'
      }
    ];

    await sendInteractiveButtons(sock, jid, {
      title: `📸 ${studioName}`,
      body: fullBody,
      footer: 'Tap an option below to proceed',
      buttons
    });
  }
}

async function handleOrderHistory(sock, jid, phone, config) {
  const orders = getAllOrdersByPhone(phone);
  if (!orders || orders.length === 0) {
    await sendInteractiveButtons(sock, jid, {
      title: "📦 Order History & Tracking",
      body: `We couldn't find any orders placed from your number (*+${phone}*).\n\nWould you like to browse our premium non-tearable photobooks & frames?`,
      buttons: [
        { type: 'quick_reply', text: '📖 Our Products', id: 'menu' },
        { type: 'quick_reply', text: '💳 Payment Info', id: 'btn_payment_info' },
        { type: 'call', text: '📞 Call Studio', phone: config.studio_phone || '+916369134270' }
      ]
    });
    return;
  }

  const orderLines = orders.slice(0, 3).map((o, idx) => {
    const formattedDate = new Date(o.created_at || Date.now()).toLocaleDateString([], {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const statusEmoji = o.status.includes('Pending') ? '🟡' : (o.status.includes('Approved') || o.status.includes('Designing') ? '🎨' : (o.status.includes('Printing') ? '🖨️' : '✅'));
    return `${idx + 1}. *Order #${o.id}*\n   • Items: ${o.product_name}\n   • Amount: *₹${Number(o.amount || 0).toLocaleString('en-IN')}*\n   • Status: ${statusEmoji} *${o.status.toUpperCase()}*\n   • Date: ${formattedDate}`;
  }).join('\n\n');

  const historyBody = `📜 *Your InstaPics Order History:*\n\n${orderLines}\n\n━━━━━━━━━━━━━━━━━━━━\nTotal Orders Placed: *${orders.length}*\n━━━━━━━━━━━━━━━━━━━━\n\nTap below for more options or message us anytime!`;

  await sendInteractiveButtons(sock, jid, {
    title: "📦 Orders & Status",
    body: historyBody,
    footer: config.studio_name || "InstaPics Custom Print Studio",
    buttons: [
      { type: 'quick_reply', text: '🛍️ New Order', id: 'menu' },
      { type: 'quick_reply', text: '💳 Payment Info', id: 'btn_payment_info' },
      { type: 'quick_reply', text: '🔄 Refresh Status', id: 'btn_track' }
    ]
  });
}

async function sendPaymentInfoMessage(sock, jid, config) {
  const upiId = config.upi_id || '6369134270@okbizaxis';
  const studioName = config.studio_name || 'InstaPics Photobooks & Frames';
  const phone = config.studio_phone || '+91 6369134270';

  const bodyText = `💳 *${studioName} — Payment Details*\n\n` +
    `• *Official UPI ID:* *${upiId}*\n` +
    `• *Account Name:* ${config.upi_name || studioName}\n` +
    `• *Support Phone:* ${phone}\n\n` +
    `📱 *Accepted Payment Apps:*\n` +
    `• Google Pay (GPay)\n` +
    `• PhonePe\n` +
    `• Paytm\n` +
    `• BHIM UPI / Cred\n\n` +
    `💡 *How to Pay:*\n` +
    `1. Open Google Pay or PhonePe\n` +
    `2. Pay to UPI ID: *${upiId}*\n` +
    `3. Share your payment screenshot or UTR reference number right here on WhatsApp!\n\n` +
    `💵 *Pay on Pickup:* You can also choose to pay cash or UPI upon collecting your album at our studio.`;

  await sendInteractiveButtons(sock, jid, {
    title: "💳 Payment Information",
    body: bodyText,
    footer: "InstaPics Secure Payment Portal",
    buttons: [
      { type: 'quick_reply', text: '📖 View Products', id: 'menu' },
      { type: 'quick_reply', text: '📦 Track My Orders', id: 'btn_track' },
      { type: 'call', text: '📞 Call Studio', phone: phone.replace(/[^0-9+]/g, '') }
    ]
  });
}
