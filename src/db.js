import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.env.DB_PATH || 'studio.db');
const db = new DatabaseSync(DB_PATH);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    customer_name TEXT,
    product_id TEXT,
    product_name TEXT,
    details TEXT,
    photos TEXT,
    address TEXT,
    payment_type TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bot_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_sessions (
    phone TEXT PRIMARY KEY,
    step TEXT NOT NULL,
    draft_data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export const DEFAULT_CONFIG = {
  studio_name: "InstaPics Photobooks & Frames",
  studio_phone: "+91 6369134270",
  studio_address: "InstaPics Custom Print Studio",
  upi_id: "6369134270@okbizaxis",
  upi_name: "InstaPics Studio",
  welcome_message: "Welcome to *InstaPics*! 📸✨\n\nWe craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.\n\nSwipe through our products below to choose your package:",
  products: [
    {
      id: "prod_photobook_a4",
      title: "📖 A4 Premium Photobook",
      description: "Non-tearable, waterproof pages with lifetime durability. Up to 140 photos.",
      price: "From ₹1,750"
    },
    {
      id: "prod_photobook_a3",
      title: "📚 A3 Jumbo Photobook",
      description: "Large luxury album for weddings, birthdays & family memories. Up to 300 photos.",
      price: "From ₹2,500"
    },
    {
      id: "prod_frames",
      title: "🖼️ Custom Photo Frames",
      description: "Crystal acrylic & wooden photo frames for wall & tabletop display.",
      price: "From ₹499"
    },
    {
      id: "prod_price_list",
      title: "🏷️ Full Price List & Offers",
      description: "Non-tearable photobook complete offer price sheet with discounts.",
      price: "Special Offers"
    }
  ],
  product_flows: {
    prod_photobook_a4: {
      id: "prod_photobook_a4",
      title: "📖 A4 Premium Photobook",
      description: "Non-tearable, waterproof pages with lifetime durability",
      price: "From ₹1,750",
      step1_title: "📖 Choose A4 Package",
      step1_prompt: "Select your desired *A4 Photobook Page Count*:\n\n✨ *Non-Tearable | Waterproof | Lifetime Durability*",
      step1_options: [
        { id: "a4_40p", text: "📘 40 Pgs (60 Photos) ₹1,750" },
        { id: "a4_60p", text: "📘 60 Pgs (100 Photos) ₹2,150" },
        { id: "a4_80p", text: "📘 80 Pgs (140 Photos) ₹2,500" }
      ],
      photo_prompt: "📸 Great choice! Please upload your photos here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* for high-resolution printing:"
    },
    prod_photobook_a3: {
      id: "prod_photobook_a3",
      title: "📚 A3 Jumbo Photobook",
      description: "Large luxury album for weddings & family memories",
      price: "From ₹2,500",
      step1_title: "📚 Choose A3 Jumbo Package",
      step1_prompt: "Select your desired *A3 Jumbo Photobook Page Count*:\n\n✨ *Jumbo Size | Non-Tearable | Waterproof | Lifetime Durability*",
      step1_options: [
        { id: "a3_40p", text: "📙 40 Pgs (130 Photos) ₹2,500" },
        { id: "a3_60p", text: "📙 60 Pgs (220 Photos) ₹3,300" },
        { id: "a3_80p", text: "📙 80 Pgs (300 Photos) ₹4,200" }
      ],
      photo_prompt: "📸 Excellent! Please upload your photos here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* for high-resolution printing:"
    },
    prod_frames: {
      id: "prod_frames",
      title: "🖼️ Custom Photo Frames",
      description: "Crystal acrylic & wooden photo frames",
      price: "From ₹499",
      step1_title: "🖼️ Choose Frame Style",
      step1_prompt: "Select your *Frame Style & Placement*:",
      step1_options: [
        { id: "frame_table", text: "🖼️ Tabletop Frame (8x10)" },
        { id: "frame_wall", text: "🖼️ Wall Frame (12x18)" },
        { id: "frame_collage", text: "🖼️ Family Collage Frame" }
      ],
      photo_prompt: "📸 Please send the high-resolution photo(s) you would like printed in the frame:"
    },
    prod_price_list: {
      id: "prod_price_list",
      title: "🏷️ Full Price List & Offers",
      description: "View all photobook sizes, page counts, and offer prices",
      price: "Special Offers",
      step1_title: "🏷️ Photobook Offers",
      step1_prompt: "Here are our current offer prices:\n\n📘 *A4 Premium Photobooks:*\n• 40 Pgs (60 Photos): *₹1,750* (was ₹3,600)\n• 60 Pgs (100 Photos): *₹2,150* (was ₹4,500)\n• 80 Pgs (140 Photos): *₹2,500* (was ₹5,200)\n\n📚 *A3 Jumbo Photobooks:*\n• 40 Pgs (130 Photos): *₹2,500* (was ₹5,000)\n• 60 Pgs (220 Photos): *₹3,300* (was ₹6,500)\n• 80 Pgs (300 Photos): *₹4,200* (was ₹8,500)\n\nTap below to start your order:",
      step1_options: [
        { id: "order_a4", text: "📘 Order A4 Book" },
        { id: "order_a3", text: "📚 Order A3 Jumbo" },
        { id: "order_frame", text: "🖼️ Order Frame" }
      ],
      photo_prompt: "📸 Please send your photos here on WhatsApp, or paste a Google Drive link:"
    }
  },
  prompt_details: "Please specify your book title, cover photo choice or notes:",
  prompt_photo: "📸 Please upload your photos here on WhatsApp, or paste a Google Drive / Google Photos / iCloud link:",
  prompt_name: "Photos noted! ✨\n\nWhat is your *Full Name*?",
  prompt_address: "Thank you, {name}! 🏠\n\nPlease share your *Delivery Address with Pincode* for courier shipping:",
  prompt_payment: "Please choose your preferred *Payment Method*:",
  order_confirmed_message: "🎉 *Order Booked Successfully!*\n\n*Order ID:* #{order_id}\n*Customer:* {name}\n*Product:* {product}\n*Package / Pages:* {details}\n*Photos Received:* {photo_count} item(s)\n*Delivery Address:* {address}\n*Payment Mode:* {payment_type}\n\nOur design team has received your order and will share your digital album preview shortly! 📖✨",
  tracking_message: "📦 *Order Status Tracking*\n\n*Order ID:* #{order_id}\n*Product:* {product}\n*Current Status:* *{status}*\n\nFeel free to message us here for design preview updates! 📸"
};

// Seed defaults or migrate from old demo config
const countStmt = db.prepare("SELECT COUNT(*) AS count FROM bot_config");
const { count } = countStmt.get();
const insertStmt = db.prepare(`
  INSERT INTO bot_config (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const checkOld = db.prepare("SELECT value FROM bot_config WHERE key = 'studio_name'").get();
const isOldDemo = checkOld && (checkOld.value.includes('Apex') || checkOld.value.includes('Marketing'));

if (count === 0 || isOldDemo) {
  for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
    insertStmt.run(k, JSON.stringify(v));
  }
} else {
  // Ensure product_flows is present
  const checkFlows = db.prepare("SELECT value FROM bot_config WHERE key = 'product_flows'").get();
  if (!checkFlows) {
    insertStmt.run('product_flows', JSON.stringify(DEFAULT_CONFIG.product_flows));
  }
}

export function getAllConfig() {
  const stmt = db.prepare("SELECT key, value FROM bot_config");
  const rows = stmt.all();
  const res = {};
  for (const row of rows) {
    try {
      res[row.key] = JSON.parse(row.value);
    } catch {
      res[row.key] = row.value;
    }
  }
  return res;
}

export function getConfig(key) {
  const stmt = db.prepare("SELECT value FROM bot_config WHERE key = ?");
  const row = stmt.get(key);
  if (!row) return DEFAULT_CONFIG[key] ?? null;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export function updateConfig(key, value) {
  const stmt = db.prepare(`
    INSERT INTO bot_config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(key, JSON.stringify(value));
}

export function updateAllConfig(configObj) {
  const stmt = db.prepare(`
    INSERT INTO bot_config (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const [k, v] of Object.entries(configObj)) {
    stmt.run(k, JSON.stringify(v));
  }
}

export function getOrders(limit = 100, offset = 0, statusFilter = null) {
  let query = "SELECT * FROM orders";
  const params = [];
  if (statusFilter && statusFilter !== 'ALL') {
    query += " WHERE status = ?";
    params.push(statusFilter);
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map(r => ({
    ...r,
    photos: r.photos ? JSON.parse(r.photos) : []
  }));
}

export function getOrderById(id) {
  const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    photos: row.photos ? JSON.parse(row.photos) : []
  };
}

export function getLatestOrderByPhone(phone) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const stmt = db.prepare("SELECT * FROM orders WHERE phone LIKE ? ORDER BY created_at DESC LIMIT 1");
  const row = stmt.get(`%${cleanPhone}%`);
  if (!row) return null;
  return {
    ...row,
    photos: row.photos ? JSON.parse(row.photos) : []
  };
}

export function createOrder(orderData) {
  const stmt = db.prepare(`
    INSERT INTO orders (
      id, phone, customer_name, product_id, product_name, details, photos, address, payment_type, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  stmt.run(
    orderData.id,
    orderData.phone,
    orderData.customer_name || '',
    orderData.product_id || '',
    orderData.product_name || '',
    orderData.details || '',
    JSON.stringify(orderData.photos || []),
    orderData.address || '',
    orderData.payment_type || '',
    orderData.status || 'Pending',
    now,
    now
  );
  return getOrderById(orderData.id);
}

export function updateOrderStatus(id, newStatus) {
  const stmt = db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?");
  stmt.run(newStatus, new Date().toISOString(), id);
  return getOrderById(id);
}

export function getSession(phone) {
  const stmt = db.prepare("SELECT * FROM customer_sessions WHERE phone = ?");
  const row = stmt.get(phone);
  if (!row) return null;
  try {
    const updatedAt = new Date(row.updated_at).getTime();
    const now = Date.now();
    // Auto-expire sessions after 30 minutes of customer inactivity
    if (now - updatedAt > 30 * 60 * 1000) {
      clearSession(phone);
      return null;
    }
    return {
      phone: row.phone,
      step: row.step,
      draft: JSON.parse(row.draft_data),
      updated_at: row.updated_at
    };
  } catch {
    return null;
  }
}

export function setSession(phone, step, draftData = {}) {
  const stmt = db.prepare(`
    INSERT INTO customer_sessions (phone, step, draft_data, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET
      step = excluded.step,
      draft_data = excluded.draft_data,
      updated_at = excluded.updated_at
  `);
  stmt.run(phone, step, JSON.stringify(draftData), new Date().toISOString());
}

export function clearSession(phone) {
  const stmt = db.prepare("DELETE FROM customer_sessions WHERE phone = ?");
  stmt.run(phone);
}

export function clearAllSessions() {
  const stmt = db.prepare("DELETE FROM customer_sessions");
  stmt.run();
}

export default db;

