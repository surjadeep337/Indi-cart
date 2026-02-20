// ==========================================
//   INDICART – app.js
// ==========================================

// ---------- PRODUCT DATA ----------
const PRODUCTS = [
  // ELECTRONICS
  { id: 1, name: "Redmi 13C 5G Smartphone", cat: "electronics", emoji: "📱", price: 8999, originalPrice: 14999, rating: 4.2, reviews: 2341, sale: true },
  { id: 2, name: "boAt Airdopes 141 TWS Earbuds", cat: "electronics", emoji: "🎧", price: 899, originalPrice: 2990, rating: 4.3, reviews: 54210, sale: true },
  { id: 3, name: "Mi Smart LED TV 32\"", cat: "electronics", emoji: "📺", price: 12999, originalPrice: 22999, rating: 4.1, reviews: 8765, sale: true },
  { id: 4, name: "HP Laptop 15s Intel Core i5", cat: "electronics", emoji: "💻", price: 41999, originalPrice: 59999, rating: 4.4, reviews: 3102, sale: false },
  { id: 5, name: "Canon DSLR EOS 1500D Camera", cat: "electronics", emoji: "📷", price: 29999, originalPrice: 44999, rating: 4.6, reviews: 1820, sale: true },
  { id: 6, name: "Syska Power Bank 20000mAh", cat: "electronics", emoji: "🔋", price: 699, originalPrice: 1999, rating: 4.0, reviews: 9001, sale: true },

  // FOOD
  { id: 7, name: "Aashirvaad Atta 10kg", cat: "food", emoji: "🌾", price: 329, originalPrice: 420, rating: 4.5, reviews: 12400, sale: false },
  { id: 8, name: "Tata Tea Gold 500g", cat: "food", emoji: "🍵", price: 179, originalPrice: 220, rating: 4.6, reviews: 34100, sale: true },
  { id: 9, name: "Amul Pure Ghee 1L", cat: "food", emoji: "🥛", price: 499, originalPrice: 620, rating: 4.7, reviews: 8700, sale: false },
  { id: 10, name: "Maggi 2-Minute Noodles Pack of 12", cat: "food", emoji: "🍜", price: 180, originalPrice: 240, rating: 4.3, reviews: 21000, sale: true },
  { id: 11, name: "Organic Basmati Rice 5kg", cat: "food", emoji: "🍚", price: 449, originalPrice: 650, rating: 4.4, reviews: 5620, sale: true },
  { id: 12, name: "Britannia Bourbon Biscuits Box", cat: "food", emoji: "🍪", price: 99, originalPrice: 130, rating: 4.2, reviews: 6700, sale: false },

  // MAKEOVER
  { id: 13, name: "Lakme 9 to 5 Primer + Matte Lipstick", cat: "makeover", emoji: "💄", price: 199, originalPrice: 450, rating: 4.3, reviews: 14300, sale: true },
  { id: 14, name: "Neutrogena Deep Clean Face Wash", cat: "makeover", emoji: "🧴", price: 249, originalPrice: 350, rating: 4.5, reviews: 8900, sale: false },
  { id: 15, name: "Maybelline Fit Me Foundation", cat: "makeover", emoji: "✨", price: 349, originalPrice: 599, rating: 4.1, reviews: 7200, sale: true },
  { id: 16, name: "Forest Essentials Face Serum", cat: "makeover", emoji: "🌿", price: 799, originalPrice: 1200, rating: 4.6, reviews: 3100, sale: false },
  { id: 17, name: "Biotique Sunscreen SPF 50", cat: "makeover", emoji: "☀️", price: 149, originalPrice: 250, rating: 4.2, reviews: 11500, sale: true },
  { id: 18, name: "L'Oreal Paris Hair Serum 80ml", cat: "makeover", emoji: "💆", price: 299, originalPrice: 499, rating: 4.4, reviews: 5400, sale: true },

  // MEN
  { id: 19, name: "Peter England Formal Shirt", cat: "men", emoji: "👔", price: 699, originalPrice: 1599, rating: 4.3, reviews: 6700, sale: true },
  { id: 20, name: "Levis 511 Slim Fit Jeans", cat: "men", emoji: "👖", price: 1499, originalPrice: 3499, rating: 4.5, reviews: 9800, sale: true },
  { id: 21, name: "Puma Sports Shoes Men", cat: "men", emoji: "👟", price: 1499, originalPrice: 3999, rating: 4.4, reviews: 4300, sale: false },
  { id: 22, name: "US POLO ASSN Polo T-Shirt", cat: "men", emoji: "👕", price: 549, originalPrice: 1299, rating: 4.2, reviews: 12200, sale: true },
  { id: 23, name: "Van Heusen Chino Trousers", cat: "men", emoji: "🩳", price: 899, originalPrice: 2199, rating: 4.1, reviews: 3400, sale: false },
  { id: 24, name: "Woodland Casual Shoes Men", cat: "men", emoji: "🥾", price: 1999, originalPrice: 4499, rating: 4.5, reviews: 7100, sale: true },

  // WOMEN
  { id: 25, name: "W Brand Ethnic Kurti", cat: "women", emoji: "👘", price: 499, originalPrice: 1299, rating: 4.4, reviews: 22000, sale: true },
  { id: 26, name: "Biba Anarkali Kurta Set", cat: "women", emoji: "👗", price: 799, originalPrice: 2499, rating: 4.5, reviews: 8300, sale: true },
  { id: 27, name: "Bata Casual Sandals Women", cat: "women", emoji: "👡", price: 699, originalPrice: 1499, rating: 4.3, reviews: 5600, sale: false },
  { id: 28, name: "Vero Moda Blazer Women", cat: "women", emoji: "🧥", price: 1299, originalPrice: 3499, rating: 4.2, reviews: 2100, sale: true },
  { id: 29, name: "ONLY Distressed Skinny Jeans", cat: "women", emoji: "👖", price: 999, originalPrice: 2999, rating: 4.4, reviews: 6700, sale: true },
  { id: 30, name: "Global Desi Printed Maxi Dress", cat: "women", emoji: "🌸", price: 649, originalPrice: 1799, rating: 4.3, reviews: 4900, sale: false },

  // MEDICINE
  { id: 31, name: "Dolo 650 Paracetamol Strip of 15", cat: "medicine", emoji: "💊", price: 19, originalPrice: 28, rating: 4.8, reviews: 120000, sale: false },
  { id: 32, name: "Himalaya Liv.52 Liver Care 100 Tab", cat: "medicine", emoji: "🌿", price: 149, originalPrice: 200, rating: 4.7, reviews: 31000, sale: true },
  { id: 33, name: "Wellman Multivitamin 30 Tablets", cat: "medicine", emoji: "💪", price: 399, originalPrice: 599, rating: 4.5, reviews: 8400, sale: false },
  { id: 34, name: "Volini Pain Relief Spray 100g", cat: "medicine", emoji: "🩹", price: 149, originalPrice: 250, rating: 4.3, reviews: 19400, sale: true },
  { id: 35, name: "Dabur Chyawanprash 1kg", cat: "medicine", emoji: "🫙", price: 299, originalPrice: 420, rating: 4.6, reviews: 43000, sale: false },
  { id: 36, name: "Revital H Woman 30 Capsules", cat: "medicine", emoji: "🌺", price: 349, originalPrice: 500, rating: 4.4, reviews: 12000, sale: true },
];

// ---------- STATE ----------
let cart   = JSON.parse(localStorage.getItem('indicart_cart'))   || [];
let wishlist = JSON.parse(localStorage.getItem('indicart_wish')) || [];
let currentCat  = 'all';
let currentSort = 'default';
let searchQuery = '';

// ---------- UTILS ----------
function saveCart()  { localStorage.setItem('indicart_cart', JSON.stringify(cart)); }
function saveWish()  { localStorage.setItem('indicart_wish', JSON.stringify(wishlist)); }

function formatPrice(p) { return '₹' + p.toLocaleString('en-IN'); }

function calcDiscount(original, current) {
  return Math.round(((original - current) / original) * 100);
}

function renderStars(r) {
  const full  = Math.floor(r);
  const half  = r % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
}

// ---------- RENDER PRODUCTS ----------
function getFilteredProducts() {
  let list = [...PRODUCTS];

  // category filter
  if (currentCat !== 'all') {
    list = list.filter(p => p.cat === currentCat);
  }

  // search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.cat.includes(q));
  }

  // sort
  switch (currentSort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'discount':
      list.sort((a, b) => calcDiscount(b.originalPrice, b.price) - calcDiscount(a.originalPrice, a.price));
      break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const noRes = document.getElementById('noResults');
  const title = document.getElementById('productsTitle');
  const list  = getFilteredProducts();

  // Update title
  const catLabels = {
    all: '🔥 Today\'s Best Deals',
    electronics: '📱 Electronics',
    food:        '🍛 Food & Grocery',
    makeover:    '💄 Make-Over',
    men:         '👔 Men\'s Fashion',
    women:       '👗 Women\'s Fashion',
    medicine:    '💊 Medicine',
  };
  title.textContent = catLabels[currentCat] || 'Products';

  if (list.length === 0) {
    grid.innerHTML = '';
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');

  grid.innerHTML = list.map(p => {
    const disc      = calcDiscount(p.originalPrice, p.price);
    const inWish    = wishlist.includes(p.id);
    const inCart    = cart.find(c => c.id === p.id);
    return `
    <div class="product-card" data-id="${p.id}">
      ${p.sale ? `<span class="product-badge">${disc}% OFF</span>` : ''}
      <button class="product-wishlist ${inWish ? 'active' : ''}" data-wish="${p.id}" title="Add to Wishlist">
        ${inWish ? '❤️' : '🤍'}
      </button>
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <span class="product-cat">${p.cat}</span>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          ${p.rating} (${p.reviews.toLocaleString()})
        </div>
        <div class="product-price">
          <span class="price-current">${formatPrice(p.price)}</span>
          <span class="price-original">${formatPrice(p.originalPrice)}</span>
          <span class="price-off">${disc}% off</span>
        </div>
        <button class="btn-add ${inCart ? 'added' : ''}" data-add="${p.id}">
          ${inCart ? '✓ Added' : '+ Add to Cart'}
        </button>
      </div>
    </div>`;
  }).join('');
}

// ---------- CART ----------
function updateCartUI() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartCount').textContent = count;

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty! Start shopping 🛍️</p>';
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)}</span>
        <div class="cart-item-qty">
          <button data-qty-dec="${item.id}">−</button>
          <span>${item.qty}</span>
          <button data-qty-inc="${item.id}">+</button>
        </div>
      </div>
      <button class="cart-remove" data-remove="${item.id}">🗑️</button>
    </div>
  `).join('');
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
  }
  saveCart();
  updateCartUI();
  renderProducts();
  showToast(`✅ "${product.name}" added to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  renderProducts();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  saveCart();
  updateCartUI();
}

// ---------- WISHLIST ----------
function toggleWishlist(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    showToast(`💔 Removed from wishlist`);
  } else {
    wishlist.push(id);
    showToast(`❤️ "${product.name}" added to wishlist!`);
  }
  document.getElementById('wishCount').textContent = wishlist.length;
  saveWish();
  renderProducts();
}

// ---------- HERO SLIDER ----------
let slideIndex = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots   = document.querySelectorAll('.dot');

function goToSlide(n) {
  slides[slideIndex].classList.remove('active');
  dots[slideIndex].classList.remove('active');
  slideIndex = (n + slides.length) % slides.length;
  slides[slideIndex].classList.add('active');
  dots[slideIndex].classList.add('active');
}

function autoSlide() {
  goToSlide(slideIndex + 1);
}

let sliderInterval = setInterval(autoSlide, 4000);

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    clearInterval(sliderInterval);
    goToSlide(i);
    sliderInterval = setInterval(autoSlide, 4000);
  });
});

// Hero CTA buttons
document.querySelectorAll('.btn-hero').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const cat = btn.dataset.cat;
    setCategory(cat);
  });
});

// ---------- CATEGORY FILTER ----------
function setCategory(cat) {
  currentCat = cat;
  // update active nav link
  document.querySelectorAll('.cat-link').forEach(l => {
    l.classList.toggle('active', l.dataset.cat === cat);
  });
  renderProducts();
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.cat-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const cat = link.dataset.cat;
    if (cat) setCategory(cat);
  });
});

document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    setCategory(card.dataset.cat);
  });
});

// ---------- SEARCH ----------
document.getElementById('searchBtn').addEventListener('click', () => {
  searchQuery = document.getElementById('searchInput').value;
  currentCat  = document.getElementById('searchCat').value;
  renderProducts();
  document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('searchInput').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('searchBtn').click();
  }
  // live search
  searchQuery = e.target.value;
  renderProducts();
});

// ---------- SORT ----------
document.getElementById('sortSelect').addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderProducts();
});

// ---------- CART OPEN/CLOSE ----------
document.getElementById('cartBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('cartSidebar').classList.remove('hidden');
  document.getElementById('cartOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

function closeCart() {
  document.getElementById('cartSidebar').classList.add('hidden');
  document.getElementById('cartOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('closeCart').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

// ---------- DELEGATED EVENTS on Products Grid ----------
document.getElementById('productsGrid').addEventListener('click', (e) => {
  const addBtn  = e.target.closest('[data-add]');
  const wishBtn = e.target.closest('[data-wish]');
  if (addBtn)  addToCart(+addBtn.dataset.add);
  if (wishBtn) toggleWishlist(+wishBtn.dataset.wish);
});

// Delegated events on Cart Items
document.getElementById('cartItems').addEventListener('click', (e) => {
  const removeBtn = e.target.closest('[data-remove]');
  const incBtn    = e.target.closest('[data-qty-inc]');
  const decBtn    = e.target.closest('[data-qty-dec]');
  if (removeBtn)  removeFromCart(+removeBtn.dataset.remove);
  if (incBtn)     changeQty(+incBtn.dataset.qtyInc, 1);
  if (decBtn)     changeQty(+decBtn.dataset.qtyDec, -1);
});

// ---------- INIT ----------
function init() {
  renderProducts();
  updateCartUI();
  document.getElementById('wishCount').textContent = wishlist.length;
}

init();