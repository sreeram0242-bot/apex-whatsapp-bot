import {
  getAllConfig,
  registerUserMessage
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
 * 1. Official InstaPicss Complete Rate Card & Welcome Offer Template
 */
export const DEFAULT_SPECS_TEMPLATE =
`📸 *INSTAPICSS PHOTOBOOKS & FRAMES* ✨\n\n` +
`WELCOME OFFER ✨\n\n` +
`✨ *QUALITY GUARANTEE:*\n` +
`• 💧 *100% Waterproof Pages* (spill-proof & washable)\n` +
`• 🛡️ *Non-Tearable Synthetic Paper* (lifetime durability)\n` +
`• High Chroma imaging technology print\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📖 *A4 PREMIUM PHOTOBOOKS* (Standard Album)\n\n` +
`• *40 Pages* (20 Sheets • up to 60 Photos)\n` +
`  ~₹3,600~ ➔ *₹1,750* (51% OFF)\n\n` +
`• *60 Pages* (30 Sheets • up to 100 Photos)\n` +
`  ~₹4,500~ ➔ *₹2,150* (52% OFF)\n\n` +
`• *80 Pages* (40 Sheets • up to 140 Photos)\n` +
`  ~₹5,200~ ➔ *₹2,500* (52% OFF)\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📚 *A3 JUMBO PHOTOBOOKS* (Luxury Large Album)\n\n` +
`• *40 Pages* (20 Sheets • up to 130 Photos)\n` +
`  ~₹5,000~ ➔ *₹2,500* (50% OFF)\n\n` +
`• *60 Pages* (30 Sheets • up to 220 Photos)\n` +
`  ~₹6,500~ ➔ *₹3,300* (49% OFF)\n\n` +
`• *80 Pages* (40 Sheets • up to 300 Photos)\n` +
`  ~₹8,500~ ➔ *₹4,200* (51% OFF)\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📲 *HOW TO ORDER (3 EASY STEPS):*\n\n` +
`1️⃣ Reply here with your preferred album size (e.g. *A4 40 Pages* or *A3 60 Pages*)\n` +
`2️⃣ Send your photos directly here on WhatsApp or share a Google Drive / Photos link.\n` +
`3️⃣ Our designers will design your digital album preview for your approval before printing! 🎨✨\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`💡 *QUICK KEYWORDS FOR DETAILS:*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`Reply with any keyword below for instant details:\n` +
`• *A4* — View A4 Photobook Packages & Offers\n` +
`• *A3* — View A3 Jumbo Wedding Album Packages\n` +
`• *Pay* — View UPI ID & Payment QR Details\n\n\n` +
`📞 *Studio Helpline:* +91 6369134270\n` +
`📍 *InstaPicss Custom Print Studio*`;

/**
 * 2. Dedicated A4 Photobook Packages & Pricing Template
 */
export const DEFAULT_A4_TEMPLATE =
`📖 *INSTAPICSS — A4 PREMIUM PHOTOBOOKS* 📸\n` +
`_Standard Album • Best for Birthdays, Family & Travel Memories_\n\n` +
`✨ *QUALITY GUARANTEE:*\n` +
`• 💧 *100% Waterproof Pages* (spill-proof & washable)\n` +
`• 🛡️ *Non-Tearable Synthetic Paper* (lifetime durability)\n` +
`• High Chroma imaging technology print\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🏷️ *A4 PACKAGES & OFFER PRICING:*\n\n` +
`• *40 Pages* (20 Sheets • up to 60 Photos)\n` +
`  ~₹3,600~ ➔ *₹1,750* (51% OFF)\n\n` +
`• *60 Pages* (30 Sheets • up to 100 Photos)\n` +
`  ~₹4,500~ ➔ *₹2,150* (52% OFF)\n\n` +
`• *80 Pages* (40 Sheets • up to 140 Photos)\n` +
`  ~₹5,200~ ➔ *₹2,500* (52% OFF)\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📲 *HOW TO ORDER:*\n\n` +
`1️⃣ Reply with your preferred page count (e.g. *A4 40 Pages*)\n` +
`2️⃣ Send your photos directly here on WhatsApp or share a Google Drive / Photos link.\n` +
`3️⃣ Our designers will design your digital album preview for your approval before printing! 🎨✨\n\n` +
`📞 *Studio Helpline:* +91 6369134270\n` +
`📍 *InstaPicss Custom Print Studio*`;

/**
 * 3. Dedicated A3 Jumbo Photobook Packages & Pricing Template
 */
export const DEFAULT_A3_TEMPLATE =
`📚 *INSTAPICSS — A3 JUMBO PHOTOBOOKS* 📸\n` +
`_Luxury Large Album • Ideal for Weddings & Grand Receptions_\n\n` +
`✨ *QUALITY GUARANTEE:*\n` +
`• 💧 *100% Waterproof Pages* (spill-proof & washable)\n` +
`• 🛡️ *Non-Tearable Synthetic Paper* (lifetime durability)\n` +
`• High Chroma imaging technology print\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🏷️ *A3 JUMBO PACKAGES & OFFER PRICING:*\n\n` +
`• *40 Pages* (20 Sheets • up to 130 Photos)\n` +
`  ~₹5,000~ ➔ *₹2,500* (50% OFF)\n\n` +
`• *60 Pages* (30 Sheets • up to 220 Photos)\n` +
`  ~₹6,500~ ➔ *₹3,300* (49% OFF)\n\n` +
`• *80 Pages* (40 Sheets • up to 300 Photos)\n` +
`  ~₹8,500~ ➔ *₹4,200* (51% OFF)\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📲 *HOW TO ORDER:*\n\n` +
`1️⃣ Reply with your preferred page count (e.g. *A3 60 Pages*)\n` +
`2️⃣ Send your photos directly here on WhatsApp or share a Google Drive / Photos link.\n` +
`3️⃣ Our designers will design your digital album preview for your approval before printing! 🎨✨\n\n` +
`📞 *Studio Helpline:* +91 6369134270\n` +
`📍 *InstaPicss Custom Print Studio*`;

/**
 * 4. Dedicated GPay Payment Details Template
 */
export const DEFAULT_PAYMENT_TEMPLATE =
`💳 *INSTAPICSS — PAYMENT DETAILS* ✨\n` +
`_Official Studio Payment Account_\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📲 *GOOGLE PAY (GPAY) & UPI:*\n\n` +
`• 🆔 *GPay UPI ID:* \`achu.yous@oksbi\`\n` +
`• 📱 *GPay Number:* \`7708065667\`\n` +
`• 👤 *Payee Name:* InstaPicss Custom Print Studio\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📱 *Accepted Payment Apps:*\n` +
`• Google Pay (GPay)\n` +
`• PhonePe\n` +
`• Paytm\n` +
`• Cred / Any UPI App\n\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`✅ *AFTER PAYMENT:*\n` +
`Please share your transaction screenshot or payment reference ID here on WhatsApp for instant order confirmation! 📸✨\n\n` +
`📞 *Studio Helpline:* +91 6369134270\n` +
`📍 *InstaPicss Custom Print Studio*`;

/**
 * In-memory in-flight lock to guarantee zero duplicate sends
 * even during rapid-fire bursts from contacts.
 */
const activeDispatches = new Set();

/**
 * Sends the complete, crystal-clear InstaPicss Products List with Pricing.
 */
export async function sendProductSpecsList(sock, jid, config = null, customerName = '', fallbackJid = null) {
  const cfg = config || getAllConfig();
  const template = cfg.welcome_specs_template || DEFAULT_SPECS_TEMPLATE;
  return await safeSend(sock, jid, { text: template }, fallbackJid);
}

/**
 * Sends focused A4 Photobook products & pricing.
 */
export async function sendA4Specs(sock, jid, config = null, fallbackJid = null) {
  return await safeSend(sock, jid, { text: DEFAULT_A4_TEMPLATE }, fallbackJid);
}

/**
 * Sends focused A3 Jumbo Photobook products & pricing.
 */
export async function sendA3Specs(sock, jid, config = null, fallbackJid = null) {
  return await safeSend(sock, jid, { text: DEFAULT_A3_TEMPLATE }, fallbackJid);
}

/**
 * Sends official GPay payment details.
 */
export async function sendPaymentInfo(sock, jid, config = null, fallbackJid = null) {
  return await safeSend(sock, jid, { text: DEFAULT_PAYMENT_TEMPLATE }, fallbackJid);
}

/**
 * Alternative keyword matcher for A4 Photobooks:
 * Matches: a4, a-4, a 4, a4 size, a4 album, a4 photobook, a4 price, a4 rate, standard album, small album
 */
export function isA4Query(text) {
  const t = (text || '').toLowerCase().trim();
  if (t === 'a4' || t === 'a 4' || t === 'a-4') return true;
  if (/^a\s*[-]?\s*4\b/.test(t)) return true;
  if (t.includes('a4') || t.includes('a 4') || t.includes('a-4')) return true;
  if (t.includes('small album') || t.includes('standard album')) return true;
  return false;
}

/**
 * Alternative keyword matcher for A3 Jumbo Photobooks:
 * Matches: a3, a-3, a 3, a3 size, a3 album, a3 photobook, a3 jumbo, jumbo, jumbo album, wedding album, big album
 */
export function isA3Query(text) {
  const t = (text || '').toLowerCase().trim();
  if (t === 'a3' || t === 'a 3' || t === 'a-3') return true;
  if (/^a\s*[-]?\s*3\b/.test(t)) return true;
  if (t.includes('a3') || t.includes('a 3') || t.includes('a-3')) return true;
  if (t.includes('jumbo') || t.includes('wedding album') || t.includes('big album') || t.includes('large album')) return true;
  return false;
}

/**
 * Alternative keyword matcher for Payment / GPay:
 * Matches: pay, payment, payment details, gpay, google pay, googlepay, phonepe, paytm, upi, upi id, qr, qr code, account details, bank details, how to pay
 */
export function isPaymentQuery(text) {
  const t = (text || '').toLowerCase().trim();
  if (t === 'pay' || t === 'payment' || t === 'gpay' || t === 'upi') return true;
  if (
    t.includes('pay') ||
    t.includes('payment') ||
    t.includes('gpay') ||
    t.includes('google pay') ||
    t.includes('googlepay') ||
    t.includes('phonepe') ||
    t.includes('paytm') ||
    t.includes('upi') ||
    t.includes('qr') ||
    t.includes('bank') ||
    t.includes('account details') ||
    t.includes('how to pay')
  ) {
    return true;
  }
  return false;
}

/**
 * Matcher for general rate card / price catalog inquiries
 */
export function isGeneralPriceQuery(text) {
  const t = (text || '').toLowerCase().trim();
  if (t === 'price' || t === 'prices' || t === 'rate' || t === 'rates') return true;
  if (
    t.includes('price list') ||
    t.includes('rate card') ||
    t.includes('pricelist') ||
    t.includes('catalog') ||
    t.includes('catalogue') ||
    t.includes('offer') ||
    t.includes('offers') ||
    t.includes('specs') ||
    t === 'cost' ||
    t === 'charges'
  ) {
    return true;
  }
  return false;
}

/**
 * Handles incoming WhatsApp messages.
 * RULES:
 * 1. Customer's 1st message -> Complete Welcome & Rate Card
 * 2. Keyword A4 -> Dedicated A4 specs & prices
 * 3. Keyword A3 -> Dedicated A3 Jumbo specs & prices
 * 4. Keyword Pay -> Dedicated GPay details (achu.yous@oksbi, 7708065667)
 * 5. Keyword Price / Catalog -> Complete Rate Card
 * 6. All other messages (photos, Drive links, address, chat) -> 0 auto-reply (human studio staff handles manually)
 */
export async function handleIncomingMessage(sock, msg) {
  try {
    // 1. Guard against null messages, group chats, newsletters, broadcasts, and status stories
    if (!msg || msg.isGroup || msg.isNewsletter) return;
    if (msg.jid?.includes('@broadcast') || msg.originalJid?.includes('@broadcast')) return;

    // 2. Prevent bot from replying to its own automated messages or staff outgoing messages
    if (msg.fromMe) return;

    // 3. Ignore non-text protocol events (emoji reactions, deleted message notifications)
    if (msg.raw?.message?.reactionMessage || msg.raw?.message?.protocolMessage) return;

    const jid = msg.jid;
    const fallbackJid = msg.originalJid;
    const rawPhone = msg.phone || (jid ? jid.split('@')[0] : '');
    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '');

    // 4. Validate phone number format (minimum 7 digits for genuine mobile numbers)
    if (!cleanPhone || cleanPhone.length < 7) {
      return;
    }

    const pushName = msg.pushName || 'Customer';
    const incomingText = (msg.text || '').trim();

    // 5. Track user message in database: checks if this is the user's very first message
    const { isFirst, messageCount } = registerUserMessage(cleanPhone, pushName);
    const config = getAllConfig();

    console.log(`[Bot] Message received from +${cleanPhone} (${pushName}) [msg #${messageCount}, isFirst: ${isFirst}]: "${incomingText}"`);

    // =========================================================================
    // CASE 1: NEW CUSTOMER ON FIRST MESSAGE
    // Automatically send the complete Welcome Offer & Rate Card
    // =========================================================================
    if (isFirst) {
      if (activeDispatches.has(cleanPhone)) return;
      activeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] New customer (+${cleanPhone})! Sending welcome offer & rate card...`);
        await sendProductSpecsList(sock, jid, config, pushName, fallbackJid);
      } finally {
        setTimeout(() => activeDispatches.delete(cleanPhone), 8000);
      }
      return;
    }

    // =========================================================================
    // CASE 2: KEYWORD "A4" (and alternative versions)
    // Sends dedicated A4 photobook packages, specs, and pricing
    // =========================================================================
    if (isA4Query(incomingText)) {
      if (activeDispatches.has(cleanPhone)) return;
      activeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] A4 keyword matched from +${cleanPhone}. Sending A4 specs & prices...`);
        await sendA4Specs(sock, jid, config, fallbackJid);
      } finally {
        setTimeout(() => activeDispatches.delete(cleanPhone), 8000);
      }
      return;
    }

    // =========================================================================
    // CASE 3: KEYWORD "A3" (and alternative versions)
    // Sends dedicated A3 Jumbo photobook packages, specs, and pricing
    // =========================================================================
    if (isA3Query(incomingText)) {
      if (activeDispatches.has(cleanPhone)) return;
      activeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] A3 keyword matched from +${cleanPhone}. Sending A3 Jumbo specs & prices...`);
        await sendA3Specs(sock, jid, config, fallbackJid);
      } finally {
        setTimeout(() => activeDispatches.delete(cleanPhone), 8000);
      }
      return;
    }

    // =========================================================================
    // CASE 4: KEYWORD "PAY" / "PAYMENT" (and alternative versions)
    // Sends official GPay details (achu.yous@oksbi, 7708065667)
    // =========================================================================
    if (isPaymentQuery(incomingText)) {
      if (activeDispatches.has(cleanPhone)) return;
      activeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] Payment keyword matched from +${cleanPhone}. Sending GPay details...`);
        await sendPaymentInfo(sock, jid, config, fallbackJid);
      } finally {
        setTimeout(() => activeDispatches.delete(cleanPhone), 8000);
      }
      return;
    }

    // =========================================================================
    // CASE 5: GENERAL RATE CARD / PRICE CATALOG KEYWORDS
    // Sends complete Welcome Offer & Rate Card
    // =========================================================================
    if (isGeneralPriceQuery(incomingText)) {
      if (activeDispatches.has(cleanPhone)) return;
      activeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] Price keyword matched from +${cleanPhone}. Sending complete rate card...`);
        await sendProductSpecsList(sock, jid, config, pushName, fallbackJid);
      } finally {
        setTimeout(() => activeDispatches.delete(cleanPhone), 8000);
      }
      return;
    }

    // =========================================================================
    // CASE 6: ALL OTHER MESSAGES (PHOTOS, DRIVE LINKS, CUSTOM CHAT)
    // ZERO auto-reply — Studio human team takes over the conversation manually.
    // =========================================================================
    console.log(`[Bot] Non-keyword message from +${cleanPhone} — manual studio takeover mode (no auto-reply).`);
    return;

  } catch (err) {
    console.error('[Bot] Error in handleIncomingMessage:', err);
  }
}
