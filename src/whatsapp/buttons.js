import QRCode from 'qrcode';

/**
 * Safe, reliable text fallback for any button requests.
 * Zero external button helpers — 100% standard WhatsApp text delivery.
 */
export async function sendInteractiveButtons(sock, jid, {
  title = '',
  body = '',
  footer = '',
  buttons = []
}) {
  const optionsList = (buttons && buttons.length > 0)
    ? '\n\n' + buttons.map((b, i) => `• *${b.text || b.title || b.id}*`).join('\n')
    : '';

  const footerText = footer ? `\n\n_${footer}_` : '';
  const fullText = `${title ? `*${title}*\n\n` : ''}${body}${optionsList}${footerText}`;

  return await sock.sendMessage(jid, { text: fullText });
}

/**
 * Safe, reliable text fallback for any carousel requests.
 */
export async function sendCarouselMessage(sock, jid, {
  bodyText = '',
  footerText = '',
  cards = []
}) {
  const cardsContent = cards.map((c, i) => {
    return `*${i + 1}. ${c.title || 'Product'}*\n${c.body || ''}`;
  }).join('\n\n━━━━━━━━━━━━━━━━━━━━\n\n');

  const fullText = `${bodyText ? `${bodyText}\n\n` : ''}${cardsContent}${footerText ? `\n\n_${footerText}_` : ''}`;
  return await sock.sendMessage(jid, { text: fullText });
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
