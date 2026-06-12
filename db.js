const mysql = require('mysql2/promise');

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    login: row.login,
    email: row.email,
    password: row.password,
    phone: row.phone || '',
    is_admin: !!row.is_admin,
    bonus_points: Number(row.bonus_points || 0),
    club_member: !!row.club_member,
    club_card_number: row.club_card_number || '',
    avatar: row.avatar || '',
  };
}

function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : null,
    discount: row.discount != null ? Number(row.discount) : null,
    image: row.image || '',
    images: parseJson(row.images, []),
    badge: row.badge,
    category: row.category,
    colors: parseJson(row.colors, []),
    sizes: parseJson(row.sizes, []),
    description: row.description || '',
    rating: row.rating != null ? Number(row.rating) : null,
    reviewsCount: row.reviews_count != null ? Number(row.reviews_count) : null,
    inStock: !!row.in_stock,
  };
}

function rowToOrder(row) {
  if (!row) return null;
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at || '');
  return {
    id: row.id,
    type: row.type || undefined,
    createdAt,
    status: row.status,
    userEmail: row.user_email,
    customer: parseJson(row.customer, {}),
    delivery: parseJson(row.delivery, {}),
    totals: parseJson(row.totals, {}),
    payment: parseJson(row.payment, {}),
    items: parseJson(row.items, []),
    loyaltyApplied: !!row.loyalty_applied,
  };
}

function rowToPending(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    flow: row.flow || 'register',
    codeHash: row.code_hash,
    expiresAt: Number(row.expires_at),
    resendAvailableAt: Number(row.resend_available_at),
    createdAt: row.created_at,
    attemptsLeft: Number(row.attempts_left),
    payload: parseJson(row.payload, null),
  };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'riffkey',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
});

async function ping() {
  const conn = await pool.getConnection();
  conn.release();
}

// ===== Users =====

async function findUserByLoginOrEmail(identifier) {
  const login = String(identifier || '').trim().toLowerCase();
  const email = login;
  if (!login) return null;
  const [rows] = await pool.query(
    `SELECT * FROM users
     WHERE LOWER(login) = ? OR LOWER(email) = ?
     LIMIT 1`,
    [login, email]
  );
  return rowToUser(rows[0]);
}

async function findUserByEmail(email) {
  return findUserByLoginOrEmail(email);
}

async function userExistsByLogin(login) {
  const [rows] = await pool.query(
    'SELECT 1 FROM users WHERE LOWER(login) = ? LIMIT 1',
    [String(login || '').trim().toLowerCase()]
  );
  return rows.length > 0;
}

async function userExistsByEmail(email) {
  const [rows] = await pool.query(
    'SELECT 1 FROM users WHERE LOWER(email) = ? LIMIT 1',
    [String(email || '').trim().toLowerCase()]
  );
  return rows.length > 0;
}

async function createUser(user) {
  const [result] = await pool.query(
    `INSERT INTO users (
      full_name, login, email, password, phone, is_admin,
      bonus_points, club_member, club_card_number, avatar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.full_name || '',
      user.login,
      user.email,
      user.password,
      user.phone || '',
      user.is_admin ? 1 : 0,
      Number(user.bonus_points || 0),
      user.club_member ? 1 : 0,
      user.club_card_number || '',
      user.avatar || '',
    ]
  );
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  return rowToUser(rows[0]);
}

async function updateUserById(id, fields) {
  const sets = [];
  const vals = [];
  const map = {
    full_name: 'full_name',
    login: 'login',
    email: 'email',
    password: 'password',
    phone: 'phone',
    is_admin: 'is_admin',
    bonus_points: 'bonus_points',
    club_member: 'club_member',
    club_card_number: 'club_card_number',
    avatar: 'avatar',
  };
  for (const [key, col] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      let val = fields[key];
      if (key === 'is_admin' || key === 'club_member') val = val ? 1 : 0;
      sets.push(`${col} = ?`);
      vals.push(val);
    }
  }
  if (!sets.length) return findUserByLoginOrEmail(id);
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rowToUser(rows[0]);
}

async function updateUserPasswordByEmail(email, password) {
  await pool.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [
    password,
    String(email).trim().toLowerCase(),
  ]);
}

async function findUserRowByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [
    String(email).trim().toLowerCase(),
  ]);
  return rowToUser(rows[0]);
}

async function findUserRowByLoginOrEmail(identifier) {
  return findUserByLoginOrEmail(identifier);
}

async function updateUserProfile(identifier, { full_name, phone }) {
  const user = await findUserByLoginOrEmail(identifier);
  if (!user) return null;
  return updateUserById(user.id, {
    full_name: full_name ?? user.full_name,
    phone: phone ?? user.phone ?? '',
  });
}

async function deductUserBonus(userId, amount) {
  await pool.query(
    'UPDATE users SET bonus_points = GREATEST(0, bonus_points - ?) WHERE id = ?',
    [amount, userId]
  );
}

async function addUserBonus(userId, amount) {
  await pool.query('UPDATE users SET bonus_points = bonus_points + ? WHERE id = ?', [
    amount,
    userId,
  ]);
}

// ===== Products =====

async function getProducts() {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
  return rows.map(rowToProduct);
}

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(id)]);
  return rowToProduct(rows[0]);
}

async function createProduct(body) {
  const [result] = await pool.query(
    `INSERT INTO products (
      name, brand, price, old_price, discount, image, images, badge, category,
      colors, sizes, description, rating, reviews_count, in_stock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.name || '',
      body.brand || 'YANKI',
      Number(body.price || 0),
      body.oldPrice != null ? Number(body.oldPrice) : null,
      body.discount != null ? Number(body.discount) : null,
      body.image || '',
      JSON.stringify(Array.isArray(body.images) ? body.images : []),
      body.badge || null,
      body.category || null,
      JSON.stringify(Array.isArray(body.colors) ? body.colors : []),
      JSON.stringify(Array.isArray(body.sizes) ? body.sizes : []),
      body.description || '',
      body.rating != null ? Number(body.rating) : null,
      body.reviewsCount != null ? Number(body.reviewsCount) : null,
      body.inStock ? 1 : 0,
    ]
  );
  return result.insertId;
}

async function updateProduct(id, body, prev) {
  const p = prev || (await getProductById(id));
  if (!p) return false;
  await pool.query(
    `UPDATE products SET
      name = ?, brand = ?, price = ?, old_price = ?, discount = ?,
      image = ?, images = ?, badge = ?, category = ?,
      colors = ?, sizes = ?, description = ?, rating = ?, reviews_count = ?, in_stock = ?
     WHERE id = ?`,
    [
      body.name ?? p.name,
      body.brand ?? p.brand,
      body.price != null ? Number(body.price) : p.price,
      body.oldPrice != null ? Number(body.oldPrice) : p.oldPrice,
      body.discount != null ? Number(body.discount) : p.discount,
      body.image ?? p.image,
      JSON.stringify(Array.isArray(body.images) ? body.images : p.images || []),
      body.badge ?? p.badge,
      body.category ?? p.category,
      JSON.stringify(Array.isArray(body.colors) ? body.colors : p.colors || []),
      JSON.stringify(Array.isArray(body.sizes) ? body.sizes : p.sizes || []),
      body.description ?? p.description,
      body.rating != null ? Number(body.rating) : p.rating,
      body.reviewsCount != null ? Number(body.reviewsCount) : p.reviewsCount,
      body.inStock != null ? (body.inStock ? 1 : 0) : p.inStock ? 1 : 0,
      Number(id),
    ]
  );
  return true;
}

async function deleteProduct(id) {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

// ===== Orders =====

async function getAllOrders() {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return rows.map(rowToOrder);
}

async function findOrderById(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rowToOrder(rows[0]);
}

async function findOrderByPaymentId(paymentId) {
  const [rows] = await pool.query(
    `SELECT * FROM orders
     WHERE JSON_UNQUOTE(JSON_EXTRACT(payment, '$.paymentId')) = ?
     LIMIT 1`,
    [paymentId]
  );
  return rowToOrder(rows[0]);
}

async function getOrdersForUser(user) {
  const email = String(user.email || '').trim().toLowerCase();
  const login = String(user.login || '').trim().toLowerCase();
  const [rows] = await pool.query(
    `SELECT * FROM orders
     WHERE (LOWER(user_email) = ? OR LOWER(user_email) = ?)
       AND (type IS NULL OR type != 'club_join')
     ORDER BY created_at DESC`,
    [email, login]
  );
  return rows.map(rowToOrder);
}

async function insertOrder(order) {
  await pool.query(
    `INSERT INTO orders (
      id, type, created_at, status, user_email,
      customer, delivery, totals, payment, items, loyalty_applied
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.type || null,
      new Date(order.createdAt || Date.now()),
      order.status || 'pending',
      order.userEmail,
      JSON.stringify(order.customer || {}),
      JSON.stringify(order.delivery || {}),
      JSON.stringify(order.totals || {}),
      JSON.stringify(order.payment || {}),
      JSON.stringify(order.items || []),
      order.loyaltyApplied ? 1 : 0,
    ]
  );
}

async function saveOrder(order) {
  const existing = await findOrderById(order.id);
  if (!existing) {
    await insertOrder(order);
    return;
  }
  await pool.query(
    `UPDATE orders SET
      type = ?, status = ?, user_email = ?,
      customer = ?, delivery = ?, totals = ?, payment = ?, items = ?, loyalty_applied = ?
     WHERE id = ?`,
    [
      order.type || null,
      order.status,
      order.userEmail,
      JSON.stringify(order.customer || {}),
      JSON.stringify(order.delivery || {}),
      JSON.stringify(order.totals || {}),
      JSON.stringify(order.payment || {}),
      JSON.stringify(order.items || []),
      order.loyaltyApplied ? 1 : 0,
      order.id,
    ]
  );
}

// ===== Pending email verifications =====

async function deletePendingByEmailAndFlow(email, flow) {
  await pool.query('DELETE FROM pending_email_verifications WHERE email = ? AND flow = ?', [
    email,
    flow || 'register',
  ]);
}

async function deletePendingByEmail(email) {
  await pool.query('DELETE FROM pending_email_verifications WHERE email = ?', [email]);
}

async function findPendingByEmail(email, flow) {
  const params = [email];
  let sql = 'SELECT * FROM pending_email_verifications WHERE email = ?';
  if (flow) {
    sql += ' AND flow = ?';
    params.push(flow);
  }
  sql += ' ORDER BY id DESC LIMIT 1';
  const [rows] = await pool.query(sql, params);
  return rowToPending(rows[0]);
}

async function insertPending(rec) {
  await pool.query(
    `INSERT INTO pending_email_verifications (
      email, flow, code_hash, expires_at, resend_available_at,
      created_at, attempts_left, payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rec.email,
      rec.flow || 'register',
      rec.codeHash,
      rec.expiresAt,
      rec.resendAvailableAt,
      rec.createdAt,
      rec.attemptsLeft,
      rec.payload ? JSON.stringify(rec.payload) : null,
    ]
  );
}

async function updatePendingById(id, rec) {
  await pool.query(
    `UPDATE pending_email_verifications SET
      code_hash = ?, expires_at = ?, resend_available_at = ?,
      created_at = ?, attempts_left = ?, payload = ?
     WHERE id = ?`,
    [
      rec.codeHash,
      rec.expiresAt,
      rec.resendAvailableAt,
      rec.createdAt,
      rec.attemptsLeft,
      rec.payload ? JSON.stringify(rec.payload) : null,
      id,
    ]
  );
}

async function deletePendingById(id) {
  await pool.query('DELETE FROM pending_email_verifications WHERE id = ?', [id]);
}

async function replacePendingForEmail(email, flow, rec) {
  await deletePendingByEmailAndFlow(email, flow);
  await insertPending({ ...rec, email, flow: flow || 'register' });
}

module.exports = {
  pool,
  ping,
  parseJson,
  rowToUser,
  rowToProduct,
  rowToOrder,
  findUserByLoginOrEmail,
  findUserByEmail,
  userExistsByLogin,
  userExistsByEmail,
  createUser,
  updateUserById,
  updateUserPasswordByEmail,
  findUserRowByEmail,
  updateUserProfile,
  deductUserBonus,
  addUserBonus,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  findOrderById,
  findOrderByPaymentId,
  getOrdersForUser,
  insertOrder,
  saveOrder,
  deletePendingByEmailAndFlow,
  deletePendingByEmail,
  findPendingByEmail,
  insertPending,
  updatePendingById,
  deletePendingById,
  replacePendingForEmail,
};
