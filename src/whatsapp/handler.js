import {
  getAllConfig,
  getAllOrdersByPhone
} from '../db.js';

/**
 * Universal safe message sender with automatic fallback routing.
 * Never throws uncaught errors.
 */
async function safeSend(sock, primaryJid, content, fallbackJid = null) {
  if (!sock) {
    console.error('[WhatsApp] Socket is not initialized.');
    return null;
  }
  try {
    return await sock.sendMessage(primaryJid, content);
  } catch (err) {
    console.error(`[WhatsApp] Failed to send message to primary JID ${primaryJid}:`, err?.message || err);
    if (fallbackJid && fallbackJid !== primaryJid) {
      try {
        console.log(`[WhatsApp] Retrying message to fallback JID ${fallbackJid}...`);
        return await sock.sendMessage(fallbackJid, content);
      } catch (err2) {
        console.error(`[WhatsApp] Fallback delivery to ${fallbackJid} also failed:`, err2?.message || err2);
      }
    }
    return null;
  }
}

/**
 * Sends the complete, crystal-clear InstaPics Product, Price & Specs List.
 * Pure normal text with emojis and bullet points — 100% universal across all WhatsApp clients.
 */
export async function sendProductSpecsList(sock, jid, config = null, customerName = '', fallbackJid = null) {
  const cfg = config || getAllConfig();
  const phone = cfg.studio_phone || '+91 7598475668';
  const nameGreeting = customerName && customerName !== 'Customer' ? `Hi *${customerName}*! ` : '';

  const message =
    `📸 *INSTAPICS PHOTOBOOKS & FRAMES* ✨\n` +
    `_Premium Non-Tearable & 100% Waterproof Photo Albums_\n\n` +
    `${nameGreeting}Welcome to InstaPics! Here is our complete product, specs & special offer price list:\n\n` +
    `✨ *QUALITY GUARANTEE:*\n` +
    `• 💧 *100% Waterproof Pages* (spill-proof & washable)\n` +
    `• 🛡️ *Non-Tearable Synthetic Paper* (lifetime durability)\n` +
    `• 🎨 *Ultra HD 6-Color Studio Printing*\n` +
    `• 🌟 *Seamless Lay-Flat Panoramic Binding*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📖 *A4 PREMIUM PHOTOBOOKS* (Standard Album)\n` +
    `_Best for Birthdays, Anniversaries, Vacations & Baby Photos_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *40 Pages* (20 Sheets • up to 60 Photos)\n` +
    `  ~₹3,600~ ➔ *₹1,750* (51% OFF)\n\n` +
    `• *60 Pages* (30 Sheets • up to 100 Photos)\n` +
    `  ~₹4,500~ ➔ *₹2,150* (52% OFF)\n\n` +
    `• *80 Pages* (40 Sheets • up to 140 Photos)\n` +
    `  ~₹5,200~ ➔ *₹2,500* (52% OFF)\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 *A3 JUMBO PHOTOBOOKS* (Luxury Large Album)\n` +
    `_Ideal for Weddings, Grand Receptions & Family Memories_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *40 Pages* (20 Sheets • up to 130 Photos)\n` +
    `  ~₹5,000~ ➔ *₹2,500* (50% OFF)\n\n` +
    `• *60 Pages* (30 Sheets • up to 220 Photos)\n` +
    `  ~₹6,500~ ➔ *₹3,300* (49% OFF)\n\n` +
    `• *80 Pages* (40 Sheets • up to 300 Photos)\n` +
    `  ~₹8,500~ ➔ *₹4,200* (51% OFF)\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🖼️ *CUSTOM PHOTO FRAMES* (Acrylic & Wood)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *Tabletop Display Frame (8x12)* ➔ *₹599*\n` +
    `• *Crystal Acrylic Wall Frame (12x18)* ➔ *₹999*\n` +
    `• *Designer Family Collage Frame* ➔ *₹1,299*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *PAYMENT DETAILS:*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `• *Official UPI ID:* \`6369134270@okbizaxis\`\n` +
    `• *Payee:* InstaPics Custom Print Studio\n` +
    `• *Accepted Apps:* Google Pay, PhonePe, Paytm, Cred, BHIM UPI\n` +
    `• *Pay on Pickup / Studio Collection Available*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📲 *HOW TO ORDER (3 EASY STEPS):*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `1️⃣ Reply here with your preferred album size (e.g. *A4 40 Pages* or *A3 60 Pages*)\n` +
    `2️⃣ Send your photos directly here on WhatsApp or share a Google Drive / Photos link.\n` +
    `3️⃣ Our designers will design your digital album preview for your approval before printing! 🎨✨\n\n` +
    `📞 *Studio Helpline:* ${phone}\n` +
    `📍 *InstaPics Custom Print Studio*`;

  return await safeSend(sock, jid, { text: message }, fallbackJid);
}

/**
 * Sends focused A4 Photobook specs & offers
 */
export async function sendA4Specs(sock, jid, config = null, fallbackJid = null) {
  const cfg = config || getAllConfig();
  const phone = cfg.studio_phone || '+91 7598475668';

  const message =
    `📖 *A4 PREMIUM PHOTOBOOK — SPECS & OFFERS* 📸\n` +
    `_Non-Tearable | 100% Waterproof | Lifetime Durability_\n\n` +
    `✨ *Specs & Special Offer Pricing:*\n` +
    `• *40 Pages* (20 Sheets • up to 60 Photos)\n` +
    `  ~₹3,600~ ➔ *₹1,750* (51% OFF)\n\n` +
    `• *60 Pages* (30 Sheets • up to 100 Photos)\n` +
    `  ~₹4,500~ ➔ *₹2,150* (52% OFF)\n\n` +
    `• *80 Pages* (40 Sheets • up to 140 Photos)\n` +
    `  ~₹5,200~ ➔ *₹2,500* (52% OFF)\n\n` +
    `✨ *Features:* Non-tearable synthetic pages, waterproof, lay-flat binding, HD lab printing.\n\n` +
    `📲 *To order:* Reply with your page count & send your photos here on WhatsApp or share a Google Drive link!\n` +
    `📞 *Helpline:* ${phone}`;

  return await safeSend(sock, jid, { text: message }, fallbackJid);
}

/**
 * Sends focused A3 Jumbo Photobook specs & offers
 */
export async function sendA3Specs(sock, jid, config = null, fallbackJid = null) {
  const cfg = config || getAllConfig();
  const phone = cfg.studio_phone || '+91 7598475668';

  const message =
    `📚 *A3 JUMBO PHOTOBOOK — SPECS & OFFERS* 📸\n` +
    `_Luxury Large Format Album for Weddings & Family Milestones_\n\n` +
    `✨ *Specs & Special Offer Pricing:*\n` +
    `• *40 Pages* (20 Sheets • up to 130 Photos)\n` +
    `  ~₹5,000~ ➔ *₹2,500* (50% OFF)\n\n` +
    `• *60 Pages* (30 Sheets • up to 220 Photos)\n` +
    `  ~₹6,500~ ➔ *₹3,300* (49% OFF)\n\n` +
    `• *80 Pages* (40 Sheets • up to 300 Photos)\n` +
    `  ~₹8,500~ ➔ *₹4,200* (51% OFF)\n\n` +
    `✨ *Features:* Jumbo size luxury photobook, non-tearable & waterproof, gold/silver foil cover options.\n\n` +
    `📲 *To order:* Reply with your page count & send your photos here on WhatsApp or share a Google Drive link!\n` +
    `📞 *Helpline:* ${phone}`;

  return await safeSend(sock, jid, { text: message }, fallbackJid);
}

/**
 * Sends focused Photo Frames specs & offers
 */
export async function sendFramesSpecs(sock, jid, config = null, fallbackJid = null) {
  const cfg = config || getAllConfig();
  const phone = cfg.studio_phone || '+91 7598475668';

  const message =
    `🖼️ *CUSTOM PHOTO FRAMES — SPECS & OFFERS* ✨\n` +
    `_High-Gloss Crystal Acrylic & Premium Wooden Borders_\n\n` +
    `• *Tabletop Display Frame (8x12)* ➔ *₹599*\n` +
    `• *Crystal Acrylic Wall Frame (12x18)* ➔ *₹999*\n` +
    `• *Designer Family Collage Frame* ➔ *₹1,299*\n\n` +
    `✨ *Features:* Fade-resistant archival inks, crystal clear acrylic, ready to hang or stand.\n\n` +
    `📲 *To order:* Reply with your frame size & send your photo here on WhatsApp!\n` +
    `📞 *Helpline:* ${phone}`;

  return await safeSend(sock, jid, { text: message }, fallbackJid);
}

/**
 * Sends Payment Details & UPI ID
 */
export async function sendPaymentInfo(sock, jid, config = null, fallbackJid = null) {
  const cfg = config || getAllConfig();
  const phone = cfg.studio_phone || '+91 7598475668';
  const upiId = cfg.upi_id || '6369134270@okbizaxis';
  const upiName = cfg.upi_name || 'InstaPics Custom Print Studio';

  const message =
    `💳 *INSTAPICS — PAYMENT DETAILS* ✨\n\n` +
    `• *Official UPI ID:* \`${upiId}\`\n` +
    `• *Payee Name:* ${upiName}\n` +
    `• *Helpline Phone:* ${phone}\n\n` +
    `📱 *Accepted Payment Apps:*\n` +
    `• Google Pay (GPay)\n` +
    `• PhonePe\n` +
    `• Paytm\n` +
    `• Cred / BHIM UPI\n\n` +
    `💵 *Pay on Pickup:* Cash or UPI available when collecting your album at our studio.\n\n` +
    `_After paying, reply here with your payment screenshot or transaction ID._`;

  return await safeSend(sock, jid, { text: message }, fallbackJid);
}

/**
 * Handles incoming WhatsApp messages.
 * Pure text responder — 0% buttons, 100% reliable delivery.
 */
export async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg || msg.isGroup || msg.isNewsletter) return;

    // Prevent bot from replying to its own automated messages
    if (msg.fromMe) return;

    const jid = msg.jid;
    const fallbackJid = msg.originalJid;
    const phone = msg.phone || (jid ? jid.split('@')[0] : 'Customer');

    const incomingText = (msg.text || '').trim();
    const lowerText = incomingText.toLowerCase();

    // If customer sent photos
    if (msg.hasImage && !incomingText) {
      console.log(`[Bot] Received photo from ${phone}`);
      await safeSend(sock, jid, {
        text: `📸 *Photo received!* ✨\n\nThank you! Please let us know which size you would like to print:\n• *A4 Photobook* (from ₹1,750)\n• *A3 Jumbo Album* (from ₹2,500)\n• *Photo Frame* (from ₹599)\n\nOr reply with your total photos count and our team will recommend the best package!`
      }, fallbackJid);
      return;
    }

    if (!incomingText) return;

    console.log(`[Bot] Message from ${phone}: "${incomingText}"`);
    const config = getAllConfig();

    // 1. A4 Photobook Keyword Matching
    if (
      lowerText === 'a4' ||
      lowerText.includes('a4') ||
      lowerText.includes('small album') ||
      lowerText.includes('standard')
    ) {
      await sendA4Specs(sock, jid, config, fallbackJid);
      return;
    }

    // 2. A3 Jumbo Photobook Keyword Matching
    if (
      lowerText === 'a3' ||
      lowerText.includes('a3') ||
      lowerText.includes('jumbo') ||
      lowerText.includes('wedding album') ||
      lowerText.includes('big album')
    ) {
      await sendA3Specs(sock, jid, config, fallbackJid);
      return;
    }

    // 3. Photo Frames Keyword Matching
    if (
      lowerText === 'frame' ||
      lowerText.includes('frame') ||
      lowerText.includes('frames') ||
      lowerText.includes('acrylic')
    ) {
      await sendFramesSpecs(sock, jid, config, fallbackJid);
      return;
    }

    // 4. Payment / UPI Keyword Matching
    if (
      lowerText === 'pay' ||
      lowerText === 'payment' ||
      lowerText.includes('upi') ||
      lowerText.includes('gpay') ||
      lowerText.includes('phonepe') ||
      lowerText.includes('bank') ||
      lowerText.includes('account') ||
      lowerText.includes('qr')
    ) {
      await sendPaymentInfo(sock, jid, config, fallbackJid);
      return;
    }

    // 5. Order History / Tracking Keyword Matching
    if (
      lowerText.includes('track') ||
      lowerText.includes('status') ||
      lowerText.includes('my order') ||
      lowerText.includes('history')
    ) {
      const orders = phone ? getAllOrdersByPhone(phone) : [];
      if (!orders || orders.length === 0) {
        await safeSend(sock, jid, {
          text: `📦 *Order Tracking*\n\nWe couldn't find any orders placed from your number (*+${phone}*).\n\nReply with *Price* to view our photobooks & frames list, or call us at ${config.studio_phone || '+91 7598475668'}!`
        }, fallbackJid);
      } else {
        const orderLines = orders.slice(0, 4).map((o, idx) => {
          const d = new Date(o.created_at || Date.now()).toLocaleDateString([], {
            month: 'short', day: 'numeric', year: 'numeric'
          });
          return `${idx + 1}. *Order #${o.id}*\n   • Items: ${o.product_name || 'Photobook'}\n   • Amount: *₹${Number(o.amount || 0).toLocaleString('en-IN')}*\n   • Status: *${o.status.toUpperCase()}*\n   • Date: ${d}`;
        }).join('\n\n');

        await safeSend(sock, jid, {
          text: `📜 *Your InstaPics Order History:*\n\n${orderLines}\n\n━━━━━━━━━━━━━━━━━━━━\nTotal Orders: *${orders.length}*\n\nFor any questions, call or reply here!`
        }, fallbackJid);
      }
      return;
    }

    // 6. Default Fallback for all greetings and other queries (Hi, Hello, Price, Rates, Menu, etc.)
    // Sends the full, crystal-clear, beautifully formatted catalog!
    await sendProductSpecsList(sock, jid, config, msg.pushName, fallbackJid);
  } catch (err) {
    console.error('[Bot] Error in handleIncomingMessage:', err);
  }
}
