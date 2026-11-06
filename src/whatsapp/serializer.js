import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Normalizes any incoming WhatsApp message into a clean, predictable structure.
 */
export async function serializeMessage(sock, m) {
  if (!m.message) return null;

  const key = m.key;
  const fromMe = key.fromMe;
  const jid = key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const isNewsletter = jid.endsWith('@newsletter');
  const pushName = m.pushName || 'Customer';

  // Extract phone number from JID
  const phone = jid.split('@')[0];

  const raw = m.message;
  // Unwrap viewOnceMessage or ephemeralMessage if present
  let content = raw;
  if (content.viewOnceMessage?.message) content = content.viewOnceMessage.message;
  if (content.viewOnceMessageV2?.message) content = content.viewOnceMessageV2.message;
  if (content.ephemeralMessage?.message) content = content.ephemeralMessage.message;

  let text = '';
  let buttonId = null;
  let hasImage = false;
  let imageMessage = null;
  let productInfo = null;
  let orderInfo = null;

  // 1. Interactive Button Response (NativeFlow)
  if (content.interactiveResponseMessage) {
    const resp = content.interactiveResponseMessage;
    if (resp.nativeFlowResponseMessage?.paramsJson) {
      try {
        const parsed = JSON.parse(resp.nativeFlowResponseMessage.paramsJson);
        buttonId = parsed.id || parsed.selectedId || parsed.row_id || null;
        text = buttonId || resp.body?.text || '';
      } catch {
        text = resp.body?.text || '';
      }
    } else if (resp.body?.text) {
      text = resp.body.text;
    }
  }

  // 2. Legacy / Template Button Responses
  if (!buttonId) {
    if (content.buttonsResponseMessage?.selectedButtonId) {
      buttonId = content.buttonsResponseMessage.selectedButtonId;
      text = buttonId;
    } else if (content.templateButtonReplyMessage?.selectedId) {
      buttonId = content.templateButtonReplyMessage.selectedId;
      text = buttonId;
    } else if (content.listResponseMessage?.singleSelectReply?.selectedRowId) {
      buttonId = content.listResponseMessage.singleSelectReply.selectedRowId;
      text = buttonId;
    }
  }

  // 3. WhatsApp Catalogue Product Messages & Inquiries
  if (content.productMessage?.product) {
    const p = content.productMessage.product;
    productInfo = {
      productId: p.productId || '',
      title: p.title || '',
      description: p.description || '',
      price: p.priceAmount1000 ? `₹${p.priceAmount1000 / 1000}` : '',
      currencyCode: p.currencyCode || 'INR',
      retailerId: p.retailerId || ''
    };
  }

  // Check quoted productMessage inside contextInfo (when user clicks product in catalogue and taps "Message Business")
  const quotedCtx = content.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quotedCtx?.productMessage?.product) {
    const p = quotedCtx.productMessage.product;
    productInfo = {
      productId: p.productId || '',
      title: p.title || '',
      description: p.description || '',
      price: p.priceAmount1000 ? `₹${p.priceAmount1000 / 1000}` : '',
      currencyCode: p.currencyCode || 'INR',
      retailerId: p.retailerId || ''
    };
  }

  // Direct or quoted orderMessage (cart checkout from WhatsApp catalogue)
  const ordMsg = content.orderMessage || quotedCtx?.orderMessage;
  if (ordMsg) {
    let orderProducts = [];
    if (sock?.getOrderDetails && ordMsg.orderId && ordMsg.token) {
      try {
        const details = await Promise.race([
          sock.getOrderDetails(ordMsg.orderId, ordMsg.token),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
        ]);
        if (details?.products && details.products.length > 0) {
          orderProducts = details.products;
          console.log('[Serializer] Fetched order products from WhatsApp:', orderProducts.map(p => p.name).join(', '));
        }
      } catch (err) {
        console.warn('[Serializer] getOrderDetails note:', err.message);
      }
    }

    const firstProduct = orderProducts[0];
    const totalNum = ordMsg.totalAmount1000 ? Math.round(Number(ordMsg.totalAmount1000) / 1000) : 0;
    const botName = (sock?.user?.name || '').toLowerCase().trim();

    // Clean orderTitle: if it matches the bot's own profile name (like "gym"), ignore it so it doesn't pollute text/buttonId
    let cleanOrderTitle = ordMsg.orderTitle || '';
    if (cleanOrderTitle.toLowerCase().trim() === botName) {
      cleanOrderTitle = '';
    }

    orderInfo = {
      orderId: ordMsg.orderId || '',
      orderTitle: firstProduct?.name || cleanOrderTitle,
      itemCount: ordMsg.itemCount || 1,
      totalAmount: totalNum ? `₹${totalNum}` : '',
      totalAmountRaw: totalNum,
      products: orderProducts,
      message: ordMsg.message || ''
    };

    if (firstProduct?.name) {
      productInfo = {
        productId: firstProduct.id || '',
        title: firstProduct.name,
        price: firstProduct.price ? `₹${firstProduct.price}` : '',
        currencyCode: firstProduct.currency || 'INR'
      };
      text = firstProduct.name;
      buttonId = firstProduct.name;
    } else if (cleanOrderTitle) {
      text = cleanOrderTitle;
      buttonId = cleanOrderTitle;
    }
  }

  // 4. Regular Text Messages
  if (!text) {
    if (content.conversation) {
      text = content.conversation;
    } else if (content.extendedTextMessage?.text) {
      text = content.extendedTextMessage.text;
    } else if (content.imageMessage?.caption) {
      text = content.imageMessage.caption;
    } else if (content.documentMessage?.caption) {
      text = content.documentMessage.caption;
    }
  }

  // If a catalogue product or order was attached:
  if (productInfo) {
    if (!buttonId) buttonId = productInfo.retailerId || productInfo.productId || productInfo.title;
    const cleanLowerText = (text || '').toLowerCase().trim();
    if (!text || ['is this available?', 'is this available', 'hi', 'hello', 'hey', 'interested'].includes(cleanLowerText)) {
      text = productInfo.title || text;
    }
  }

  if (orderInfo && !productInfo) {
    if (orderInfo.orderTitle) {
      if (!buttonId) buttonId = orderInfo.orderTitle;
      if (!text) text = orderInfo.orderTitle;
    }
  }

  // 4. Media (Images or Documents for printing)
  if (content.imageMessage) {
    hasImage = true;
    imageMessage = content.imageMessage;
  } else if (content.documentMessage && content.documentMessage.mimetype?.startsWith('image/')) {
    hasImage = true;
    imageMessage = content.documentMessage;
  }

  // Media download helper
  const downloadMedia = async (targetFilename = null) => {
    if (!imageMessage) return null;
    const stream = await downloadContentFromMessage(
      imageMessage,
      content.documentMessage ? 'document' : 'image'
    );
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const uploadDir = path.resolve('uploads/photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = targetFilename || `upload_${phone}_${Date.now()}.jpg`;
    const fullPath = path.join(uploadDir, filename);
    await fs.promises.writeFile(fullPath, buffer);
    return {
      filename,
      fullPath,
      relativePath: `/uploads/photos/${filename}`,
      size: buffer.length
    };
  };

  return {
    raw: m,
    key,
    jid,
    phone,
    fromMe,
    isGroup,
    isNewsletter,
    pushName,
    text: (text || '').trim(),
    buttonId: (buttonId || '').trim(),
    productInfo,
    orderInfo,
    hasImage,
    downloadMedia
  };
}

