// ============================================================
//  INDICART - Backend Server  (FIXED VERSION)
//  Stack: Node.js + Express + SQLite + bcryptjs + sessions
// ============================================================

const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ─── DATABASE SETUP ──────────────────────────────────────────
const db = new Database('./indicart.db');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    UNIQUE NOT NULL,
    password  TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cart (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    emoji      TEXT,
    price      INTEGER NOT NULL,
    qty        INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    name         TEXT    NOT NULL,
    phone        TEXT    NOT NULL,
    address      TEXT    NOT NULL,
    city         TEXT,
    pincode      TEXT,
    payment      TEXT    DEFAULT 'Cash on Delivery',
    total        INTEGER NOT NULL,
    status       TEXT    DEFAULT 'Placed',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    emoji      TEXT,
    price      INTEGER NOT NULL,
    qty        INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   TEXT    NOT NULL,
    product    TEXT    NOT NULL,
    reason     TEXT    NOT NULL,
    description TEXT,
    status     TEXT    DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS support_tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    status      TEXT    DEFAULT 'Open',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    UNIQUE(user_id, product_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

console.log('✅ Database initialized');

// ─── MIDDLEWARE ───────────────────────────────────────────────

// FIX 1: CORS must allow your frontend origin with credentials
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, same-origin)
    callback(null, true);
  },
  credentials: true  // CRITICAL: allows cookies/session to be sent
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FIX 2: Session config — sameSite must be 'lax' for cookies to work in browser
app.use(session({
  secret: 'indicart_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,       // set true only if using HTTPS
    httpOnly: true,
    sameSite: 'lax',     // FIX: was missing — needed for cookies to be sent
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));

// Serve all your HTML/CSS/JS files statically
app.use(express.static(path.join(__dirname, 'public')));

// ─── HELPERS ─────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please login first', notLoggedIn: true });
  }
  next();
}

// ─── DEBUG ROUTE (remove in production) ──────────────────────
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionId: req.sessionID,
    userId: req.session.userId || null,
    userName: req.session.userName || null
  });
});

// ─── AUTH ROUTES ─────────────────────────────────────────────

// Register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);

  req.session.userId = result.lastInsertRowid;
  req.session.userName = name;

  // FIX 3: Save session explicitly before responding
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Session error' });
    }
    res.json({ success: true, message: 'Account created!', name });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Fill all fields' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;

  // FIX 3: Save session explicitly before responding
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Session error' });
    }
    res.json({ success: true, message: 'Login successful!', name: user.name });
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    // Session points to deleted user — clean up
    req.session.destroy();
    return res.json({ loggedIn: false });
  }
  res.json({ loggedIn: true, user });
});

// ─── CART ROUTES ─────────────────────────────────────────────

// Get cart
app.get('/api/cart', requireLogin, (req, res) => {
  const items = db.prepare('SELECT * FROM cart WHERE user_id = ?').all(req.session.userId);
  res.json(items);
});

// Add to cart
app.post('/api/cart', requireLogin, (req, res) => {
  const { product_id, name, emoji, price } = req.body;
  const userId = req.session.userId;

  // FIX 4: Validate inputs
  if (!product_id || !name || price === undefined) {
    return res.status(400).json({ error: 'product_id, name, and price are required' });
  }

  const parsedPrice = parseInt(price, 10);
  if (isNaN(parsedPrice)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  const existing = db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?').get(userId, product_id);

  if (existing) {
    db.prepare('UPDATE cart SET qty = qty + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO cart (user_id, product_id, name, emoji, price, qty) VALUES (?, ?, ?, ?, ?, 1)')
      .run(userId, product_id, name, emoji || '', parsedPrice);
  }

  const items = db.prepare('SELECT * FROM cart WHERE user_id = ?').all(userId);
  res.json({ success: true, cart: items });
});

// Update quantity
app.put('/api/cart/:productId', requireLogin, (req, res) => {
  const { qty } = req.body;
  const userId = req.session.userId;
  const productId = req.params.productId;

  const parsedQty = parseInt(qty, 10);

  if (isNaN(parsedQty) || parsedQty <= 0) {
    db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(userId, productId);
  } else {
    db.prepare('UPDATE cart SET qty = ? WHERE user_id = ? AND product_id = ?').run(parsedQty, userId, productId);
  }

  const items = db.prepare('SELECT * FROM cart WHERE user_id = ?').all(userId);
  res.json({ success: true, cart: items });
});

// Remove from cart
app.delete('/api/cart/:productId', requireLogin, (req, res) => {
  db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?').run(req.session.userId, req.params.productId);
  const items = db.prepare('SELECT * FROM cart WHERE user_id = ?').all(req.session.userId);
  res.json({ success: true, cart: items });
});

// Clear cart
app.delete('/api/cart', requireLogin, (req, res) => {
  db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.session.userId);
  res.json({ success: true });
});

// ─── ORDER ROUTES ─────────────────────────────────────────────

// Place order
// FIX 5: Accept cart items from request body as FALLBACK
// if the DB cart is empty (handles frontend-managed cart scenarios)
app.post('/api/orders', requireLogin, (req, res) => {
  const { name, phone, address, city, pincode, payment, items: bodyItems } = req.body;
  const userId = req.session.userId;

  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Fill all delivery details' });
  }

  // Try DB cart first
  let items = db.prepare('SELECT * FROM cart WHERE user_id = ?').all(userId);

  // FIX 5: FALLBACK — if DB cart empty, use items sent in request body
  if ((!items || items.length === 0) && bodyItems && Array.isArray(bodyItems) && bodyItems.length > 0) {
    console.log(`⚠️  DB cart was empty for user ${userId}, using body items as fallback`);
    items = bodyItems.map(item => ({
      product_id: item.product_id || item.id,
      name: item.name,
      emoji: item.emoji || '',
      price: parseInt(item.price, 10),
      qty: parseInt(item.qty || item.quantity || 1, 10)
    }));
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please add items before placing an order.' });
  }

  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Use a transaction for safety
  const placeOrder = db.transaction(() => {
    const order = db.prepare(
      'INSERT INTO orders (user_id, name, phone, address, city, pincode, payment, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, name, phone, address, city || '', pincode || '', payment || 'Cash on Delivery', total);

    const orderId = order.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, name, emoji, price, qty) VALUES (?, ?, ?, ?, ?, ?)'
    );

    items.forEach(item => {
      insertItem.run(orderId, item.product_id, item.name, item.emoji || '', item.price, item.qty);
    });

    // Clear DB cart
    db.prepare('DELETE FROM cart WHERE user_id = ?').run(userId);

    return orderId;
  });

  try {
    const orderId = placeOrder();
    res.json({ success: true, orderId, message: 'Order placed successfully! 🎉' });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// Get user orders
app.get('/api/orders', requireLogin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);

  const full = orders.map(order => {
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items: orderItems };
  });

  res.json(full);
});

// Track order by ID
app.get('/api/orders/track/:orderId', (req, res) => {
  const order = db.prepare('SELECT id, status, created_at, name FROM orders WHERE id = ?').get(req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const statusMap = { 'Placed': 1, 'Shipped': 2, 'Out for Delivery': 3, 'Delivered': 4 };
  res.json({ ...order, step: statusMap[order.status] || 1 });
});

// ─── WISHLIST ROUTES ──────────────────────────────────────────

app.get('/api/wishlist', requireLogin, (req, res) => {
  const items = db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?').all(req.session.userId);
  res.json(items.map(i => i.product_id));
});

app.post('/api/wishlist/:productId', requireLogin, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.session.userId, req.params.productId);
    res.json({ success: true, added: true });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/wishlist/:productId', requireLogin, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.session.userId, req.params.productId);
  res.json({ success: true, removed: true });
});

// ─── RETURNS ROUTE ────────────────────────────────────────────

app.post('/api/returns', (req, res) => {
  const { order_id, product, reason, description } = req.body;

  if (!order_id || !product || !reason || reason === 'Select Reason') {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  db.prepare('INSERT INTO returns (order_id, product, reason, description) VALUES (?, ?, ?, ?)')
    .run(order_id, product, reason, description || '');

  res.json({ success: true, message: 'Return request submitted successfully ✅' });
});

// ─── SUPPORT ROUTE ────────────────────────────────────────────

app.post('/api/support', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.prepare('INSERT INTO support_tickets (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
  res.json({ success: true, message: 'Your message has been received! We will get back to you shortly.' });
});

// ─── 404 FALLBACK ─────────────────────────────────────────────
// Send index.html for any unknown routes (SPA support)
app.get('*splat', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 INDICART server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from /public folder`);
  console.log(`🗄️  Database: indicart.db\n`);
});