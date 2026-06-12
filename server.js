const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const https = require('https');
require('dotenv').config();

const YooKassa = require('yookassa');
const nodemailer = require('nodemailer');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const REGISTER_CODE_TTL_MS = Math.max(
  60_000,
  Number(process.env.REGISTER_CODE_TTL_SECONDS || 600) * 1000
);
const REGISTER_CODE_RESEND_COOLDOWN_MS = Math.max(
  10_000,
  Number(process.env.REGISTER_CODE_RESEND_COOLDOWN_SECONDS || 60) * 1000
);
const REGISTER_CODE_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.REGISTER_CODE_MAX_ATTEMPTS || 5)
);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function getPublicUrl(req) {
  const fromEnv = String(process.env.PUBLIC_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const host = req.get('host') || `localhost:${PORT}`;
  return `http://${host}`;
}

function getYooKassaClient() {
  const shopId = String(process.env.YOOKASSA_SHOP_ID || '').trim();
  const secretKey = String(process.env.YOOKASSA_SECRET_KEY || '').trim();
  if (!shopId || !secretKey) return null;
  return new YooKassa({ shopId, secretKey });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim();
}

function normalizeLogin(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

function isValidEmail(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidPassword(password) {
  return String(password || '').length >= 6;
}

function maskEmail(email) {
  const e = normalizeEmail(email);
  const [user, domain] = e.split('@');
  if (!user || !domain) return e;
  const u =
    user.length <= 2
      ? user[0] + '*'
      : user[0] + '*'.repeat(user.length - 2) + user[user.length - 1];
  return `${u}@${domain}`;
}

function generateClubCardNumberForUser(user) {
  const seed = `${user?.id || ''}|${normalizeLogin(user?.login)}|${normalizePhone(user?.phone)}`;
  const hex = crypto.createHash('sha256').update(seed).digest('hex');
  let digits = '55';
  for (let i = 0; i < hex.length && digits.length < 16; i += 1) {
    digits += String(parseInt(hex[i], 16) % 10);
  }
  while (digits.length < 16) digits += '0';
  return digits.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function buildEmailTransport() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();

  if (!host || !port || !user || !pass) return null;
  const opts = {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
  if (port === 587) {
    opts.requireTLS = true;
  }
  return nodemailer.createTransport(opts);
}

async function sendEmailCode({ toEmail, code }) {
  const from =
    String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim() ||
    'noreply@localhost';
  const transport = buildEmailTransport();
  const subject = 'Код подтверждения — RiiFKey';
  const text = `Ваш код подтверждения RiiFKey: ${code}\n\nЕсли это были не вы — просто проигнорируйте письмо.`;

  if (!transport) {
    console.log(`[email-code] to=${toEmail} code=${code}`);
    return { delivered: false };
  }

  try {
    await transport.sendMail({ from, to: toEmail, subject, text });
  } catch (err) {
    const raw = [
      err?.message,
      err?.response,
      err?.responseCode,
      typeof err?.response === 'string' ? err.response : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (
      /535|Application password|NEOBHODIM|parol prilozheniya|парол.*приложен/i.test(raw)
    ) {
      throw new Error(
        'Mail.ru / internet.ru: нужен пароль приложения, а не пароль от входа в почту. ' +
          'Почта → шестерёнка → Все настройки → Безопасность → Пароли для внешних приложений → создать пароль и вставить его в SMTP_PASS в .env. ' +
          'Инструкция: https://help.mail.ru/mail/security/protection/external'
      );
    }
    const smtpHost = String(process.env.SMTP_HOST || '');
    if (/gmail\.com/i.test(smtpHost) && /535|534|Invalid login|not accepted/i.test(raw)) {
      throw new Error(
        'Gmail: нужен «пароль приложения» Google (с включённой 2FA), не обычный пароль. Укажите его в SMTP_PASS.'
      );
    }
    throw err;
  }
  return { delivered: true };
}

async function getUserByIdentifier(identifier) {
  return db.findUserByLoginOrEmail(identifier);
}

function getUserByEmail(email) {
  return db.findUserByEmail(email);
}

function toSafeUser(u) {
  if (!u) return null;
  const s = { ...u };
  delete s.password;
  return s;
}

async function finalizePaidOrderRewards(order) {
  if (!order || order.loyaltyApplied) return;

  const fresh = await db.findOrderById(order.id);
  if (!fresh || fresh.loyaltyApplied) return;

  const user = await db.findUserByLoginOrEmail(order.userEmail);
  if (!user) {
    fresh.loyaltyApplied = true;
    await db.saveOrder(fresh);
    return;
  }

  if (order.type === 'club_join') {
    const updates = { club_member: true };
    if (!user.club_card_number) {
      updates.club_card_number = generateClubCardNumberForUser(user);
    }
    await db.updateUserById(user.id, updates);
    fresh.loyaltyApplied = true;
    fresh.status = 'paid';
    await db.saveOrder(fresh);
    return;
  }

  if (!user.club_member) {
    fresh.loyaltyApplied = true;
    await db.saveOrder(fresh);
    return;
  }

  const paid = Math.floor(Number(order.totals?.amountToPay ?? order.totals?.total ?? 0));
  const earnedBonus = Math.floor(Math.max(0, paid) / 1500) * 150;
  await db.addUserBonus(user.id, earnedBonus);
  fresh.loyaltyApplied = true;
  await db.saveOrder(fresh);
}

async function calcTotalsFromCart(cart, deliveryMode) {
  const products = await db.getProducts();
  const byId = new Map(products.map((p) => [Number(p.id), p]));

  let subtotal = 0;
  let discount = 0;
  let itemsCount = 0;

  for (const item of cart || []) {
    const pid = Number(item.productId);
    const qty = Number(item.quantity || 0);
    if (!pid || qty <= 0) continue;
    const p = byId.get(pid);
    if (!p) continue;
    itemsCount += qty;
    subtotal += Number(p.price || 0) * qty;
    if (p.oldPrice) discount += (Number(p.oldPrice) - Number(p.price || 0)) * qty;
  }

  const deliveryFee = deliveryMode === 'pickup' ? 0 : subtotal >= 5000 ? 0 : 500;
  const total = subtotal - discount + deliveryFee;
  return { subtotal, discount, deliveryFee, total, itemsCount };
}

app.get('/api/health', async (_req, res) => {
  try {
    await db.ping();
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'disconnected', message: err?.message || 'DB error' });
  }
});

// ====== API товаров ======

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const body = req.body || {};
    const id = await db.createProduct(body);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const prev = await db.getProductById(id);
    if (!prev) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    await db.updateProduct(id, req.body || {}, prev);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const ok = await db.deleteProduct(Number(req.params.id));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Товар не найден' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

// ====== Auth ======

app.post('/api/auth/password-change/request-code', async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Введите корректный email' });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const now = Date.now();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const info = await sendEmailCode({ toEmail: email, code });

    await db.replacePendingForEmail(email, 'password_change', {
      codeHash,
      expiresAt: now + REGISTER_CODE_TTL_MS,
      resendAvailableAt: now + REGISTER_CODE_RESEND_COOLDOWN_MS,
      createdAt: new Date(now).toISOString(),
      attemptsLeft: REGISTER_CODE_MAX_ATTEMPTS,
      payload: null,
    });

    return res.json({
      success: true,
      delivered: info.delivered,
      message: `Код отправлен на ${maskEmail(email)}`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Не удалось отправить код',
    });
  }
});

app.post('/api/auth/password-change/confirm', async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);
  const newPassword = String(body.newPassword || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Введите корректный email' });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Код должен быть из 6 цифр' });
  }
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Новый пароль должен быть минимум 6 символов',
    });
  }

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }

    const rec = await db.findPendingByEmail(email, 'password_change');
    if (!rec) {
      return res.status(400).json({ success: false, message: 'Сначала запросите код' });
    }
    if (Date.now() > Number(rec.expiresAt || 0)) {
      await db.deletePendingById(rec.id);
      return res.status(400).json({ success: false, message: 'Код истёк. Запросите новый' });
    }
    if (Number(rec.attemptsLeft || 0) <= 0) {
      await db.deletePendingById(rec.id);
      return res.status(400).json({
        success: false,
        message: 'Слишком много попыток. Запросите новый код',
      });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== rec.codeHash) {
      await db.updatePendingById(rec.id, {
        ...rec,
        attemptsLeft: Number(rec.attemptsLeft || 0) - 1,
      });
      return res.status(400).json({ success: false, message: 'Неверный код' });
    }

    await db.updateUserPasswordByEmail(email, newPassword);
    await db.deletePendingById(rec.id);
    const updated = await db.findUserByEmail(email);
    return res.json({ success: true, user: toSafeUser(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.post('/api/auth/register/request-code', async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const login = normalizeLogin(normalizeEmail(body.email).split('@')[0]);
  const fullName = normalizeName(body.full_name || normalizeEmail(body.email).split('@')[0]);
  const password = String(body.password || '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Введите корректный email' });
  }
  if (!fullName) {
    return res.status(400).json({ success: false, message: 'Введите имя пользователя' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Пароль должен быть минимум 6 символов',
    });
  }

  try {
    if (await db.userExistsByLogin(login)) {
      return res.status(400).json({ success: false, message: 'Логин уже занят' });
    }
    if (await db.userExistsByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email уже используется' });
    }
    if (await db.userExistsByEmail(login)) {
      return res
        .status(400)
        .json({ success: false, message: 'Логин совпадает с существующим email' });
    }

    const now = Date.now();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const info = await sendEmailCode({ toEmail: email, code });

    await db.replacePendingForEmail(email, 'register', {
      codeHash,
      expiresAt: now + REGISTER_CODE_TTL_MS,
      resendAvailableAt: now + REGISTER_CODE_RESEND_COOLDOWN_MS,
      createdAt: new Date(now).toISOString(),
      attemptsLeft: REGISTER_CODE_MAX_ATTEMPTS,
      payload: { full_name: fullName, login, email, password },
    });

    res.json({
      success: true,
      message: `Код отправлен на ${maskEmail(email)}`,
      delivered: info.delivered,
      attemptsLeft: REGISTER_CODE_MAX_ATTEMPTS,
      maxAttempts: REGISTER_CODE_MAX_ATTEMPTS,
      resendAvailableInSeconds: Math.ceil(REGISTER_CODE_RESEND_COOLDOWN_MS / 1000),
      expiresInSeconds: Math.ceil(REGISTER_CODE_TTL_MS / 1000),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Не удалось отправить код',
    });
  }
});

app.post('/api/auth/register/resend-code', async (req, res) => {
  const email = normalizeEmail((req.body || {}).email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Введите корректный email' });
  }

  try {
    if (await db.userExistsByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Пользователь уже существует' });
    }

    const rec = await db.findPendingByEmail(email, 'register');
    if (!rec) {
      return res.status(400).json({
        success: false,
        message: 'Сначала заполните форму регистрации и запросите код',
      });
    }

    const now = Date.now();
    const resendWaitMs = Math.max(0, Number(rec.resendAvailableAt || 0) - now);
    if (resendWaitMs > 0) {
      return res.status(429).json({
        success: false,
        message: `Код можно запросить повторно через ${Math.ceil(resendWaitMs / 1000)} сек`,
        resendAvailableInSeconds: Math.ceil(resendWaitMs / 1000),
        attemptsLeft: Number(rec.attemptsLeft || 0),
        maxAttempts: REGISTER_CODE_MAX_ATTEMPTS,
      });
    }
    if (Date.now() > Number(rec.expiresAt || 0)) {
      await db.deletePendingById(rec.id);
      return res.status(400).json({
        success: false,
        message: 'Срок действия истёк. Заполните регистрацию заново',
      });
    }

    const newNow = Date.now();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const info = await sendEmailCode({ toEmail: email, code });

    await db.updatePendingById(rec.id, {
      ...rec,
      codeHash,
      expiresAt: newNow + REGISTER_CODE_TTL_MS,
      resendAvailableAt: newNow + REGISTER_CODE_RESEND_COOLDOWN_MS,
      attemptsLeft: REGISTER_CODE_MAX_ATTEMPTS,
      createdAt: new Date(newNow).toISOString(),
    });

    res.json({
      success: true,
      message: `Новый код отправлен на ${maskEmail(email)}`,
      delivered: info.delivered,
      attemptsLeft: REGISTER_CODE_MAX_ATTEMPTS,
      maxAttempts: REGISTER_CODE_MAX_ATTEMPTS,
      resendAvailableInSeconds: Math.ceil(REGISTER_CODE_RESEND_COOLDOWN_MS / 1000),
      expiresInSeconds: Math.ceil(REGISTER_CODE_TTL_MS / 1000),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Не удалось отправить код',
    });
  }
});

app.post('/api/auth/register/confirm', async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Введите корректный email' });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Код должен быть из 6 цифр' });
  }

  try {
    if (await db.userExistsByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Пользователь уже существует' });
    }

    const rec = await db.findPendingByEmail(email, 'register');
    if (!rec) {
      return res.status(400).json({ success: false, message: 'Сначала запросите код на почту' });
    }

    const now = Date.now();
    if (now > Number(rec.expiresAt || 0)) {
      await db.deletePendingById(rec.id);
      return res.status(400).json({ success: false, message: 'Код истёк. Запросите новый' });
    }
    if (Number(rec.attemptsLeft || 0) <= 0) {
      await db.deletePendingById(rec.id);
      return res.status(400).json({
        success: false,
        message: 'Слишком много попыток. Запросите новый код',
        attemptsLeft: 0,
        maxAttempts: REGISTER_CODE_MAX_ATTEMPTS,
      });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== rec.codeHash) {
      await db.updatePendingById(rec.id, {
        ...rec,
        attemptsLeft: Number(rec.attemptsLeft || 0) - 1,
      });
      return res.status(400).json({
        success: false,
        message: 'Неверный код',
        attemptsLeft: Math.max(0, Number(rec.attemptsLeft || 0) - 1),
        maxAttempts: REGISTER_CODE_MAX_ATTEMPTS,
      });
    }

    const user = await db.createUser({
      full_name: rec.payload?.full_name || rec.payload?.login || 'Пользователь',
      login: normalizeLogin(rec.payload?.login),
      phone: '',
      email: normalizeEmail(rec.payload?.email),
      password: rec.payload?.password || '',
      is_admin: false,
      bonus_points: 0,
      club_member: false,
      club_card_number: '',
      avatar: '',
    });

    await db.deletePendingById(rec.id);
    res.json({ success: true, user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {};
  const login = normalizeLogin(body.email || body.login);
  const password = body.password || '';

  try {
    const user = await db.findUserByLoginOrEmail(login);
    if (!user || user.password !== password) {
      return res.status(400).json({ success: false, message: 'Неверный логин или пароль' });
    }
    res.json({ success: true, user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.post('/api/auth/me', async (req, res) => {
  const body = req.body || {};
  const login = normalizeLogin(body.email || body.login);
  const password = String(body.password || '');

  try {
    const user = await getUserByIdentifier(login);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
    res.json({ success: true, user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.patch('/api/auth/profile', async (req, res) => {
  const body = req.body || {};
  const login = normalizeLogin(body.email || body.login);

  try {
    const full_name =
      body.full_name != null ? normalizeName(body.full_name) : undefined;
    if (full_name !== undefined && !full_name) {
      return res.status(400).json({ success: false, message: 'Введите имя' });
    }
    const u = await db.updateUserProfile(login, { full_name, phone: '' });
    if (!u) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    res.json({ success: true, user: toSafeUser(u) });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.post('/api/orders/mine', async (req, res) => {
  const body = req.body || {};
  const login = normalizeLogin(body.login || body.email);
  const password = String(body.password || '');

  try {
    const user = await getUserByIdentifier(login);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Неверный вход' });
    }
    const orders = await db.getOrdersForUser(user);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

// ====== Оплата (YooKassa) ======

app.post('/api/club/create-payment', async (req, res) => {
  const kass = getYooKassaClient();
  if (!kass) {
    return res.status(500).json({
      success: false,
      message:
        'YooKassa не настроена на сервере. Укажи YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в переменных окружения.',
    });
  }

  const body = req.body || {};
  const userEmail = String(body.userEmail || '').trim();
  const password = String(body.password || '');

  try {
    const user = await getUserByIdentifier(userEmail);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Нужен вход в аккаунт' });
    }
    if (user.club_member) {
      return res.status(400).json({ success: false, message: 'Вы уже участник YANKI Club' });
    }

    const orderId = 'CLUB-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8);
    const publicUrl = getPublicUrl(req);
    const returnUrl = `${publicUrl}/club-success.html?orderId=${encodeURIComponent(orderId)}`;

    const payment = await kass.createPayment(
      {
        amount: { value: '1.00', currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: returnUrl },
        description: 'YANKI Club — оформление карты',
        metadata: { orderId, userEmail, type: 'club_join' },
      },
      crypto.randomUUID()
    );

    await db.insertOrder({
      id: orderId,
      type: 'club_join',
      createdAt: new Date().toISOString(),
      status: 'pending',
      userEmail,
      customer: { name: user.full_name || user.email, phone: '' },
      delivery: { mode: 'none', note: 'club' },
      totals: {
        subtotal: 1,
        discount: 0,
        deliveryFee: 0,
        total: 1,
        baseTotal: 1,
        bonusUsed: 0,
        amountToPay: 1,
        itemsCount: 0,
      },
      payment: { provider: 'yookassa', paymentId: payment.id, status: payment.status },
      items: [],
    });

    res.json({
      success: true,
      orderId,
      paymentId: payment.id,
      confirmation_url: payment?.confirmation?.confirmation_url,
      status: payment.status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка создания платежа' });
  }
});

app.post('/api/payments/create', async (req, res) => {
  const kass = getYooKassaClient();
  if (!kass) {
    return res.status(500).json({
      success: false,
      message:
        'YooKassa не настроена на сервере. Укажи YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в переменных окружения.',
    });
  }

  const body = req.body || {};
  const cart = Array.isArray(body.cart) ? body.cart : [];
  const deliveryMode = body.deliveryMode === 'pickup' ? 'pickup' : 'delivery';
  const customerName = String(body.customerName || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const address = String(body.address || '').trim();
  const userEmail = String(body.userEmail || '').trim();

  try {
    const user = await getUserByIdentifier(userEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Нужен вход в аккаунт' });
    }
    if (!cart.length) {
      return res.status(400).json({ success: false, message: 'Корзина пуста' });
    }
    if (!customerName) {
      return res.status(400).json({ success: false, message: 'Введите имя' });
    }
    if (!customerPhone) {
      return res.status(400).json({ success: false, message: 'Введите телефон' });
    }
    if (deliveryMode === 'delivery' && !address) {
      return res.status(400).json({ success: false, message: 'Введите адрес доставки' });
    }

    const totals = await calcTotalsFromCart(cart, deliveryMode);
    if (!totals.itemsCount || totals.total <= 0) {
      return res.status(400).json({ success: false, message: 'Некорректная корзина' });
    }

    const bonusRequested = Math.max(0, Math.floor(Number(body.bonusToSpend || 0)));
    if (bonusRequested > 0 && !user.club_member) {
      return res.status(400).json({
        success: false,
        message:
          'Списание баллов доступно участникам YANKI Club. Оформите карту на странице клуба.',
      });
    }

    const baseTotal = Math.round(Number(totals.total) * 100) / 100;
    const maxBonus = Math.floor(baseTotal * 0.5);
    let bonusUsed = Math.min(
      bonusRequested,
      maxBonus,
      Math.floor(Number(user.bonus_points || 0))
    );
    bonusUsed = Math.max(0, bonusUsed);

    let amountToPay = Math.round((baseTotal - bonusUsed) * 100) / 100;
    if (baseTotal >= 1 && amountToPay > 0 && amountToPay < 1) {
      bonusUsed = Math.max(0, Math.floor(baseTotal * 100) / 100 - 1);
      amountToPay = Math.round((baseTotal - bonusUsed) * 100) / 100;
    }

    if (bonusUsed > Number(user.bonus_points || 0)) {
      return res.status(400).json({ success: false, message: 'Недостаточно баллов' });
    }
    if (amountToPay < 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Сумма к оплате картой слишком мала. Уменьшите списание баллов.',
      });
    }

    const orderId = 'ORD-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8);
    const publicUrl = getPublicUrl(req);
    const returnUrl = `${publicUrl}/order-success.html?orderId=${encodeURIComponent(orderId)}`;
    const prevBonus = Number(user.bonus_points || 0);

    try {
      const payment = await kass.createPayment(
        {
          amount: { value: amountToPay.toFixed(2), currency: 'RUB' },
          capture: true,
          confirmation: { type: 'redirect', return_url: returnUrl },
          description: `Заказ ${orderId} • YANKI`,
          metadata: { orderId, userEmail },
        },
        crypto.randomUUID()
      );

      if (bonusUsed > 0) {
        await db.deductUserBonus(user.id, bonusUsed);
      }

      const orderTotals = { ...totals, baseTotal, bonusUsed, amountToPay };
      await db.insertOrder({
        id: orderId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        userEmail,
        customer: { name: customerName, phone: customerPhone },
        delivery:
          deliveryMode === 'pickup'
            ? {
                mode: 'pickup',
                city: 'Оренбург',
                address: 'Оренбург, ул. Советская, 27 (центр)',
              }
            : { mode: 'delivery', city: 'Оренбург', address },
        totals: orderTotals,
        payment: { provider: 'yookassa', paymentId: payment.id, status: payment.status },
        items: cart,
      });

      const updatedUser = await db.findUserByLoginOrEmail(userEmail);
      res.json({
        success: true,
        orderId,
        paymentId: payment.id,
        confirmation_url: payment?.confirmation?.confirmation_url,
        status: payment.status,
        bonusUsed,
        amountToPay,
        bonus_points: updatedUser?.bonus_points ?? prevBonus - bonusUsed,
      });
    } catch (err) {
      if (bonusUsed > 0) {
        await db.addUserBonus(user.id, bonusUsed);
      }
      res.status(500).json({ success: false, message: err?.message || 'Ошибка создания платежа' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка БД' });
  }
});

app.get('/api/payments/status', async (req, res) => {
  const kass = getYooKassaClient();
  if (!kass) {
    return res.status(500).json({
      success: false,
      message:
        'YooKassa не настроена на сервере. Укажи YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в переменных окружения.',
    });
  }

  const orderId = String(req.query.orderId || '').trim();
  const paymentId = String(req.query.paymentId || '').trim();

  try {
    let order = null;
    if (orderId) order = await db.findOrderById(orderId);
    if (!order && paymentId) order = await db.findOrderByPaymentId(paymentId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Заказ не найден' });
    }

    const payment = await kass.getPayment(order.payment.paymentId);
    order.payment.status = payment.status;
    if (payment.status === 'succeeded') order.status = 'paid';
    if (payment.status === 'canceled') order.status = 'canceled';
    await db.saveOrder(order);

    if (payment.status === 'succeeded') {
      await finalizePaidOrderRewards(order);
    }
    if (payment.status === 'canceled' && Number(order.totals?.bonusUsed || 0) > 0) {
      const u = await db.findUserByLoginOrEmail(order.userEmail);
      if (u) {
        await db.addUserBonus(u.id, Number(order.totals.bonusUsed || 0));
      }
    }

    const orderOut = (await db.findOrderById(order.id)) || order;
    let userOut = null;
    if (payment.status === 'succeeded') {
      const uAfter = await getUserByEmail(order.userEmail);
      if (uAfter) userOut = toSafeUser(uAfter);
    }

    res.json({ success: true, order: orderOut, payment, user: userOut });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || 'Ошибка проверки платежа' });
  }
});

app.post('/api/payments/webhook', (req, res) => {
  res.json({ success: true });
});

async function startServer() {
  try {
    await db.ping();
    console.log('MySQL: подключение установлено');
    app.listen(PORT, '0.0.0.0', () => {
      const publicUrl = String(process.env.PUBLIC_URL || '').trim() || `http://localhost:${PORT}`;
      console.log(`Yanci server running at ${publicUrl}`);
      console.log(`Listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('');
    console.error('Не удалось подключиться к MySQL.');
    console.error('Проверьте DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME в переменных окружения.');
    console.error('Локально: запустите MySQL и импортируйте database/schema.sql');
    console.error('');
    console.error(err?.message || err);
    process.exit(1);
  }
}

startServer();
