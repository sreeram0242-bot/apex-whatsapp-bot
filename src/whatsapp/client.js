import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Browsers,
  getAggregateVotesInPollMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'node:path';
import { serializeMessage } from './serializer.js';
import { handleIncomingMessage, sendWelcomeMenu } from './handler.js';
import { sendCarouselMessage, sendInteractiveButtons } from './buttons.js';
import { saveMessage, getStoredMessage } from './store.js';
import { getAllConfig } from '../db.js';

let sock = null;
let currentStatus = 'initializing'; // initializing, qr_ready, connecting, connected, logged_out
let currentQrDataUrl = null;
let currentRawQr = null;
let pairingCode = null;
let isInitializing = false;
let reconnectTimer = null;

const logger = pino({ level: 'silent' }); // quiet down internal socket noise

export async function initWhatsApp() {
  if (isInitializing) {
    console.log('[WhatsApp] Already initializing socket, skipping duplicate call.');
    return sock;
  }
  isInitializing = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Safely clean up previous socket and listeners
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch {}
    sock = null;
  }

  const sessionDir = path.resolve(process.env.SESSION_DIR || 'sessions');
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
    version: [2, 3000, 1015901307],
    isLatest: false
  }));

  console.log(`[WhatsApp] Baileys Engine v${version.join('.')} (Latest: ${isLatest})`);

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.windows('Desktop'),
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async (key) => {
      const msg = getStoredMessage(key?.id);
      return msg || undefined;
    }
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentStatus = 'qr_ready';
      currentRawQr = qr;
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
      } catch (e) {
        console.error('Error generating QR data URL:', e);
      }

      console.log('\n[WhatsApp] Scan the QR code below using WhatsApp (Linked Devices):');
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === 'connecting') {
      currentStatus = 'connecting';
      console.log('[WhatsApp] Connecting to WhatsApp servers...');
    }

    if (connection === 'open') {
      isInitializing = false;
      currentStatus = 'connected';
      currentQrDataUrl = null;
      currentRawQr = null;
      pairingCode = null;
      const userPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Unknown';
      console.log(`\n[WhatsApp] Connected successfully! Logged in as: +${userPhone} (${sock.user?.name || 'Studio Bot'})`);
    }

    if (connection === 'close') {
      isInitializing = false;
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : null;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[WhatsApp] Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        currentStatus = 'connecting';
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            initWhatsApp();
          }, 3000);
        }
      } else {
        currentStatus = 'logged_out';
        console.log('[WhatsApp] Session logged out. Please rescan QR code.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      try {
        if (m.key?.id && m.message) {
          saveMessage(m.key.id, m.message);
        }
        const serialized = await serializeMessage(sock, m);
        if (serialized) {
          await handleIncomingMessage(sock, serialized);
        }
      } catch (err) {
        console.error('[WhatsApp] Error processing message:', err);
      }
    }
  });

  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (update.pollUpdates) {
        console.log(`[WhatsApp] Poll update received for message: ${key.id}`);
        const pollCreation = getStoredMessage(key.id);
        if (pollCreation) {
          try {
            const votes = getAggregateVotesInPollMessage(
              { message: pollCreation, pollUpdates: update.pollUpdates },
              sock.user?.id
            );
            console.log('[WhatsApp Poll] Aggregated votes:', JSON.stringify(votes));
            for (const opt of votes) {
              if (opt.voters && opt.voters.length > 0) {
                console.log(`[WhatsApp Poll] Tapped option: "${opt.name}"`);
                const simulatedMsg = {
                  key: {
                    remoteJid: key.remoteJid,
                    fromMe: false,
                    id: `poll_vote_${Date.now()}`
                  },
                  jid: key.remoteJid,
                  phone: key.remoteJid.split('@')[0],
                  fromMe: false,
                  isGroup: key.remoteJid.endsWith('@g.us'),
                  isNewsletter: key.remoteJid.endsWith('@newsletter'),
                  pushName: 'Customer',
                  text: opt.name,
                  buttonId: opt.name,
                  hasImage: false,
                  downloadMedia: async () => null
                };
                await handleIncomingMessage(sock, simulatedMsg);
              }
            }
          } catch (pollErr) {
            console.error('[WhatsApp] Error aggregating poll votes:', pollErr);
          }
        }
      }
    }
  });

  return sock;
}

export function getWhatsAppStatus() {
  const userPhone = sock?.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : null;
  return {
    status: currentStatus,
    phone: userPhone,
    name: sock?.user?.name || 'Studio WhatsApp',
    qrCodeDataUrl: currentQrDataUrl,
    pairingCode
  };
}

export async function requestPairing(phoneNumber) {
  if (!sock) throw new Error('WhatsApp socket not initialized');
  if (currentStatus === 'connected') throw new Error('WhatsApp is already connected');
  
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid phone number with country code (e.g. 919876543210)');
  }

  const code = await sock.requestPairingCode(cleanPhone);
  pairingCode = code;
  return code;
}

export async function sendCustomerNotification(phone, messageText) {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }

  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const jid = `${cleanPhone}@s.whatsapp.net`;
  return await sock.sendMessage(jid, { text: messageText });
}

export async function fetchBusinessCatalog() {
  if (!sock) throw new Error('WhatsApp is not initialized');
  if (currentStatus !== 'connected') throw new Error('WhatsApp is not connected');

  const ownJid = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : null;
  console.log(`[WhatsApp] Fetching catalog for: ${ownJid}`);

  // Timeout promise after 6 seconds so it never hangs
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('WhatsApp Catalog query timed out (no catalog configured on WhatsApp servers)')), 6000)
  );

  try {
    const catalogPromise = sock.getCatalog({ jid: ownJid, limit: 50 });
    const catalog = await Promise.race([catalogPromise, timeoutPromise]);
    console.log('[WhatsApp] Catalog fetched:', JSON.stringify(catalog).slice(0, 300));
    return catalog;
  } catch (err) {
    console.warn('[WhatsApp] Could not fetch catalog from WhatsApp server:', err.message);
    return { products: [] };
  }
}

export async function restartWhatsApp() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch {}
    sock = null;
  }
  isInitializing = false;
  return await initWhatsApp();
}

export async function sendWelcomeToOwner() {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  const userPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : null;
  if (!userPhone) throw new Error('Could not determine connected phone number');
  const jid = `${userPhone}@s.whatsapp.net`;
  const config = getAllConfig();
  await sendWelcomeMenu(sock, jid, config, sock.user?.name || 'Owner');
  return { success: true, phone: userPhone };
}

export async function checkPhoneOnWhatsApp(phoneNumber) {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  let cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  const result = await sock.onWhatsApp(cleanPhone);
  return result;
}

export async function sendWelcomeToPhone(phoneNumber) {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  let cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Invalid phone number provided');
  }
  const jid = `${cleanPhone}@s.whatsapp.net`;
  const config = getAllConfig();
  await sendWelcomeMenu(sock, jid, config, 'Customer');
  return { success: true, phone: cleanPhone };
}

export async function sendListDemoToPhone(phoneNumber) {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  let cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Invalid phone number provided');
  }
  const jid = `${cleanPhone}@s.whatsapp.net`;
  const ownPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '916369134270';

  const buttons = [
    {
      type: 'catalog',
      text: '🛍️ View WhatsApp Catalogue',
      business_phone_number: ownPhone
    },
    {
      type: 'single_select',
      title: '📖 Choose Photobook / Frame',
      sections: [
        {
          title: '📖 A4 Premium (Non-Tearable)',
          highlight_label: 'Best Seller',
          rows: [
            {
              id: 'prod_photobook_a4',
              title: '📘 A4 • 40 Pages (60 Photos)',
              description: '₹1,750 • Non-tearable & waterproof (was ₹3,600)'
            },
            {
              id: 'prod_photobook_a4',
              title: '📘 A4 • 60 Pages (100 Photos)',
              description: '₹2,150 • Non-tearable & waterproof (was ₹4,500)'
            },
            {
              id: 'prod_photobook_a4',
              title: '📘 A4 • 80 Pages (140 Photos)',
              description: '₹2,500 • Non-tearable & waterproof (was ₹5,200)'
            }
          ]
        },
        {
          title: '📚 A3 Jumbo (Luxury Album)',
          rows: [
            {
              id: 'prod_photobook_a3',
              title: '📙 A3 • 40 Pages (130 Photos)',
              description: '₹2,500 • Jumbo luxury album (was ₹5,000)'
            },
            {
              id: 'prod_photobook_a3',
              title: '📙 A3 • 60 Pages (220 Photos)',
              description: '₹3,300 • Jumbo luxury album (was ₹6,500)'
            },
            {
              id: 'prod_photobook_a3',
              title: '📙 A3 • 80 Pages (300 Photos)',
              description: '₹4,200 • Jumbo luxury album (was ₹8,500)'
            }
          ]
        },
        {
          title: '🖼️ Custom Photo Frames',
          rows: [
            {
              id: 'prod_frames',
              title: '🖼️ Acrylic / Wooden Frame',
              description: 'From ₹499 • Custom sizes for wall & table'
            }
          ]
        }
      ]
    }
  ];

  return await sendInteractiveButtons(sock, jid, {
    title: '📸 InstaPics Photobooks & Frames',
    body: 'Welcome to *InstaPics*! 📸✨\n\nWe print premium *Non-Tearable & 100% Waterproof Photobooks* and personalized *Photo Frames* with lifetime durability.\n\nTap *Choose Photobook / Frame* to select your package:',
    footer: 'Select an option below',
    buttons
  });
}

export async function sendCarouselDemoToPhone(phoneNumber) {
  if (!sock || currentStatus !== 'connected') {
    throw new Error('WhatsApp is not connected');
  }
  let cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Invalid phone number provided');
  }
  const jid = `${cleanPhone}@s.whatsapp.net`;

  return await sendCarouselMessage(sock, jid, {
    bodyText: "📸 *InstaPics Photobooks & Frames*\n\nExplore our custom photobook and frame collections below. Swipe through the cards to view each product and tap the button to customize:",
    footerText: "◄ Swipe Left / Right to Browse ►",
    cards: [
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
        title: '🖼️ Custom Frames (₹499)',
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
    ]
  });
}


