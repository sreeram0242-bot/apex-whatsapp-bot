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
 * Official InstaPicss Photobooks Products List with Pricing Template
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
`📞 *Studio Helpline:* +91 6369134270\n` +
`📍 *InstaPicss Custom Print Studio*`;

/**
 * In-memory in-flight lock to guarantee zero duplicate sends
 * even during rapid-fire bursts from contacts.
 */
const activeWelcomeDispatches = new Set();

/**
 * Sends the complete, crystal-clear InstaPicss Products List with Pricing.
 * Pure normal text with emojis and bullet points — 100% universal across all WhatsApp clients.
 */
export async function sendProductSpecsList(sock, jid, config = null, customerName = '', fallbackJid = null) {
  const cfg = config || getAllConfig();
  const template = cfg.welcome_specs_template || DEFAULT_SPECS_TEMPLATE;
  return await safeSend(sock, jid, { text: template }, fallbackJid);
}

/**
 * Handles incoming WhatsApp messages.
 * RULES:
 * 1. Auto-reply ONLY for the Products List with their Pricing:
 *    - On customer's 1st message (welcome offer)
 *    - On product/pricing keywords (price, a4, a3, rates, catalog, album, etc.)
 * 2. ZERO auto-reply for all other messages (studio human team handles manually).
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
    const lowerText = incomingText.toLowerCase();

    // 5. Track user message in database: checks if this is the user's very first message
    const { isFirst, messageCount } = registerUserMessage(cleanPhone, pushName);
    const config = getAllConfig();

    console.log(`[Bot] Message received from +${cleanPhone} (${pushName}) [msg #${messageCount}, isFirst: ${isFirst}]: "${incomingText}"`);

    // =========================================================================
    // CASE A: NEW CUSTOMER ON FIRST MESSAGE
    // Automatically send the complete Products List with Pricing
    // =========================================================================
    if (isFirst) {
      if (activeWelcomeDispatches.has(cleanPhone)) {
        console.log(`[Bot] Product list dispatch already in-flight for +${cleanPhone}, skipping duplicate trigger.`);
        return;
      }
      activeWelcomeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] New customer detected (+${cleanPhone})! Sending products list with pricing...`);
        await sendProductSpecsList(sock, jid, config, pushName, fallbackJid);
      } finally {
        setTimeout(() => activeWelcomeDispatches.delete(cleanPhone), 10000);
      }
      return;
    }

    // =========================================================================
    // CASE B: PRODUCT & PRICING KEYWORDS (ANY USER)
    // Auto-reply ONLY when customer explicitly asks for products, prices, or rates
    // (photobook, album, menu, hi, hello are excluded)
    // =========================================================================
    const isProductPricingQuery =
      lowerText === 'price' ||
      lowerText === 'prices' ||
      lowerText === 'rate' ||
      lowerText === 'rates' ||
      lowerText.includes('rate card') ||
      lowerText.includes('price list') ||
      lowerText.includes('pricelist') ||
      lowerText.includes('cost') ||
      lowerText.includes('charges') ||
      lowerText.includes('amount') ||
      lowerText.includes('product') ||
      lowerText.includes('products') ||
      lowerText.includes('catalog') ||
      lowerText.includes('catalogue') ||
      lowerText.includes('offer') ||
      lowerText.includes('offers') ||
      lowerText === 'a4' ||
      lowerText === 'a3' ||
      lowerText.includes('a4') ||
      lowerText.includes('a3') ||
      lowerText.includes('jumbo') ||
      lowerText.includes('specs');

    if (isProductPricingQuery) {
      if (activeWelcomeDispatches.has(cleanPhone)) {
        return;
      }
      activeWelcomeDispatches.add(cleanPhone);

      try {
        console.log(`[Bot] Product/pricing keyword matched ("${incomingText}") from +${cleanPhone}. Sending products list with pricing...`);
        await sendProductSpecsList(sock, jid, config, pushName, fallbackJid);
      } finally {
        setTimeout(() => activeWelcomeDispatches.delete(cleanPhone), 10000);
      }
      return;
    }

    // =========================================================================
    // CASE C: ALL OTHER MESSAGES (PHOTOS, DRIVE LINKS, CUSTOM CHAT)
    // ZERO auto-reply — Studio human team takes over the conversation manually.
    // =========================================================================
    console.log(`[Bot] Non-pricing message from +${cleanPhone} — manual studio takeover mode (no auto-reply).`);
    return;

  } catch (err) {
    console.error('[Bot] Error in handleIncomingMessage:', err);
  }
}
