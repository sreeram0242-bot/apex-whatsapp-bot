import QRCode from 'qrcode';
import buttonHelper from '@ryuu-reinzz/button-helper';
import fs from 'node:fs';
import path from 'node:path';
import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import { saveMessage } from './store.js';

const { sendInteractiveMessageV2 } = buttonHelper;

/**
 * Sends real clickable interactive buttons to WhatsApp with binary biz/bot node tags.
 * Supports: cta_catalog, quick_reply, cta_url, cta_call, cta_copy
 */
export async function sendInteractiveButtons(sock, jid, {
  title = '',
  body = '',
  footer = '',
  buttons = []
}) {
  try {
    const ownPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/[^0-9]/g, '') : '916369134270';

    // Build interactive buttons array
    const interactiveButtons = buttons.map(btn => {
      // 1. WhatsApp In-App Catalogue Button (opens business catalog directly in WhatsApp)
      if (btn.type === 'catalog') {
        const catPhone = btn.business_phone_number || ownPhone;
        return {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text || '🛍️ View WhatsApp Catalogue',
            url: `https://wa.me/c/${catPhone}`,
            merchant_url: `https://wa.me/c/${catPhone}`
          })
        };
      }

      // 2. Click to open URL Link
      if (btn.type === 'url') {
        return {
          name: 'cta_url',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            url: btn.url,
            merchant_url: btn.url
          })
        };
      }

      // 3. Click to Call
      if (btn.type === 'call') {
        return {
          name: 'cta_call',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            phone_number: btn.phone
          })
        };
      }

      // 4. Click to Copy Code
      if (btn.type === 'copy') {
        return {
          name: 'cta_copy',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            copy_code: btn.code
          })
        };
      }

      // 5. Interactive List Menu / Single Select (no reply arrow!)
      if (btn.type === 'single_select' || btn.type === 'list') {
        return {
          name: 'single_select',
          buttonParamsJson: JSON.stringify({
            title: btn.title || btn.text || '📋 Select Option',
            sections: btn.sections || []
          })
        };
      }

      // If already in native flow format
      if (btn.name && btn.buttonParamsJson) {
        return btn;
      }

      // 6. Default Quick Reply Button
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: btn.text,
          id: btn.id || btn.text
        })
      };
    });

    console.log(`[Buttons] Sending interactive message to ${jid} (buttons: ${interactiveButtons.length})`);
    const sent = await sendInteractiveMessageV2(sock, jid, {
      title: title || undefined,
      text: body || "Please select an option below:",
      footer: footer || undefined,
      interactiveButtons
    });

    console.log(`[Buttons] Sent successfully! Message ID: ${sent?.key?.id}`);
    if (sent?.key?.id && sent?.message) {
      saveMessage(sent.key.id, sent.message);
    }
    return sent;
  } catch (err) {
    console.error('[Buttons] Error sending interactive buttons:', err);
    try {
      const fallbackText = `${title ? `*${title}*\n\n` : ''}${body}\n\n${buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n')}`;
      await sock.sendMessage(jid, { text: fallbackText });
    } catch (fbErr) {
      console.error('[Buttons] Fallback text failed:', fbErr.message);
    }
  }
}

/**
 * Sends a generated UPI QR Code image to WhatsApp for instant customer payment
 */
export async function sendUpiQrCode(sock, jid, { upiId, upiName, amount = 0, orderId = '', note = 'InstaPics Order' }) {
  let upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`${note} #${orderId}`)}`;
  if (amount > 0) {
    upiUri += `&am=${amount}&cu=INR`;
  }

  const qrBuffer = await QRCode.toBuffer(upiUri, {
    width: 500,
    margin: 2,
    color: {
      dark: '#09090B',
      light: '#FFFFFF'
    }
  });

  const formattedAmount = amount > 0 ? `\n*Amount Payable:* *₹${amount.toLocaleString('en-IN')}*` : '';

  const caption = `📱 *Instant UPI Payment Details*\n\n` +
    `*Payee:* ${upiName}\n` +
    `*UPI ID:* \`${upiId}\`${formattedAmount}\n` +
    `*Order Ref:* #${orderId}\n\n` +
    `Scan this QR Code using any UPI App (GPay, PhonePe, Paytm, BHIM) or copy the UPI ID above.\n` +
    `_After paying, reply here with the payment screenshot or transaction ID._`;

  return await sock.sendMessage(jid, {
    image: qrBuffer,
    caption
  });
}

/**
 * Sends a swipeable Carousel Message (Method 1) where each card has a photo, text, and button.
 */
export async function sendCarouselMessage(sock, jid, {
  bodyText = 'Explore our digital services:',
  footerText = 'Swipe to view options',
  cards = []
}) {
  try {
    console.log(`[Carousel] Preparing ${cards.length} cards for ${jid}...`);

    const preparedCards = [];
    for (const card of cards) {
      let imageMessage = null;
      try {
        if (card.imageBuffer) {
          const media = await prepareWAMessageMedia(
            { image: card.imageBuffer },
            { upload: sock.waUploadToServer }
          );
          imageMessage = media.imageMessage;
        } else if (card.imagePath) {
          const buf = fs.readFileSync(card.imagePath);
          const media = await prepareWAMessageMedia(
            { image: buf },
            { upload: sock.waUploadToServer }
          );
          imageMessage = media.imageMessage;
        } else if (card.imageUrl) {
          const media = await prepareWAMessageMedia(
            { image: { url: card.imageUrl } },
            { upload: sock.waUploadToServer }
          );
          imageMessage = media.imageMessage;
        }
      } catch (mediaErr) {
        console.warn(`[Carousel] Media upload note for ${card.title}:`, mediaErr.message);
      }

      const buttonItem = card.button || {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: card.buttonText || 'Select',
          id: card.buttonId || 'btn_select'
        })
      };

      const cardObj = proto.Message.InteractiveMessage.create({
        header: proto.Message.InteractiveMessage.Header.create({
          title: card.title || '',
          hasMediaAttachment: Boolean(imageMessage),
          imageMessage: imageMessage || undefined
        }),
        body: proto.Message.InteractiveMessage.Body.create({
          text: card.body || ''
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
          buttons: [buttonItem]
        })
      });

      preparedCards.push(cardObj);
    }

    const userJid = sock.authState?.creds?.me?.id || sock.user?.id;

    const fullMsg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              header: proto.Message.InteractiveMessage.Header.create({
                hasMediaAttachment: false
              }),
              body: proto.Message.InteractiveMessage.Body.create({
                text: bodyText
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: footerText
              }),
              carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                cards: preparedCards,
                messageVersion: 1
              })
            })
          }
        }
      },
      {
        userJid,
        logger: sock.logger
      }
    );

    const additionalNodes = [
      {
        tag: 'biz',
        attrs: {},
        content: [
          {
            tag: 'interactive',
            attrs: {
              type: 'native_flow',
              v: '1'
            },
            content: [
              {
                tag: 'native_flow',
                attrs: {
                  v: '9',
                  name: 'mixed'
                }
              }
            ]
          }
        ]
      },
      { tag: 'bot', attrs: { biz_bot: '1' } }
    ];

    console.log(`[Carousel] Relaying carousel message to ${jid} (cards: ${preparedCards.length})...`);
    await sock.relayMessage(jid, fullMsg.message, {
      messageId: fullMsg.key.id,
      additionalNodes
    });

    if (fullMsg?.key?.id && fullMsg?.message) {
      saveMessage(fullMsg.key.id, fullMsg.message);
    }

    console.log(`[Carousel] Sent successfully! Message ID: ${fullMsg.key.id}`);
    return fullMsg;
  } catch (err) {
    console.error('[Carousel] Error sending carousel:', err);
    throw err;
  }
}

/**
 * Sends Format 3: Instant Price List Image Card with interactive action buttons underneath
 */
export async function sendPriceListImageDemo(sock, jid) {
  const imgPath = path.resolve('assets/products/price_list.jpg');
  const buf = fs.readFileSync(imgPath);

  const caption = "📸 *InstaPics Official Photobook Price List*\n\n" +
    "✨ *Non-Tearable | 100% Waterproof | Lifetime Durability*\n\n" +
    "📘 *A4 Premium Photobook:*\n" +
    "• 40 Pgs (60 Photos): *₹1,750* (was ₹3,600)\n" +
    "• 60 Pgs (100 Photos): *₹2,150* (was ₹4,500)\n" +
    "• 80 Pgs (140 Photos): *₹2,500* (was ₹5,200)\n\n" +
    "📚 *A3 Jumbo Photobook:*\n" +
    "• 40 Pgs (130 Photos): *₹2,500* (was ₹5,000)\n" +
    "• 60 Pgs (220 Photos): *₹3,300* (was ₹6,500)\n" +
    "• 80 Pgs (300 Photos): *₹4,200* (was ₹8,500)\n\n" +
    "Tap an option below to start your order:";

  try {
    const media = await prepareWAMessageMedia(
      { image: buf },
      { upload: sock.waUploadToServer }
    );

    const userJid = sock.authState?.creds?.me?.id || sock.user?.id;
    const fullMsg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              header: proto.Message.InteractiveMessage.Header.create({
                title: "🏷️ InstaPics Price List",
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
              }),
              body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
              footer: proto.Message.InteractiveMessage.Footer.create({ text: "Tap an option below to order" }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '📘 Order A4 Book', id: 'prod_photobook_a4' })
                  },
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '📚 Order A3 Jumbo', id: 'prod_photobook_a3' })
                  },
                  {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: '🖼️ Custom Frames', id: 'prod_frames' })
                  }
                ]
              })
            })
          }
        }
      },
      { userJid, logger: sock.logger }
    );

    const additionalNodes = [
      {
        tag: 'biz',
        attrs: {},
        content: [
          {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
          }
        ]
      },
      { tag: 'bot', attrs: { biz_bot: '1' } }
    ];

    console.log(`[PriceListDemo] Relaying interactive price card to ${jid}...`);
    await sock.relayMessage(jid, fullMsg.message, { messageId: fullMsg.key.id, additionalNodes });
    if (fullMsg?.key?.id && fullMsg?.message) {
      saveMessage(fullMsg.key.id, fullMsg.message);
    }
    console.log(`[PriceListDemo] Sent successfully! ID: ${fullMsg.key.id}`);
    return fullMsg;
  } catch (err) {
    console.warn('[PriceListDemo] Falling back to standard image message:', err.message);
    return await sock.sendMessage(jid, {
      image: buf,
      caption: caption
    });
  }
}
