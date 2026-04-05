// ============================================================
//  INDICART — api.js  (include in every HTML page)
//  <script src="api.js"></script>  before </body>
// ============================================================
const BASE = '/api';

async function apiCall(method, endpoint, body) {
  const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(BASE + endpoint, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, data: { error: 'Server not reachable' } };
  }
}

const Auth = {
  register : (name, email, password) => apiCall('POST', '/register', { name, email, password }),
  login    : (email, password)        => apiCall('POST', '/login',    { email, password }),
  logout   : ()                       => apiCall('POST', '/logout'),
  me       : ()                       => apiCall('GET',  '/me')
};

const Cart = {
  get       : ()                  => apiCall('GET',    '/cart'),
  add       : (p)                 => apiCall('POST',   '/cart', { product_id: p.id, name: p.name, emoji: p.emoji || '', price: p.price }),
  updateQty : (productId, qty)    => apiCall('PUT',    `/cart/${productId}`, { qty }),
  remove    : (productId)         => apiCall('DELETE', `/cart/${productId}`),
  clear     : ()                  => apiCall('DELETE', '/cart')
};

const Orders = {
  place    : (details)  => apiCall('POST', '/orders',               details),
  myOrders : ()         => apiCall('GET',  '/orders'),
  track    : (orderId)  => apiCall('GET',  `/orders/track/${orderId}`)
};

const Wishlist = {
  get    : ()   => apiCall('GET',    '/wishlist'),
  add    : (id) => apiCall('POST',   `/wishlist/${id}`),
  remove : (id) => apiCall('DELETE', `/wishlist/${id}`)
};

const Returns = { submit: (d) => apiCall('POST', '/returns', d) };
const Support  = { submit: (d) => apiCall('POST', '/support', d) };