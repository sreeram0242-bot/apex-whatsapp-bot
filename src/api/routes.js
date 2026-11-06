import express from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
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
  sendCustomerNotification,
  fetchBusinessCatalog,
  sendWelcomeToOwner,
  sendWelcomeToPhone,
  sendListDemoToPhone,
  sendCarouselDemoToPhone,
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
    res.json({ success: true, message: `Carousel demo sent to +${targetPhone}!`, result });
  } catch (err) {
    console.error('[API] Error in /send-carousel-demo:', err);
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
      const msg = `📢 *Order Status Update*\n\n` +
        `Hi *${updatedOrder.customer_name || 'Customer'}*, your order *#${updatedOrder.id}* (${updatedOrder.product_name}) has been updated:\n\n` +
        `*New Status:* *${status.toUpperCase()}*\n\n` +
        `Thank you for choosing Lumina Photo Studio! 📸`;
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

