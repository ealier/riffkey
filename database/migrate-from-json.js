/**
 * Перенос данных из data/*.json в MySQL.
 * Запуск: npm run db:migrate
 *
 * Перед запуском импортируйте database/schema.sql в phpMyAdmin.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const dataDir = path.join(__dirname, '..', 'data');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function migrateUsers() {
  const users = readJson(path.join(dataDir, 'users.json'), []);
  let count = 0;
  for (const u of users) {
    const exists = await db.userExistsByEmail(u.email);
    if (exists) continue;
    await db.pool.query(
      `INSERT INTO users (
        id, full_name, login, email, password, phone, is_admin,
        bonus_points, club_member, club_card_number, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.full_name || '',
        u.login || u.email?.split('@')[0] || 'user',
        u.email,
        u.password,
        u.phone || '',
        u.is_admin ? 1 : 0,
        Number(u.bonus_points || 0),
        u.club_member ? 1 : 0,
        u.club_card_number || '',
        u.avatar || '',
      ]
    );
    count += 1;
  }
  console.log(`users: импортировано ${count}`);
}

async function migrateProducts() {
  const products = readJson(path.join(dataDir, 'products.json'), []);
  let count = 0;
  for (const p of products) {
    const [rows] = await db.pool.query('SELECT 1 FROM products WHERE id = ?', [p.id]);
    if (rows.length) continue;
    await db.pool.query(
      `INSERT INTO products (
        id, name, brand, price, old_price, discount, image, images, badge, category,
        colors, sizes, description, rating, reviews_count, in_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name || '',
        p.brand || 'YANKI',
        Number(p.price || 0),
        p.oldPrice != null ? Number(p.oldPrice) : null,
        p.discount != null ? Number(p.discount) : null,
        p.image || '',
        JSON.stringify(Array.isArray(p.images) ? p.images : []),
        p.badge || null,
        p.category || null,
        JSON.stringify(Array.isArray(p.colors) ? p.colors : []),
        JSON.stringify(Array.isArray(p.sizes) ? p.sizes : []),
        p.description || '',
        p.rating != null ? Number(p.rating) : null,
        p.reviewsCount != null ? Number(p.reviewsCount) : null,
        p.inStock ? 1 : 0,
      ]
    );
    count += 1;
  }
  console.log(`products: импортировано ${count}`);
}

async function migrateOrders() {
  const orders = readJson(path.join(dataDir, 'orders.json'), []);
  let count = 0;
  for (const o of orders) {
    const existing = await db.findOrderById(o.id);
    if (existing) continue;
    await db.insertOrder(o);
    count += 1;
  }
  console.log(`orders: импортировано ${count}`);
}

async function migratePending() {
  const pending = readJson(path.join(dataDir, 'pending_email_verifications.json'), []);
  let count = 0;
  for (const p of pending) {
    const email = p.email || (p.payload && p.payload.email);
    if (!email) continue;
    const flow = p.flow || 'register';
    const rec = await db.findPendingByEmail(email, flow);
    if (rec) continue;
    await db.insertPending({
      email,
      flow,
      codeHash: p.codeHash,
      expiresAt: p.expiresAt,
      resendAvailableAt: p.resendAvailableAt,
      createdAt: p.createdAt,
      attemptsLeft: p.attemptsLeft ?? 5,
      payload: p.payload || null,
    });
    count += 1;
  }
  console.log(`pending_email_verifications: импортировано ${count}`);
}

async function main() {
  await db.ping();
  console.log('Миграция JSON → MySQL...');
  await migrateUsers();
  await migrateProducts();
  await migrateOrders();
  await migratePending();
  console.log('Готово.');
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
