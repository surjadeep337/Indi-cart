// ============================================================
//  INDICART - Backend Server
//  Stack: Node.js + Express + PostgreSQL (pg) + bcryptjs + sessions
//  Compatible with: Vercel, Render, Railway, Supabase, Neon
// ============================================================
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── DATABASE SETUP ──────────────────────────────────────────
// Set DATABASE_URL in your environment variables.
// Example (Neon / Supabase / Railway):
//   DATABASE_URL=postgresql://user:password@host:5432/indicart?sslmode=require

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

// ─── CREATE TABLES ON STARTUP ────────────────────────────────
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       TEXT    NOT NULL,
        email      TEXT    UNIQUE NOT NULL,
        password   TEXT    NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cart (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        name       TEXT    NOT NULL,
        emoji      TEXT,
        price      INTEGER NOT NULL,
        qty        INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS orders (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       TEXT    NOT NULL,
        phone      TEXT    NOT NULL,
        address    TEXT    NOT NULL,
        city       TEXT,
        pincode    TEXT,
        payment    TEXT    DEFAULT 'Cash on Delivery',
        total      INTEGER NOT NULL,
        status     TEXT    DEFAULT 'Placed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id         SERIAL PRIMARY KEY,
        order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        name       TEXT    NOT NULL,
        emoji      TEXT,
        price      INTEGER NOT NULL,
        qty        INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS returns (
        id          SERIAL PRIMARY KEY,
        order_id    TEXT    NOT NULL,
        product     TEXT    NOT NULL,
        reason      TEXT    NOT NULL,
        description TEXT,
        status      TEXT    DEFAULT 'Pending',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL,
        message    TEXT NOT NULL,
        status     TEXT DEFAULT 'Open',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        UNIQUE(user_id, product_id)
      );
    `);
    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

initDB().catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions stored in PostgreSQL (works on Vercel/Render/Railway)
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,   // auto-creates the session table
  }),
  secret: process.env.SESSION_SECRET || 'indicart_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // true on HTTPS hosts
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));

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
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hash]
    );

    req.session.userId = result.rows[0].id;
    req.session.userName = name;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({ success: true, message: 'Account created!', name });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Fill all fields' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({ success: true, message: 'Login successful!', name: user.name });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
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
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];
    if (!user) {
      req.session.destroy();
      return res.json({ loggedIn: false });
    }
    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

// ─── CART ROUTES ─────────────────────────────────────────────

// Get cart
app.get('/api/cart', requireLogin, async (req, res) => {
  const result = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.userId]);
  res.json(result.rows);
});

// Add to cart
app.post('/api/cart', requireLogin, async (req, res) => {
  const { product_id, name, emoji, price } = req.body;
  const userId = req.session.userId;

  if (!product_id || !name || price === undefined) {
    return res.status(400).json({ error: 'product_id, name, and price are required' });
  }

  const parsedPrice = parseInt(price, 10);
  if (isNaN(parsedPrice)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );

    if (existing.rows.length > 0) {
      await pool.query('UPDATE cart SET qty = qty + 1 WHERE id = $1', [existing.rows[0].id]);
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, product_id, name, emoji, price, qty) VALUES ($1, $2, $3, $4, $5, 1)',
        [userId, product_id, name, emoji || '', parsedPrice]
      );
    }

    const items = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
    res.json({ success: true, cart: items.rows });
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Update quantity
app.put('/api/cart/:productId', requireLogin, async (req, res) => {
  const { qty } = req.body;
  const userId = req.session.userId;
  const productId = req.params.productId;
  const parsedQty = parseInt(qty, 10);

  try {
    if (isNaN(parsedQty) || parsedQty <= 0) {
      await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    } else {
      await pool.query(
        'UPDATE cart SET qty = $1 WHERE user_id = $2 AND product_id = $3',
        [parsedQty, userId, productId]
      );
    }
    const items = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
    res.json({ success: true, cart: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove from cart
app.delete('/api/cart/:productId', requireLogin, async (req, res) => {
  await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
    [req.session.userId, req.params.productId]);
  const items = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.session.userId]);
  res.json({ success: true, cart: items.rows });
});

// Clear cart
app.delete('/api/cart', requireLogin, async (req, res) => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [req.session.userId]);
  res.json({ success: true });
});

// ─── ORDER ROUTES ─────────────────────────────────────────────

// Place order
app.post('/api/orders', requireLogin, async (req, res) => {
  const { name, phone, address, city, pincode, payment, items: bodyItems } = req.body;
  const userId = req.session.userId;

  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Fill all delivery details' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Try DB cart first
    let itemsResult = await client.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
    let items = itemsResult.rows;

    // Fallback: use items from request body
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
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty. Please add items before placing an order.' });
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, name, phone, address, city, pincode, payment, total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [userId, name, phone, address, city || '', pincode || '', payment || 'Cash on Delivery', total]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, emoji, price, qty) VALUES ($1,$2,$3,$4,$5,$6)',
        [orderId, item.product_id, item.name, item.emoji || '', item.price, item.qty]
      );
    }

    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    res.json({ success: true, orderId, message: 'Order placed successfully! 🎉' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  } finally {
    client.release();
  }
});

// Get user orders
app.get('/api/orders', requireLogin, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.userId]
    );

    const full = await Promise.all(ordersResult.rows.map(async (order) => {
      const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items: itemsResult.rows };
    }));

    res.json(full);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Track order by ID
app.get('/api/orders/track/:orderId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, status, created_at, name FROM orders WHERE id = $1',
      [req.params.orderId]
    );
    const order = result.rows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const statusMap = { 'Placed': 1, 'Shipped': 2, 'Out for Delivery': 3, 'Delivered': 4 };
    res.json({ ...order, step: statusMap[order.status] || 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// ─── WISHLIST ROUTES ──────────────────────────────────────────

app.get('/api/wishlist', requireLogin, async (req, res) => {
  const result = await pool.query('SELECT product_id FROM wishlist WHERE user_id = $1', [req.session.userId]);
  res.json(result.rows.map(i => i.product_id));
});

app.post('/api/wishlist/:productId', requireLogin, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.session.userId, req.params.productId]
    );
    res.json({ success: true, added: true });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/wishlist/:productId', requireLogin, async (req, res) => {
  await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [req.session.userId, req.params.productId]);
  res.json({ success: true, removed: true });
});

// ─── RETURNS ROUTE ────────────────────────────────────────────

app.post('/api/returns', async (req, res) => {
  const { order_id, product, reason, description } = req.body;

  if (!order_id || !product || !reason || reason === 'Select Reason') {
    return res.status(400).json({ error: 'Please fill all required fields' });
  }

  try {
    await pool.query(
      'INSERT INTO returns (order_id, product, reason, description) VALUES ($1, $2, $3, $4)',
      [order_id, product, reason, description || '']
    );
    res.json({ success: true, message: 'Return request submitted successfully ✅' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit return' });
  }
});

// ─── SUPPORT ROUTE ────────────────────────────────────────────

app.post('/api/support', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    await pool.query(
      'INSERT INTO support_tickets (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );
    res.json({ success: true, message: 'Your message has been received! We will get back to you shortly.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit support ticket' });
  }
});

// ─── 404 FALLBACK ─────────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 INDICART server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from /public folder`);
  console.log(`🗄️  Database: PostgreSQL (${process.env.DATABASE_URL ? 'connected' : '⚠️  DATABASE_URL not set'})\n`);
});