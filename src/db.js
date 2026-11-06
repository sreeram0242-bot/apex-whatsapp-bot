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
  studio_name: "Apex Software & Digital Marketing",
  studio_phone: "+91 6369134270",
  studio_address: "Tech Hub, 4th Floor, Innovation Tower",
  upi_id: "6369134270@okbizaxis",
  upi_name: "Software & Digital Agency",
  welcome_message: "Welcome to *Software & Digital Marketing Solutions* 🚀💻\n\nWe build high-converting websites, run ROI-driven Meta ad campaigns, and rank your business on Google.\n\nPlease choose a service below to get started:",
  products: [
    {
      id: "prod_meta_ads",
      title: "Meta Ads",
      description: "High-ROI Facebook & Instagram ad campaigns",
      price: "₹999.00"
    },
    {
      id: "prod_digital_marketing",
      title: "Digital Marketing",
      description: "Complete 360° digital growth & brand management",
      price: "₹14,999.00"
    },
    {
      id: "prod_seo",
      title: "SEO management",
      description: "Google Maps & Search Page 1 keyword ranking",
      price: "₹999.00"
    },
    {
      id: "prod_web_dev",
      title: "Web Development",
      description: "Fast, modern & responsive business website (Save ₹3,000)",
      price: "₹4,999.00"
    }
  ],
  product_flows: {
    prod_meta_ads: {
      id: "prod_meta_ads",
      title: "Meta Ads (₹999.00)",
      description: "High-ROI Facebook & Instagram ad campaigns",
      price: "₹999.00",
      step1_title: "🎯 Campaign Goal",
      step1_prompt: "What is your primary goal for *Meta Ads*?",
      step1_options: [
        { id: "meta_leads", text: "🎯 Lead Gen" },
        { id: "meta_ecommerce", text: "🛍️ E-Commerce" },
        { id: "meta_branding", text: "📈 Brand Reach" }
      ],
      step2_title: "💰 Monthly Ad Spend Budget",
      step2_prompt: "Select your estimated *Monthly Ad Budget*:",
      step2_options: [
        { id: "budget_10k", text: "💰 ₹5k - ₹15k" },
        { id: "budget_30k", text: "💰 ₹15k - ₹50k" },
        { id: "budget_50k_plus", text: "🚀 ₹50k+ (Scale)" }
      ],
      photo_prompt: "🔗 Please share your *Website URL, Instagram page link, or Business niche* so our media buyer can review your audience:"
    },
    prod_digital_marketing: {
      id: "prod_digital_marketing",
      title: "Digital Marketing (₹14,999.00)",
      description: "Complete 360° digital growth & brand management",
      price: "₹14,999.00",
      step1_title: "🚀 Growth Priority",
      step1_prompt: "What is your main target for the *360° Digital Marketing* package?",
      step1_options: [
        { id: "dm_360", text: "🚀 360° Growth" },
        { id: "dm_performance", text: "📊 Direct ROI" },
        { id: "dm_social", text: "📱 Social Media" }
      ],
      step2_title: "🏢 Business Stage",
      step2_prompt: "Select your *Business Industry / Category*:",
      step2_options: [
        { id: "biz_startup", text: "🌱 Startup" },
        { id: "biz_local", text: "🏪 Local Biz" },
        { id: "biz_d2c", text: "📦 E-Commerce" }
      ],
      photo_prompt: "📝 Tell us a bit about your *Business & Current Monthly Revenue or Growth Goals* for the next 90 days:"
    },
    prod_seo: {
      id: "prod_seo",
      title: "SEO management (₹999.00)",
      description: "Google Maps & Search Page 1 keyword ranking",
      price: "₹999.00",
      step1_title: "🔍 SEO Strategy",
      step1_prompt: "Select your *SEO Focus Area*:",
      step1_options: [
        { id: "seo_local", text: "📍 Google Maps" },
        { id: "seo_nationwide", text: "🚀 Google Search" },
        { id: "seo_audit", text: "🛠️ Site Audit" }
      ],
      step2_title: "💻 Website Platform",
      step2_prompt: "What platform is your website built on?",
      step2_options: [
        { id: "cms_wordpress", text: "💻 WordPress" },
        { id: "cms_shopify", text: "🛒 Shopify" },
        { id: "cms_custom", text: "⚡ Custom Code" }
      ],
      photo_prompt: "🌐 Please send your *Website Link (e.g. yourbrand.com)* and the main cities or keywords you want to rank for:"
    },
    prod_web_dev: {
      id: "prod_web_dev",
      title: "Web Development (₹4,999.00)",
      description: "Fast, modern & responsive business website (Save ₹3,000)",
      price: "₹4,999.00",
      step1_title: "🌐 Website Category",
      step1_prompt: "What kind of *Website* do you want to build?",
      step1_options: [
        { id: "web_business", text: "💼 Business Site" },
        { id: "web_store", text: "🛒 Online Store" },
        { id: "web_landing", text: "⚡ Landing Page" }
      ],
      step2_title: "⏱️ Target Delivery Timeline",
      step2_prompt: "Select your target launch timeline:",
      step2_options: [
        { id: "time_urgent", text: "⚡ Express (3-5d)" },
        { id: "time_standard", text: "📅 Standard (1-2w)" },
        { id: "time_redesign", text: "🔄 Redesign" }
      ],
      photo_prompt: "🎨 Please share any *reference websites you like, or special features needed* (Payment gateway, WhatsApp chat, Booking, etc.):"
    }
  },
  prompt_details: "Please specify your project requirements or reference links:",
  prompt_photo: "Please share your website link, logo, or project brief:",
  prompt_name: "Requirement saved! 🤝\n\nWhat is your *Full Name*?",
  prompt_address: "Thank you, {name}! 🏢\n\nPlease share your *Company / Business Name and City* (or billing address):",
  prompt_payment: "Please choose your preferred *Payment / Onboarding Method*:",
  order_confirmed_message: "🎉 *Service Order Booked Successfully!*\n\n*Project ID:* #{order_id}\n*Client:* {name}\n*Service:* {product}\n*Specifications:* {details}\n*Company/Location:* {address}\n*Payment Mode:* {payment_type}\n\nOur project strategist has received your requirements and will reach out with the onboarding roadmap.",
  tracking_message: "📊 *Project Status Update*\n\n*Project ID:* #{order_id}\n*Service:* {product}\n*Current Status:* *{status}*\n*Assigned Lead:* Senior Growth Specialist\n\nFeel free to contact us anytime for milestone updates! 🚀"
};

// Seed defaults if empty or missing product_flows
const countStmt = db.prepare("SELECT COUNT(*) AS count FROM bot_config");
const { count } = countStmt.get();
const insertStmt = db.prepare(`
  INSERT INTO bot_config (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

if (count === 0) {
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

