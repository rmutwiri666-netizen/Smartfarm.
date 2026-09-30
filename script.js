const ownerWhatsApp = '254706554354';
const storageKeys = {
  products: 'smartfarm-products-v1',
  orders: 'smartfarm-orders-v1',
  subscriptions: 'smartfarm-subscriptions-v1',
  transactions: 'smartfarm-transactions-v1'
};

const photos = {
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=850&q=80',
  avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=850&q=80',
  tomatoes: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=850&q=80',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=850&q=80',
  chicken: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=850&q=80',
  flowers: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=850&q=80',
  service: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=850&q=80'
};

const sampleProducts = [
  { id: 'sf-maize-001', name: 'Dry white maize', category: 'Cereals', location: 'Meru', seller: 'SmartFarm Wholesale', price: 5000, unit: 'per bag', quantity: 48, description: 'Clean, properly dried maize selected and stored with care. Available for collection in Meru.', image: photos.maize, own: true },
  { id: 'sf-avocado-002', name: 'Hass avocados', category: 'Fruits', location: 'Meru', seller: 'SmartFarm Wholesale', price: 1200, unit: 'per crate', quantity: 8, description: 'Fresh Hass avocados from our Meru orchard. Ask us about the current harvest and collection.', image: photos.avocado, own: true },
  { id: 'sf-tomato-003', name: 'Fresh garden tomatoes', category: 'Vegetables', location: 'Meru', seller: 'SmartFarm Wholesale', price: 1800, unit: 'per crate', quantity: 26, description: 'Firm, ripe tomatoes harvested for local markets. Wholesale quantities available.', image: photos.tomatoes, own: true },
  { id: 'sf-greens-004', name: 'Mixed leafy greens', category: 'Vegetables', location: 'Meru', seller: 'SmartFarm Wholesale', price: 300, unit: 'per bunch', quantity: 35, description: 'A fresh selection of seasonal leafy greens grown in Meru County.', image: photos.vegetables, own: true },
  { id: 'market-eggs-005', name: 'Free-range eggs', category: 'Livestock', location: 'Kiambu', seller: 'Highland Nest Farm', price: 550, unit: 'per tray', quantity: 22, description: 'Farm-fresh eggs from a small family poultry farm. Pickup can be arranged in Kiambu.', image: photos.chicken, own: false },
  { id: 'market-flowers-006', name: 'Seasonal cut flowers', category: 'Flowers', location: 'Nairobi', seller: 'Bloom Fields Kenya', price: 900, unit: 'per bunch', quantity: 15, description: 'Seasonal mixed flower bunches, freshly cut for local delivery in Nairobi.', image: photos.flowers, own: false },
  { id: 'market-ploughing-007', name: 'Land preparation service', category: 'Services', location: 'Nyeri', seller: 'Karanja Farm Services', price: 3500, unit: 'per service', quantity: 3, description: 'Smallholder land preparation and ploughing services. Contact to check dates and location.', image: photos.service, own: false }
];

const sampleOrders = [
  { id: 'SF-2409', buyer: 'Grace Wanjiku', product: 'Hass avocados · 2 crates', amount: 2400, date: '30 Sep 2026', status: 'Pending', delivery: 'Pickup · Meru' },
  { id: 'SF-2408', buyer: 'Peter Mwangi', product: 'Dry white maize · 5 bags', amount: 25000, date: '30 Sep 2026', status: 'Pending', delivery: 'Delivery · Meru' },
  { id: 'SF-2403', buyer: 'Amina Hassan', product: 'Garden tomatoes · 3 crates', amount: 5400, date: '28 Sep 2026', status: 'Confirmed', delivery: 'Pickup · Meru' },
  { id: 'SF-2391', buyer: 'Daniel Kariuki', product: 'Mixed leafy greens · 4 bunches', amount: 1200, date: '25 Sep 2026', status: 'Completed', delivery: 'Delivered · Meru' }
];

const sampleTransactions = [
  { id: 'tx-sale-001', type: 'sale', amount: 50000, note: 'Wholesale maize sales', date: '30 Sep 2026' },
  { id: 'tx-sale-002', type: 'sale', amount: 35000, note: 'Produce market sales', date: '30 Sep 2026' },
  { id: 'tx-expense-001', type: 'expense', amount: 18000, note: 'Seeds and farm inputs', date: '26 Sep 2026' },
  { id: 'tx-expense-002', type: 'expense', amount: 14400, note: 'Transport and labour', date: '21 Sep 2026' }
];

const plans = [
  { id: 'starter', name: 'Starter', description: 'A simple start for a growing farm.', monthly: 0, listings: '3 active listings', detail: 'Product listing and seller profile' },
  { id: 'grower', name: 'Grower', description: 'More room for your farm to grow.', monthly: 500, listings: '20 active listings', detail: 'Seller analytics and priority support', featured: true },
  { id: 'harvest', name: 'Harvest', description: 'For busy farms ready to scale.', monthly: 1200, listings: 'Unlimited listings', detail: 'Advanced analytics and featured slot' }
];

let products = sampleProducts;
let localProducts = [];
let orders = sampleOrders;
let subscriptionRequests = [];
let transactions = sampleTransactions;
let billingFrequency = 'monthly';
let toastTimer;
let previewImage = '';
let openedProductId = '';
let currentUser = null;
let sharedApiAvailable = false;
let authMode = 'login';

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function readDatabase(key, fallback) {
  const stored = await window.smartFarmDatabase.get(key);
  if (stored !== undefined) return stored;

  const legacyValue = readStored(key, null);
  const value = legacyValue ?? fallback;
  await window.smartFarmDatabase.put(key, value);
  return value;
}

async function saveStored(key, value) {
  try {
    await window.smartFarmDatabase.put(key, value);
    return true;
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      showToast('IndexedDB is unavailable; saved this data using browser storage instead.');
      return true;
    } catch {
      showToast('This browser could not save the demo data.');
      return false;
    }
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatCurrency(amount) {
  return `KSh ${Number(amount).toLocaleString('en-KE')}`;
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

async function requestApi(route, options = {}) {
  const response = await fetch(route, {
    credentials: 'same-origin',
    ...options,
    headers: { 'content-type': 'application/json', ...options.headers }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

function updateAccountUI() {
  const name = currentUser?.name || 'Guest visitor';
  document.querySelector('#account-name').textContent = name;
  document.querySelector('#account-email').textContent = currentUser?.email || 'Sign in to sell';
  document.querySelector('#account-avatar').textContent = currentUser
    ? name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'SF';
  const accountButton = document.querySelector('#account-button');
  accountButton.textContent = currentUser ? 'Account' : 'Sign in';
  accountButton.setAttribute('aria-label', currentUser ? `Account for ${name}` : 'Sign in or create a seller account');
  const sellerInput = document.querySelector('#advert-form [name="seller"]');
  sellerInput.value = currentUser?.name || '';
  sellerInput.readOnly = Boolean(currentUser);
  document.querySelector('#advert-form .form-foot p').textContent = currentUser
    ? 'Your listing will be shared with visitors of this SmartFarm marketplace.'
    : 'Sign in or create an account to publish this listing to the shared marketplace.';
  updateListingPreview();
}

function renderAccountDialog() {
  const signedIn = Boolean(currentUser);
  const registering = authMode === 'register';
  const nameField = document.querySelector('#auth-name-field');
  const nameInput = nameField.querySelector('input');
  document.querySelector('#account-dialog-title').textContent = signedIn ? 'Seller account' : registering ? 'Create seller account' : 'Sign in';
  document.querySelector('#auth-description').textContent = signedIn
    ? 'Your account publishes products to the shared SmartFarm marketplace.'
    : registering ? 'Create your account to publish products and manage your farm.' : 'Sign in to manage your farm and publish products to the shared marketplace.';
  document.querySelector('#auth-form').hidden = signedIn;
  document.querySelector('#auth-toggle').hidden = signedIn;
  document.querySelector('#account-signed-in').hidden = !signedIn;
  document.querySelector('#signed-in-email').textContent = currentUser?.email || '';
  nameField.hidden = !registering;
  nameInput.required = registering;
  document.querySelector('#auth-form [name="password"]').autocomplete = registering ? 'new-password' : 'current-password';
  document.querySelector('#auth-submit').textContent = registering ? 'Create account' : 'Sign in';
  document.querySelector('#auth-toggle').textContent = registering ? 'Already have an account? Sign in' : 'New to SmartFarm? Create an account';
}

function openAccountDialog(mode = 'login') {
  authMode = mode;
  renderAccountDialog();
  const dialog = document.querySelector('#account-dialog');
  if (!dialog.open) dialog.showModal();
}

async function importLegacyListings() {
  if (!currentUser) return;
  const marker = `smartfarm-listing-import-${currentUser.id}`;
  try {
    if (localStorage.getItem(marker)) return;
  } catch {
    return;
  }
  const oldListings = localProducts.filter((product) => product.id?.startsWith('seller-')
    && product.seller?.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
  if (!oldListings.length) return;
  for (const product of oldListings) {
    await requestApi('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        location: product.location,
        price: product.price,
        unit: product.unit,
        quantity: product.quantity,
        description: product.description,
        image: product.image
      })
    });
  }
  try {
    localStorage.setItem(marker, '1');
  } catch {
    showToast('Your existing listings were shared, but this browser could not save the import marker.');
  }
}

async function loadSharedProducts() {
  const result = await requestApi('/api/products');
  products = [...sampleProducts, ...result.products];
  renderMarketplace();
}

function switchView(name, updateHash = true) {
  const target = document.querySelector(`[data-view="${name}"]`);
  if (!target) return;
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view === target));
  document.querySelectorAll('[data-view-link]').forEach((link) => link.classList.toggle('active', link.dataset.viewLink === name));
  const label = document.querySelector(`[data-view-link="${name}"]`);
  document.querySelector('#page-crumb').textContent = label?.textContent.replace(/^\d+/, '').trim() || 'Overview';
  if (updateHash) history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function makeProductCard(product) {
  const sellerBadge = product.own ? 'platform' : '';
  const sellerName = escapeHTML(product.seller);
  return `<article class="product-card" data-product-id="${escapeHTML(product.id)}" tabindex="0" aria-label="View ${escapeHTML(product.name)} details">
    <div class="product-card-photo" style="background-image:url('${escapeHTML(product.image)}')"><span class="product-ribbon ${sellerBadge}">${product.own ? 'SMARTFARM WHOLESALE' : 'LOCAL SELLER'}</span><span class="product-open-mark" aria-hidden="true">&#8599;</span></div>
    <div class="product-card-content"><span class="product-card-category">${escapeHTML(product.category)}</span><h3 class="product-card-title">${escapeHTML(product.name)}</h3><p class="product-card-description">${escapeHTML(product.description)}</p><div class="product-card-bottom"><span class="product-card-price">${formatCurrency(product.price)} <small>${escapeHTML(product.unit)}</small></span><span class="product-card-location">${escapeHTML(product.location)}</span></div><div class="product-seller-line"><span class="seller-tiny-mark">${product.own ? 'SF' : 'F'}</span>${sellerName}<span class="seller-verified">&#10003; ${product.own ? 'Platform store' : 'Seller'}</span></div></div>
  </article>`;
}

function renderMarketplace() {
  const search = document.querySelector('#product-search').value.trim().toLowerCase();
  const category = document.querySelector('#category-filter').value;
  const location = document.querySelector('#location-filter').value;
  const filtered = products.filter((product) => {
    const searchable = `${product.name} ${product.category} ${product.location} ${product.seller} ${product.description}`.toLowerCase();
    return (!search || searchable.includes(search)) && (category === 'all' || product.category === category) && (location === 'all' || product.location.toLowerCase() === location.toLowerCase());
  });
  document.querySelector('#market-product-grid').innerHTML = filtered.map(makeProductCard).join('');
  document.querySelector('#results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`;
  document.querySelector('#empty-state').hidden = filtered.length > 0;
  document.querySelector('#market-product-grid').hidden = filtered.length === 0;
  const ownProducts = (currentUser ? products.filter((product) => product.ownerId === currentUser.id) : products.filter((product) => product.own)).slice(0, 3);
  document.querySelector('#overview-products').innerHTML = ownProducts.map((product) => `<article class="mini-product" data-product-id="${escapeHTML(product.id)}" tabindex="0"><div class="mini-product-photo" style="background-image:url('${escapeHTML(product.image)}')"></div><h3 class="mini-product-title">${escapeHTML(product.name)}</h3><div class="mini-product-meta"><strong>${formatCurrency(product.price)}</strong><span>${escapeHTML(product.location)}</span></div></article>`).join('');
  renderInventory();
}

function renderInventory() {
  const ownProducts = currentUser ? products.filter((product) => product.ownerId === currentUser.id) : [];
  document.querySelector('#active-product-count').textContent = ownProducts.length;
  document.querySelector('#farm-product-count').textContent = ownProducts.length;
  document.querySelector('#inventory-body').innerHTML = ownProducts.length ? ownProducts.map((product) => {
    const isLow = product.quantity <= 10;
    return `<tr><td><div class="inventory-product"><span class="inventory-thumb" style="background-image:url('${escapeHTML(product.image)}')"></span><span><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.seller)}</small></span></div></td><td>${escapeHTML(product.category)}</td><td class="${isLow ? 'stock-low' : ''}">${Number(product.quantity).toLocaleString('en-KE')} ${escapeHTML(product.unit.replace('per ', ''))}</td><td>${formatCurrency(product.price)} <span>/ ${escapeHTML(product.unit.replace('per ', ''))}</span></td><td><span class="stock-pill ${isLow ? 'low' : ''}">${isLow ? 'Low stock' : 'In stock'}</span></td></tr>`;
  }).join('') : `<tr><td colspan="5">${currentUser ? 'No listings yet. Add a product to get started.' : 'Sign in to view and manage your farm listings.'}</td></tr>`;
}

function renderFinances() {
  const sales = transactions.filter((item) => item.type === 'sale').reduce((total, item) => total + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount), 0);
  const profit = sales - expenses;
  const expenseRatio = sales ? Math.round((expenses / sales) * 100) : 0;
  document.querySelector('#sales-total').textContent = formatCurrency(sales);
  document.querySelector('#expenses-total').textContent = formatCurrency(expenses);
  document.querySelector('#profit-total').textContent = formatCurrency(profit);
  document.querySelector('#expense-record-count').textContent = `${transactions.filter((item) => item.type === 'expense').length} records`;
  document.querySelector('#expense-ratio').textContent = `${expenseRatio}% of sales revenue`;
  document.querySelector('#expense-progress').style.width = `${Math.min(expenseRatio, 100)}%`;
  document.querySelector('#transaction-list').innerHTML = [...transactions].slice(0, 5).map((item) => `<div class="transaction-row"><span class="transaction-marker ${item.type}">${item.type === 'sale' ? '+' : '−'}</span><span class="transaction-description"><strong>${escapeHTML(item.note)}</strong><small>${item.type === 'sale' ? 'Sale' : 'Expense'} · ${escapeHTML(item.date)}</small></span><strong class="transaction-amount ${item.type}">${item.type === 'sale' ? '+' : '−'}${formatCurrency(item.amount)}</strong></div>`).join('');
}

function openProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  openedProductId = productId;
  document.querySelector('#dialog-image').style.backgroundImage = `url('${product.image}')`;
  document.querySelector('#dialog-category').textContent = product.category;
  document.querySelector('#dialog-title').textContent = product.name;
  document.querySelector('#dialog-description').textContent = product.description;
  document.querySelector('#dialog-seller').textContent = product.seller;
  document.querySelector('#dialog-location').textContent = `${product.location}, Kenya`;
  document.querySelector('#dialog-stock').textContent = `${Number(product.quantity).toLocaleString('en-KE')} ${product.unit.replace('per ', '')} available`;
  document.querySelector('#dialog-price').innerHTML = `${formatCurrency(product.price)} <span>${escapeHTML(product.unit)}</span>`;
  const message = `Hello SmartFarm, I am interested in ${product.name} from ${product.seller} in ${product.location}. Is it available?`;
  document.querySelector('#dialog-whatsapp').href = `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(message)}`;
  const dialog = document.querySelector('#product-dialog');
  if (!dialog.open) dialog.showModal();
  history.replaceState(null, '', `#product/${encodeURIComponent(productId)}`);
}

function handleLocation() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash.startsWith('product/')) {
    switchView('marketplace', false);
    openProduct(hash.slice('product/'.length));
  } else if (document.querySelector(`[data-view="${hash}"]`)) {
    switchView(hash, false);
  }
}

function renderOrders() {
  const filter = document.querySelector('#order-filter').value;
  const visibleOrders = orders.filter((order) => filter === 'all' || order.status === filter);
  const list = document.querySelector('#order-list');
  if (!visibleOrders.length) {
    list.innerHTML = '<div class="order-empty">No orders in this category.</div>';
    return;
  }
  list.innerHTML = visibleOrders.map((order) => {
    const nextAction = order.status === 'Pending' ? 'Confirm' : order.status === 'Confirmed' ? 'Complete' : '';
    const action = nextAction ? `<button class="order-action" type="button" data-order-action="${escapeHTML(order.id)}">${nextAction}</button>` : '<span></span>';
    return `<article class="order-row"><div class="order-buyer"><strong>${escapeHTML(order.buyer)}</strong><small>${escapeHTML(order.delivery)}</small></div><div class="order-number"><strong>#${escapeHTML(order.id)}</strong><small>${escapeHTML(order.date)}</small></div><div class="order-product">${escapeHTML(order.product)}</div><div class="order-price">${formatCurrency(order.amount)}</div><span class="order-state ${order.status.toLowerCase()}">${escapeHTML(order.status)}</span>${action}</article>`;
  }).join('');
}

async function updateOrder(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;
  order.status = order.status === 'Pending' ? 'Confirmed' : order.status === 'Confirmed' ? 'Completed' : order.status;
  await saveStored(storageKeys.orders, orders);
  renderOrders();
  showToast(`Order #${order.id} marked ${order.status.toLowerCase()} in this demo.`);
}

function annualPrice(monthlyPrice) {
  return Math.round(monthlyPrice * 12 * .85);
}

function renderPlans() {
  const annual = billingFrequency === 'annual';
  document.querySelector('#plan-grid').innerHTML = plans.map((plan) => {
    const price = annual ? annualPrice(plan.monthly) : plan.monthly;
    const interval = annual ? '/ year' : '/ month';
    const note = annual && plan.monthly ? `Normally ${formatCurrency(plan.monthly * 12)} billed monthly` : annual ? 'Free plan' : 'Billed monthly';
    return `<article class="plan-card ${plan.featured ? 'featured' : ''}">${plan.featured ? '<span class="plan-ribbon">MOST POPULAR</span>' : ''}<h3 class="plan-name">${plan.name}</h3><p class="plan-description">${plan.description}</p><div class="plan-price">${formatCurrency(price)}<span> ${interval}</span></div><div class="plan-annual-note">${note}</div><div class="plan-divider"></div><div class="plan-limit">${plan.listings}</div><div class="plan-limit">${plan.detail}</div><button class="button ${plan.featured ? 'button-dark' : 'button-outline'}" type="button" data-subscribe="${plan.id}">${plan.monthly === 0 ? 'Choose Starter' : 'Request this plan'} <span aria-hidden="true">&#8594;</span></button></article>`;
  }).join('') + '<p class="price-disclaimer">Illustrative prices for this demo. Confirm plan pricing and seller terms before launch.</p>';
}

function renderSubscriptionActivity() {
  const container = document.querySelector('#subscription-activity');
  if (!subscriptionRequests.length) {
    container.innerHTML = '<p class="history-empty">No subscription requests yet.</p>';
    return;
  }
  container.innerHTML = subscriptionRequests.map((request) => `<div class="history-row"><div><strong>${escapeHTML(request.plan)} plan · ${escapeHTML(request.period)}</strong><small>${escapeHTML(request.date)} · ${formatCurrency(request.amount)}</small></div><span class="history-pending">PAYMENT SETUP NEEDED</span></div>`).join('');
}

async function requestSubscription(planId) {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) return;
  if (plan.monthly === 0) {
    showToast('Starter is free in this demo. Live seller registration is not connected.');
    return;
  }
  const annual = billingFrequency === 'annual';
  const request = {
    id: `request-${Date.now()}`,
    plan: plan.name,
    period: annual ? 'Annual' : 'Monthly',
    amount: annual ? annualPrice(plan.monthly) : plan.monthly,
    date: new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'Payment setup needed'
  };
  subscriptionRequests.unshift(request);
  await saveStored(storageKeys.subscriptions, subscriptionRequests);
  renderSubscriptionActivity();
  showToast('Request saved locally. No payment was started or collected.');
}

function bindEvents() {
  document.querySelector('#account-button').addEventListener('click', () => openAccountDialog());
  document.querySelector('#account-close').addEventListener('click', () => document.querySelector('#account-dialog').close());
  document.querySelector('#auth-form').addEventListener('submit', submitAuth);
  document.querySelector('#auth-toggle').addEventListener('click', () => {
    authMode = authMode === 'register' ? 'login' : 'register';
    renderAccountDialog();
  });
  document.querySelector('#sign-out-button').addEventListener('click', signOut);

  document.querySelectorAll('[data-view-link], [data-open-view]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      switchView(element.dataset.viewLink || element.dataset.openView);
    });
  });

  document.querySelectorAll('[data-filter-seller]').forEach((button) => {
    button.addEventListener('click', () => {
      switchView('marketplace');
      document.querySelector('#product-search').value = button.dataset.filterSeller;
      renderMarketplace();
    });
  });

  ['product-search', 'category-filter', 'location-filter'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener(id === 'product-search' ? 'input' : 'change', renderMarketplace);
  });

  document.addEventListener('click', (event) => {
    const card = event.target.closest('[data-product-id]');
    if (card) openProduct(card.dataset.productId);
    const orderButton = event.target.closest('[data-order-action]');
    if (orderButton) updateOrder(orderButton.dataset.orderAction);
    const planButton = event.target.closest('[data-subscribe]');
    if (planButton) requestSubscription(planButton.dataset.subscribe);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.product-card, .mini-product')) {
      event.preventDefault();
      openProduct(event.target.dataset.productId);
    }
  });

  document.querySelector('#order-filter').addEventListener('change', renderOrders);
  document.querySelector('#transaction-form').addEventListener('submit', addTransaction);
  document.querySelectorAll('[data-billing]').forEach((button) => button.addEventListener('click', () => {
    billingFrequency = button.dataset.billing;
    document.querySelectorAll('[data-billing]').forEach((choice) => {
      const isSelected = choice === button;
      choice.classList.toggle('active', isSelected);
      choice.setAttribute('aria-pressed', String(isSelected));
    });
    renderPlans();
  }));

  document.querySelector('#advert-form').addEventListener('input', updateListingPreview);
  document.querySelector('#advert-form').addEventListener('change', updateListingPreview);
  document.querySelector('#advert-form').addEventListener('submit', addProduct);

  document.querySelector('#product-dialog').querySelector('.dialog-close').addEventListener('click', () => document.querySelector('#product-dialog').close());
  document.querySelector('#copy-product-link').addEventListener('click', copyProductLink);
  document.querySelector('#product-dialog').addEventListener('close', () => {
    if (window.location.hash.startsWith('#product/')) history.replaceState(null, '', '#marketplace');
  });
  document.querySelector('#notifications-button').addEventListener('click', () => switchView('orders'));
  window.addEventListener('hashchange', handleLocation);
}

async function submitAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const registering = authMode === 'register';
  const body = {
    email: form.get('email').trim(),
    password: form.get('password')
  };
  if (registering) body.name = form.get('name').trim();
  try {
    const result = await requestApi(registering ? '/api/register' : '/api/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    currentUser = result.user;
    sharedApiAvailable = true;
    updateAccountUI();
    renderAccountDialog();
    document.querySelector('#account-dialog').close();
    try {
      await importLegacyListings();
      await loadSharedProducts();
    } catch (error) {
      showToast(error.message);
    }
    showToast(registering ? 'Account created. Your farm is ready to publish.' : 'You are signed in.');
  } catch (error) {
    showToast(error.message);
  }
}

async function signOut() {
  try {
    await requestApi('/api/logout', { method: 'POST' });
    currentUser = null;
    updateAccountUI();
    renderAccountDialog();
    document.querySelector('#account-dialog').close();
    renderMarketplace();
    showToast('You are signed out. Marketplace listings remain public.');
  } catch (error) {
    showToast(error.message);
  }
}

async function addTransaction(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const amount = Number(data.get('amount'));
  const note = data.get('note').trim();
  if (!Number.isFinite(amount) || amount <= 0 || !note) {
    showToast('Enter a valid amount and transaction description.');
    return;
  }
  transactions.unshift({
    id: `tx-${Date.now()}`,
    type: data.get('type'),
    amount,
    note,
    date: new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  });
  await saveStored(storageKeys.transactions, transactions);
  renderFinances();
  form.reset();
  showToast('Record added. Farm totals have been recalculated.');
}

async function copyProductLink() {
  const product = products.find((item) => item.id === openedProductId);
  if (!product) return;
  const productUrl = `${window.location.href.split('#')[0]}#product/${encodeURIComponent(product.id)}`;
  try {
    await navigator.clipboard.writeText(productUrl);
    showToast('Product link copied. It will be public after this site is hosted and the listing is online.');
  } catch {
    showToast(`Copy was blocked. Product URL: ${productUrl}`);
  }
}

function updateListingPreview() {
  const form = document.querySelector('#advert-form');
  const data = new FormData(form);
  const name = data.get('name').trim();
  const category = data.get('category');
  const location = data.get('location').trim();
  const price = data.get('price');
  const unit = data.get('unit');
  const seller = data.get('seller').trim();
  document.querySelector('#preview-name').textContent = name || 'Your product name';
  document.querySelector('#preview-category').textContent = category || 'YOUR CATEGORY';
  document.querySelector('#preview-location').textContent = location ? `${location}, Kenya` : 'Your location, Kenya';
  document.querySelector('#preview-price').innerHTML = `${formatCurrency(price || 0)} <span>${escapeHTML(unit || 'per unit')}</span>`;
  document.querySelector('#preview-seller').textContent = seller || 'Your farm';
}

async function addProduct(event) {
  event.preventDefault();
  if (!currentUser) {
    showToast('Create an account or sign in to publish a listing.');
    openAccountDialog('register');
    return;
  }
  if (!sharedApiAvailable) {
    showToast('The shared marketplace server is unavailable. Try again when it is online.');
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  const product = {
    name: data.get('name').trim(),
    category: data.get('category'),
    location: data.get('location').trim(),
    price: Number(data.get('price')),
    unit: data.get('unit'),
    quantity: Number(data.get('quantity')),
    description: data.get('description').trim() || 'Fresh farm listing. Contact SmartFarm to ask about availability.',
    image: previewImage || photos.vegetables
  };
  if (!Number.isFinite(product.price) || product.price <= 0 || !Number.isInteger(product.quantity) || product.quantity < 1) {
    showToast('Enter a valid price and available quantity.');
    return;
  }
  try {
    await requestApi('/api/products', { method: 'POST', body: JSON.stringify(product) });
    await loadSharedProducts();
    form.reset();
    previewImage = '';
    document.querySelector('.preview-photo').style.backgroundImage = '';
    updateAccountUI();
    switchView('marketplace');
    showToast('Your listing is live in the shared marketplace.');
  } catch (error) {
    showToast(error.message);
  }
}

function setupPhotoUpload() {
  const input = document.querySelector('#product-photo');
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      showToast('Choose an image file for your product photo.');
      return;
    }
    if (file.size > 1_500_000) {
      input.value = '';
      showToast('Choose a photo smaller than 1.5 MB for this demo.');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      previewImage = String(reader.result);
      document.querySelector('.preview-photo').style.backgroundImage = `url('${previewImage}')`;
    });
    reader.readAsDataURL(file);
  });
}

async function init() {
  try {
    [localProducts, orders, subscriptionRequests, transactions] = await Promise.all([
      readDatabase(storageKeys.products, sampleProducts),
      readDatabase(storageKeys.orders, sampleOrders),
      readDatabase(storageKeys.subscriptions, []),
      readDatabase(storageKeys.transactions, sampleTransactions)
    ]);
  } catch {
    localProducts = readStored(storageKeys.products, sampleProducts);
    orders = readStored(storageKeys.orders, sampleOrders);
    subscriptionRequests = readStored(storageKeys.subscriptions, []);
    transactions = readStored(storageKeys.transactions, sampleTransactions);
    showToast('Using browser storage because IndexedDB could not be opened.');
  }

  try {
    const [session] = await Promise.all([requestApi('/api/session')]);
    currentUser = session.user;
    await loadSharedProducts();
    sharedApiAvailable = true;
    if (currentUser) {
      await importLegacyListings();
      await loadSharedProducts();
    }
  } catch {
    currentUser = null;
    products = sampleProducts;
    showToast('Shared accounts need the SmartFarm server. Start it with npm start.');
  }

  updateAccountUI();
  renderMarketplace();
  renderOrders();
  renderPlans();
  renderSubscriptionActivity();
  renderFinances();
  bindEvents();
  setupPhotoUpload();
  handleLocation();
  if (sharedApiAvailable) window.setInterval(() => loadSharedProducts().catch(() => {}), 15000);
}

init();