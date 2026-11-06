// ==========================================================================
// INSTAPICS PHOTOBOOKS & FRAMES — ADMIN CONSOLE JAVASCRIPT ENGINE (v3.0)
// ==========================================================================

let currentConfig = null;
let currentOrders = [];
let statusPollInterval = null;
let activeProductFlowId = 'prod_photobook_a4';
let simCart = [];

// Self-invoking bootloader (immune to DOMContentLoaded race conditions)
function bootConsole() {
  console.log('[Console] Booting InstaPics Admin Console...');
  try { initTabs(); } catch (e) { console.error('initTabs:', e); }
  try { fetchOrders(); } catch (e) { console.error('fetchOrders:', e); }
  try { fetchConfig(); } catch (e) { console.error('fetchConfig:', e); }
  try { fetchDeviceStatus(); } catch (e) { console.error('fetchDeviceStatus:', e); }

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

  const activeContent = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);

  if (activeContent) activeContent.classList.add('active');
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'orders') fetchOrders();
  if (tabId === 'product-flows') fetchConfig();
  if (tabId === 'settings') fetchConfig();
  if (tabId === 'device') fetchDeviceStatus();
};

function initTabs() {
  const navBtns = document.querySelectorAll('.nav-tab');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.getAttribute('data-tab') || btn.id.replace('tabBtn-', '');
      if (target) window.switchTab(target);
    });
  });
}

// --------------------------------------------------------------------------
// 2. CONFIGURATION & PRODUCT FLOW EDITOR
// --------------------------------------------------------------------------
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    currentConfig = data.config || {};
    populateSettingsFields(currentConfig);
    renderProductFlowTabs(currentConfig.products || [], currentConfig.product_flows || {});
    renderSimulator();
  } catch (err) {
    console.error('[Config] Failed to load config:', err);
  }
}

function renderProductFlowTabs(products, productFlows) {
  const container = document.getElementById('productFlowTabs');
  if (!container) return;

  if (!products.some(p => p.id === activeProductFlowId) && products.length > 0) {
    activeProductFlowId = products[0].id;
  }

  container.innerHTML = products.map(p => `
    <button type="button" class="product-pill ${p.id === activeProductFlowId ? 'active' : ''}" onclick="selectProductFlow('${p.id}')">
      ${escapeHtml(p.title)}
    </button>
  `).join('');

  renderActiveProductFlow(activeProductFlowId, productFlows);
}

window.selectProductFlow = function(prodId) {
  activeProductFlowId = prodId;

  const pills = document.querySelectorAll('.product-pill');
  pills.forEach(p => {
    p.classList.toggle('active', p.textContent.includes(prodId) || p.getAttribute('onclick')?.includes(prodId));
  });

  const productFlows = currentConfig?.product_flows || {};
  renderActiveProductFlow(prodId, productFlows);
};

function renderActiveProductFlow(prodId, productFlows) {
  const flow = productFlows[prodId] || {
    id: prodId,
    title: prodId,
    description: "",
    price: "",
    step1_title: "Product Options",
    step1_prompt: "Please select an option:",
    step1_options: [],
    photo_prompt: "Please upload your photos:"
  };

  const product = (currentConfig?.products || []).find(p => p.id === prodId) || {};

  setElText('editorProductTitle', flow.title || product.title || prodId);
  setElText('editorProductId', prodId);

  setVal('flowTitleInput', product.title || flow.title || '');
  setVal('flowPriceInput', product.price || flow.price || '');
  setVal('flowDescInput', product.description || flow.description || '');

  setVal('flowStep1PromptInput', flow.step1_prompt || '');
  setVal('flowPhotoPromptInput', flow.photo_prompt || '');

  // Render options table rows
  const tbody = document.getElementById('optionsTableBody');
  if (tbody) {
    const options = flow.step1_options || [];
    if (options.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No options defined yet. Click '+ Add Option' above.</td></tr>`;
    } else {
      tbody.innerHTML = options.map((opt, idx) => `
        <tr class="option-row" data-index="${idx}">
          <td>
            <input type="text" class="text-input opt-text" value="${escapeHtml(opt.text)}" placeholder="e.g. 📘 40 Pgs (60 Photos) ₹1,750">
          </td>
          <td>
            <input type="number" class="text-input opt-price" value="${escapeHtml(opt.price || extractPrice(opt.text) || '')}" placeholder="₹ Price">
          </td>
          <td>
            <input type="text" class="text-input opt-id" value="${escapeHtml(opt.id || `${prodId}_opt_${idx + 1}`)}" placeholder="opt_id">
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-secondary btn-sm" style="color: #ef4444; padding: 4px 8px;" onclick="removeOptionRow(this)">&times;</button>
          </td>
        </tr>
      `).join('');
    }
  }
}

window.addOptionRow = function() {
  const tbody = document.getElementById('optionsTableBody');
  if (!tbody) return;

  const emptyState = tbody.querySelector('.empty-state');
  if (emptyState) emptyState.parentElement.remove();

  const count = tbody.querySelectorAll('.option-row').length + 1;
  const newRow = document.createElement('tr');
  newRow.className = 'option-row';
  newRow.innerHTML = `
    <td>
      <input type="text" class="text-input opt-text" value="Option ${count} ₹1,000" placeholder="Button text & price">
    </td>
    <td>
      <input type="number" class="text-input opt-price" value="1000" placeholder="1000">
    </td>
    <td>
      <input type="text" class="text-input opt-id" value="${activeProductFlowId}_opt_${count}" placeholder="id">
    </td>
    <td style="text-align: center;">
      <button type="button" class="btn btn-secondary btn-sm" style="color: #ef4444; padding: 4px 8px;" onclick="removeOptionRow(this)">&times;</button>
    </td>
  `;
  tbody.appendChild(newRow);
};

window.removeOptionRow = function(btn) {
  const row = btn.closest('.option-row');
  if (row) row.remove();
};

window.saveActiveProductFlow = async function() {
  if (!activeProductFlowId) return;

  const title = getVal('flowTitleInput');
  const price = getVal('flowPriceInput');
  const description = getVal('flowDescInput');
  const step1_prompt = getVal('flowStep1PromptInput');
  const photo_prompt = getVal('flowPhotoPromptInput');

  // Gather options
  const optionRows = document.querySelectorAll('#optionsTableBody .option-row');
  const step1_options = [];
  optionRows.forEach((row, i) => {
    const text = row.querySelector('.opt-text')?.value.trim();
    const optPriceRaw = row.querySelector('.opt-price')?.value.trim();
    const optPrice = parseInt(optPriceRaw, 10) || extractPrice(text) || 0;
    const optId = row.querySelector('.opt-id')?.value.trim() || `${activeProductFlowId}_opt_${i + 1}`;
    if (text) {
      step1_options.push({ id: optId, text, price: optPrice });
    }
  });

  const updatedFlow = {
    id: activeProductFlowId,
    title: title || activeProductFlowId,
    description: description,
    price: price,
    step1_title: title || "Product Options",
    step1_prompt: step1_prompt,
    step1_options: step1_options,
    photo_prompt: photo_prompt
  };

  const updatedFlows = { ...(currentConfig?.product_flows || {}) };
  updatedFlows[activeProductFlowId] = updatedFlow;

  // Update in products list
  const updatedProducts = (currentConfig?.products || []).map(p => {
    if (p.id === activeProductFlowId) {
      return { ...p, title, price, description };
    }
    return p;
  });

  const newConfig = {
    ...currentConfig,
    products: updatedProducts,
    product_flows: updatedFlows
  };

  try {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: newConfig })
    });
    const data = await res.json();
    if (data.success) {
      currentConfig = data.config;
      renderProductFlowTabs(currentConfig.products || [], currentConfig.product_flows || {});
      renderSimulator();
      showToast(`Flow for "${title || activeProductFlowId}" saved successfully!`);
    } else {
      showToast(`Error: ${data.error || 'Failed to save'}`);
    }
  } catch (err) {
    showToast(`Save error: ${err.message}`);
  }
};

window.addNewProductPrompt = function() {
  const name = prompt("Enter the new Product Title (e.g. 🎁 Magic Photo Mug):");
  if (!name || !name.trim()) return;

  const id = 'prod_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Math.floor(Math.random() * 1000);
  const price = prompt("Enter Starting Price (e.g. From ₹399):", "From ₹399") || "₹399";
  const desc = prompt("Enter short description:", "Custom printed with lifetime photo durability.") || "";

  const newProd = { id, title: name.trim(), price: price.trim(), description: desc.trim() };
  const newFlow = {
    id: id,
    title: name.trim(),
    price: price.trim(),
    description: desc.trim(),
    step1_title: name.trim(),
    step1_prompt: `Please select your preferred option for ${name.trim()}:`,
    step1_options: [
      { id: `${id}_opt1`, text: "Standard Size ₹399", price: 399 },
      { id: `${id}_opt2`, text: "Premium Size ₹599", price: 599 }
    ],
    photo_prompt: "📸 Please upload your photo for printing:"
  };

  const updatedProducts = [...(currentConfig?.products || []), newProd];
  const updatedFlows = { ...(currentConfig?.product_flows || {}), [id]: newFlow };

  const newConfig = { ...currentConfig, products: updatedProducts, product_flows: updatedFlows };

  fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: newConfig })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      currentConfig = data.config;
      activeProductFlowId = id;
      renderProductFlowTabs(currentConfig.products, currentConfig.product_flows);
      showToast(`Added product "${name}"!`);
    }
  })
  .catch(e => showToast(`Error: ${e.message}`));
};

window.deleteCurrentProduct = function() {
  if (!activeProductFlowId) return;
  if (!confirm(`Are you sure you want to delete product "${activeProductFlowId}"?`)) return;

  const updatedProducts = (currentConfig?.products || []).filter(p => p.id !== activeProductFlowId);
  const updatedFlows = { ...(currentConfig?.product_flows || {}) };
  delete updatedFlows[activeProductFlowId];

  const newConfig = { ...currentConfig, products: updatedProducts, product_flows: updatedFlows };

  fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: newConfig })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      currentConfig = data.config;
      activeProductFlowId = currentConfig.products[0]?.id || '';
      renderProductFlowTabs(currentConfig.products, currentConfig.product_flows);
      showToast('Product deleted!');
    }
  })
  .catch(e => showToast(`Delete failed: ${e.message}`));
};

window.testCurrentProductInSim = function() {
  restartSimulator();
  setTimeout(() => {
    simClickProduct(activeProductFlowId);
  }, 200);
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

  const welcomeText = (currentConfig?.welcome_message || "Welcome to *InstaPics*! 📸✨\n\nWe craft premium Non-Tearable & Waterproof Photobooks with lifetime durability.\n\nSwipe through our products below to choose your package:")
    .replace('{name}', 'Customer');

  const products = currentConfig?.products || [];

  const cardsHtml = products.slice(0, 4).map(p => `
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-top: 6px;">
      <div style="font-weight: 600; font-size: 13px; color: #09090b;">${escapeHtml(p.title)}</div>
      <div style="font-size: 11px; color: #64748b; margin: 2px 0 6px 0;">${escapeHtml(p.description || '')}</div>
      <div class="phone-btn" onclick="simClickProduct('${p.id}')" style="background: #0f172a; color: #fff; font-weight: 500;">
        Select: ${escapeHtml(p.title.split(' ')[1] || p.title)} (${escapeHtml(p.price || '')})
      </div>
    </div>
  `).join('');

  chatBody.innerHTML = `
    <div class="phone-msg-bubble outgoing">
      Hi! I want to order a photobook.
    </div>

    <div class="phone-msg-bubble incoming">
      <div style="white-space: pre-line;">${escapeHtml(welcomeText)}</div>
      <div style="margin-top: 6px; font-weight: 600; font-size: 11px; color: #475569;">◄ Swipe Cards / Choose Product ►</div>
      ${cardsHtml}
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
}

window.simClickProduct = function(prodId) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || []).find(p => p.id === prodId) || { title: prodId };
  const flow = (currentConfig?.product_flows || {})[prodId] || {
    step1_prompt: "Please choose your page count:",
    step1_options: [
      { text: "📘 40 Pages ₹1,750", price: 1750 },
      { text: "📘 60 Pages ₹2,150", price: 2150 }
    ]
  };

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Selected: ${escapeHtml(product.title)}
    </div>
  `;

  const options = flow.step1_options || [];
  const buttonsHtml = options.map(opt => `
    <div class="phone-btn" onclick="simChooseOption('${prodId}', '${escapeHtml(opt.text)}', ${opt.price || extractPrice(opt.text)})">
      ${escapeHtml(opt.text)}
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble incoming">
      <strong>Selected: ${escapeHtml(product.title)}</strong><br>
      <span style="font-size: 12px; color: #475569;">${escapeHtml(flow.step1_prompt || 'Please choose your package:')}</span>
      <div class="phone-buttons-group">
        ${buttonsHtml || `<div class="phone-btn" onclick="simChooseOption('${prodId}', 'Standard', 1500)">Standard Option ₹1,500</div>`}
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simChooseOption = function(prodId, optionText, price) {
  const chatBody = document.getElementById('simulatorChatBody');
  const product = (currentConfig?.products || []).find(p => p.id === prodId) || { title: prodId };

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Selected: ${escapeHtml(optionText)}
    </div>
  `;

  const cleanPrice = price || extractPrice(optionText) || 1500;
  simCart.push({
    productTitle: product.title,
    option: optionText,
    price: cleanPrice
  });

  const cartTotal = simCart.reduce((sum, item) => sum + (item.price || 0), 0);
  const cartLines = simCart.map((item, idx) => `
    <div style="margin-bottom: 6px;">
      ${idx + 1}. <strong>${escapeHtml(item.productTitle)}</strong><br>
      <span style="font-size: 11px; color: #64748b;">&nbsp;&nbsp;• ${escapeHtml(item.option)}</span>
    </div>
  `).join('');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble incoming">
      <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">🛒 Your InstaPics Cart:</div>
      ${cartLines}
      <div style="border-top: 1px dashed #cbd5e1; margin: 8px 0; padding-top: 6px; font-weight: 600; color: #16a34a;">
        💰 Cart Total: ₹${cartTotal.toLocaleString('en-IN')} (${simCart.length} item${simCart.length > 1 ? 's' : ''})
      </div>
      <div style="font-size: 11px; margin-bottom: 6px;">Would you like to add another item or proceed to order?</div>
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simAddAnotherItem()">➕ Add Another Item</div>
        <div class="phone-btn" onclick="simStartCheckout()" style="background: #0f172a; color: #fff; font-weight: 500;">📸 Upload Photos & Order</div>
      </div>
    </div>
  `;

  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simAddAnotherItem = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  const products = currentConfig?.products || [];

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      ➕ Add Another Item
    </div>
    <div class="phone-msg-bubble incoming">
      ✨ <strong>Add Another Item to Your Order</strong> 🛍️<br><br>
      Select your next product from our collection below:
      <div class="phone-buttons-group">
        ${products.slice(0, 4).map(p => `
          <div class="phone-btn" onclick="simClickProduct('${p.id}')">
            ${escapeHtml(p.title)} (${escapeHtml(p.price || '')})
          </div>
        `).join('')}
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simStartCheckout = function() {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      📸 Upload Photos & Order
    </div>
    <div class="phone-msg-bubble incoming">
      📸 <strong>Step 1/3: Send Photos</strong> ✨<br><br>
      Please upload your photos directly here on WhatsApp, or send a <strong>Google Drive / iCloud link</strong>:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendPhotos('https://drive.google.com/drive/folders/sample-photos')">📁 Share Google Drive Link</div>
        <div class="phone-btn" onclick="simSendPhotos('Uploaded 60 High-Res Photos.zip')">📷 Upload Photos Directly</div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendPhotos = function(link) {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      ${link}
    </div>
    <div class="phone-msg-bubble incoming">
      Photos received! ✨<br><br>
      <strong>Step 2/3: Customer Name</strong><br>
      What is your <strong>Full Name</strong>?
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendCustomerName('Priya Sharma')">Simulate: "Priya Sharma"</div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendCustomerName = function(name) {
  const chatBody = document.getElementById('simulatorChatBody');
  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      ${name}
    </div>
    <div class="phone-msg-bubble incoming">
      Thank you, ${name}! 🏠<br><br>
      <strong>Step 3/3: Delivery Address</strong><br>
      Please share your complete <strong>Delivery Address with Pincode</strong> for courier shipping:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simSendDeliveryAddress('Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040')">
          Simulate: "Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040"
        </div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simSendDeliveryAddress = function(addr) {
  const chatBody = document.getElementById('simulatorChatBody');
  const total = simCart.reduce((sum, item) => sum + (item.price || 0), 0);

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      ${addr}
    </div>
    <div class="phone-msg-bubble incoming">
      Order Total: <strong>₹${total.toLocaleString('en-IN')}</strong><br><br>
      Please choose your preferred <strong>Payment Method</strong>:
      <div class="phone-buttons-group">
        <div class="phone-btn" onclick="simCompleteOrder('Instant UPI / Online QR')">📱 Instant UPI / QR Code</div>
        <div class="phone-btn" onclick="simCompleteOrder('Pay on Pickup / Delivery')">💵 Pay on Pickup / Delivery</div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

window.simCompleteOrder = function(paymentType) {
  const chatBody = document.getElementById('simulatorChatBody');
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const total = simCart.reduce((sum, item) => sum + (item.price || 0), 0);
  const itemsText = simCart.map((i, idx) => `${idx + 1}. ${i.productTitle} (${i.option})`).join('<br>');

  chatBody.innerHTML += `
    <div class="phone-msg-bubble outgoing">
      Payment Choice: ${paymentType}
    </div>
    <div class="phone-msg-bubble incoming">
      🎉 <strong>Order Booked Successfully!</strong><br><br>
      <strong>Order ID:</strong> #${orderId}<br>
      <strong>Customer:</strong> Priya Sharma<br><br>
      <strong>Items Ordered:</strong><br>
      ${itemsText}<br><br>
      <strong>Total Order Value:</strong> <span style="color:#16a34a; font-weight:700;">₹${total.toLocaleString('en-IN')}</span><br>
      <strong>Delivery to:</strong> Flat 4B, Lotus Apartments, Anna Nagar, Chennai - 600040<br>
      <strong>Payment Mode:</strong> ${paymentType}<br><br>
      ${paymentType.includes('UPI') ? '<em>[Dynamic UPI QR Code generated for ₹' + total.toLocaleString('en-IN') + ']</em><br><br>' : ''}
      Our design team has received your order and will share your digital album preview shortly! 📖✨
      <div class="phone-buttons-group">
        <div class="phone-btn">📦 Track Order Status</div>
        <div class="phone-btn">📞 Call Studio Support</div>
      </div>
    </div>
  `;
  chatBody.scrollTop = chatBody.scrollHeight;
};

// --------------------------------------------------------------------------
// 4. ORDERS MANAGEMENT
// --------------------------------------------------------------------------
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
    console.error('[Orders] Load error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Error loading orders: ${err.message}</td></tr>`;
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No customer orders recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const photoCount = order.photos ? order.photos.length : 0;
    const formattedDate = new Date(order.created_at).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const photoCell = photoCount > 0
      ? `<span class="badge-amount" style="background:#e0f2fe; color:#0369a1;">📷 ${photoCount} Photo(s)</span>`
      : `<span style="color: var(--text-muted); font-size: 11px;">None / Link</span>`;

    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');

    return `
      <tr>
        <td>
          <div class="order-badge">#${escapeHtml(order.id)}</div>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">${formattedDate}</span>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(order.customer_name || 'Anonymous')}</div>
          <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: #0284c7; text-decoration: none;">
            +${escapeHtml(order.phone)} ↗
          </a>
        </td>
        <td>
          <div style="font-weight: 600; margin-bottom: 2px;">${escapeHtml(order.product_name)}</div>
          <div style="font-size: 12px; color: #475569; white-space: pre-line;">${escapeHtml(order.details || 'Standard')}</div>
        </td>
        <td>${photoCell}</td>
        <td style="max-width: 200px; font-size: 12px; color: var(--text-secondary);">
          ${escapeHtml(order.address || 'Pickup at Studio')}
        </td>
        <td>
          <div class="badge-amount">${order.amount ? `₹${Number(order.amount).toLocaleString('en-IN')}` : '₹0'}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${escapeHtml(order.payment_type || 'UPI')}</div>
        </td>
        <td>
          <select class="select-input" style="font-size: 11px; padding: 4px 6px;" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Designing" ${order.status === 'Designing' ? 'selected' : ''}>Designing Preview</option>
            <option value="Printing" ${order.status === 'Printing' ? 'selected' : ''}>Printing & Binding</option>
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

window.updateOrderStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notifyCustomer: false })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order #${id} status updated to ${newStatus}`);
    }
  } catch (err) {
    showToast(`Failed to update status: ${err.message}`);
  }
};

window.notifyOrderUpdate = async function(id, status) {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notifyCustomer: true })
    });
    const data = await res.json();
    if (data.notificationSent) {
      showToast(`WhatsApp status notification sent for #${id}!`);
    } else {
      showToast(`Status updated, but customer notification could not be delivered`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

// --------------------------------------------------------------------------
// 5. STUDIO SETTINGS
// --------------------------------------------------------------------------
function populateSettingsFields(cfg) {
  setVal('cfgStudioName', cfg.studio_name);
  setVal('cfgStudioPhone', cfg.studio_phone);
  setVal('cfgStudioAddress', cfg.studio_address);
  setVal('cfgUpiId', cfg.upi_id);
  setVal('cfgWelcomeMessage', cfg.welcome_message);
  setVal('cfgPromptName', cfg.prompt_name);
  setVal('cfgPromptAddress', cfg.prompt_address);
  setVal('cfgOrderConfirmedMessage', cfg.order_confirmed_message);
  setVal('cfgTrackingMessage', cfg.tracking_message);
}

window.saveSettings = async function() {
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
      renderSimulator();
      showToast('Studio settings saved successfully!');
    }
  } catch (err) {
    showToast(`Failed to save settings: ${err.message}`);
  }
};

// --------------------------------------------------------------------------
// 6. WHATSAPP DEVICE MANAGEMENT
// --------------------------------------------------------------------------
window.restartWhatsAppSocket = async function() {
  try {
    await fetch('/api/restart', { method: 'POST' });
    showToast('WhatsApp socket restart initiated...');
    setTimeout(fetchDeviceStatus, 2000);
  } catch (err) {
    showToast(`Error: ${err.message}`);
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
      document.getElementById('pairingCodeDisplay').classList.remove('hidden');
      showToast('Pairing code generated! Check your phone.');
    } else {
      alert(data.error || 'Failed to generate code');
    }
  } catch (err) {
    alert(`Pairing error: ${err.message}`);
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
      showToast(`Error: ${data.error || 'Failed to dispatch'}`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📲 Test on My Phone';
    }
  }
};

window.sendWelcomeToCustomPhone = async function() {
  const phone = getVal('targetCustomerPhoneInput');
  if (!phone) {
    alert('Please enter a WhatsApp number (e.g. 9629661668)');
    return;
  }
  try {
    showToast(`Sending welcome carousel to +${phone}...`);
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
      showToast(`Error: ${data.error || 'Failed to send'}`);
    }
  } catch (err) {
    showToast(`Error: ${err.message}`);
  }
};

let lastDeviceState = { status: null, qrCodeDataUrl: null, phone: null };

async function fetchDeviceStatus() {
  try {
    const res = await fetch('/api/status');
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
      if (statusText) statusText.textContent = `Online (+${data.phone})`;
      if (qrContainer) qrContainer.classList.add('hidden');
      if (connectedBanner) {
        connectedBanner.classList.remove('hidden');
        if (phoneText) phoneText.textContent = `+${data.phone}`;
      }
    } else {
      if (pill) pill.className = 'device-pill';
      if (connectedBanner) connectedBanner.classList.add('hidden');
      if (qrContainer) qrContainer.classList.remove('hidden');

      if (data.status === 'qr_ready' && data.qrCodeDataUrl) {
        if (statusText) statusText.textContent = 'Scan QR';
        qrContainer.innerHTML = `<img src="${data.qrCodeDataUrl}" class="qr-image" alt="WhatsApp QR Code" />`;
      } else if (data.status === 'connecting') {
        if (statusText) statusText.textContent = 'Connecting...';
        qrContainer.innerHTML = `<div class="field-hint">Connecting to WhatsApp...</div>`;
      } else {
        if (statusText) statusText.textContent = 'Offline';
        qrContainer.innerHTML = `<div class="field-hint">Waiting for QR Code...</div>`;
      }
    }

    if (data.pairingCode) {
      const codeVal = document.getElementById('pairingCodeValue');
      if (codeVal) codeVal.textContent = data.pairingCode;
      document.getElementById('pairingCodeDisplay')?.classList.remove('hidden');
    }
  } catch (err) {
    // Silent status poll catch
  }
}

// --------------------------------------------------------------------------
// 7. UTILITY HELPERS
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
  const match = String(str).match(/₹\s*([0-9,]+)/);
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
