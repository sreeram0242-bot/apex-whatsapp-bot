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
      title: '📋 Choose a Service',
      sections: [
        {
          title: 'Available Packages',
          highlight_label: 'Popular',
          rows: [
            {
              id: 'prod_meta_ads',
              title: '🎯 Meta Ads',
              description: '₹999 • High-ROI FB & IG Lead Campaigns'
            },
            {
              id: 'prod_digital_marketing',
              title: '🚀 Digital Marketing',
              description: '₹14,999 • Complete 360° Omnichannel Growth'
            },
            {
              id: 'prod_seo',
              title: '📍 SEO Management',
              description: '₹999 • Google Search & Maps Page 1'
            },
            {
              id: 'prod_web_dev',
              title: '💻 Web Development',
              description: '₹4,999 • Modern High-Speed Business Website'
            }
          ]
        }
      ]
    }
  ];

  return await sendInteractiveButtons(sock, jid, {
    title: '🚀 Apex Software & Digital Marketing',
    body: 'Welcome to *Apex Digital Solutions*!\n\nWe provide high-impact digital growth services for your business.\n\nTap *View WhatsApp Catalogue* or tap *Choose a Service* to select your package (No reply icons!):',
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
    bodyText: "🚀 *Apex Software & Digital Solutions*\n\nExplore our service packages below. Swipe through the cards to view each plan with its photo and tap the button to choose:",
    footerText: "◄ Swipe Left / Right to Browse ►",
    cards: [
      {
        title: '🎯 Meta Ads (₹999)',
        imagePath: path.resolve('assets/services/meta_ads.jpg'),
        body: 'High-ROI Facebook & Instagram ad campaigns with targeted leads.',
        buttonText: '🎯 Select Meta Ads',
        buttonId: 'prod_meta_ads'
      },
      {
        title: '🚀 Digital Marketing (₹14,999)',
        imagePath: path.resolve('assets/services/digital_marketing.jpg'),
        body: 'Complete 360° omnichannel growth, brand scaling & management.',
        buttonText: '🚀 Select 360° Plan',
        buttonId: 'prod_digital_marketing'
      },
      {
        title: '📍 SEO Enhancement (₹999)',
        imagePath: path.resolve('assets/services/seo.jpg'),
        body: 'Google Search & Google Maps Page 1 local keyword ranking.',
        buttonText: '📍 Select SEO',
        buttonId: 'prod_seo'
      },
      {
        title: '💻 Web Development (₹4,999)',
        imagePath: path.resolve('assets/services/website_dev.jpg'),
        body: 'Fast, modern & responsive business website with WhatsApp chat.',
        buttonText: '💻 Select Web Dev',
        buttonId: 'prod_web_dev'
      }
    ]
  });
}


