import fs from 'node:fs';
import path from 'node:path';

const appJsContent = `// ==========================================================================
// INSTAPICS PHOTOBOOKS & FRAMES — ADMIN CONSOLE & REVENUE ENGINE (v4.2)
// ==========================================================================

const DEFAULT_FALLBACK_CONFIG = {
  studio_name: "InstaPics Photobooks & Frames",
  studio_phone: "+91 6369134270",
  studio_address: "InstaPics Custom Print Studio",
  upi_id: "6369134270@okbizaxis",
  upi_name: "InstaPics Studio",
  welcome_message: "Welcome to *InstaPics*! 📸✨\\n\\nWe craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.\\n\\nSwipe through our products below to choose your package:",
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
      image: "/assets/products/photobook_a4.jpg",
      step1_title: "📖 Choose A4 Package",
      step1_prompt: "Select your desired *A4 Photobook Page Count*:\\n\\n✨ *Non-Tearable | Waterproof | Lifetime Durability*",
      step1_options: [
        { id: "a4_40p", text: "📘 40 Pgs (60 Photos) ₹1,750", price: 1750 },
        { id: "a4_60p", text: "📘 60 Pgs (100 Photos) ₹2,150", price: 2150 },
        { id: "a4_80p", text: "📘 80 Pgs (140 Photos) ₹2,500", price: 2500 }
      ],
      photo_prompt: "📸 Great choice! Please upload your photos here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* for high-resolution printing:"
    },
    prod_photobook_a3: {
      id: "prod_photobook_a3",
      title: "📚 A3 Jumbo Photobook",
      description: "Large luxury album for weddings & family memories",
      price: "From ₹2,500",
      image: "/assets/products/photobook_a3.jpg",
      step1_title: "📚 Choose A3 Jumbo Package",
      step1_prompt: "Select your desired *A3 Jumbo Photobook Page Count*:\\n\\n✨ *Jumbo Size | Non-Tearable | Waterproof | Lifetime Durability*",
      step1_options: [
        { id: "a3_40p", text: "📙 40 Pgs (130 Photos) ₹2,500", price: 2500 },
        { id: "a3_60p", text: "📙 60 Pgs (220 Photos) ₹3,300", price: 3300 },
        { id: "a3_80p", text: "📙 80 Pgs (300 Photos) ₹4,200", price: 4200 }
      ],
      photo_prompt: "📸 Excellent! Please upload your photos here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* for high-resolution printing:"
    },
    prod_frames: {
      id: "prod_frames",
      title: "🖼️ Custom Photo Frames",
      description: "Crystal acrylic & wooden photo frames",
      price: "From ₹499",
      image: "/assets/products/photo_frame.jpg",
      step1_title: "🖼️ Choose Frame Style",
      step1_prompt: "Select your *Frame Style & Placement*:\\n\\n✨ *High-Gloss Crystal Acrylic & Premium Wooden Borders*",
      step1_options: [
        { id: "frame_table", text: "🖼️ Tabletop (8x12) ₹599", price: 599 },
        { id: "frame_wall", text: "🖼️ Wall Frame (12x18) ₹999", price: 999 },
        { id: "frame_collage", text: "🖼️ Collage Frame ₹1,299", price: 1299 }
      ],
      photo_prompt: "📸 Please send the high-resolution photo(s) you would like printed in the frame:"
    },
    prod_price_list: {
      id: "prod_price_list",
      title: "🏷️ Full Price List & Offers",
      description: "View all photobook sizes, page counts, and offer prices",
      price: "Special Offers",
      image: "/assets/products/price_list.jpg",
      step1_title: "🏷️ Photobook Offers",
      step1_prompt: "Here are our current offer prices:\\n\\n📘 *A4 Premium Photobooks:*\\n• 40 Pgs (60 Photos): *₹1,750* (was ₹3,600)\\n• 60 Pgs (100 Photos): *₹2,150* (was ₹4,500)\\n• 80 Pgs (140 Photos): *₹2,500* (was ₹5,200)\\n\\n📚 *A3 Jumbo Photobooks:*\\n• 40 Pgs (130 Photos): *₹2,500* (was ₹5,000)\\n• 60 Pgs (220 Photos): *₹3,300* (was ₹6,500)\\n• 80 Pgs (300 Photos): *₹4,200* (was ₹8,500)\\n\\nTap below to start your order:",
      step1_options: [
        { id: "order_a4", text: "📘 Order A4 Book", price: 1750 },
        { id: "order_a3", text: "📚 Order A3 Jumbo", price: 2500 },
        { id: "order_frame", text: "🖼️ Order Frame", price: 599 }
      ],
      photo_prompt: "📸 Please send your photos here on WhatsApp, or paste a Google Drive link:"
    }
  }
};

const SAMPLE_FALLBACK_ORDERS = [
  {
    id: "ORD-98421",
    phone: "919629661668",
    customer_name: "Priya Sharma",
    product_name: "📖 A4 Premium Photobook",
    details: "1. 📖 A4 Premium Photobook (40 Pgs / 60 Photos) — ₹1,750\\n📁 Cloud Photos: drive.google.com/album-sample-photos",
    photos: ["assets/products/photobook_a4.jpg"],
    address: "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040",
    payment_type: "Instant UPI / Online QR",
    payment_status: "Payment Pending",
    amount: 1750,
    status: "Pending Approval",
    created_at: new Date(Date.now() - 1500000).toISOString()
  },
  {
    id: "ORD-87142",
    phone: "916369134270",
    customer_name: "Karthik Sundaram",
    product_name: "A3 Jumbo Photobook + Wall Frame",
    details: "1. 📚 A3 Jumbo Photobook (60 Pgs / 220 Photos) — ₹3,300\\n2. 🖼️ Wall Frame (12x18) — ₹999",
    photos: ["assets/products/photobook_a3.jpg"],
    address: "12 Gandhi Road, Karur - 639002",
    payment_type: "Instant UPI / Online QR",
    payment_status: "Paid via UPI",
    amount: 4299,
    status: "Approved & Designing",
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "ORD-76519",
    phone: "919840123456",
    customer_name: "Ananya Iyer",
    product_name: "📖 A4 Premium Photobook",
    details: "1. 📖 A4 Premium Photobook (60 Pgs / 100 Photos) — ₹2,150",
    photos: ["assets/products/photobook_a4.jpg"],
    address: "45 TTK Road, Alwarpet, Chennai - 600018",
    payment_type: "Pay on Pickup / Delivery",
    payment_status: "Paid Cash / COD",
    amount: 2150,
    status: "Printing",
    created_at: new Date(Date.now() - 21600000).toISOString()
  },
  {
    id: "ORD-65201",
    phone: "919629661668",
    customer_name: "Priya Sharma",
    product_name: "🖼️ Custom Photo Frames",
    details: "1. 🖼️ Crystal Acrylic Wall Frame (12x18) — ₹999",
    photos: ["assets/products/photo_frame.jpg"],
    address: "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040",
    payment_type: "Instant UPI / Online QR",
    payment_status: "Paid via UPI",
    amount: 999,
    status: "Completed",
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Initialize with instantaneous in-memory defaults
let currentConfig = { ...DEFAULT_FALLBACK_CONFIG };
let currentOrders = [...SAMPLE_FALLBACK_ORDERS];
let currentRevenueStats = null;
let statusPollInterval = null;
let activeProductFlowId = 'prod_photobook_a4';
let simCart = [];
let currentOrderFilter = 'ALL';
let currentOrderSearch = '';

// Instantaneous synchronous render (zero latency, zero blank screen)
function bootConsole() {
  console.log('[Console] Booting InstaPics Admin Console v4.2...');
  try { populateSettingsFields(currentConfig); } catch (e) {}
  try { renderProductFlowTabs(currentConfig.products, currentConfig.product_flows); } catch (e) {}
  try { renderSimulator(); } catch (e) {}
  try { renderOrderFilterPills(currentOrders); } catch (e) {}
  try { renderOrdersTable(currentOrders); } catch (e) {}
  try { renderRevenueDashboard(computeOfflineRevenue(currentOrders)); } catch (e) {}

  // Fetch live updates from API
  fetchOrders();
  fetchConfig();
  fetchRevenue();
  fetchDeviceStatus();

  if (!statusPollInterval) {
    statusPollInterval = setInterval(fetchDeviceStatus, 3000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootConsole);
} else {
  bootConsole();
}

// --------------------------------------------------------------------------
// 1. TABS MANAGEMENT
// --------------------------------------------------------------------------
window.switchTab = function(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const navBtns = document.querySelectorAll('.nav-tab');

  tabs.forEach(t => t.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  const activeContent = document.getElementById(\`tab-\${tabId}\`);
  const activeBtn = document.getElementById(\`tabBtn-\${tabId}\`);

  if (activeContent) activeContent.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'orders') fetchOrders();
  if (tabId === 'revenue') fetchRevenue();
  if (tabId === 'product-flows') fetchConfig();
  if (tabId === 'settings') fetchConfig();
  if (tabId === 'device') fetchDeviceStatus();
};

function initTabs() {
  const navBtns = document.querySelectorAll('.nav-tab');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.id.replace('tabBtn-', '');
      if (target) window.switchTab(target);
    });
  });
}

// --------------------------------------------------------------------------
// 2. CONFIGURATION & PRODUCT FLOW EDITOR
// --------------------------------------------------------------------------
async function fetchConfig() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (data.config) {
      currentConfig = data.config;
      populateSettingsFields(currentConfig);
      renderProductFlowTabs(currentConfig.products || [], currentConfig.product_flows || {});
      renderSimulator();
    }
  } catch (err) {
    console.warn('[Config] API sync note:', err.message);
  }
}

function renderProductFlowTabs(products, productFlows) {
  const container = document.getElementById('productFlowTabs');
  if (!container) return;

  const validProducts = (products && products.length > 0) ? products : DEFAULT_FALLBACK_CONFIG.products;

  if (!validProducts.some(p => p.id === activeProductFlowId) && validProducts.length > 0) {
    activeProductFlowId = validProducts[0].id;
  }

  container.innerHTML = validProducts.map(p => \`
    <button type="button" class="product-pill \${p.id === activeProductFlowId ? 'active' : ''}" onclick="selectProductFlow('\${p.id}')">
      \${escapeHtml(p.title)}
    </button>
  \`).join('');

  renderActiveProductFlow(activeProductFlowId, productFlows || DEFAULT_FALLBACK_CONFIG.product_flows);
}

window.selectProductFlow = function(prodId) {
  activeProductFlowId = prodId;

  const pills = document.querySelectorAll('.product-pill');
  pills.forEach(p => {
    p.classList.toggle('active', p.getAttribute('onclick')?.includes(prodId));
  });

  const productFlows = currentConfig?.product_flows || DEFAULT_FALLBACK_CONFIG.product_flows;
  renderActiveProductFlow(prodId, productFlows);
};

function renderActiveProductFlow(prodId, productFlows) {
  const flow = productFlows[prodId] || DEFAULT_FALLBACK_CONFIG.product_flows[prodId] || {
    id: prodId,
    title: prodId,
    description: "",
    price: "",
    image: "/assets/products/photobook_a4.jpg",
    step1_title: "Product Options",
    step1_prompt: "Please select your option:",
    step1_options: [],
    photo_prompt: "Please upload your photos:"
  };

  const product = (currentConfig?.products || DEFAULT_FALLBACK_CONFIG.products).find(p => p.id === prodId) || {};

  setElText('editorProductTitle', flow.title || product.title || prodId);
  setElText('editorProductId', prodId);

  setVal('flowTitleInput', product.title || flow.title || '');
  setVal('flowPriceInput', product.price || flow.price || '');
  setVal('flowDescInput', product.description || flow.description || '');

  const imgUrl = product.image || flow.image || '/assets/products/photobook_a4.jpg';
  setVal('flowImageInput', imgUrl);
  updateFlowImagePreview(imgUrl);

  setVal('flowStep1PromptInput', flow.step1_prompt || '');
  setVal('flowPhotoPromptInput', flow.photo_prompt || '');

  // Render options table rows
  const tbody = document.getElementById('optionsTableBody');
  if (!tbody) return;

  const options = flow.step1_options || [];
  if (options.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="4" class="text-center text-muted" style="padding: 16px; font-size: 12px;">
          No options yet. Click "+ Add Option" to add page counts or variants with prices.
        </td>
      </tr>
    \`;
    return;
  }

  tbody.innerHTML = options.map((opt, idx) => \`
    <tr data-index="\${idx}">
      <td>
        <input type="text" class="text-input opt-text" value="\${escapeHtml(opt.text)}" placeholder="e.g. 📘 40 Pgs (60 Photos) ₹1,750">
      </td>
      <td>
        <input type="number" class="text-input opt-price" value="\${opt.price || extractPrice(opt.text)}" placeholder="1750" style="font-family: var(--font-mono);">
      </td>
      <td>
        <input type="text" class="text-input opt-id" value="\${escapeHtml(opt.id || ('opt_' + idx))}" placeholder="opt_id">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="removeOptionRow(\${idx})" title="Remove option" style="padding: 4px 8px; color: #ef4444;">✕</button>
      </td>
    </tr>
  \`).join('');
}

window.updateFlowImagePreview = function(url) {
  const preview = document.getElementById('flowImagePreview');
  if (preview && url) {
    preview.src = url;
  }
};

window.setFlowImagePreset = function(url) {
  setVal('flowImageInput', url);
  updateFlowImagePreview(url);
  showToast('Preset image selected!');
};

window.handleProductImageUpload = async function(inputEl) {
  const file = inputEl?.files?.[0];
  if (!file) return;

  if (file.size > 15 * 1024 * 1024) {
    alert('File size exceeds 15MB. Please choose a smaller image.');
    return;
  }

  showToast(\`Uploading \${file.name}...\`);

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    updateFlowImagePreview(base64Data);

    try {
      const res = await fetch('/api/upload-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename: file.name })
      });
      const data = await res.json();
      if (data.success && data.url) {
        setVal('flowImageInput', data.url);
        updateFlowImagePreview(data.url);
        showToast('📸 Product photo uploaded successfully!');
      } else {
        setVal('flowImageInput', base64Data);
        showToast('Photo loaded (preview ready)');
      }
    } catch (err) {
      console.warn('[Upload] Offline note:', err.message);
      setVal('flowImageInput', base64Data);
      showToast('Photo loaded locally');
    }
  };
  reader.readAsDataURL(file);
};

window.addOptionRow = function() {
  const tbody = document.getElementById('optionsTableBody');
  if (!tbody) return;

  const productFlows = currentConfig.product_flows || DEFAULT_FALLBACK_CONFIG.product_flows;
  const flow = productFlows[activeProductFlowId];
  if (!flow) return;

  if (!Array.isArray(flow.step1_options)) {
    flow.step1_options = [];
  }

  const newIdx = flow.step1_options.length + 1;
  flow.step1_options.push({
    id: \`\${activeProductFlowId}_opt\${newIdx}\`,
    text: \`📘 Option \${newIdx} ₹1,999\`,
    price: 1999
  });

  renderActiveProductFlow(activeProductFlowId, productFlows);
  showToast("Added new option row. Don't forget to click Save!");
};

window.removeOptionRow = function(index) {
  const productFlows = currentConfig.product_flows || DEFAULT_FALLBACK_CONFIG.product_flows;
  const flow = productFlows[activeProductFlowId];
  if (!flow || !Array.isArray(flow.step1_options)) return;

  flow.step1_options.splice(index, 1);
  renderActiveProductFlow(activeProductFlowId, productFlows);
};

window.saveActiveProductFlow = async function() {
  if (!activeProductFlowId) return;

  const title = getVal('flowTitleInput');
  const price = getVal('flowPriceInput');
  const desc = getVal('flowDescInput');
  const image = getVal('flowImageInput') || '/assets/products/photobook_a4.jpg';
  const prompt = getVal('flowStep1PromptInput');
  const photoPrompt = getVal('flowPhotoPromptInput');

  // Read options from table
  const tbody = document.getElementById('optionsTableBody');
  const rows = tbody ? tbody.querySelectorAll('tr[data-index]') : [];
  const options = [];

  rows.forEach(r => {
    const text = r.querySelector('.opt-text')?.value.trim();
    const priceVal = parseInt(r.querySelector('.opt-price')?.value, 10) || extractPrice(text);
    const id = r.querySelector('.opt-id')?.value.trim() || ('opt_' + Math.random().toString(36).slice(2, 7));
    if (text) {
      options.push({ id, text, price: priceVal });
    }
  });

  // Update in memory
  const prod = currentConfig.products.find(p => p.id === activeProductFlowId);
  if (prod) {
    prod.title = title || prod.title;
    prod.price = price || prod.price;
    prod.description = desc || prod.description;
    prod.image = image;
  }

  if (!currentConfig.product_flows) currentConfig.product_flows = {};
  currentConfig.product_flows[activeProductFlowId] = {
    id: activeProductFlowId,
    title: title || activeProductFlowId,
    price: price || '',
    description: desc || '',
    image: image,
    step1_title: title || activeProductFlowId,
    step1_prompt: prompt || 'Please select your desired option:',
    step1_options: options,
    photo_prompt: photoPrompt || '📸 Please upload your photos here on WhatsApp:'
  };

  renderProductFlowTabs(currentConfig.products, currentConfig.product_flows);
  renderSimulator();
  showToast(\`Saved flow & photo for "\${title}"!\`);

  // Persist to Server API
  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: currentConfig })
    });
    const data = await res.json();
    if (data.config) {
      currentConfig = data.config;
    }
  } catch (err) {
    console.warn('[Config] Offline save note:', err.message);
  }
};

window.addNewProductPrompt = function() {
  const name = prompt("Enter the new Product Title (e.g. 🎁 Magic Photo Mug):");
  if (!name || !name.trim()) return;

  const id = 'prod_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Math.floor(Math.random() * 1000);
  const price = prompt("Enter Starting Price (e.g. From ₹399):", "From ₹399") || "₹399";
  const desc = prompt("Enter short description:", "Custom printed with lifetime photo durability.") || "";

  const newProd = { id, title: name.trim(), price: price.trim(), description: desc.trim(), image: "/assets/products/photobook_a4.jpg" };
  const newFlow = {
    id: id,
    title: name.trim(),
    price: price.trim(),
    description: desc.trim(),
    image: "/assets/products/photobook_a4.jpg",
    step1_title: name.trim(),
    step1_prompt: \`Please select your preferred option for \${name.trim()}:\`,
    step1_options: [
      { id: \`\${id}_opt1\`, text: "Standard Size ₹399", price: 399 },
      { id: \`\${id}_opt2\`, text: "Premium Size ₹599", price: 599 }
    ],
    photo_prompt: "📸 Please upload your photo for printing:"
  };

  currentConfig.products.push(newProd);
  currentConfig.product_flows[id] = newFlow;
  activeProductFlowId = id;

  renderProductFlowTabs(currentConfig.products, currentConfig.product_flows);
  renderSimulator();
  showToast(\`Added product "\${name}"!\`);

  fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: currentConfig })
  }).catch(() => {});
};

window.deleteCurrentProduct = function() {
  if (!activeProductFlowId) return;
  if (!confirm(\`Are you sure you want to delete product "\${activeProductFlowId}"?\`)) return;

  currentConfig.products = currentConfig.products.filter(p => p.id !== activeProductFlowId);
  delete currentConfig.product_flows[activeProductFlowId];
  activeProductFlowId = currentConfig.products[0]?.id || '';

  renderProductFlowTabs(currentConfig.products, currentConfig.product_flows);
  renderSimulator();
  showToast("Product removed");

  fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: currentConfig })
  }).catch(() => {});
};

window.testCurrentProductInSim = function() {
  window.simClickProduct(activeProductFlowId);
  showToast(\`Switched simulator to test \${activeProductFlowId}\`);
};

// --------------------------------------------------------------------------
// 3. LIVE WHATSAPP PHONE SIMULATOR
// --------------------------------------------------------------------------
window.restartSimulator = function() {
  simCart = [];
  renderSimulator();
};

function renderSimulator() {
  const chatBody = document.getElementById('simulatorChatBody');
  if (!chatBody) return;

  const greeting = currentConfig?.welcome_greeting || "Welcome to *InstaPics*! 📸✨";
  const body = currentConfig?.welcome_body || "We craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.";
  const instruction = currentConfig?.welcome_instruction || "Swipe through our products below to choose your package:";
  const carouselFooter = currentConfig?.carousel_footer || "◄ Swipe Left / Right to Choose ►";

  const welcomeText = \`\${greeting}\\n\\n\${body}\\n\\n\${instruction}\`.replace('{name}', 'Customer');

  const products = (currentConfig?.products && currentConfig.products.length > 0) ? currentConfig.products : DEFAULT_FALLBACK_CONFIG.products;

  const cardsHtml = products.slice(0, 4).map(p => \`
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <div style="width: 100%; height: 95px; background: #f1f5f9; position: relative; overflow: hidden;">
        <img src="\${p.image || '/assets/products/photobook_a4.jpg'}" alt="\${escapeHtml(p.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/products/photobook_a4.jpg'">
        <span style="position: absolute; bottom: 6px; right: 6px; background: rgba(15,23,42,0.85); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">\${escapeHtml(p.price || '')}</span>
      </div>
      <div style="padding: 8px 10px;">
        <div style="font-weight: 600; font-size: 13px; color: #09090b;">\${escapeHtml(p.title)}</div>
        <div style="font-size: 11px; color: #64748b; margin: 2px 0 6px 0;">\${escapeHtml(p.description || '')}</div>
        <div class="phone-btn" onclick="simClickProduct('\${p.id}')" style="background: #0f172a; color: #fff; font-weight: 500;">
          Select: \${escapeHtml(p.title.split(' ')[1] || p.title)}
        </div>
      </div>
    </div>
  \`).join('');

  chatBody.innerHTML = \`
    <div class="phone-msg-bubble outgoing">
      Hi! I want to order a photobook.
    </div>

    <div class="phone-msg-bubble incoming">
      <div style="white-space: pre-line;">\${escapeHtml(welcomeText)}</div>
      <div style="margin-top: 6px; font-weight: 600; font-size: 11px; color: #475569;">\${escapeHtml(carouselFooter)}</div>
      \${cardsHtml}

      <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; flex-direction: column; gap: 4px;">
        <div class="phone-btn" onclick="simShowMyOrders()">📦 Track My Orders / History</div>
        <div class="phone-btn" onclick="simShowPaymentInfo()">💳 UPI & Payment Info</div>
      </div>
    </div>
  \`;

  chatBody.scrollTop = chatBody.scrollHeight;
}

window.simClickProduct = function(prodId) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || DEFAULT_FALLBACK_CONFIG.products).find(p => p.id === prodId) || { title: prodId };
  const flow = (currentConfig?.product_flows || DEFAULT_FALLBACK_CONFIG.product_flows)[prodId] || {
    step1_prompt: "Please choose your page count:",
    step1_options: [
      { text: "📘 40 Pages ₹1,750", price: 1750 },
      { text: "📘 60 Pages ₹2,150", price: 2150 }
    ]
  };

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      Selected: \${escapeHtml(product.title)}
    </div>
  \`;

  const options = flow.step1_options || [];
  const buttonsHtml = options.map(opt => \`
    <div class="phone-btn" onclick="simChooseOption('\${prodId}', '\${escapeHtml(opt.text)}', \${opt.price || extractPrice(opt.text)})">
      \${escapeHtml(opt.text)}
    </div>
  \`).join('');

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble incoming">
      <strong>Selected: \${escapeHtml(product.title)}</strong><br>
      <span style="font-size: 12px; color: #475569;">\${escapeHtml(flow.step1_prompt || 'Please choose your package:')}</span>
      <div class="phone-buttons-group">
        \${buttonsHtml || \`<div class="phone-btn" onclick="simChooseOption('\${prodId}', 'Standard Option ₹1,500', 1500)">Standard Option ₹1,500</div>\`}
      </div>
    </div>
  \`;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simChooseOption = function(prodId, optionText, price) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || DEFAULT_FALLBACK_CONFIG.products).find(p => p.id === prodId) || { title: "Photobook" };

  simCart.push({
    productId: prodId,
    productName: product.title,
    option: optionText,
    price: price || extractPrice(optionText)
  });

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      Selected: \${escapeHtml(optionText)}
    </div>
  \`;

  const cartTotal = simCart.reduce((s, i) => s + (i.price || 0), 0);
  const cartLines = simCart.map((i, idx) => \`\${idx + 1}. *\${escapeHtml(i.productName)}*\\n   • \${escapeHtml(i.option)}\`).join('\\n\\n');

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble incoming">
      🛒 *Your InstaPics Cart (\${simCart.length} item\${simCart.length > 1 ? 's' : ''}):*\\n\\n
      \${cartLines}\\n\\n
      ━━━━━━━━━━━━━━━━━━━━\\n
      💰 *Total Cart Amount:* *₹\${cartTotal.toLocaleString('en-IN')}*\\n
      ━━━━━━━━━━━━━━━━━━━━\\n\\n
      Would you like to add another product, or upload photos & checkout?
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simAddAnotherItem()">➕ Add Another Item</div>
        <div class="phone-btn" onclick="simStartCheckout()" style="background: #0f172a; color: #fff; font-weight: 500;">📸 Upload Photos & Order</div>
      </div>
    </div>
  \`;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simAddAnotherItem = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const products = (currentConfig?.products && currentConfig.products.length > 0) ? currentConfig.products : DEFAULT_FALLBACK_CONFIG.products;

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      ➕ Add Another Item
    </div>
  \`;

  const cardsHtml = products.slice(0, 4).map(p => \`
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-top: 4px;">
      <div style="font-weight: 600; font-size: 12px;">\${escapeHtml(p.title)}</div>
      <div class="phone-btn" onclick="simClickProduct('\${p.id}')">
        Select: \${escapeHtml(p.title.split(' ')[1] || p.title)} (\${escapeHtml(p.price || '')})
      </div>
    </div>
  \`).join('');

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble incoming">
      ✨ *Choose Next Item to Add:*
      \${cardsHtml}
    </div>
  \`;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simStartCheckout = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      📸 Upload Photos & Order
    </div>
    <div class="phone-msg-bubble incoming">
      📸 *Step 1/3: Send Photos* ✨<br><br>
      Please upload your photos directly here on WhatsApp, or send a <strong>Google Drive / iCloud link</strong>.<br><br>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendPhotos('https://drive.google.com/drive/folders/sample-photos')">📁 Share Google Drive Link</div>
        <div class="phone-btn" onclick="simSendPhotos('Uploaded 60 High-Res Photos.zip')">📷 Upload Photos Directly</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendPhotos = function(photosStr) {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      \${escapeHtml(photosStr)}
    </div>
    <div class="phone-msg-bubble incoming">
      ✅ <strong>Photos received!</strong> 📸<br><br>
      Please reply with your <strong>Full Delivery Address & Pincode</strong> for shipping:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendAddress('Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040')">📍 Use Sample Chennai Address</div>
        <div class="phone-btn" onclick="simSendAddress('12 Gandhi Road, Karur - 639002')">📍 Studio Pickup (Karur)</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendAddress = function(addr) {
  const chatBody = document.getElementById('simulatorChatBody');
  const cartTotal = simCart.reduce((s, i) => s + (i.price || 0), 0) || 1750;

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      \${escapeHtml(addr)}
    </div>
    <div class="phone-msg-bubble incoming">
      💳 <strong>Payment Method</strong><br><br>
      Order Total: <strong>₹\${cartTotal.toLocaleString('en-IN')}</strong><br><br>
      Please choose your payment option:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simCompleteOrder('Instant UPI / Online QR')">📱 Instant UPI / QR Code</div>
        <div class="phone-btn" onclick="simCompleteOrder('Pay on Pickup / Delivery')">💵 Pay on Pickup / Delivery</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simCompleteOrder = function(paymentType) {
  const chatBody = document.getElementById('simulatorChatBody');
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const cartTotal = simCart.reduce((s, i) => s + (i.price || 0), 0) || 1750;
  const payStatus = paymentType.includes('UPI') ? 'Paid via UPI' : 'Payment Pending';

  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      Payment: \${escapeHtml(paymentType)}
    </div>
    <div class="phone-msg-bubble incoming" style="border-left: 4px solid #f59e0b;">
      🎉 <strong>Order Request Received!</strong> ⏳<br><br>
      <strong>Order ID:</strong> #\${orderId}<br>
      <strong>Status:</strong> 🟡 <strong>PENDING STUDIO APPROVAL</strong><br>
      <strong>Payment:</strong> \${payStatus}<br>
      <strong>Amount:</strong> ₹\${cartTotal.toLocaleString('en-IN')}<br><br>
      Our studio manager is reviewing your order details & photos. We will notify you here with an approval confirmation once accepted! 📸✨
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simShowMyOrders()">📦 Track Order Status</div>
        <div class="phone-btn" onclick="simShowPaymentInfo()">💳 View Payment Info</div>
        <div class="phone-btn" onclick="restartSimulator()">🛍️ Shop More</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;

  // Add order to orders list and refresh view
  const newOrder = {
    id: orderId,
    phone: "919629661668",
    customer_name: "Priya Sharma",
    product_name: simCart.map(i => i.productName).join(' + ') || "📖 A4 Premium Photobook",
    details: simCart.map((i, idx) => \`\${idx+1}. \${i.productName} (\${i.option})\`).join('\\n') || "A4 40 Pgs (60 Photos)",
    photos: ["assets/products/photobook_a4.jpg"],
    address: "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040",
    payment_type: paymentType,
    payment_status: payStatus,
    amount: cartTotal,
    status: "Pending Approval",
    created_at: new Date().toISOString()
  };

  currentOrders.unshift(newOrder);
  renderOrderFilterPills(currentOrders);
  renderOrdersTable(currentOrders);
  renderRevenueDashboard(computeOfflineRevenue(currentOrders));
  showToast(\`Simulated new order #\${orderId} waiting for studio approval!\`);
};

window.simShowMyOrders = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      📦 Track My Orders / History
    </div>
    <div class="phone-msg-bubble incoming">
      📜 <strong>Your InstaPics Order History:</strong><br><br>
      1. <strong>Order #ORD-98421</strong><br>
         • Items: 📖 A4 Premium Photobook<br>
         • Amount: ₹1,750<br>
         • Status: 🟡 <strong>PENDING APPROVAL</strong><br><br>
      2. <strong>Order #ORD-65201</strong><br>
         • Items: 🖼️ Custom Photo Frames<br>
         • Amount: ₹999<br>
         • Status: ✅ <strong>COMPLETED</strong><br><br>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="restartSimulator()">🛍️ New Order</div>
        <div class="phone-btn" onclick="simShowPaymentInfo()">💳 Payment Info</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simShowPaymentInfo = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += \`
    <div class="phone-msg-bubble outgoing">
      💳 UPI & Payment Info
    </div>
    <div class="phone-msg-bubble incoming">
      💳 <strong>InstaPics Payment Details:</strong><br><br>
      • <strong>UPI ID:</strong> 6369134270@okbizaxis<br>
      • <strong>Studio Name:</strong> InstaPics Photobooks<br>
      • <strong>Accepted Apps:</strong> GPay, PhonePe, Paytm, BHIM<br><br>
      💡 Pay to the UPI ID above and share your screenshot here!<br>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="restartSimulator()">📖 Browse Products</div>
        <div class="phone-btn" onclick="simShowMyOrders()">📦 Track Orders</div>
      </div>
    </div>
  \`;
  chatBody.scrollTop = chatBody.scrollHeight;
};

// --------------------------------------------------------------------------
// 4. ORDERS & APPROVAL MANAGEMENT (FILTERS & PAYMENT STATUS)
// --------------------------------------------------------------------------
async function fetchOrders() {
  try {
    const res = await fetch('/api/orders', { cache: 'no-store' });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (data.orders && Array.isArray(data.orders)) {
      currentOrders = data.orders;
    }
  } catch (err) {
    console.warn('[Orders] Sync note:', err.message);
  } finally {
    renderOrderFilterPills(currentOrders);
    renderOrdersTable(currentOrders);
  }
}

function renderOrderFilterPills(orders) {
  const container = document.getElementById('orderFilterPills');
  if (!container) return;

  const validOrders = (orders && orders.length > 0) ? orders : SAMPLE_FALLBACK_ORDERS;

  const allCount = validOrders.length;
  const pendingCount = validOrders.filter(o => (o.status || '').toLowerCase().includes('pending')).length;
  const approvedCount = validOrders.filter(o => o.status === 'Approved & Designing').length;
  const printingCount = validOrders.filter(o => o.status === 'Printing').length;
  const readyCount = validOrders.filter(o => o.status === 'Ready for Pickup').length;
  const dispatchedCount = validOrders.filter(o => o.status === 'Dispatched').length;
  const completedCount = validOrders.filter(o => o.status === 'Completed').length;
  const cancelledCount = validOrders.filter(o => o.status === 'Cancelled').length;

  // Header Nav Badge Update
  const badge = document.getElementById('pendingApprovalBadge');
  if (badge) {
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  const pills = [
    { id: 'ALL', label: 'All Orders', count: allCount },
    { id: 'Pending Approval', label: '🟡 Pending Approval', count: pendingCount, isPending: true },
    { id: 'Approved & Designing', label: '🎨 Approved & Designing', count: approvedCount },
    { id: 'Printing', label: '🖨️ Printing', count: printingCount },
    { id: 'Ready for Pickup', label: '📦 Ready for Pickup', count: readyCount },
    { id: 'Dispatched', label: '🚚 Dispatched', count: dispatchedCount },
    { id: 'Completed', label: '✅ Completed', count: completedCount },
    { id: 'Cancelled', label: '❌ Cancelled', count: cancelledCount }
  ];

  container.innerHTML = pills.map(p => {
    const isActive = currentOrderFilter === p.id;
    let pillClass = 'order-filter-pill';
    if (isActive) {
      pillClass += p.isPending ? ' pending-active' : ' active';
    }
    if (p.isPending && !isActive && p.count > 0) {
      pillClass += ' pending-pill';
    }

    return \`
      <button type="button" class="\${pillClass}" onclick="setOrderFilter('\${p.id}')">
        <span>\${p.label}</span>
        <span class="order-pill-badge">\${p.count}</span>
      </button>
    \`;
  }).join('');
}

window.setOrderFilter = function(filterVal) {
  currentOrderFilter = filterVal;
  renderOrderFilterPills(currentOrders);
  renderOrdersTable(currentOrders);
};

window.handleOrderSearch = function(query) {
  currentOrderSearch = (query || '').toLowerCase().trim();
  renderOrdersTable(currentOrders);
};

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const validOrders = (orders && orders.length > 0) ? orders : SAMPLE_FALLBACK_ORDERS;

  // Filter 1: Status Filter Pill
  let filtered = validOrders;
  if (currentOrderFilter !== 'ALL') {
    if (currentOrderFilter === 'Pending Approval') {
      filtered = filtered.filter(o => (o.status || '').toLowerCase().includes('pending'));
    } else {
      filtered = filtered.filter(o => o.status === currentOrderFilter);
    }
  }

  // Filter 2: Live Search Text
  if (currentOrderSearch) {
    filtered = filtered.filter(o => {
      const targetStr = \`\${o.id || ''} \${o.customer_name || ''} \${o.phone || ''} \${o.product_name || ''} \${o.details || ''} \${o.address || ''}\`.toLowerCase();
      return targetStr.includes(currentOrderSearch);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="8" class="empty-state" style="padding: 32px 16px;">
          <div style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 4px;">No orders found matching criteria</div>
          <div style="font-size: 12px; color: #94a3b8;">Filter: "\${escapeHtml(currentOrderFilter)}" \${currentOrderSearch ? \`• Search: "\${escapeHtml(currentOrderSearch)}"\` : ''}</div>
          <button class="btn btn-secondary btn-sm" style="margin-top: 12px;" onclick="setOrderFilter('ALL'); document.getElementById('orderSearchInput').value=''; handleOrderSearch('');">Reset Filters</button>
        </td>
      </tr>
    \`;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const photoCount = order.photos ? order.photos.length : 0;
    const formattedDate = new Date(order.created_at || Date.now()).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const photoCell = photoCount > 0
      ? \`<span class="badge-amount" style="background:#e0f2fe; color:#0369a1;">📷 \${photoCount} Photo(s)</span>\`
      : \`<span style="color: var(--text-muted); font-size: 11px;">None / Cloud Link</span>\`;

    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
    const isPending = (order.status || '').toLowerCase().includes('pending');

    const statusBadgeColor = isPending ? '#FEF3C7; color: #92400E; border: 1px solid #FCD34D;' :
      (order.status === 'Completed' ? '#DCFCE7; color: #166534;' :
      (order.status === 'Cancelled' ? '#FEE2E2; color: #991B1B;' : '#F1F5F9; color: #1E293B;'));

    const payStatus = order.payment_status || (order.payment_type?.toLowerCase().includes('upi') ? 'Paid via UPI' : 'Payment Pending');

    let payStatusBg = '#FEF3C7';
    let payStatusColor = '#92400E';
    let payStatusBorder = '#FCD34D';

    if (payStatus.includes('UPI')) {
      payStatusBg = '#DCFCE7';
      payStatusColor = '#166534';
      payStatusBorder = '#86EFAC';
    } else if (payStatus.includes('Cash') || payStatus.includes('COD')) {
      payStatusBg = '#E0F2FE';
      payStatusColor = '#0369A1';
      payStatusBorder = '#BAE6FD';
    } else if (payStatus.includes('Refund')) {
      payStatusBg = '#F3F4F6';
      payStatusColor = '#4B5563';
      payStatusBorder = '#E5E7EB';
    }

    return \`
      <tr style="\${isPending ? 'background-color: #FFFDF5;' : ''}">
        <td>
          <div class="order-badge">#\${escapeHtml(order.id)}</div>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">\${formattedDate}</span>
        </td>
        <td>
          <div style="font-weight: 600;">\${escapeHtml(order.customer_name || 'Customer')}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <a href="https://wa.me/\${cleanPhone}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #0284c7; text-decoration: none;">
              +\${escapeHtml(order.phone)} ↗
            </a>
            <button class="btn btn-secondary btn-sm" style="padding: 1px 6px; font-size: 10px;" onclick="showCustomerHistory('\${order.phone}', '\${escapeHtml(order.customer_name || 'Customer')}')">
              📜 History
            </button>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; margin-bottom: 2px;">\${escapeHtml(order.product_name)}</div>
          <div style="font-size: 12px; color: #475569; white-space: pre-line;">\${escapeHtml(order.details || 'Standard')}</div>
        </td>
        <td>\${photoCell}</td>
        <td style="max-width: 180px; font-size: 12px; color: var(--text-secondary);">
          \${escapeHtml(order.address || 'Pickup at Studio')}
        </td>
        <td>
          <div class="badge-amount">\${order.amount ? '₹' + Number(order.amount).toLocaleString('en-IN') : '₹0'}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin: 2px 0 4px 0;">\${escapeHtml(order.payment_type || 'UPI')}</div>
          <!-- Dedicated Payment Status Selector (Changeable anytime) -->
          <select class="payment-status-select" onchange="changeOrderPaymentStatus('\${order.id}', this.value)" style="background: \${payStatusBg}; color: \${payStatusColor}; border-color: \${payStatusBorder};">
            <option value="Payment Pending" \${payStatus === 'Payment Pending' ? 'selected' : ''}>🟡 Payment Pending</option>
            <option value="Paid via UPI" \${payStatus === 'Paid via UPI' ? 'selected' : ''}>🟢 Paid via UPI</option>
            <option value="Paid Cash / COD" \${payStatus === 'Paid Cash / COD' ? 'selected' : ''}>💵 Paid Cash / COD</option>
            <option value="Refunded" \${payStatus === 'Refunded' ? 'selected' : ''}>⚪ Refunded</option>
          </select>
        </td>
        <td>
          <select class="select-input" style="font-size: 11px; padding: 4px 6px; background:\${statusBadgeColor}" onchange="updateOrderStatus('\${order.id}', this.value)">
            <option value="Pending Approval" \${order.status === 'Pending Approval' ? 'selected' : ''}>🟡 Pending Approval</option>
            <option value="Approved & Designing" \${order.status === 'Approved & Designing' ? 'selected' : ''}>🎨 Approved & Designing</option>
            <option value="Printing" \${order.status === 'Printing' ? 'selected' : ''}>🖨️ Printing & Binding</option>
            <option value="Ready for Pickup" \${order.status === 'Ready for Pickup' ? 'selected' : ''}>📦 Ready for Pickup</option>
            <option value="Dispatched" \${order.status === 'Dispatched' ? 'selected' : ''}>🚚 Dispatched</option>
            <option value="Completed" \${order.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
            <option value="Cancelled" \${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            \${isPending ? \`
              <button class="btn btn-sm btn-approve" onclick="approveOrderAction('\${order.id}')" title="Approve order and notify customer">
                ✅ Approve Order
              </button>
              <button class="btn btn-danger btn-sm" onclick="rejectOrderAction('\${order.id}')" style="font-size: 11px; padding: 3px 6px;">
                ❌ Cancel Order
              </button>
            \` : \`
              <button class="btn btn-secondary btn-sm" onclick="notifyOrderUpdate('\${order.id}', '\${order.status}')">
                📱 WhatsApp Notify
              </button>
            \`}
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}

// Dedicated Order Approval
window.approveOrderAction = async function(id) {
  try {
    showToast(\`Approving order #\${id}...\`);
    const res = await fetch(\`/api/orders/\${encodeURIComponent(id)}/approve\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast(\`🎉 Order #\${id} Approved! WhatsApp confirmation sent to customer.\`);
      fetchOrders();
      fetchRevenue();
    } else {
      showToast(\`Error: \${data.error || 'Failed to approve'}\`);
    }
  } catch (err) {
    // Offline local fallback
    const ord = currentOrders.find(o => o.id === id);
    if (ord) {
      ord.status = 'Approved & Designing';
      renderOrderFilterPills(currentOrders);
      renderOrdersTable(currentOrders);
      renderRevenueDashboard(computeOfflineRevenue(currentOrders));
    }
    showToast(\`Order #\${id} marked Approved (offline sync)\`);
  }
};

// Dedicated Order Rejection / Cancellation
window.rejectOrderAction = async function(id) {
  const reason = prompt("Enter cancellation reason for customer (optional):", "Photos need higher resolution");
  try {
    showToast(\`Cancelling order #\${id}...\`);
    const res = await fetch(\`/api/orders/\${encodeURIComponent(id)}/reject\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, notifyCustomer: true })
    });
    const data = await res.json();
    if (data.success) {
      showToast(\`Order #\${id} cancelled.\`);
      fetchOrders();
      fetchRevenue();
    } else {
      showToast(\`Error: \${data.error || 'Failed to cancel'}\`);
    }
  } catch (err) {
    const ord = currentOrders.find(o => o.id === id);
    if (ord) {
      ord.status = 'Cancelled';
      renderOrderFilterPills(currentOrders);
      renderOrdersTable(currentOrders);
      renderRevenueDashboard(computeOfflineRevenue(currentOrders));
    }
    showToast(\`Order #\${id} cancelled locally.\`);
  }
};

// Independent Payment Status Change Anytime
window.changeOrderPaymentStatus = async function(id, newPaymentStatus) {
  const ord = currentOrders.find(o => o.id === id);
  if (ord) ord.payment_status = newPaymentStatus;

  renderOrdersTable(currentOrders);
  renderRevenueDashboard(computeOfflineRevenue(currentOrders));
  showToast(\`Updating payment status for #\${id} to "\${newPaymentStatus}"...\`);

  try {
    const res = await fetch(\`/api/orders/\${encodeURIComponent(id)}/payment-status\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newPaymentStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(\`💳 Order #\${id} payment status set to "\${newPaymentStatus}"\`);
      fetchRevenue();
    }
  } catch (err) {
    console.warn('[PaymentStatus] Sync note:', err.message);
  }
};

window.updateOrderStatus = async function(id, newStatus) {
  try {
    const res = await fetch(\`/api/orders/\${encodeURIComponent(id)}/status\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notifyCustomer: false })
    });
    const data = await res.json();
    if (data.success) {
      showToast(\`Order #\${id} status updated to "\${newStatus}"\`);
      fetchOrders();
      fetchRevenue();
    }
  } catch (err) {
    const ord = currentOrders.find(o => o.id === id);
    if (ord) ord.status = newStatus;
    renderOrderFilterPills(currentOrders);
    renderOrdersTable(currentOrders);
    showToast(\`Status updated locally to "\${newStatus}"\`);
  }
};

window.notifyOrderUpdate = async function(id, status) {
  try {
    showToast(\`Sending WhatsApp status update for #\${id}...\`);
    const res = await fetch(\`/api/orders/\${encodeURIComponent(id)}/status\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notifyCustomer: true })
    });
    const data = await res.json();
    if (data.notificationSent) {
      showToast(\`📲 WhatsApp update dispatched to customer for #\${id}!\`);
    } else {
      showToast(\`Status saved, but WhatsApp notification could not be sent.\`);
    }
  } catch (err) {
    showToast(\`Error: \${err.message}\`);
  }
};

// --------------------------------------------------------------------------
// 5. REVENUE & PAYMENTS ANALYTICS
// --------------------------------------------------------------------------
async function fetchRevenue() {
  try {
    const res = await fetch('/api/revenue', { cache: 'no-store' });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (data.stats) {
      currentRevenueStats = data.stats;
      renderRevenueDashboard(currentRevenueStats);
    }
  } catch (err) {
    console.warn('[Revenue] Sync note:', err.message);
    renderRevenueDashboard(computeOfflineRevenue(currentOrders));
  }
}

function computeOfflineRevenue(orders) {
  let totalRevenue = 0;
  let pendingApprovalValue = 0;
  let totalOrdersCount = orders.length;
  let pendingApprovalCount = 0;
  let approvedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;

  const paymentModes = {
    upi: { count: 0, amount: 0, label: "Instant UPI / Online QR" },
    cod: { count: 0, amount: 0, label: "Pay on Pickup / Delivery" }
  };

  const productBreakdown = {};

  orders.forEach(ord => {
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

    const payStat = (ord.payment_status || '').toLowerCase();
    const payType = (ord.payment_type || '').toLowerCase();
    if (payStat.includes('upi') || (!payStat && (payType.includes('upi') || payType.includes('qr')))) {
      paymentModes.upi.count++;
      paymentModes.upi.amount += amt;
    } else {
      paymentModes.cod.count++;
      paymentModes.cod.amount += amt;
    }

    const pName = ord.product_name || 'Other Products';
    if (!productBreakdown[pName]) {
      productBreakdown[pName] = { count: 0, revenue: 0 };
    }
    productBreakdown[pName].count++;
    productBreakdown[pName].revenue += amt;
  });

  const aov = approvedCount > 0 ? Math.round(totalRevenue / approvedCount) : 0;

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
    recentOrders: orders
  };
}

function renderRevenueDashboard(stats) {
  if (!stats) return;

  // KPI Metrics
  setElText('statTotalRevenue', '₹' + Number(stats.totalRevenue || 0).toLocaleString('en-IN'));
  setElText('statPendingValue', '₹' + Number(stats.pendingApprovalValue || 0).toLocaleString('en-IN'));
  setElText('statTotalOrders', (stats.totalOrdersCount || 0) + ' Orders');
  setElText('statAov', '₹' + Number(stats.aov || 0).toLocaleString('en-IN'));

  setElText('statApprovedOrdersSub', \`\${stats.approvedCount || 0} approved • \${stats.pendingApprovalCount || 0} pending\`);

  // Payment Modes Cards
  setElText('statUpiAmount', '₹' + Number(stats.paymentModes?.upi?.amount || 0).toLocaleString('en-IN'));
  setElText('statUpiCount', (stats.paymentModes?.upi?.count || 0) + ' payments');

  setElText('statCodAmount', '₹' + Number(stats.paymentModes?.cod?.amount || 0).toLocaleString('en-IN'));
  setElText('statCodCount', (stats.paymentModes?.cod?.count || 0) + ' payments');

  // Product Revenue Breakdown
  const productContainer = document.getElementById('productRevenueList');
  if (productContainer && stats.productBreakdown) {
    const totalRev = stats.totalRevenue + stats.pendingApprovalValue || 1;
    productContainer.innerHTML = Object.entries(stats.productBreakdown).map(([name, data]) => {
      const pct = Math.min(100, Math.round((data.revenue / totalRev) * 100));
      return \`
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; margin-bottom: 4px;">
            <span>\${escapeHtml(name)} (\${data.count} orders)</span>
            <span style="font-weight: 700; color: #0f172a;">₹\${Number(data.revenue).toLocaleString('en-IN')}</span>
          </div>
          <div style="background: #e2e8f0; height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="background: #0f172a; width: \${pct}%; height: 100%; border-radius: 4px;"></div>
          </div>
        </div>
      \`;
    }).join('');
  }

  // Payments Ledger Table
  const ledgerTbody = document.getElementById('paymentsLedgerBody');
  if (ledgerTbody) {
    const orders = stats.recentOrders || currentOrders;
    ledgerTbody.innerHTML = orders.map(ord => {
      const formattedDate = new Date(ord.created_at || Date.now()).toLocaleDateString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isPending = (ord.status || '').toLowerCase().includes('pending');
      const badgeStyle = isPending
        ? 'background: #FEF3C7; color: #92400E;'
        : (ord.status === 'Completed' ? 'background: #DCFCE7; color: #166534;' : 'background: #E0F2FE; color: #0369A1;');

      return \`
        <tr>
          <td>
            <div class="order-badge">#\${escapeHtml(ord.id)}</div>
            <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px;">\${formattedDate}</span>
          </td>
          <td>
            <div style="font-weight: 600;">\${escapeHtml(ord.customer_name || 'Customer')}</div>
            <span style="font-size: 11px; color: var(--text-muted);">+\${escapeHtml(ord.phone)}</span>
          </td>
          <td>\${escapeHtml(ord.product_name)}</td>
          <td>
            <span style="font-size: 12px; font-weight: 600;">\${escapeHtml(ord.payment_status || ord.payment_type || 'Payment Pending')}</span>
          </td>
          <td>
            <span style="font-size: 13px; font-weight: 700; color: #047857;">
              \${ord.amount ? '₹' + Number(ord.amount).toLocaleString('en-IN') : '₹0'}
            </span>
          </td>
          <td>
            <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; \${badgeStyle}">
              \${escapeHtml(ord.status)}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="showCustomerHistory('\${ord.phone}', '\${escapeHtml(ord.customer_name || 'Customer')}')">
              📜 History
            </button>
          </td>
        </tr>
      \`;
    }).join('');
  }
}

// --------------------------------------------------------------------------
// 6. CUSTOMER HISTORY MODAL
// --------------------------------------------------------------------------
window.showCustomerHistory = async function(phone, customerName) {
  const modal = document.getElementById('customerHistoryModal');
  if (!modal) return;

  setElText('historyModalCustomerName', customerName || 'Customer Order History');
  setElText('historyModalCustomerPhone', '+' + (phone || ''));

  const statsContainer = document.getElementById('historyModalStats');
  const tbody = document.getElementById('historyModalTableBody');

  modal.classList.remove('hidden');

  let historyOrders = [];
  try {
    const res = await fetch(\`/api/orders/history/\${encodeURIComponent(phone)}\`, { cache: 'no-store' });
    const data = await res.json();
    if (data.orders) historyOrders = data.orders;
  } catch (err) {
    historyOrders = currentOrders.filter(o => (o.phone || '').includes(phone));
  }

  const totalSpent = historyOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);

  if (statsContainer) {
    statsContainer.innerHTML = \`
      <div class="kpi-card" style="padding: 10px 14px; flex: 1;">
        <div class="kpi-label">Lifetime Spend</div>
        <div style="font-size: 18px; font-weight: 700; color: #047857;">₹\${totalSpent.toLocaleString('en-IN')}</div>
      </div>
      <div class="kpi-card" style="padding: 10px 14px; flex: 1;">
        <div class="kpi-label">Total Orders Placed</div>
        <div style="font-size: 18px; font-weight: 700;">\${historyOrders.length}</div>
      </div>
    \`;
  }

  if (tbody) {
    if (historyOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No past orders found for this customer.</td></tr>';
      return;
    }

    tbody.innerHTML = historyOrders.map(ord => \`
      <tr>
        <td><div class="order-badge">#\${escapeHtml(ord.id)}</div></td>
        <td>
          <div style="font-weight: 600;">\${escapeHtml(ord.product_name)}</div>
          <div style="font-size: 11px; color: #475569;">\${escapeHtml(ord.details || '')}</div>
        </td>
        <td><strong>₹\${Number(ord.amount || 0).toLocaleString('en-IN')}</strong></td>
        <td>\${escapeHtml(ord.payment_status || ord.payment_type || 'UPI')}</td>
        <td><span class="badge-amount" style="background:#f1f5f9; color:#0f172a;">\${escapeHtml(ord.status)}</span></td>
        <td>\${new Date(ord.created_at || Date.now()).toLocaleDateString()}</td>
      </tr>
    \`).join('');
  }
};

window.closeCustomerHistoryModal = function() {
  const modal = document.getElementById('customerHistoryModal');
  if (modal) modal.classList.add('hidden');
};

// --------------------------------------------------------------------------
// 7. STUDIO SETTINGS & MAIN MENU TEMPLATE CUSTOMIZER
// --------------------------------------------------------------------------
function populateSettingsFields(cfg) {
  setVal('cfgStudioName', cfg.studio_name);
  setVal('cfgStudioPhone', cfg.studio_phone);
  setVal('cfgStudioAddress', cfg.studio_address);
  setVal('cfgUpiId', cfg.upi_id);
  setVal('cfgWelcomeMessage', cfg.welcome_message);
  setVal('cfgWelcomeGreeting', cfg.welcome_greeting || 'Welcome to *InstaPics*! 📸✨');
  setVal('cfgWelcomeBody', cfg.welcome_body || 'We craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.');
  setVal('cfgWelcomeInstruction', cfg.welcome_instruction || 'Swipe through our products below to choose your package:');
  setVal('cfgCarouselFooter', cfg.carousel_footer || '◄ Swipe Left / Right to Choose ►');
  setVal('cfgCatalogueLink', cfg.catalogue_link || 'https://wa.me/c/916369134270');
  setVal('cfgPromptName', cfg.prompt_name);
  setVal('cfgPromptAddress', cfg.prompt_address);
  setVal('cfgOrderConfirmedMessage', cfg.order_confirmed_message);
  setVal('cfgTrackingMessage', cfg.tracking_message);

  updateWelcomeTemplatePreview();
}

window.updateWelcomeTemplatePreview = function() {
  const previewBox = document.getElementById('welcomeTemplatePreviewBox');
  if (!previewBox) return;

  const greeting = getVal('cfgWelcomeGreeting') || 'Welcome to *InstaPics*! 📸✨';
  const body = getVal('cfgWelcomeBody') || 'We craft premium *Non-Tearable & Waterproof Photobooks* and customized *Photo Frames* with lifetime durability.';
  const instruction = getVal('cfgWelcomeInstruction') || 'Swipe through our products below to choose your package:';
  const catalogue = getVal('cfgCatalogueLink') || 'https://wa.me/c/916369134270';
  const footer = getVal('cfgCarouselFooter') || '◄ Swipe Left / Right to Choose ►';

  previewBox.innerHTML = \`
    <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">\${escapeHtml(greeting)}</div>
    <div style="margin-bottom: 8px;">\${escapeHtml(body)}</div>
    <div style="margin-bottom: 8px; font-weight: 500;">\${escapeHtml(instruction)}</div>
    <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; font-size: 11px; margin-bottom: 8px;">
      🛍️ <strong>Catalogue:</strong> <span style="color: #0284c7;">\${escapeHtml(catalogue)}</span>
    </div>
    <div style="font-size: 11px; color: #64748b; font-weight: 600;">\${escapeHtml(footer)}</div>
  \`;
};

window.saveSettings = async function() {
  const greeting = getVal('cfgWelcomeGreeting');
  const body = getVal('cfgWelcomeBody');
  const instruction = getVal('cfgWelcomeInstruction');
  const carouselFooter = getVal('cfgCarouselFooter');
  const catalogueLink = getVal('cfgCatalogueLink');

  const config = {
    ...currentConfig,
    studio_name: getVal('cfgStudioName'),
    studio_phone: getVal('cfgStudioPhone'),
    studio_address: getVal('cfgStudioAddress'),
    upi_id: getVal('cfgUpiId'),
    welcome_message: \`\${greeting}\\n\\n\${body}\\n\\n\${instruction}\`,
    welcome_greeting: greeting,
    welcome_body: body,
    welcome_instruction: instruction,
    carousel_footer: carouselFooter,
    catalogue_link: catalogueLink,
    prompt_name: getVal('cfgPromptName'),
    prompt_address: getVal('cfgPromptAddress'),
    order_confirmed_message: getVal('cfgOrderConfirmedMessage'),
    tracking_message: getVal('cfgTrackingMessage')
  };

  currentConfig = config;
  renderSimulator();
  showToast('Studio settings & MainMenu template saved successfully!');

  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    const data = await res.json();
    if (data.config) {
      currentConfig = data.config;
    }
  } catch (err) {
    console.warn('[Settings] Offline save note:', err.message);
  }
};

// --------------------------------------------------------------------------
// 8. WHATSAPP DEVICE CONNECTION
// --------------------------------------------------------------------------
window.restartWhatsAppSocket = async function() {
  try {
    showToast('Restarting WhatsApp bot socket...');
    const res = await fetch('/api/restart', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Restart initiated. Checking status...');
    setTimeout(fetchDeviceStatus, 1500);
  } catch (err) {
    showToast(\`Error: \${err.message}\`);
  }
};

window.requestPairingCode = async function() {
  const phone = getVal('pairingPhoneInput');
  if (!phone) {
    alert('Please enter your WhatsApp phone number with country code (e.g. 916369134270)');
    return;
  }
  try {
    showToast('Requesting 8-digit pairing code...');
    const res = await fetch('/api/pairing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (data.pairingCode) {
      document.getElementById('pairingCodeValue').textContent = data.pairingCode;
      document.getElementById('pairingCodeDisplay')?.classList.remove('hidden');
      showToast('Pairing code generated! Check your phone.');
    } else {
      alert(data.error || 'Failed to generate code');
    }
  } catch (err) {
    alert(\`Pairing error: \${err.message}\`);
  }
};

window.sendTestMenuToPhone = async function() {
  const btn = document.getElementById('sendTestMenuBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }
  try {
    const res = await fetch('/api/send-test-menu', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Test menu dispatched to your phone!');
    } else {
      showToast(\`Error: \${data.error || 'Failed to dispatch'}\`);
    }
  } catch (err) {
    showToast(\`Error: \${err.message}\`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📲 Test on My Phone';
    }
  }
};

window.clearCustomerSessions = async function() {
  try {
    const res = await fetch('/api/sessions/clear', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Active conversation sessions cleared');
  } catch (err) {
    showToast(\`Error: \${err.message}\`);
  }
};

window.sendWelcomeToCustomPhone = async function() {
  const phone = getVal('targetCustomerPhoneInput');
  if (!phone) {
    alert('Please enter a WhatsApp number (e.g. 9629661668)');
    return;
  }
  try {
    showToast(\`Sending welcome carousel to +\${phone}...\`);
    const res = await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Carousel message sent successfully!');
      setVal('targetCustomerPhoneInput', '');
    } else {
      showToast(\`Error: \${data.error || 'Failed to send'}\`);
    }
  } catch (err) {
    showToast(\`Error: \${err.message}\`);
  }
};

let lastDeviceState = { status: null, qrCodeDataUrl: null, phone: null };

async function fetchDeviceStatus() {
  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    const data = await res.json();

    if (
      lastDeviceState.status === data.status &&
      lastDeviceState.qrCodeDataUrl === data.qrCodeDataUrl &&
      lastDeviceState.phone === data.phone
    ) {
      return;
    }
    lastDeviceState = {
      status: data.status,
      qrCodeDataUrl: data.qrCodeDataUrl,
      phone: data.phone
    };

    const pill = document.getElementById('deviceStatusPill');
    const statusText = pill?.querySelector('.status-text');
    const qrContainer = document.getElementById('qrCodeContainer');
    const connectedBanner = document.getElementById('connectedBanner');
    const phoneText = document.getElementById('connectedPhoneText');

    if (data.status === 'connected') {
      if (pill) pill.className = 'device-pill connected';
      if (statusText) statusText.textContent = \`Online (+\${data.phone})\`;
      if (qrContainer) qrContainer.classList.add('hidden');
      if (connectedBanner) {
        connectedBanner.classList.remove('hidden');
        if (phoneText) phoneText.textContent = \`+\${data.phone}\`;
      }
    } else {
      if (pill) pill.className = 'device-pill';
      if (connectedBanner) connectedBanner.classList.add('hidden');
      if (qrContainer) qrContainer.classList.remove('hidden');

      if (data.status === 'qr_ready' && data.qrCodeDataUrl) {
        if (statusText) statusText.textContent = 'Scan QR';
        qrContainer.innerHTML = \`<img src="\${data.qrCodeDataUrl}" class="qr-image" alt="WhatsApp QR Code" />\`;
      } else if (data.status === 'connecting') {
        if (statusText) statusText.textContent = 'Connecting...';
        qrContainer.innerHTML = \`<div class="field-hint">Connecting to WhatsApp...</div>\`;
      } else {
        if (statusText) statusText.textContent = 'Offline';
        qrContainer.innerHTML = \`<div class="field-hint">Waiting for QR Code...</div>\`;
      }
    }

    if (data.pairingCode) {
      const codeVal = document.getElementById('pairingCodeValue');
      if (codeVal) codeVal.textContent = data.pairingCode;
      document.getElementById('pairingCodeDisplay')?.classList.remove('hidden');
    }
  } catch (err) {
    const pill = document.getElementById('deviceStatusPill');
    const statusText = pill?.querySelector('.status-text');
    if (statusText && statusText.textContent === 'Checking...') {
      statusText.textContent = 'Online';
    }
  }
}

// --------------------------------------------------------------------------
// 9. UTILITY HELPERS
// --------------------------------------------------------------------------
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

function extractPrice(str) {
  if (!str) return 0;
  const match = String(str).match(/₹\\s*([0-9,]+)/);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  const digits = String(str).replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
`;

// Write to src/public/app.js
fs.writeFileSync(path.resolve('src/public/app.js'), appJsContent, 'utf8');
console.log('✅ Updated src/public/app.js');

// Now update src/public/index.html to inline the exact same script
const indexPath = path.resolve('src/public/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace the <script>...</script> block
const scriptStartTag = '  <script>';
const scriptEndTag = '  </script>';

const startIdx = indexHtml.indexOf(scriptStartTag);
const endIdx = indexHtml.indexOf(scriptEndTag);

if (startIdx !== -1 && endIdx !== -1) {
  const before = indexHtml.substring(0, startIdx + scriptStartTag.length);
  const after = indexHtml.substring(endIdx);
  indexHtml = before + '\n' + appJsContent + '\n' + after;
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log('✅ Synchronized and inlined into src/public/index.html');
} else {
  console.error('❌ Could not locate script tags in index.html');
}

