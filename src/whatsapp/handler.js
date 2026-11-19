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
 * Official InstaPicss Photobooks & Frames Welcome Offer & Specs List Template
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
 * Sends the complete, crystal-clear InstaPicss Welcome Offer & Specs List.
 * Pure normal text with emojis and bullet points — 100% universal across all WhatsApp clients.
 */
export async function sendProductSpecsList(sock, jid, config = null, customerName = '', fallbackJid = null) {
  const cfg = config || getAllConfig();
  const template = cfg.welcome_specs_template || DEFAULT_SPECS_TEMPLATE;
  return await safeSend(sock, jid, { text: template }, fallbackJid);
}

/**
 * Handles incoming WhatsApp messages.
 * STRICT ONE-TIME WELCOME AUTO-REPLY ENGINE:
 * - When a customer messages for the very first time: receives the Welcome Offer & Specs List once.
 * - All subsequent messages & keywords: 0 auto-replies (silent return).
 * - Studio human staff handles conversations manually without bot interference.
 */
export async function handleIncomingMessage(sock, msg) {
  try {
    if (!msg || msg.isGroup || msg.isNewsletter) return;

    // Prevent bot from replying to its own automated messages
    if (msg.fromMe) return;

    const jid = msg.jid;
    const fallbackJid = msg.originalJid;
    const phone = msg.phone || (jid ? jid.split('@')[0] : 'Customer');
    const pushName = msg.pushName || 'Customer';

    // Track user message in database: checks if this is the user's very first message
    const { isFirst, messageCount } = registerUserMessage(phone, pushName);
    const config = getAllConfig();

    console.log(`[Bot] Message received from ${phone} (${pushName}) [msg #${messageCount}, isFirst: ${isFirst}]`);

    // =========================================================================
    // 1. STRICT RULE: ONE-TIME AUTO-REPLY ON FIRST MESSAGE ONLY
    // =========================================================================
    if (isFirst) {
      console.log(`[Bot] New customer detected (+${phone})! Sending one-time welcome offer & specs list...`);
      await sendProductSpecsList(sock, jid, config, pushName, fallbackJid);
      return;
    }

    // =========================================================================
    // 2. ALL SUBSEQUENT MESSAGES: NO AUTO-REPLY, NO KEYWORDS
    // =========================================================================
    // Studio human team / staff will handle all follow-up messages and orders manually.
    console.log(`[Bot] Subsequent message from existing customer (+${phone}) — silent pass-through for studio staff takeover.`);
    return;

  } catch (err) {
    console.error('[Bot] Error in handleIncomingMessage:', err);
  }
}
