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
  requestPairing,
  restartWhatsApp,
  logoutWhatsApp,
  sendCustomerNotification,
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

