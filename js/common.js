function initCommonFunctions() {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const sideMenuOverlay = document.getElementById('sideMenuOverlay');
  const sideMenuClose = document.getElementById('sideMenuClose');

  if (menuBtn) {
      menuBtn.addEventListener('click', () => {
          menuBtn.classList.toggle('active');
          sideMenu.classList.toggle('active');
          sideMenuOverlay.classList.toggle('active');
      });
  }

  if (sideMenuOverlay) {
      sideMenuOverlay.addEventListener('click', closeSideMenu);
  }

  if (sideMenuClose) {
      sideMenuClose.addEventListener('click', closeSideMenu);
  }

  window.addEventListener('scroll', () => {
      const header = document.getElementById('header');
      if (header && window.scrollY > 50) {
          header.classList.add('scrolled');
      } else if (header) {
          header.classList.remove('scrolled');
      }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
      // Проверяем, есть ли параметр search в URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      if (searchParam) {
          searchInput.value = searchParam;
          searchInput.parentElement.classList.add('has-value');
      }
      
      searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              const query = searchInput.value.trim();
              if (query) {
                  // Если мы на странице каталога, применяем поиск там
                  if (window.location.pathname.includes('catalog.html')) {
                      if (window.applyFilters) {
                          const url = new URL(window.location.href);
                          url.searchParams.set('search', query);
                          window.history.pushState({}, '', url);
                          window.applyFilters();
                      } else {
                          window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
                      }
                  } else {
                      // Иначе переходим на страницу каталога с поиском
                      window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
                  }
              } else {
                  // Если поиск пустой, убираем параметр
                  if (window.location.pathname.includes('catalog.html')) {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('search');
                      window.history.pushState({}, '', url);
                      if (window.applyFilters) {
                          window.applyFilters();
                      }
                  }
              }
          }
      });
      
      searchInput.addEventListener('input', () => {
          searchInput.parentElement.classList.toggle('has-value', searchInput.value.length > 0);
      });
      
      // Добавляем обработчик клика на иконку поиска
      const searchBar = searchInput.parentElement;
      if (searchBar) {
          const searchIcon = searchBar.querySelector('svg');
          if (searchIcon && searchIcon.parentElement === searchBar) {
              searchBar.style.cursor = 'pointer';
              searchBar.addEventListener('click', (e) => {
                  if (e.target === searchBar || e.target === searchIcon || searchIcon.contains(e.target)) {
                      searchInput.focus();
                  }
              });
          }
      }
  }

  const userIcon = document.getElementById('userIcon');
  if (userIcon) {
      userIcon.addEventListener('click', (e) => {
          e.preventDefault();
          openAuthModal();
      });
      userIcon.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openAuthModal();
          }
      });
  }

  document.querySelectorAll('[role="button"]').forEach(btn => {
      if (!btn.hasAttribute('onclick')) return;
      btn.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              btn.click();
          }
      });
  });

  normalizeFooterSocialLinks();
  updateCartCount();
}

function normalizeFooterSocialLinks() {
  const socialContainers = document.querySelectorAll('.footer-social');
  if (!socialContainers.length) return;

  const socialConfig = [
      { href: 'https://vk.com', label: 'VK' },
      { href: 'https://max.ru', label: 'MAX' },
  ];

  socialContainers.forEach((container) => {
      const links = Array.from(container.querySelectorAll('.social-link'));

      socialConfig.forEach((cfg, index) => {
          let link = links[index];
          if (!link) {
              link = document.createElement('a');
              link.className = 'social-link';
              container.appendChild(link);
          }

          link.href = cfg.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.setAttribute('aria-label', cfg.label);
          link.innerHTML = `<span>${cfg.label}</span>`;
      });

      links.slice(socialConfig.length).forEach((link) => link.remove());
  });
}

function normalizeGlobalFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-brand">
        <div class="footer-logo">RiiFKey</div>
        <p class="footer-description">
          Современный магазин женской одежды. Мы создаем стильные и качественные вещи для уверенных в себе женщин.
        </p>
        <div class="footer-social">
          <a href="https://vk.com" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="VK"><span>VK</span></a>
          <a href="https://max.ru" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="MAX"><span>MAX</span></a>
        </div>
      </div>
      <div class="footer-column">
        <h4>Покупателям</h4>
        <ul>
          <li><a href="order.html">Как сделать заказ</a></li>
          <li><a href="payment.html">Способы оплаты</a></li>
          <li><a href="delivery.html">Доставка</a></li>
          <li><a href="returns.html">Возврат товара</a></li>
          <li><a href="faq.html">Вопросы и ответы</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Компания</h4>
        <ul>
          <li><a href="about.html">О нас</a></li>
          <li><a href="stores.html">Магазин</a></li>
          <li><a href="vacancies.html">Вакансии</a></li>
          <li><a href="contacts.html">Контакты</a></li>
          <li><a href="blog.html">Блог</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <h4>Контакты</h4>
        <ul>
          <li><a href="tel:+79510337306">79510337306</a></li>
          <li><a href="mailto:arshanovraf@bk.ru">arshanovraf@bk.ru</a></li>
          <li><a href="contacts.html">Оренбург, ул. Гаранькина 25</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copyright">© 2026 RiiFKey. Все права защищены.</p>
      <div class="footer-payments">
        <div class="footer-payment">VISA</div>
        <div class="footer-payment">MC</div>
        <div class="footer-payment">MIR</div>
        <div class="footer-payment">SBP</div>
      </div>
    </div>
  `;
}

function closeSideMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const sideMenuOverlay = document.getElementById('sideMenuOverlay');
  
  if (menuBtn) menuBtn.classList.remove('active');
  if (sideMenu) sideMenu.classList.remove('active');
  if (sideMenuOverlay) sideMenuOverlay.classList.remove('active');
}

function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId, size = 'M', color = null, quantity = 1) {
  const cart = getCart();
  const existingItem = cart.find(item => 
      item.productId === productId && item.size === size && item.color === color
  );

  if (existingItem) {
      existingItem.quantity += quantity;
  } else {
      cart.push({ productId, size, color, quantity });
  }

  saveCart(cart);
  updateCartCount();
  
  const cartCount = document.getElementById('cartCount');
  if (cartCount) {
      cartCount.classList.add('pulse');
      setTimeout(() => cartCount.classList.remove('pulse'), 600);
  }
  
  return cart;
}

function removeFromCart(productId, size, color) {
  const cart = getCart();
  const filteredCart = cart.filter(item => 
      !(item.productId === productId && item.size === size && item.color === color)
  );
  saveCart(filteredCart);
  updateCartCount();
  return filteredCart;
}

function updateCartQuantity(productId, size, color, quantity) {
  const cart = getCart();
  const item = cart.find(item => 
      item.productId === productId && item.size === size && item.color === color
  );
  
  if (item) {
      if (quantity <= 0) {
          return removeFromCart(productId, size, color);
      }
      item.quantity = quantity;
      saveCart(cart);
      updateCartCount();
  }
  return cart;
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) {
      cartCountElement.textContent = totalItems;
      if (totalItems > 0) {
          cartCountElement.style.display = 'flex';
      } else {
          cartCountElement.style.display = 'none';
      }
  }
}

function pluralizeRu(count, one, few, many) {
  const n = Math.abs(Number(count)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

function formatItemsCount(count) {
  const word = pluralizeRu(count, 'товар', 'товара', 'товаров');
  return `${count} ${word}`;
}

window.pluralizeRu = pluralizeRu;
window.formatItemsCount = formatItemsCount;

function getFavorites() {
  const favorites = localStorage.getItem('favorites');
  return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(productId) {
  const favorites = getFavorites();
  const index = favorites.indexOf(productId);
  
  if (index > -1) {
      favorites.splice(index, 1);
      saveFavorites(favorites);
      return false;
  } else {
      favorites.push(productId);
      saveFavorites(favorites);
      return true;
  }
}

function isFavorite(productId) {
  const favorites = getFavorites();
  return favorites.includes(productId);
}

function saveFavoritesToStorage(favorites) {
  saveFavorites(favorites);
}

window.saveFavoritesToStorage = saveFavoritesToStorage;

function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${
              type === 'success'
                  ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                  : type === 'error'
                      ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                      : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
          }
      </svg>
      <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
  }, 3000);
}

let _authModalCreated = false;
let _pendingRegisterEmail = '';
let _registerAttemptsLeft = null;
let _registerMaxAttempts = 5;
let _resendAvailableAtMs = 0;
let _resendTimerId = null;
const POST_AUTH_REDIRECT_KEY = 'yanki_post_auth_redirect';

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
      const msg = data && data.message ? data.message : 'Ошибка запроса';
      const err = new Error(msg);
      err._data = data || {};
      throw err;
  }
  return data;
}

function getStoredUser() {
  try {
      const raw = localStorage.getItem('yanki_user');
      return raw ? JSON.parse(raw) : null;
  } catch {
      return null;
  }
}

function setStoredUser(user) {
  if (user) {
      localStorage.setItem('yanki_user', JSON.stringify(user));
  } else {
      localStorage.removeItem('yanki_user');
  }
}

function isUserLoggedIn() {
  return !!getStoredUser();
}

function setPostAuthRedirect(url) {
  if (!url) {
      localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      return;
  }
  localStorage.setItem(POST_AUTH_REDIRECT_KEY, String(url));
}

function consumePostAuthRedirect() {
  const url = localStorage.getItem(POST_AUTH_REDIRECT_KEY);
  localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return url || null;
}

function runPostAuthRedirectIfAny() {
  const url = consumePostAuthRedirect();
  if (!url) return false;
  closeAuthModal();
  setTimeout(() => {
      window.location.href = url;
  }, 150);
  return true;
}

async function authMe() {
  return getStoredUser();
}

function ensureAuthModal() {
  if (_authModalCreated) return;
  _authModalCreated = true;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay auth-modal-overlay';
  overlay.id = 'authModalOverlay';
  overlay.addEventListener('click', closeAuthModal);

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet auth-modal-sheet';
  sheet.id = 'authModalSheet';
  sheet.addEventListener('click', (e) => e.stopPropagation());

  sheet.innerHTML = `
    <div class="modal-head">
      <div class="modal-title" id="authModalTitle">Аккаунт</div>
      <div class="modal-subtitle" id="authModalSubtitle">Войдите или зарегистрируйтесь</div>
      <button class="modal-close" type="button" aria-label="Close" onclick="closeAuthModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-error" id="authModalError"></div>
      <div id="authModalContent"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAuthModal();
  });
}

function setAuthError(msg) {
  const el = document.getElementById('authModalError');
  if (!el) return;
  if (msg) {
      el.textContent = msg;
      el.classList.add('show');
  } else {
      el.textContent = '';
      el.classList.remove('show');
  }
}

function clearResendTimer() {
  if (_resendTimerId) {
      clearInterval(_resendTimerId);
      _resendTimerId = null;
  }
}

function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds || 0)));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateSmsConfirmMetaUi() {
  const attemptsEl = document.getElementById('smsAttemptsInfo');
  if (attemptsEl) {
      const left = _registerAttemptsLeft == null ? _registerMaxAttempts : _registerAttemptsLeft;
      attemptsEl.textContent = `Осталось попыток: ${left} из ${_registerMaxAttempts}`;
  }

  const btn = document.getElementById('smsResendBtn');
  const timerEl = document.getElementById('smsResendTimer');
  if (!btn || !timerEl) return;

  const leftSec = Math.max(0, Math.ceil((_resendAvailableAtMs - Date.now()) / 1000));
  if (leftSec > 0) {
      btn.disabled = true;
      timerEl.textContent = `Повторная отправка через ${formatCountdown(leftSec)}`;
      return;
  }
  btn.disabled = false;
  timerEl.textContent = 'Можно отправить код повторно';
}

function startResendTimer() {
  clearResendTimer();
  updateSmsConfirmMetaUi();
  _resendTimerId = setInterval(() => {
      updateSmsConfirmMetaUi();
      if (Date.now() >= _resendAvailableAtMs) {
          clearResendTimer();
      }
  }, 500);
}

function applyRegisterCodeMeta(data = {}) {
  if (typeof data.maxAttempts === 'number') _registerMaxAttempts = Math.max(1, data.maxAttempts);
  if (typeof data.attemptsLeft === 'number') _registerAttemptsLeft = Math.max(0, data.attemptsLeft);
  if (typeof data.resendAvailableInSeconds === 'number') {
      _resendAvailableAtMs = Date.now() + Math.max(0, Number(data.resendAvailableInSeconds)) * 1000;
  }
}

function renderAuthTabs(active = 'login') {
  return `
    <div class="modal-tabs">
      <button class="modal-tab ${active === 'login' ? 'active' : ''}" onclick="renderAuthView('login')">Вход</button>
      <button class="modal-tab ${active === 'register' ? 'active' : ''}" onclick="renderAuthView('register')">Регистрация</button>
    </div>
  `;
}

function renderAuthView(view) {
  setAuthError('');
  const content = document.getElementById('authModalContent');
  if (!content) return;

  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  if (title) title.textContent = view === 'register' ? 'Регистрация' : 'Вход';
  if (subtitle) subtitle.textContent = 'Создайте аккаунт или войдите';

  if (view === 'register') {
      content.innerHTML = `
        ${renderAuthTabs('register')}
        <form class="modal-form" onsubmit="return submitRegister(event)">
          <div class="modal-field">
            <label>Email</label>
            <input name="email" type="email" placeholder="you@mail.ru / you@gmail.com" required />
          </div>
          <div class="modal-field">
            <label>Пароль</label>
            <input name="password" type="password" placeholder="Минимум 6 символов" required />
          </div>
          <div class="modal-actions">
            <button class="modal-btn primary" type="submit">Создать аккаунт</button>
            <button class="modal-btn ghost" type="button" onclick="closeAuthModal()">Отмена</button>
          </div>
          <div class="modal-note">Мы отправим код подтверждения на указанную почту. Без кода регистрация не завершится.</div>
        </form>
      `;
      return;
  }

  content.innerHTML = `
    ${renderAuthTabs('login')}
    <form class="modal-form" onsubmit="return submitLogin(event)">
      <div class="modal-field">
        <label>Email</label>
        <input name="email" type="email" placeholder="you@mail.ru" required />
      </div>
      <div class="modal-field">
        <label>Пароль</label>
        <input name="password" type="password" placeholder="Ваш пароль" required />
      </div>
      <div class="modal-actions">
        <button class="modal-btn primary" type="submit">Войти</button>
        <button class="modal-btn ghost" type="button" onclick="closeAuthModal()">Отмена</button>
      </div>
      <div class="modal-note">Админ доступ: <b>admin</b> / <b>admin123</b></div>
    </form>
  `;
}

async function renderAccountView(user) {
  setAuthError('');
  const content = document.getElementById('authModalContent');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  if (title) title.textContent = 'Аккаунт';
  if (subtitle) subtitle.textContent = 'Вы вошли в систему';

  const isAdmin = user && user.is_admin;
  const bp = Number(user?.bonus_points || 0);
  const club = user?.club_member ? 'Участник RiiFKey Club' : 'Не в клубе';
  const avRaw = String(user?.avatar || '').trim();
  const avOk = /^data:image\//.test(avRaw) || /^https?:\/\//i.test(avRaw);
  const av = avOk
      ? `<img class="auth-account-avatar-img" src="${avRaw.replace(/"/g, '&quot;')}" alt="" />`
      : `<span class="auth-account-avatar-letter">${(user?.full_name || user?.email || '?')[0].toUpperCase()}</span>`;

  content.innerHTML = `
    <div class="auth-account-card">
      <div class="auth-account-avatar">${av}</div>
      <div class="auth-account-info">
        <div class="auth-account-name">${user.full_name || user.email}</div>
        <div class="auth-account-email">${user.email || ''}</div>
        <div class="auth-account-meta">
          <span class="auth-bonus-pill"><b>${bp.toLocaleString('ru-RU')}</b> бонусов</span>
          <span class="auth-club-pill">${club}</span>
        </div>
      </div>
    </div>
    <div class="modal-actions auth-account-actions">
      <button class="modal-btn primary" type="button" onclick="closeAuthModal(); window.location.href='profile.html'">Личный кабинет</button>
      <button class="modal-btn ghost-accent" type="button" onclick="closeAuthModal(); window.location.href='club.html'">RiiFKey Club</button>
      ${isAdmin ? `<button class="modal-btn primary" type="button" onclick="window.location.href='admin/index.html'">Админ-панель</button>` : ''}
      <button class="modal-btn ghost" type="button" onclick="logoutUser()">Выйти</button>
    </div>
  `;
}

async function submitLogin(e) {
  e.preventDefault();
  setAuthError('');
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
      const data = await apiJson('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      const user = data.user;
      setStoredUser(user);
      showToast('Вы вошли', 'success');
      updateUserIcon(true);
      await renderAccountView(user);
      updateCartCount();
      runPostAuthRedirectIfAny();
  } catch (err) {
      setAuthError(err.message || 'Ошибка входа');
  }
  return false;
}

async function submitRegister(e) {
  e.preventDefault();
  setAuthError('');
  const form = e.target;
  try {
      const payload = {
          email: form.email.value.trim(),
          password: form.password.value,
      };

      const data = await apiJson('/api/auth/register/request-code', { method: 'POST', body: JSON.stringify(payload) });
      applyRegisterCodeMeta(data);
      let toastMsg = data?.message || 'Код отправлен на email';
      if (data && data.delivered === false) {
          toastMsg += ' Для локальной проверки код также выводится в консоль сервера.';
      }
      showToast(toastMsg, 'success');

      renderEmailCodeConfirmView({ email: payload.email });
  } catch (err) {
      setAuthError(err.message || 'Ошибка регистрации');
  }
  return false;
}

function renderEmailCodeConfirmView({ email }) {
  setAuthError('');
  _pendingRegisterEmail = String(email || '').trim();
  const content = document.getElementById('authModalContent');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  if (title) title.textContent = 'Подтверждение email';
  if (subtitle) subtitle.textContent = 'Введите код из письма, чтобы завершить регистрацию';

  if (!content) return;
  const safeEmail = _pendingRegisterEmail;

  content.innerHTML = `
    <div class="modal-note" style="margin-top:0">
      Мы отправили код на <b>${safeEmail}</b>.
    </div>
    <form class="modal-form" onsubmit="return submitEmailCodeConfirm(event)">
      <input type="hidden" name="email" value="${safeEmail}" />
      <div class="modal-field">
        <label>Код из письма</label>
        <input name="code" type="text" maxlength="12" inputmode="numeric" autocomplete="one-time-code" placeholder="6 цифр" required />
      </div>
      <div class="modal-actions">
        <button class="modal-btn primary" type="submit">Подтвердить</button>
        <button class="modal-btn ghost" id="smsResendBtn" type="button" onclick="submitResendRegisterCode()">Отправить код ещё раз</button>
        <button class="modal-btn ghost" type="button" onclick="renderAuthView('register')">Назад</button>
      </div>
      <div class="modal-note" id="smsResendTimer"></div>
      <div class="modal-note" id="smsAttemptsInfo"></div>
      <div class="modal-note">
        Не пришло письмо? Проверьте папку «Спам» и нажмите «Отправить код ещё раз».
      </div>
    </form>
  `;
  startResendTimer();
}

async function submitResendRegisterCode() {
  setAuthError('');
  const email = _pendingRegisterEmail;
  if (!email) return;
  try {
      const data = await apiJson('/api/auth/register/resend-code', {
          method: 'POST',
          body: JSON.stringify({ email }),
      });
      applyRegisterCodeMeta(data);
      startResendTimer();
      let toastMsg = data?.message || 'Код отправлен на email';
      if (data && data.delivered === false) {
          toastMsg += ' Код для локальной проверки смотрите в консоли сервера.';
      }
      showToast(toastMsg, 'success');
  } catch (err) {
      const secsFromApi = Number(err?._data?.resendAvailableInSeconds || 0);
      const secsFromMsg = err?.message && /через\s+(\d+)\s*сек/.test(err.message)
          ? Number((err.message.match(/через\s+(\d+)\s*сек/) || [])[1] || 0)
          : 0;
      const secs = Math.max(secsFromApi, secsFromMsg);
      if (typeof err?._data?.attemptsLeft === 'number') {
          _registerAttemptsLeft = Math.max(0, Number(err._data.attemptsLeft));
          updateSmsConfirmMetaUi();
      }
      if (secs > 0) {
          _resendAvailableAtMs = Date.now() + secs * 1000;
          startResendTimer();
      }
      setAuthError(err.message || 'Не удалось отправить код');
  }
}

async function submitEmailCodeConfirm(e) {
  e.preventDefault();
  setAuthError('');
  const form = e.target;
  const email = form.email.value.trim();
  const code = String(form.code.value || '').replace(/\D/g, '').slice(0, 6);
  try {
      const data = await apiJson('/api/auth/register/confirm', { method: 'POST', body: JSON.stringify({ email, code }) });
      const user = data.user;
      _registerAttemptsLeft = null;
      clearResendTimer();
      setStoredUser(user);
      showToast('Email подтвержден. Аккаунт создан', 'success');
      updateUserIcon(true);
      await renderAccountView(user);
      runPostAuthRedirectIfAny();
  } catch (err) {
      const left = err?._data?.attemptsLeft;
      const msg = String(err?.message || '');
      if (typeof left === 'number') {
          _registerAttemptsLeft = Math.max(0, Number(left));
          updateSmsConfirmMetaUi();
      } else if (/Неверный код/i.test(msg)) {
          if (_registerAttemptsLeft == null) _registerAttemptsLeft = _registerMaxAttempts;
          _registerAttemptsLeft = Math.max(0, _registerAttemptsLeft - 1);
          updateSmsConfirmMetaUi();
      }
      setAuthError(err.message || 'Ошибка подтверждения');
  }
  return false;
}

async function logoutUser() {
  showToast('Вы вышли', '');
  setStoredUser(null);
  updateUserIcon(false);
  renderAuthView('login');
}

function updateUserIcon(isLoggedIn) {
  const userIcon = document.getElementById('userIcon');
  if (!userIcon) return;
  userIcon.classList.toggle('active', !!isLoggedIn);
}

async function openAuthModal() {
  ensureAuthModal();
  const overlay = document.getElementById('authModalOverlay');
  const sheet = document.getElementById('authModalSheet');
  if (!overlay || !sheet) return;
  overlay.classList.add('active');
  sheet.classList.add('active');

  const user = await authMe();
  if (user) {
      updateUserIcon(true);
      await renderAccountView(user);
  } else {
      updateUserIcon(false);
      renderAuthView('login');
  }
}

function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  const sheet = document.getElementById('authModalSheet');
  if (overlay) overlay.classList.remove('active');
  if (sheet) sheet.classList.remove('active');
  clearResendTimer();
}

function hideLoader() {
  setTimeout(() => {
      const loader = document.getElementById('loader');
      if (loader) {
          loader.classList.add('hidden');
      }
  }, 1000);
}

function applyBrandingAndLocationOverrides() {
  const replacements = [
      ['YANKI', 'RiifKey'],
      ['Yanki', 'RiifKey'],
      ['yanki', 'riifkey'],
      ['2025', '2026'],
      ['Москва, ул. Примерная, 1', 'Оренбург, ул. Гаранькина 25'],
      ['Оренбург, ул. Советская, 27 (центр)', 'Оренбург, ул. Гаранькина 25'],
      ['info@yanki.ru', 'arshanovraf@bk.ru'],
      ['info@riifkey.ru', 'arshanovraf@bk.ru'],
      ['support@yanki.ru', 'arshanovraf@bk.ru'],
      ['admin@yanki.ru', 'admin@riifkey.ru'],
  ];

  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
  textNodes.forEach((node) => {
      let value = node.nodeValue || '';
      let next = value;
      replacements.forEach(([from, to]) => {
          next = next.split(from).join(to);
      });
      if (next !== value) node.nodeValue = next;
  });

  const attrs = ['title', 'aria-label', 'placeholder', 'alt', 'href', 'content'];
  document.querySelectorAll('*').forEach((el) => {
      attrs.forEach((attr) => {
          const v = el.getAttribute(attr);
          if (!v) return;
          let n = v;
          replacements.forEach(([from, to]) => {
              n = n.split(from).join(to);
          });
          if (n !== v) el.setAttribute(attr, n);
      });
  });

  let title = document.title || '';
  replacements.forEach(([from, to]) => {
      title = title.split(from).join(to);
  });
  if (title) document.title = title;
}

let _helpModalCreated = false;
let _contactsModalCreated = false;

function ensureHelpModal() {
  if (_helpModalCreated) return;
  _helpModalCreated = true;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay help-modal-overlay';
  overlay.id = 'helpModalOverlay';
  overlay.addEventListener('click', closeHelpModal);

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet help-modal-sheet';
  sheet.id = 'helpModalSheet';
  sheet.addEventListener('click', (e) => e.stopPropagation());

  sheet.innerHTML = `
    <div class="modal-head help-modal-head">
      <div class="modal-title">ИИ Помощник</div>
      <div class="modal-subtitle">Я помогу вам найти нужный раздел и навигировать по сайту</div>
      <button class="modal-close" type="button" aria-label="Close" onclick="closeHelpModal()">✕</button>
    </div>
    <div class="modal-body help-modal-body">
      <div class="ai-avatar">
        <div class="ai-pulse"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="ai-message">
        <p class="ai-greeting">Привет! Я ваш ИИ помощник.</p>
        <p class="ai-instruction">Куда вы хотите перейти?</p>
      </div>
      <div class="help-nav-buttons">
        <button class="help-nav-btn" onclick="navigateTo('index.html')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Главная</span>
        </button>
        <button class="help-nav-btn" onclick="navigateTo('catalog.html')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Каталог</span>
        </button>
        <button class="help-nav-btn" onclick="navigateTo('catalog.html?filter=new')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Новинки</span>
        </button>
        <button class="help-nav-btn" onclick="navigateTo('catalog.html?filter=sale')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span>Распродажа</span>
        </button>
        <button class="help-nav-btn" onclick="navigateTo('favorites.html')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Избранное</span>
        </button>
        <button class="help-nav-btn" onclick="navigateTo('cart.html')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span>Корзина</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  setTimeout(() => {
      const buttons = sheet.querySelectorAll('.help-nav-btn');
      buttons.forEach((btn, index) => {
          btn.style.setProperty('--btn-index', index);
      });
      
      const tips = sheet.querySelectorAll('.ai-tips ul li');
      tips.forEach((tip, index) => {
          tip.style.setProperty('--tip-index', index);
      });
  }, 100);

  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
          closeHelpModal();
      }
  });
}

function openHelpModal() {
  closeSideMenu();
  ensureHelpModal();
  const overlay = document.getElementById('helpModalOverlay');
  const sheet = document.getElementById('helpModalSheet');
  if (!overlay || !sheet) return;
  overlay.classList.add('active');
  sheet.classList.add('active');
}

function closeHelpModal() {
  const overlay = document.getElementById('helpModalOverlay');
  const sheet = document.getElementById('helpModalSheet');
  if (overlay) overlay.classList.remove('active');
  if (sheet) sheet.classList.remove('active');
}

function navigateTo(url) {
  closeHelpModal();
  setTimeout(() => {
      window.location.href = url;
  }, 300);
}

function ensureContactsModal() {
  if (_contactsModalCreated) return;
  _contactsModalCreated = true;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay contacts-modal-overlay';
  overlay.id = 'contactsModalOverlay';
  overlay.addEventListener('click', closeContactsModal);

  const sheet = document.createElement('div');
  sheet.className = 'modal-sheet contacts-modal-sheet';
  sheet.id = 'contactsModalSheet';
  sheet.addEventListener('click', (e) => e.stopPropagation());

  sheet.innerHTML = `
    <div class="modal-head contacts-modal-head">
      <div class="modal-title">Свяжитесь с нами</div>
      <div class="modal-subtitle">Мы всегда рады вам помочь</div>
      <button class="modal-close" type="button" aria-label="Close" onclick="closeContactsModal()">✕</button>
    </div>
    <div class="modal-body contacts-modal-body">
      <div class="contacts-modern-grid">
        <div class="contact-card contact-card-primary">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Телефон</h4>
              <a href="tel:+79510337306" class="contact-link">79510337306</a>
            <p class="contact-hint">Бесплатный звонок по России</p>
          </div>
        </div>

        <div class="contact-card contact-card-accent">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Email</h4>
            <a href="mailto:arshanovraf@bk.ru" class="contact-link">arshanovraf@bk.ru</a>
            <p class="contact-hint">Ответим в течение 24 часов</p>
          </div>
        </div>

        <div class="contact-card">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Адрес магазина</h4>
            <p class="contact-text">Москва, ул. Примерная, 1</p>
            <p class="contact-hint">Ежедневно с 10:00 до 22:00</p>
          </div>
        </div>

        <div class="contact-card">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Режим работы</h4>
            <p class="contact-text">Пн-Вс: 10:00 - 22:00</p>
            <p class="contact-hint">Без выходных и праздников</p>
          </div>
        </div>

        <div class="contact-card contact-card-social">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Социальные сети</h4>
            <div class="social-links-modern">
              <a href="https://facebook.com" class="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://instagram.com" class="social-btn" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://x.com" class="social-btn" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="contact-card">
          <div class="contact-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="contact-card-content">
            <h4>Техподдержка</h4>
            <a href="mailto:arshanovraf@bk.ru" class="contact-link">arshanovraf@bk.ru</a>
            <p class="contact-hint">Помощь 24/7</p>
          </div>
        </div>
      </div>
      
      <div class="contacts-cta">
        <button class="contact-action-btn-modern" onclick="window.open('tel:+79510337306')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Позвонить сейчас
        </button>
        <button class="contact-action-btn-modern contact-action-btn-secondary" onclick="window.open('mailto:arshanovraf@bk.ru')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Написать письмо
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
          closeContactsModal();
      }
  });
}

function openContactsModal() {
  closeSideMenu();
  ensureContactsModal();
  const overlay = document.getElementById('contactsModalOverlay');
  const sheet = document.getElementById('contactsModalSheet');
  if (!overlay || !sheet) return;
  overlay.classList.add('active');
  sheet.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeContactsModal() {
  const overlay = document.getElementById('contactsModalOverlay');
  const sheet = document.getElementById('contactsModalSheet');
  if (overlay) overlay.classList.remove('active');
  if (sheet) sheet.classList.remove('active');
  document.body.style.overflow = '';
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.updateCartCount = updateCartCount;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavorites = getFavorites;
window.saveFavorites = saveFavorites;
window.showToast = showToast;
window.closeSideMenu = closeSideMenu;
window.getCart = getCart;
window.saveCart = saveCart;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.renderAuthView = renderAuthView;
window.submitLogin = submitLogin;
window.submitRegister = submitRegister;
window.submitResendRegisterCode = submitResendRegisterCode;
window.submitEmailCodeConfirm = submitEmailCodeConfirm;
window.logoutUser = logoutUser;
window.isUserLoggedIn = isUserLoggedIn;
window.setPostAuthRedirect = setPostAuthRedirect;
window.runPostAuthRedirectIfAny = runPostAuthRedirectIfAny;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.navigateTo = navigateTo;
window.openContactsModal = openContactsModal;
window.closeContactsModal = closeContactsModal;

document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  applyBrandingAndLocationOverrides();
  normalizeGlobalFooter();
  initCommonFunctions();
  authMe().then((user) => updateUserIcon(!!user)).catch(() => updateUserIcon(false));
});