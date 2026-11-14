import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getAllOrdersByPhone,
  getRevenueStats,
  approveOrder,
  rejectOrder,
  getAllConfig,
  updateAllConfig,
  updateConfig,
  clearSession,
  clearAllSessions
} from '../db.js';
import {
  getWhatsAppStatus,
  getQrBuffer,
  requestPairing,
  restartWhatsApp,
  logoutWhatsApp,
  sendCustomerNotification,
  sendCustomerImage,
  fetchBusinessCatalog,
  sendWelcomeToOwner,
  sendWelcomeToPhone,
  sendListDemoToPhone,
  sendCarouselDemoToPhone,
  sendPriceListDemoToPhone,
  checkPhoneOnWhatsApp
} from '../whatsapp/client.js';

const router = express.Router();

router.get('/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    const result = await checkPhoneOnWhatsApp(phone);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. WhatsApp Connection & Device Management
router.get('/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

router.get(['/qr.png', '/qr'], async (req, res) => {
  try {
    const buf = await getQrBuffer();
    if (!buf) {
      return res.status(404).send('QR code not ready or device already connected');
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(buf);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/send-test-menu', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const result = phone ? await sendWelcomeToPhone(phone) : await sendWelcomeToOwner();
    res.json({ success: true, message: `Welcome menu sent to +${result.phone}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-text', async (req, res) => {
  try {
    const { phone, message } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    const result = await sendCustomerNotification(phone, message || 'Hello from Apex Software & Digital Marketing!');
    res.json({ success: true, messageId: result?.key?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-image', async (req, res) => {
  try {
    const { phone, imagePath, caption } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    const result = await sendCustomerImage(phone, imagePath, caption);
    res.json({ success: true, messageId: result?.key?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-all-ideas', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const targetPhone = phone || '9629661668';

    // 1. Intro Notice
    await sendCustomerNotification(
      targetPhone,
      '🎨 *Here are 4 Different Ideas to Show Your Products & Prices on WhatsApp!*\n' +
      'Review each presentation style below directly on your screen to choose your favorite:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━'
    );
    await new Promise(r => setTimeout(r, 1200));

    // 2. IDEA 1: Modern Typography & Price Card
    const idea1 =
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 *IDEA 1: Modern WhatsApp Typography & Price Card*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📸 *INSTAPICS PHOTOBOOKS & FRAMES* ✨\n' +
      '_Premium Non-Tearable & Waterproof Photo Albums_\n\n' +
      '✨ *Features:* 100% Waterproof | Tear-Proof | Lifetime Durability | HD Print\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '📚 *A3 JUMBO PHOTOBOOKS* (Weddings & Big Events)\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '• *40 Pages* (20 Sheets / 130 Photos)\n' +
      '  ~₹5,000~ ➔ *₹2,500* (50% OFF)\n\n' +
      '• *60 Pages* (30 Sheets / 220 Photos)\n' +
      '  ~₹6,500~ ➔ *₹3,300* (49% OFF)\n\n' +
      '• *80 Pages* (40 Sheets / 300 Photos)\n' +
      '  ~₹8,500~ ➔ *₹4,200* (51% OFF)\n\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '📖 *A4 PREMIUM PHOTOBOOKS* (Birthdays & Memories)\n' +
      '━━━━━━━━━━━━━━━━━━━━\n' +
      '• *40 Pages* (20 Sheets / 60 Photos)\n' +
      '  ~₹3,600~ ➔ *₹1,750* (51% OFF)\n\n' +
      '• *60 Pages* (30 Sheets / 100 Photos)\n' +
      '  ~₹4,500~ ➔ *₹2,150* (52% OFF)\n\n' +
      '• *80 Pages* (40 Sheets / 140 Photos)\n' +
      '  ~₹5,200~ ➔ *₹2,500* (52% OFF)\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📦 *Free doorstep delivery on orders above ₹2,000!*\n\n' +
      '📲 *To order:* Reply here with your chosen size or send photos via Google Drive / WhatsApp.\n' +
      '📞 *Studio Helpline:* +91 7598475668';
    await sendCustomerNotification(targetPhone, idea1);
    await new Promise(r => setTimeout(r, 1500));

    // 3. IDEA 2A: A4 Photo with Specs Caption
    const a4Caption =
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 *IDEA 2 (Part A): A4 Photobook Photo + Specs*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📖 *A4 Premium Photobook* (Non-Tearable & Waterproof)\n' +
      '✨ 20-40 Sheets | Up to 140 Photos | Lifetime Durability\n\n' +
      '• *40 Pages (60 Photos)*  ➔ *₹1,750* (was ~₹3,600~)\n' +
      '• *60 Pages (100 Photos)* ➔ *₹2,150* (was ~₹4,500~)\n' +
      '• *80 Pages (140 Photos)* ➔ *₹2,500* (was ~₹5,200~)\n\n' +
      '📲 Reply to order or call: +91 7598475668';
    await sendCustomerImage(targetPhone, 'assets/products/photobook_a4.jpg', a4Caption);
    await new Promise(r => setTimeout(r, 1500));

    // 4. IDEA 2B: A3 Photo with Specs Caption
    const a3Caption =
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 *IDEA 2 (Part B): A3 Jumbo Photo + Specs*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📚 *A3 Jumbo Photobook* (Luxury Wedding & Family Edition)\n' +
      '✨ 20-40 Sheets | Up to 300 Photos | Large Format Album\n\n' +
      '• *40 Pages (130 Photos)* ➔ *₹2,500* (was ~₹5,000~)\n' +
      '• *60 Pages (220 Photos)* ➔ *₹3,300* (was ~₹6,500~)\n' +
      '• *80 Pages (300 Photos)* ➔ *₹4,200* (was ~₹8,500~)\n\n' +
      '📲 Reply to order or call: +91 7598475668';
    await sendCustomerImage(targetPhone, 'assets/products/photobook_a3.jpg', a3Caption);
    await new Promise(r => setTimeout(r, 1500));

    // 5. IDEA 3: Graphic Price List Flyer Image + Caption
    const flyerCaption =
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 *IDEA 3: Graphic Official Rate Card Flyer*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '🏷️ *InstaPics Complete Introductory Price List Flyer*\n' +
      'Save this image to your phone gallery for reference anytime!\n\n' +
      '• A4 Photobooks: From *₹1,750*\n' +
      '• A3 Jumbo Albums: From *₹2,500*\n\n' +
      '📞 Order Helpline: +91 7598475668';
    await sendCustomerImage(targetPhone, 'assets/products/price_list.jpg', flyerCaption);
    await new Promise(r => setTimeout(r, 1500));

    // 6. IDEA 4: Clean Monospace Grid Table
    const idea4 =
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '💡 *IDEA 4: Clean Monospace Grid Table*\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '📸 *INSTAPICS OFFICIAL RATE CARD* 📸\n' +
      '_Non-Tearable | Waterproof | Lifetime Durability_\n\n' +
      '```\n' +
      '┌─────────────────────────────────┐\n' +
      '│ A4 PREMIUM PHOTOBOOK            │\n' +
      '├─────────┬────────┬──────┬───────┤\n' +
      '│ Pages   │ Photos │ Reg. │ Offer │\n' +
      '├─────────┼────────┼──────┼───────┤\n' +
      '│ 40 Pgs  │ 60     │ 3600 │ ₹1750 │\n' +
      '│ 60 Pgs  │ 100    │ 4500 │ ₹2150 │\n' +
      '│ 80 Pgs  │ 140    │ 5200 │ ₹2500 │\n' +
      '└─────────┴────────┴──────┴───────┘\n' +
      '┌─────────────────────────────────┐\n' +
      '│ A3 JUMBO PHOTOBOOK              │\n' +
      '├─────────┬────────┬──────┬───────┤\n' +
      '│ Pages   │ Photos │ Reg. │ Offer │\n' +
      '├─────────┼────────┼──────┼───────┤\n' +
      '│ 40 Pgs  │ 130    │ 5000 │ ₹2500 │\n' +
      '│ 60 Pgs  │ 220    │ 6500 │ ₹3300 │\n' +
      '│ 80 Pgs  │ 300    │ 8500 │ ₹4200 │\n' +
      '└─────────┴────────┴──────┴───────┘\n' +
      '```\n\n' +
      '📞 *Call/WhatsApp to order:* +91 7598475668\n' +
      '━━━━━━━━━━━━━━━━━━━━━━\n' +
      '✨ *Which idea do you like best? Reply here with Idea 1, 2, 3, or 4!*';
    await sendCustomerNotification(targetPhone, idea4);

    res.json({ success: true, message: `All 4 ideas sent successfully to +${targetPhone}!` });
  } catch (err) {
    console.error('[API] Error sending all ideas:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-welcome', async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    const result = await sendWelcomeToPhone(phone);
    res.json({ success: true, message: `Welcome message with buttons sent to +${result.phone}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-list-demo', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const targetPhone = phone || '9629661668';
    const result = await sendListDemoToPhone(targetPhone);
    res.json({ success: true, message: `List menu demo sent to +${targetPhone}!`, result });
  } catch (err) {
    console.error('[API] Error in /send-list-demo:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-carousel-demo', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const targetPhone = phone || '9629661668';
    const result = await sendCarouselDemoToPhone(targetPhone);
    res.json({ success: true, message: `Carousel demo (Format 1) sent to +${targetPhone}!`, result });
  } catch (err) {
    console.error('[API] Error in /send-carousel-demo:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-pricelist-demo', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const targetPhone = phone || '9629661668';
    const result = await sendPriceListDemoToPhone(targetPhone);
    res.json({ success: true, message: `Price list image demo (Format 3) sent to +${targetPhone}!`, result });
  } catch (err) {
    console.error('[API] Error in /send-pricelist-demo:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-all-demos', async (req, res) => {
  try {
    const { phone } = req.body || {};
    const targetPhone = phone || '9629661668';

    // 1. Send Format 1: Swipeable Photo Carousel
    console.log(`[Demo] Sending Format 1 (Carousel) to ${targetPhone}...`);
    await sendCarouselDemoToPhone(targetPhone);
    await new Promise(r => setTimeout(r, 2000));

    // 2. Send Format 2: Native List Menu
    console.log(`[Demo] Sending Format 2 (List Menu) to ${targetPhone}...`);
    await sendListDemoToPhone(targetPhone);
    await new Promise(r => setTimeout(r, 2000));

    // 3. Send Format 3: Instant Price List Image Card
    console.log(`[Demo] Sending Format 3 (Price List Image) to ${targetPhone}...`);
    await sendPriceListDemoToPhone(targetPhone);

    res.json({
      success: true,
      message: `All 3 demo formats sent successfully to +${targetPhone}!`
    });
  } catch (err) {
    console.error('[API] Error in /send-all-demos:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pairing', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    const code = await requestPairing(phone);
    res.json({ success: true, pairingCode: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restart', async (req, res) => {
  try {
    await restartWhatsApp();
    res.json({ success: true, message: 'WhatsApp restart initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({ success: true, message: 'WhatsApp unlinked successfully. Ready for new QR / pairing code.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/clear', (req, res) => {
  const { phone } = req.body || {};
  if (phone) {
    clearSession(phone);
  } else {
    clearAllSessions();
  }
  res.json({ success: true, message: 'Active conversation sessions cleared' });
});

// 2. Orders Management
router.get('/orders', (req, res) => {
  const { status, limit, offset } = req.query;
  const orders = getOrders(Number(limit) || 100, Number(offset) || 0, status || null);
  res.json({ orders });
});

router.get('/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

router.patch('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, notifyCustomer } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updatedOrder = updateOrderStatus(id, status);
  if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

  let notificationSent = false;
  if (notifyCustomer && updatedOrder.phone) {
    try {
      const config = getAllConfig();
      const studioName = config.studio_name || 'InstaPics Photobooks & Frames';
      const msg = `📢 *Order Status Update*\n\n` +
        `Hi *${updatedOrder.customer_name || 'Customer'}*, your order *#${updatedOrder.id}* (${updatedOrder.product_name}) has been updated:\n\n` +
        `*New Status:* *${status.toUpperCase()}*\n\n` +
        `Thank you for choosing ${studioName}! 📸`;
      await sendCustomerNotification(updatedOrder.phone, msg);
      notificationSent = true;
    } catch (err) {
      console.warn('[API] Could not send WhatsApp notification:', err.message);
    }
  }

  res.json({
    success: true,
    order: updatedOrder,
    notificationSent
  });
});

// Update Order Payment Status anytime independently of fulfillment status
router.patch('/orders/:id/payment-status', async (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body || {};

  if (!payment_status) return res.status(400).json({ error: 'payment_status is required' });

  const updatedOrder = updateOrderPaymentStatus(id, payment_status);
  if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

  res.json({
    success: true,
    message: `Payment status updated to ${payment_status}`,
    order: updatedOrder
  });
});

// Upload Product Image (Base64 data or data URL saved to uploads/products/)
router.post('/upload-product-image', async (req, res) => {
  try {
    const { image, filename } = req.body || {};
    if (!image) return res.status(400).json({ error: 'Image data is required' });

    const uploadsDir = path.resolve('uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let buffer;
    let ext = 'jpg';
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const safeFilename = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/products/${safeFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: safeFilename
    });
  } catch (err) {
    console.error('[API] Error in /upload-product-image:', err);
    res.status(500).json({ error: err.message });
  }
});

// Approve Order Endpoint (Admin Action: "orders will place only if i approve")
router.post('/orders/:id/approve', async (req, res) => {
  const { id } = req.params;
  const updatedOrder = approveOrder(id);
  if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

  let notificationSent = false;
  if (updatedOrder.phone) {
    try {
      const config = getAllConfig();
      const studioName = config.studio_name || 'InstaPics Photobooks & Frames';
      const msg = `🎉 *Order Approved by InstaPics!* 📸✨\n\n` +
        `Hi *${updatedOrder.customer_name || 'Customer'}*, your order *#${updatedOrder.id}* has been *APPROVED* by our studio!\n\n` +
        `• *Items:* ${updatedOrder.product_name}\n` +
        `• *Specs / Pages:* ${updatedOrder.details}\n` +
        `• *Amount:* ₹${Number(updatedOrder.amount || 0).toLocaleString('en-IN')}\n` +
        `• *Status:* *APPROVED & DESIGNING* 🎨\n\n` +
        `Our album designers are preparing your digital preview now. Thank you for choosing ${studioName}!`;
      await sendCustomerNotification(updatedOrder.phone, msg);
      notificationSent = true;
    } catch (err) {
      console.warn('[API] Could not send WhatsApp approval notice:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Order #${id} approved!`,
    order: updatedOrder,
    notificationSent
  });
});

// Reject Order Endpoint
router.post('/orders/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason, notifyCustomer } = req.body || {};
  const updatedOrder = rejectOrder(id);
  if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });

  let notificationSent = false;
  if (notifyCustomer && updatedOrder.phone) {
    try {
      const config = getAllConfig();
      const studioName = config.studio_name || 'InstaPics Photobooks & Frames';
      const msg = `📢 *Order Update - #${updatedOrder.id}*\n\n` +
        `Hi *${updatedOrder.customer_name || 'Customer'}*, your order *#${updatedOrder.id}* could not be approved at this time.\n\n` +
        `${reason ? `*Reason:* ${reason}\n\n` : ''}` +
        `Please message us here or call ${config.studio_phone || '+91 6369134270'} if you have questions. Thank you!`;
      await sendCustomerNotification(updatedOrder.phone, msg);
      notificationSent = true;
    } catch (err) {
      console.warn('[API] Could not send WhatsApp rejection notice:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Order #${id} cancelled`,
    order: updatedOrder,
    notificationSent
  });
});

// Customer Order History Endpoint
router.get('/orders/history/:phone', (req, res) => {
  const { phone } = req.params;
  const orders = getAllOrdersByPhone(phone);
  const totalSpend = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  res.json({
    success: true,
    phone,
    totalOrders: orders.length,
    totalSpend,
    orders
  });
});

// Revenue & Analytics Stats Endpoint
router.get('/revenue', (req, res) => {
  try {
    const stats = getRevenueStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Flow & Bot Configuration Editor
router.get('/config', (req, res) => {
  res.json({ config: getAllConfig() });
});

router.put('/config', (req, res) => {
  const { config } = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'Invalid config payload' });
  }
  updateAllConfig(config);
  res.json({ success: true, config: getAllConfig() });
});

// 4. WhatsApp Business Catalog
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await fetchBusinessCatalog();
    res.json({ success: true, catalog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/catalog/sync', async (req, res) => {
  try {
    const catalog = await fetchBusinessCatalog();
    const rawProducts = catalog?.products || catalog || [];

    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return res.json({
        success: false,
        message: 'No products found in WhatsApp Business Catalog',
        products: []
      });
    }

    const formattedProducts = rawProducts.map(p => {
      // In WhatsApp business catalog node parsing, price is usually divided by 1000
      let priceStr = '';
      if (p.price) {
        const val = Number(p.price) > 1000 ? Number(p.price) / 1000 : Number(p.price);
        priceStr = `${p.currency || '₹'}${val}`;
      }

      return {
        id: p.id ? `prod_${p.id}` : `prod_${Date.now().toString(36)}`,
        title: p.name || p.title || 'Product',
        description: p.description || '',
        price: priceStr || 'Enquire'
      };
    });

    updateConfig('products', formattedProducts);

    res.json({
      success: true,
      message: `Successfully synced ${formattedProducts.length} product(s) from WhatsApp Business Catalog!`,
      products: formattedProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

