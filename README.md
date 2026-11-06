# Lumina Photo Studio — WhatsApp Bot & Orders Console

A high-performance WhatsApp bot engine built with **Baileys**, designed for photo studios to showcase products, collect specifications, download customer photos, capture delivery addresses, issue instant UPI QR codes, and confirm orders with interactive buttons. Includes a minimalist, high-taste Admin Panel for managing orders and live-editing the chat flow.

---

## 🎨 UI Aesthetic & Principles
- **Monochrome & Ash Grey Palette**: Pure White (`#FFFFFF`), Pitch Black (`#09090B`), Ash Grey (`#F4F4F5`, `#71717A`), and Deep Navy (`#0F172A`).
- **No Rainbow/Colourful Clutter**: Designed following Swiss typography, Dieter Rams, and Vercel minimalist design standards.
- **No Extra Buttons or Options**: Clean, focused, and purposeful.

---

## 🚀 Key Features

### 1. Interactive WhatsApp Customer Bot (`@whiskeysockets/baileys`)
- **Automatic Welcome**: Welcomes any customer messaging the studio with interactive, clickable buttons.
- **Clickable Product Buttons**:
  - `🖼️ Custom Frames`
  - `🎨 Canvas Prints`
  - `📖 Photo Albums`
  - `☕ Photo Mugs`
  - `🎁 Custom Gifts`
- **Customer Photo Upload**: Prompts customer to upload their image(s) directly in WhatsApp. Automatically downloads and attaches high-res photos to their order.
- **Structured Checkout Flow**:
  1. Product selected
  2. Specifications & Size (e.g. 12x18 inch, Matte)
  3. Photo Upload (with 'skip' option)
  4. Customer Full Name
  5. Delivery Address & Pincode
  6. Payment Type selection with buttons (`📱 Instant UPI / QR` or `💵 Pay on Delivery`)
- **Instant Dynamic UPI QR Code**: Automatically generates a scannable UPI QR code with your Studio UPI ID and Order ID reference.
- **Post-Order Interactive Buttons**:
  - `📦 Track Order Status`
  - `📞 Call Studio`
  - `📍 Copy Studio Address`
- **Live Order Tracking**: Customers can tap `📦 Track Order Status` or type "status" anytime to see whether their photo is in `Printing`, `Ready for Pickup`, or `Dispatched`.

### 2. Studio Admin Console (Web UI at `http://localhost:3000`)
- **Real-Time Orders Table**: See customer name, phone number, product, specifications, uploaded photo previews, delivery address, payment method, and status.
- **One-Click WhatsApp Status Notification**: Change order status to `Printing`, `Ready for Pickup`, or `Dispatched` and notify the customer on WhatsApp with one click.
- **Live Flow & Message Editor**: Edit welcome greeting, question prompts, studio address, UPI ID, and add/remove clickable products on the fly without restarting the server.
- **Device Connection**: View live QR code or generate an **8-Digit Pairing Code** (link phone directly without scanning).

---

## 📦 Project Structure

```
d:/bailey/
├── package.json
├── studio.db                 // Embedded SQLite database (node:sqlite)
├── sessions/                 // Baileys multi-file authentication keys
├── uploads/photos/           // Customer photos uploaded over WhatsApp
└── src/
    ├── server.js             // Express server + Baileys initialization
    ├── db.js                 // SQLite data store (orders, flow config, sessions)
    ├── whatsapp/
    │   ├── client.js         // Socket connection, QR & 8-digit Pairing Code
    │   ├── buttons.js        // Modern nativeFlow interactive buttons & UPI QR generator
    │   ├── serializer.js     // Normalized message & button response parser
    │   └── handler.js        // Conversational state machine & order intake
    ├── api/
    │   └── routes.js         // REST endpoints for Admin Panel
    └── public/
        ├── index.html        // Minimalist high-taste Admin Panel
        ├── style.css         // Pure white, black, ash grey & deep navy theme
        └── app.js            // Dashboard interactions & real-time updates
```

---

## 🏃‍♂️ How to Run

1. Open a terminal in `d:\bailey`
2. Start the server:
   ```bash
   npm start
   ```
3. Open your browser to the Admin Panel:
   **`http://localhost:3000`**
4. Connect WhatsApp:
   - **Option A (QR Code)**: Scan the QR code shown on the web page or terminal.
   - **Option B (Pairing Code)**: Go to the "WhatsApp Device" tab in the panel, enter your phone number, get the 8-digit code, and enter it in WhatsApp (Linked Devices -> Link with phone number).

