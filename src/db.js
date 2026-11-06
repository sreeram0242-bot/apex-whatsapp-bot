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
    amount REAL DEFAULT 0,
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

try {
  db.exec("ALTER TABLE orders ADD COLUMN amount REAL DEFAULT 0");
} catch {
  // column already exists
}

try {
  db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'Payment Pending'");
} catch {
  // column already exists
}

export const DEFAULT_CONFIG = {
  studio_name: "InstaPics Photobooks & Frames",
  studio_phone: "+91 6369134270",
  studio_address: "InstaPics Custom Print Studio",
  upi_id: "6369134270@okbizaxis",
  upi_name: "InstaPics Studio",
  welcome_message: "Welcome to *InstaPics*! 📸✨\n\nWe craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.\n\nSwipe through our products below to choose your package:",
  welcome_greeting: "Welcome to *InstaPics*! 📸✨",
  welcome_body: "We craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.",
  welcome_instruction: "Swipe through our products below to choose your package:",
  catalogue_link: "https://wa.me/c/916369134270",
  carousel_footer: "◄ Swipe Left / Right to Choose ►",
  products: [
    {
      id: "prod_photobook_a4",
      title: "📖 A4 Premium Photobook",
      description: "Non-tearable, waterproof pages with lifetime durability. Up to 140 photos.",
      price: "From ₹1,750",
      image: "/assets/products/photobook_a4.jpg"
    },
    {
      id: "prod_photobook_a3",
      title: "📚 A3 Jumbo Photobook",
      description: "Large luxury album for weddings, birthdays & family memories. Up to 300 photos.",
      price: "From ₹2,500",
      image: "/assets/products/photobook_a3.jpg"
    },
    {
      id: "prod_frames",
      title: "🖼️ Custom Photo Frames",
      description: "Crystal acrylic & wooden photo frames for wall & tabletop display.",
      price: "From ₹499",
      image: "/assets/products/photo_frame.jpg"
    },
    {
      id: "prod_price_list",
      title: "🏷️ Full Price List & Offers",
      description: "Non-tearable photobook complete offer price sheet with discounts.",
      price: "Special Offers",
      image: "/assets/products/price_list.jpg"
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
      price: "From ₹599",
      step1_title: "🖼️ Choose Frame Style",
      step1_prompt: "Select your *Frame Style & Placement*:\n\n✨ *High-Gloss Crystal Acrylic & Premium Wooden Borders*",
      step1_options: [
        { id: "frame_table", text: "🖼️ Tabletop (8x12) ₹599" },
        { id: "frame_wall", text: "🖼️ Wall Frame (12x18) ₹999" },
        { id: "frame_collage", text: "🖼️ Collage Frame ₹1,299" }
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
  order_confirmed_message: "🎉 *Order Booked Successfully!*\n\n*Order ID:* #{order_id}\n*Customer:* {name}\n*Items Ordered:*\n{details}\n\n💰 *Total Amount:* *₹{total_amount}*\n*Photos:* {photo_count}\n*Delivery Address:* {address}\n*Payment Mode:* {payment_type}\n\nOur design team has received your order and will share your digital album preview shortly! 📖✨",
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
  // Ensure product_flows is present and has current pricing
  const checkFlows = db.prepare("SELECT value FROM bot_config WHERE key = 'product_flows'").get();
  if (!checkFlows || checkFlows.value.includes('(8x10)')) {
    insertStmt.run('product_flows', JSON.stringify(DEFAULT_CONFIG.product_flows));
  }
}

// Seed initial sample InstaPics orders if database is brand new or lacks sample revenue
try {
  const zeroAmtCount = db.prepare("SELECT COUNT(*) AS count FROM orders WHERE amount > 0").get().count;
  if (zeroAmtCount === 0) {
    // Clear old 0-amount placeholders
    db.prepare("DELETE FROM orders WHERE amount = 0").run();

    const now = new Date();
    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (id, phone, customer_name, product_id, product_name, details, photos, address, payment_type, status, amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Pending Approval order
    insertOrderStmt.run(
      "ORD-98421",
      "919629661668",
      "Priya Sharma",
      "prod_photobook_a4",
      "📖 A4 Premium Photobook",
      "1. 📖 A4 Premium Photobook (40 Pgs / 60 Photos) — ₹1,750\n📁 Cloud Photos: drive.google.com/album-sample-photos",
      JSON.stringify(["assets/products/photobook_a4.jpg"]),
      "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040",
      "Instant UPI / Online QR",
      "Pending Approval",
      1750,
      new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      new Date(now.getTime() - 25 * 60 * 1000).toISOString()
    );

    // 2. Approved & Designing order
    insertOrderStmt.run(
      "ORD-87142",
      "916369134270",
      "Karthik Sundaram",
      "prod_photobook_a3, prod_frames",
      "A3 Jumbo Photobook + Wall Frame",
      "1. 📚 A3 Jumbo Photobook (60 Pgs / 220 Photos) — ₹3,300\n2. 🖼️ Wall Frame (12x18) — ₹999",
      JSON.stringify(["assets/products/photobook_a3.jpg", "assets/products/photo_frame.jpg"]),
      "12 Gandhi Road, Karur - 639002",
      "Instant UPI / Online QR",
      "Approved & Designing",
      4299,
      new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 1 * 3600 * 1000).toISOString()
    );

    // 3. Printing order
    insertOrderStmt.run(
      "ORD-76519",
      "919840123456",
      "Ananya Iyer",
      "prod_photobook_a4",
      "📖 A4 Premium Photobook",
      "1. 📖 A4 Premium Photobook (60 Pgs / 100 Photos) — ₹2,150",
      JSON.stringify(["assets/products/photobook_a4.jpg"]),
      "45 TTK Road, Alwarpet, Chennai - 600018",
      "Pay on Pickup / Delivery",
      "Printing",
      2150,
      new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 3 * 3600 * 1000).toISOString()
    );

    // 4. Completed order
    insertOrderStmt.run(
      "ORD-65201",
      "919629661668",
      "Priya Sharma",
      "prod_frames",
      "🖼️ Custom Photo Frames",
      "1. 🖼️ Crystal Acrylic Wall Frame (12x18) — ₹999",
      JSON.stringify(["assets/products/photo_frame.jpg"]),
      "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040",
      "Instant UPI / Online QR",
      "Completed",
      999,
      new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
    );
  }
} catch (e) {
  console.warn('[DB] Order seed check note:', e.message);
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
  const searchPattern = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const stmt = db.prepare("SELECT * FROM orders WHERE phone LIKE ? ORDER BY created_at DESC LIMIT 1");
  const row = stmt.get(`%${searchPattern}%`);
  if (!row) return null;
  return {
    ...row,
    photos: row.photos ? JSON.parse(row.photos) : []
  };
}

export function getAllOrdersByPhone(phone) {
  if (!phone) return [];
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const searchPattern = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const stmt = db.prepare("SELECT * FROM orders WHERE phone LIKE ? ORDER BY created_at DESC");
  const rows = stmt.all(`%${searchPattern}%`);
  return rows.map(r => ({
    ...r,
    photos: r.photos ? (typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos) : []
  }));
}

export function approveOrder(id) {
  const stmt = db.prepare("UPDATE orders SET status = 'Approved & Designing', updated_at = ? WHERE id = ?");
  stmt.run(new Date().toISOString(), id);
  return getOrderById(id);
}

export function rejectOrder(id) {
  const stmt = db.prepare("UPDATE orders SET status = 'Cancelled', updated_at = ? WHERE id = ?");
  stmt.run(new Date().toISOString(), id);
  return getOrderById(id);
}

export function getRevenueStats() {
  const allOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();

  let totalRevenue = 0;
  let pendingApprovalValue = 0;
  let totalOrdersCount = allOrders.length;
  let pendingApprovalCount = 0;
  let approvedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  const paymentModes = {
    upi: { count: 0, amount: 0, label: "Instant UPI / Online QR" },
    cod: { count: 0, amount: 0, label: "Pay on Pickup / Delivery" }
  };

  const productBreakdown = {};

  for (const ord of allOrders) {
    const amt = Number(ord.amount) || 0;
    const st = (ord.status || 'Pending').toLowerCase();

    if (st.includes('pending') || st.includes('awaiting')) {
      pendingApprovalValue += amt;
      pendingApprovalCount++;
    } else if (st.includes('cancelled') || st.includes('reject')) {
      cancelledCount++;
    } else {
      totalRevenue += amt;
      approvedCount++;
      if (st.includes('complete') || st.includes('deliver')) {
        completedCount++;
      }
    }

    // Payment modes - check payment_status first, fallback to payment_type
    const payStat = (ord.payment_status || '').toLowerCase();
    const payType = (ord.payment_type || '').toLowerCase();
    if (payStat.includes('upi') || (!payStat && (payType.includes('upi') || payType.includes('qr')))) {
      paymentModes.upi.count++;
      paymentModes.upi.amount += amt;
    } else {
      paymentModes.cod.count++;
      paymentModes.cod.amount += amt;
    }

    // Product breakdown
    const pName = ord.product_name || 'Other Products';
    if (!productBreakdown[pName]) {
      productBreakdown[pName] = { count: 0, revenue: 0 };
    }
    productBreakdown[pName].count++;
    productBreakdown[pName].revenue += amt;
  }

  const aov = approvedCount > 0
    ? Math.round(totalRevenue / approvedCount)
    : (totalOrdersCount > 0 ? Math.round((totalRevenue + pendingApprovalValue) / totalOrdersCount) : 0);

  return {
    totalRevenue,
    pendingApprovalValue,
    totalOrdersCount,
    pendingApprovalCount,
    approvedCount,
    completedCount,
    cancelledCount,
    aov,
    paymentModes,
    productBreakdown,
    recentOrders: allOrders.slice(0, 50).map(r => ({
      ...r,
      photos: r.photos ? (typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos) : []
    }))
  };
}

export function createOrder(orderData) {
  const stmt = db.prepare(`
    INSERT INTO orders (
      id, phone, customer_name, product_id, product_name, details, photos, address, payment_type, payment_status, status, amount, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  const defaultPayStatus = (orderData.payment_status) ||
    (orderData.payment_type?.toLowerCase().includes('upi') ? 'Paid via UPI' : 'Payment Pending');

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
    defaultPayStatus,
    orderData.status || 'Pending Approval',
    orderData.amount || 0,
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

export function updateOrderPaymentStatus(id, newPaymentStatus) {
  const stmt = db.prepare("UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?");
  stmt.run(newPaymentStatus, new Date().toISOString(), id);
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

