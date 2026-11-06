// ==========================================================================
// INSTAPICS PHOTOBOOKS & FRAMES ADMIN PANEL — JAVASCRIPT
// ==========================================================================

let currentConfig = null;
let currentOrders = [];
let statusPollInterval = null;
let activeProductFlowId = 'prod_photobook_a4';

document.addEventListener('DOMContentLoaded', () => {
  try { initTabs(); } catch (e) { console.error('initTabs failed:', e); }
  try { initOrders(); } catch (e) { console.error('initOrders failed:', e); }
  try { initFlowEditor(); } catch (e) { console.error('initFlowEditor failed:', e); }
  try { initSettings(); } catch (e) { console.error('initSettings failed:', e); }
  try { initDeviceManager(); } catch (e) { console.error('initDeviceManager failed:', e); }
  try { initSimulator(); } catch (e) { console.error('initSimulator failed:', e); }

  // Start polling device status every 3 seconds
  fetchDeviceStatus();
  statusPollInterval = setInterval(fetchDeviceStatus, 3000);
});

// --------------------------------------------------------------------------
// 1. TABS NAVIGATION
// --------------------------------------------------------------------------
function initTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(`tab-${targetTab}`);
      if (targetEl) targetEl.classList.add('active');

      if (targetTab === 'orders') fetchOrders();
      if (targetTab === 'product-flows') fetchConfig();
      if (targetTab === 'settings') fetchConfig();
      if (targetTab === 'device') fetchDeviceStatus();
    });
  });
}

// --------------------------------------------------------------------------
// 2. ORDERS MANAGEMENT
// --------------------------------------------------------------------------
function initOrders() {
  const refreshBtn = document.getElementById('refreshOrdersBtn');
  const filterSelect = document.getElementById('orderStatusFilter');

  if (refreshBtn) refreshBtn.addEventListener('click', () => fetchOrders());
  if (filterSelect) filterSelect.addEventListener('change', () => fetchOrders());

  // Close Photo Modal
  const closeBtn = document.getElementById('closePhotoModalBtn');
  const modal = document.getElementById('photoModal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  fetchOrders();
}

async function fetchOrders() {
  const tbody = document.getElementById('ordersTableBody');
  const filter = document.getElementById('orderStatusFilter')?.value || 'ALL';

  try {
    const url = filter === 'ALL' ? '/api/orders' : `/api/orders?status=${encodeURIComponent(filter)}`;
    const res = await fetch(url);
    const data = await res.json();
    currentOrders = data.orders || [];
    renderOrdersTable(currentOrders);
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Error loading orders: ${err.message}</td></tr>`;
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No customer orders recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const photoCount = order.photos ? order.photos.length : 0;
    const formattedDate = new Date(order.created_at).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const photoButton = photoCount > 0
      ? `<button class="photo-thumb-btn" onclick="openPhotos('${order.id}')">📷 ${photoCount} Photo(s)</button>`
      : `<span style="color: var(--text-muted); font-size: 12px;">None</span>`;

    return `
      <tr>
        <td>
          <div class="order-id">#${order.id}</div>
          <span class="field-hint" style="font-family: var(--font-mono); font-size: 11px;">${formattedDate}</span>
        </td>
        <td>
          <div class="customer-name">${escapeHtml(order.customer_name || 'Anonymous')}</div>
          <span class="order-phone">+${escapeHtml(order.phone)}</span>
        </td>
        <td>
          <strong>${escapeHtml(order.product_name)}</strong>
          <div><span class="specs-badge" style="white-space: pre-line; text-align: left; display: inline-block;">${escapeHtml(order.details || 'Standard')}</span></div>
        </td>
        <td>${photoButton}</td>
        <td style="max-width: 220px; font-size: 12px; color: var(--text-secondary);">
          ${escapeHtml(order.address || 'Pickup at Studio')}
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 600; color: #16a34a;">${order.amount ? `₹${Number(order.amount).toLocaleString('en-IN')}` : ''}</div>
          <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(order.payment_type)}</span>
        </td>
        <td>
          <select class="select-input" style="font-size: 12px; padding: 4px 6px;" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Printing" ${order.status === 'Printing' ? 'selected' : ''}>Printing</option>
            <option value="Ready for Pickup" ${order.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
            <option value="Dispatched" ${order.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="notifyOrderUpdate('${order.id}', '${order.status}')">
            WhatsApp Notify
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openPhotos = function(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order || !order.photos || order.photos.length === 0) return;

  const modal = document.getElementById('photoModal');
  const gallery = document.getElementById('photoModalBody');

  gallery.innerHTML = order.photos.map(p => `
    <a href="${p}" target="_blank" rel="noopener noreferrer">
      <img src="${p}" class="modal-gallery-img" alt="Order Photo" />
    </a>
  `).join('');

  modal.classList.remove('hidden');
};

window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notifyCustomer: false })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order #${orderId} marked as ${newStatus}`);
      fetchOrders();
    }
  } catch (err) {
    showToast(`Failed to update status: ${err.message}`);
  }
};

window.notifyOrderUpdate = async function(orderId, currentStatus) {
  if (!confirm(`Send WhatsApp status notification to customer for Order #${orderId} (${currentStatus})?`)) {
    return;
  }
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: currentStatus, notifyCustomer: true })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`WhatsApp message dispatched to customer!`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

// --------------------------------------------------------------------------
// 3. PRODUCT FLOWS EDITOR
// --------------------------------------------------------------------------
function initFlowEditor() {
  const saveBtn = document.getElementById('saveProductFlowsBtn');
  const addProdBtn = document.getElementById('addProductBtn');

  if (saveBtn) saveBtn.addEventListener('click', saveProductFlows);
  if (addProdBtn) addProdBtn.addEventListener('click', () => addProductCard());

  fetchConfig();
}

async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    currentConfig = data.config || {};
    populateConfigFields(currentConfig);
    renderSimulator();
  } catch (err) {
    console.error('Failed to load bot config:', err);
  }
}

function populateConfigFields(cfg) {
  // Settings Tab Fields
  setVal('cfgStudioName', cfg.studio_name);
  setVal('cfgStudioPhone', cfg.studio_phone);
  setVal('cfgStudioAddress', cfg.studio_address);
  setVal('cfgUpiId', cfg.upi_id);
  setVal('cfgWelcomeMessage', cfg.welcome_message);
  setVal('cfgPromptName', cfg.prompt_name);
  setVal('cfgPromptAddress', cfg.prompt_address);
  setVal('cfgOrderConfirmedMessage', cfg.order_confirmed_message);
  setVal('cfgTrackingMessage', cfg.tracking_message);

  // Flow Tab Fields
  renderProductFlowTabs(cfg.products || [], cfg.product_flows || {});
  renderProductsList(cfg.products || []);
}

function renderProductFlowTabs(products, productFlows) {
  const tabsContainer = document.getElementById('productFlowTabs');
  if (!tabsContainer) return;

  if (!products.some(p => p.id === activeProductFlowId) && products.length > 0) {
    activeProductFlowId = products[0].id;
  }

  tabsContainer.innerHTML = products.map(p => `
    <button type="button" class="product-pill ${p.id === activeProductFlowId ? 'active' : ''}" onclick="selectProductFlow('${p.id}')">
      ${escapeHtml(p.title)}
    </button>
  `).join('');

  renderActiveProductFlow(activeProductFlowId, productFlows);
}

window.selectProductFlow = function(prodId) {
  activeProductFlowId = prodId;
  const pills = document.querySelectorAll('.product-pill');
  pills.forEach(p => p.classList.remove('active'));
  event?.target?.classList.add('active');

  const productFlows = currentConfig?.product_flows || {};
  renderActiveProductFlow(prodId, productFlows);
};

function renderActiveProductFlow(prodId, productFlows) {
  const container = document.getElementById('activeProductFlowEditor');
  if (!container) return;

  const flow = productFlows[prodId] || {
    id: prodId,
    title: prodId,
    step1_title: "Options",
    step1_prompt: "Select an option:",
    step1_options: [],
    step2_title: "Customization",
    step2_prompt: "",
    step2_options: [],
    photo_prompt: "Please send your photo:"
  };

  const step1OptsText = (flow.step1_options || []).map(o => o.text).join('\n');
  const step2OptsText = (flow.step2_options || []).map(o => o.text).join('\n');

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span class="product-flow-section-title">Dedicated Flow for: <strong>${escapeHtml(flow.title || prodId)}</strong></span>
      <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${prodId}</span>
    </div>

    <!-- Step 1 Config -->
    <div class="form-group" style="margin-top: 10px;">
      <label>Step 1 Heading & Prompt Question</label>
      <input type="text" id="flowStep1Prompt" class="text-input" value="${escapeHtml(flow.step1_prompt || '')}" placeholder="e.g. Please choose your Frame Size:">
    </div>

    <div class="form-group">
      <label>Step 1 Clickable Buttons (1 option per line)</label>
      <textarea id="flowStep1Options" class="textarea-input" rows="3" placeholder="Option 1&#10;Option 2&#10;Option 3">${escapeHtml(step1OptsText)}</textarea>
      <span class="field-hint">Each line generates a modern clickable WhatsApp button for the customer.</span>
    </div>

    <!-- Step 2 Config -->
    <div class="form-group">
      <label>Step 2 Heading / Prompt (Leave empty if no Step 2 needed)</label>
      <input type="text" id="flowStep2Prompt" class="text-input" value="${escapeHtml(flow.step2_prompt || '')}" placeholder="e.g. Select Finish & Border or Custom Quote:">
    </div>

    <div class="form-group">
      <label>Step 2 Clickable Buttons (Optional, 1 per line)</label>
      <textarea id="flowStep2Options" class="textarea-input" rows="3" placeholder="Finish 1&#10;Finish 2">${escapeHtml(step2OptsText)}</textarea>
      <span class="field-hint">Leave blank if Step 2 is a custom text question (e.g. quote, engraving name).</span>
    </div>

    <!-- Photo Upload Prompt -->
    <div class="form-group">
      <label>Product-Specific Photo Upload Instructions</label>
      <textarea id="flowPhotoPrompt" class="textarea-input" rows="2">${escapeHtml(flow.photo_prompt || '')}</textarea>
    </div>
  `;
}

function gatherActiveProductFlowData() {
  if (!activeProductFlowId) return null;
  const flowStep1Prompt = document.getElementById('flowStep1Prompt')?.value.trim() || '';
  const flowStep1OptsRaw = document.getElementById('flowStep1Options')?.value.trim() || '';
  const flowStep2Prompt = document.getElementById('flowStep2Prompt')?.value.trim() || '';
  const flowStep2OptsRaw = document.getElementById('flowStep2Options')?.value.trim() || '';
  const flowPhotoPrompt = document.getElementById('flowPhotoPrompt')?.value.trim() || '';

  const step1_options = flowStep1OptsRaw.split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map((text, idx) => ({ id: `${activeProductFlowId}_opt1_${idx + 1}`, text }));

  const step2_options = flowStep2OptsRaw.split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map((text, idx) => ({ id: `${activeProductFlowId}_opt2_${idx + 1}`, text }));

  const currentProduct = (currentConfig?.products || []).find(p => p.id === activeProductFlowId);

  return {
    id: activeProductFlowId,
    title: currentProduct?.title || activeProductFlowId,
    description: currentProduct?.description || '',
    price: currentProduct?.price || '',
    step1_title: "Product Options",
    step1_prompt: flowStep1Prompt,
    step1_options,
    step2_title: "Customization",
    step2_prompt: flowStep2Prompt,
    step2_options,
    photo_prompt: flowPhotoPrompt
  };
}

function renderProductsList(products) {
  const container = document.getElementById('productsList');
  if (!container) return;
  container.innerHTML = products.map((prod, index) => `
    <div class="product-item-card" data-index="${index}">
      <div class="product-item-header">
        <input type="text" class="text-input prod-title" value="${escapeHtml(prod.title)}" placeholder="Product Title (e.g. 🖼️ Frames)">
        <input type="text" class="text-input prod-price" style="width: 100px;" value="${escapeHtml(prod.price || '')}" placeholder="₹ Price">
        <button class="delete-product-btn" onclick="removeProductCard(${index})">&times;</button>
      </div>
      <input type="text" class="text-input prod-desc" value="${escapeHtml(prod.description || '')}" placeholder="Short description / specs hint">
      <input type="hidden" class="prod-id" value="${escapeHtml(prod.id || `prod_${Date.now()}`)}">
    </div>
  `).join('');
}

function addProductCard() {
  const products = gatherCurrentProducts();
  const newId = `prod_${Date.now().toString(36)}`;
  products.push({
    id: newId,
    title: "✨ New Photo Product",
    description: "High quality custom photo product",
    price: "₹499+"
  });
  renderProductsList(products);
  renderProductFlowTabs(products, currentConfig?.product_flows || {});
}

window.removeProductCard = function(index) {
  const products = gatherCurrentProducts();
  products.splice(index, 1);
  renderProductsList(products);
  renderProductFlowTabs(products, currentConfig?.product_flows || {});
};

function gatherCurrentProducts() {
  const cards = document.querySelectorAll('.product-item-card');
  const products = [];
  cards.forEach(card => {
    const title = card.querySelector('.prod-title')?.value.trim() || 'Product';
    const price = card.querySelector('.prod-price')?.value.trim() || '';
    const description = card.querySelector('.prod-desc')?.value.trim() || '';
    const id = card.querySelector('.prod-id')?.value.trim() || `prod_${Date.now()}`;
    products.push({ id, title, description, price });
  });
  return products;
}

async function saveProductFlows() {
  const activeFlow = gatherActiveProductFlowData();
  const updatedProductFlows = { ...(currentConfig?.product_flows || {}) };
  if (activeFlow) {
    updatedProductFlows[activeFlow.id] = activeFlow;
  }

  const updatedProducts = gatherCurrentProducts();

  const config = {
    ...currentConfig,
    products: updatedProducts,
    product_flows: updatedProductFlows
  };

  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    const data = await res.json();
    if (data.success) {
      currentConfig = data.config;
      renderProductFlowTabs(currentConfig.products || [], currentConfig.product_flows || {});
      renderSimulator();
      showToast('Product flows updated & saved!');
    }
  } catch (err) {
    showToast(`Failed to save: ${err.message}`);
  }
}

// --------------------------------------------------------------------------
// 4. STUDIO SETTINGS
// --------------------------------------------------------------------------
function initSettings() {
  const saveBtn = document.getElementById('saveSettingsBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
}

async function saveSettings() {
  const config = {
    ...currentConfig,
    studio_name: getVal('cfgStudioName'),
    studio_phone: getVal('cfgStudioPhone'),
    studio_address: getVal('cfgStudioAddress'),
    upi_id: getVal('cfgUpiId'),
    welcome_message: getVal('cfgWelcomeMessage'),
    prompt_name: getVal('cfgPromptName'),
    prompt_address: getVal('cfgPromptAddress'),
    order_confirmed_message: getVal('cfgOrderConfirmedMessage'),
    tracking_message: getVal('cfgTrackingMessage')
  };

  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config })
    });
    const data = await res.json();
    if (data.success) {
      currentConfig = data.config;
      showToast('Studio settings saved successfully!');
      renderSimulator();
    }
  } catch (err) {
    showToast(`Failed to save settings: ${err.message}`);
  }
}

// --------------------------------------------------------------------------
// 5. LIVE WHATSAPP PHONE SIMULATOR (SEE PRODUCTS LIVELY)
// --------------------------------------------------------------------------
function initSimulator() {
  const resetBtn = document.getElementById('resetSimulatorBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => renderSimulator());
}

function renderSimulator() {
  const chatBody = document.getElementById('simulatorChatBody');
  const simTitle = document.getElementById('simPhoneTitle');
  if (!chatBody) return;

  const studioName = currentConfig?.studio_name || "InstaPics Photobooks & Frames";
  if (simTitle) simTitle.textContent = studioName;

  const welcomeText = (currentConfig?.welcome_message || "Welcome to *InstaPics*! 📸✨\n\nWe craft premium Non-Tearable & Waterproof Photobooks with lifetime durability.\n\nChoose your package below:")
    .replace('{name}', 'Customer');

  const products = currentConfig?.products || [];

  const catalogBtnHtml = `
    <div class="phone-btn" onclick="simClickCatalog()" style="background: var(--navy-primary); color: #FFFFFF; font-weight: 500;">
      🛍️ View WhatsApp Catalogue
    </div>
  `;

  const buttonsHtml = products.slice(0, 5).map(p => `
    <div class="phone-btn" onclick="simClickProduct('${p.id}')">
      ${escapeHtml(p.title)} ${p.price ? `(${escapeHtml(p.price)})` : ''}
    </div>
  `).join('');

  chatBody.innerHTML = `
    <!-- User initial message -->
    <div class="phone-msg-bubble outgoing">
      Hi! I'd like to place an order.
    </div>

    <!-- Bot Welcome Bubble with Buttons -->
    <div class="phone-msg-bubble incoming">
      <div style="white-space: pre-line;">${escapeHtml(welcomeText)}</div>
      <div class="phone-buttons-group">
        ${catalogBtnHtml}
        ${buttonsHtml}
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
}

window.simClickCatalog = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const products = currentConfig?.products || [];
  const itemsHtml = products.map(p => `
    <div style="border-bottom: 1px solid var(--border-color); padding: 8px 0; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${escapeHtml(p.title)}</strong><br>
        <span style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(p.description || '')}</span>
      </div>
      <div style="font-weight: 600; font-size: 13px; color: var(--text-primary);">${escapeHtml(p.price || '')}</div>
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      🛍️ View WhatsApp Catalogue
    </div>
    <div class="phone-msg-bubble incoming">
      <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">📦 WhatsApp Business Catalogue</div>
      ${itemsHtml}
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);">Tap any product below to start booking:</div>
      <div class="phone-buttons-group" style="margin-top: 6px;">
        ${products.slice(0, 4).map(p => `<div class="phone-btn" onclick="simClickProduct('${p.id}')">${escapeHtml(p.title)}</div>`).join('')}
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simClickProduct = function(prodId) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || []).find(p => p.id === prodId) || { title: prodId };
  const flow = (currentConfig?.product_flows || {})[prodId] || {
    step1_prompt: "Please choose your size:",
    step1_options: [
      { text: "Option A" },
      { text: "Option B" }
    ],
    photo_prompt: "Please upload your photo:"
  };

  // Add outgoing click
  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Selected: ${escapeHtml(product.title)}
    </div>
  `;

  // Bot response with Step 1 Buttons
  const step1Buttons = (flow.step1_options || []).map(opt => `
    <div class="phone-btn" onclick="simClickStep1('${prodId}', '${escapeHtml(opt.text)}')">
      ${escapeHtml(opt.text)}
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble incoming">
      <strong>${escapeHtml(product.title)}</strong><br>
      <span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(flow.step1_prompt || 'Please choose an option:')}</span>
      <div class="phone-buttons-group">
        ${step1Buttons || `<div class="phone-btn" onclick="simClickStep1('${prodId}', 'Standard Size')">Standard Size</div>`}
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

let simCart = [];

function extractSimPrice(str) {
  if (!str) return 0;
  const match = str.match(/₹\s*([0-9,]+)/);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  const digits = str.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

window.simClickStep1 = function(prodId, step1Choice) {
  const chatBody = document.getElementById('simulatorChatBody');
  const flow = (currentConfig?.product_flows || {})[prodId] || {};
  const product = (currentConfig?.products || []).find(p => p.id === prodId) || { title: prodId };

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Selected: ${escapeHtml(step1Choice)}
    </div>
  `;

  if (flow.step2_options && flow.step2_options.length > 0) {
    const step2Buttons = flow.step2_options.map(opt => `
      <div class="phone-btn" onclick="simClickStep2('${prodId}', '${escapeHtml(step1Choice)}', '${escapeHtml(opt.text)}')">
        ${escapeHtml(opt.text)}
      </div>
    `).join('');

    chatBody.innerHTML += `
      <div class="phone-msg-bubble incoming">
        <span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(flow.step2_prompt || 'Choose Finish / Style:')}</span>
        <div class="phone-buttons-group">
          ${step2Buttons}
        </div>
      </div>
    `;
    chatBody.scrollTop = chatBody.scrollHeight;
  } else {
    const price = extractSimPrice(step1Choice) || extractSimPrice(product.price);
    simCart.push({
      productTitle: product.title,
      option: step1Choice,
      price: price
    });
    simShowCartReview();
  }
};

window.simClickStep2 = function(prodId, step1Choice, step2Choice) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || []).find(p => p.id === prodId) || { title: prodId };
  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Customization: ${escapeHtml(step2Choice)}
    </div>
  `;
  const price = extractSimPrice(step1Choice) || extractSimPrice(step2Choice) || extractSimPrice(product.price);
  simCart.push({
    productTitle: product.title,
    option: `${step1Choice} • ${step2Choice}`,
    price: price
  });
  simShowCartReview();
};

window.simShowCartReview = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const total = simCart.reduce((sum, i) => sum + (i.price || 0), 0);
  const itemsListHtml = simCart.map((item, idx) => `
    <div style="margin-bottom: 6px;">
      ${idx + 1}. <strong>${escapeHtml(item.productTitle)}</strong><br>
      <span style="font-size: 11px; color: var(--text-secondary);">&nbsp;&nbsp;• ${escapeHtml(item.option)}</span>
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble incoming">
      <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">🛒 Your InstaPics Cart:</div>
      ${itemsListHtml}
      <div style="border-top: 1px dashed var(--border-light); margin: 8px 0; padding-top: 6px; font-weight: 600; color: #16a34a;">
        💰 Cart Total: ₹${total.toLocaleString('en-IN')} (${simCart.length} item${simCart.length > 1 ? 's' : ''})
      </div>
      <div style="font-size: 12px; margin-bottom: 8px;">Would you like to add another item or proceed to order?</div>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simShowMoreProducts()">➕ Add Another Item</div>
        <div class="phone-btn" onclick="simShowPhotoStep()" style="background: var(--navy-dark); color: #fff; font-weight: 500;">📸 Upload Photos & Order</div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simShowMoreProducts = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const products = currentConfig?.products || [];
  const buttonsHtml = products.slice(0, 4).map(p => `
    <div class="phone-btn" onclick="simClickProduct('${p.id}')">
      ${escapeHtml(p.title)} ${p.price ? `(${escapeHtml(p.price)})` : ''}
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      ➕ Add Another Item
    </div>
    <div class="phone-msg-bubble incoming">
      ✨ <strong>Add Another Item to Your Order</strong> 🛍️<br><br>
      Select your next product from our collection below:
      <div class="phone-buttons-group">
        ${buttonsHtml}
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simShowPhotoStep = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const photoPrompt = "📸 *Step 1/3: Send Photos*\n\nPlease upload your photos directly here on WhatsApp, or send a *Google Drive / Google Photos / iCloud link* for high-resolution printing:";

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      📸 Upload Photos & Order
    </div>
    <div class="phone-msg-bubble incoming">
      <div style="white-space: pre-line;">${escapeHtml(photoPrompt)}</div>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simUploadPhoto('https://drive.google.com/drive/folders/sample-album')">
          📁 Share Google Drive Link
        </div>
        <div class="phone-btn" onclick="simUploadPhoto('Attached 60 Photos')">
          📷 Upload Photos Directly
        </div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simUploadPhoto = function(sampleLink) {
  const chatBody = document.getElementById('simulatorChatBody');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      <span>${sampleLink || '📁 Google Drive link shared'}</span>
    </div>

    <div class="phone-msg-bubble incoming">
      Photos received! ✨<br><br>
      <strong>Step 2/3: Customer Name</strong><br>
      What is your <strong>Full Name</strong>?
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendName()">Simulate Name: "Priya Sharma"</div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendName = function() {
  const chatBody = document.getElementById('simulatorChatBody');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Priya Sharma
    </div>

    <div class="phone-msg-bubble incoming">
      Thank you, Priya Sharma! 🏠<br><br>
      <strong>Step 3/3: Delivery Address</strong><br>
      Please share your <strong>Delivery Address with Pincode</strong> for courier shipping:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendAddress()">Simulate: "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040"</div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendAddress = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const total = simCart.reduce((sum, i) => sum + (i.price || 0), 0);

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040
    </div>

    <div class="phone-msg-bubble incoming">
      Order Total: <strong>₹${total.toLocaleString('en-IN')}</strong><br><br>
      Please choose your preferred <strong>Payment Method</strong>:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simFinishOrder('Instant UPI / Online QR')">📱 Instant UPI / QR</div>
        <div class="phone-btn" onclick="simFinishOrder('Pay on Pickup / Delivery')">💵 Pay on Pickup / Delivery</div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simFinishOrder = function(paymentType) {
  const chatBody = document.getElementById('simulatorChatBody');
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const total = simCart.reduce((sum, i) => sum + (i.price || 0), 0);
  const itemsSummary = simCart.map((i, idx) => `${idx + 1}. ${i.productTitle} (${i.option})`).join('<br>');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Payment Choice: ${paymentType}
    </div>

    <div class="phone-msg-bubble incoming">
      🎉 <strong>Order Booked Successfully!</strong><br><br>
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> Priya Sharma<br><br>
      <strong>Items Ordered:</strong><br>
      ${itemsSummary}<br><br>
      <strong>Total Amount:</strong> <span style="color:#16a34a; font-weight:600;">₹${total.toLocaleString('en-IN')}</span><br>
      <strong>Shipping to:</strong> Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040<br>
      <strong>Payment Mode:</strong> ${paymentType}<br><br>
      ${paymentType.includes('UPI') ? '<em>[UPI QR Code generated automatically for instant payment]</em><br><br>' : ''}
      Our design team has received your order and will share your photobook layout preview shortly! 📖✨
      <div class="phone-buttons-group">
        <div class="phone-btn">📦 Track Order Status</div>
        <div class="phone-btn">📞 Call Studio Support</div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

// --------------------------------------------------------------------------
// 6. WHATSAPP DEVICE MANAGER
// --------------------------------------------------------------------------
function initDeviceManager() {
  const restartBtn = document.getElementById('restartBotBtn');
  const pairingBtn = document.getElementById('requestPairingBtn');
  const testMenuBtn = document.getElementById('sendTestMenuBtn');
  const sendCustomerWelcomeBtn = document.getElementById('sendCustomerWelcomeBtn');

  if (sendCustomerWelcomeBtn) {
    sendCustomerWelcomeBtn.addEventListener('click', async () => {
      const phoneInput = document.getElementById('targetCustomerPhoneInput');
      const phone = phoneInput?.value.trim();
      if (!phone) {
        showToast('Please enter a WhatsApp phone number');
        return;
      }
      sendCustomerWelcomeBtn.disabled = true;
      sendCustomerWelcomeBtn.textContent = 'Sending...';
      try {
        const res = await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message);
          phoneInput.value = '';
        } else {
          showToast(`Error: ${data.error || 'Failed to send'}`);
        }
      } catch (err) {
        showToast(`Error: ${err.message}`);
      } finally {
        sendCustomerWelcomeBtn.disabled = false;
        sendCustomerWelcomeBtn.textContent = 'Send Welcome Message & Buttons';
      }
    });
  }

  if (testMenuBtn) {
    testMenuBtn.addEventListener('click', async () => {
      testMenuBtn.disabled = true;
      testMenuBtn.textContent = 'Sending...';
      try {
        const res = await fetch('/api/send-test-menu', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Interactive menu sent to your phone!');
        } else {
          showToast(`Error: ${data.error || 'Failed to send'}`);
        }
      } catch (err) {
        showToast(`Error: ${err.message}`);
      } finally {
        testMenuBtn.disabled = false;
        testMenuBtn.textContent = '📲 Test on My Phone';
      }
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/restart', { method: 'POST' });
        showToast('WhatsApp restart initiated...');
        setTimeout(fetchDeviceStatus, 2000);
      } catch (err) {
        showToast(`Error restarting: ${err.message}`);
      }
    });
  }

  if (pairingBtn) {
    pairingBtn.addEventListener('click', async () => {
      const phoneInput = document.getElementById('pairingPhoneInput');
      const phone = phoneInput?.value.trim();
      if (!phone) {
        alert('Please enter your WhatsApp phone number with country code (e.g. 919876543210)');
        return;
      }
      try {
        pairingBtn.disabled = true;
        pairingBtn.textContent = 'Requesting Code...';
        const res = await fetch('/api/pairing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.pairingCode) {
          document.getElementById('pairingCodeValue').textContent = data.pairingCode;
          document.getElementById('pairingCodeDisplay').classList.remove('hidden');
          showToast('Pairing code generated!');
        } else {
          alert(data.error || 'Failed to generate code');
        }
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        pairingBtn.disabled = false;
        pairingBtn.textContent = 'Generate 8-Digit Pairing Code';
      }
    });
  }
}

let lastDeviceState = { status: null, qrCodeDataUrl: null, phone: null };

async function fetchDeviceStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    // Avoid DOM thrashing and QR image flickering if state hasn't changed
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
      pill.className = 'device-pill connected';
      if (statusText) statusText.textContent = `Online (+${data.phone})`;
      if (qrContainer) qrContainer.classList.add('hidden');
      if (connectedBanner) {
        connectedBanner.classList.remove('hidden');
        if (phoneText) phoneText.textContent = `+${data.phone}`;
      }
    } else {
      pill.className = 'device-pill';
      if (connectedBanner) connectedBanner.classList.add('hidden');
      if (qrContainer) qrContainer.classList.remove('hidden');

      if (data.status === 'qr_ready' && data.qrCodeDataUrl) {
        if (statusText) statusText.textContent = 'Scan QR';
        qrContainer.innerHTML = `<img src="${data.qrCodeDataUrl}" class="qr-image" alt="WhatsApp QR Code" />`;
      } else if (data.status === 'connecting') {
        if (statusText) statusText.textContent = 'Connecting...';
        qrContainer.innerHTML = `<div class="qr-placeholder">Connecting to WhatsApp...</div>`;
      } else {
        if (statusText) statusText.textContent = 'Offline';
        qrContainer.innerHTML = `<div class="qr-placeholder">Waiting for QR Code...</div>`;
      }
    }

    if (data.pairingCode) {
      const codeVal = document.getElementById('pairingCodeValue');
      if (codeVal) codeVal.textContent = data.pairingCode;
      document.getElementById('pairingCodeDisplay')?.classList.remove('hidden');
    }
  } catch (err) {
    console.warn('Status poll error:', err);
  }
}

// --------------------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------------------
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
