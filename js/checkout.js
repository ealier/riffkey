async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Ошибка запроса');
  return data;
}

function getCartTotals(deliveryMode) {
  const cart = getCart();
  let subtotal = 0;
  let discount = 0;

  for (const item of cart) {
    const p = getProductById(item.productId);
    if (!p) continue;
    subtotal += Number(p.price || 0) * Number(item.quantity || 0);
    if (p.oldPrice) {
      discount += (Number(p.oldPrice) - Number(p.price)) * Number(item.quantity || 0);
    }
  }

  const deliveryFee = deliveryMode === 'pickup' ? 0 : subtotal >= 5000 ? 0 : 500;
  const total = subtotal - discount + deliveryFee;

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    itemsCount: cart.reduce((s, i) => s + (i.quantity || 0), 0),
  };
}

let _bonusSpend = 0;
let _userBonus = 0;
let _clubMember = false;

function getMaxBonusForTotal(total) {
  if (!_clubMember) return 0;
  return Math.min(Math.floor(_userBonus), Math.floor(total * 0.5));
}

function renderSummary() {
  const deliveryMode =
    document.querySelector('input[name="deliveryMode"]:checked')?.value || 'delivery';
  const { subtotal, discount, deliveryFee, total, itemsCount } =
    getCartTotals(deliveryMode);

  const maxBonus = getMaxBonusForTotal(total);
  _bonusSpend = Math.min(Math.max(0, _bonusSpend), maxBonus);

  const elRange = document.getElementById('bonusRange');
  if (elRange) {
    elRange.max = String(maxBonus);
    elRange.value = String(_bonusSpend);
  }

  const toPay = Math.max(0, Math.round((total - _bonusSpend) * 100) / 100);

  const elItems = document.getElementById('sumItems');
  const elSubtotal = document.getElementById('sumSubtotal');
  const elDiscount = document.getElementById('sumDiscount');
  const elDelivery = document.getElementById('sumDelivery');
  const elBonusRow = document.getElementById('sumBonusRow');
  const elBonus = document.getElementById('sumBonus');
  const elTotal = document.getElementById('sumTotal');
  const elBonusSpendLabel = document.getElementById('bonusSpendLabel');

  if (elItems) elItems.textContent = String(itemsCount);
  if (elSubtotal) elSubtotal.textContent = subtotal.toLocaleString('ru-RU') + ' ₽';
  if (elDiscount)
    elDiscount.textContent =
      discount > 0 ? '-' + discount.toLocaleString('ru-RU') + ' ₽' : '0 ₽';
  if (elDelivery)
    elDelivery.textContent =
      deliveryFee === 0 ? 'Бесплатно' : deliveryFee.toLocaleString('ru-RU') + ' ₽';

  if (elBonusRow && elBonus) {
    if (_clubMember && maxBonus > 0) {
      elBonusRow.style.display = 'flex';
      elBonus.textContent = '-' + _bonusSpend.toLocaleString('ru-RU') + ' ₽';
    } else {
      elBonusRow.style.display = 'none';
    }
  }

  if (elTotal) elTotal.textContent = toPay.toLocaleString('ru-RU') + ' ₽';
  if (elBonusSpendLabel) elBonusSpendLabel.textContent = String(_bonusSpend);

  const hidden = document.getElementById('fieldBonusToSpend');
  if (hidden) hidden.value = String(_bonusSpend);
}

function syncDeliveryFields() {
  const mode =
    document.querySelector('input[name="deliveryMode"]:checked')?.value || 'delivery';
  const addressWrap = document.getElementById('addressWrap');
  const pickupWrap = document.getElementById('pickupWrap');

  if (addressWrap) addressWrap.style.display = mode === 'delivery' ? 'block' : 'none';
  if (pickupWrap) pickupWrap.style.display = mode === 'pickup' ? 'block' : 'none';

  renderSummary();
}

function initBonusBlock() {
  try {
    const user = JSON.parse(localStorage.getItem('yanki_user') || 'null');
    _userBonus = Math.floor(Number(user?.bonus_points || 0));
    _clubMember = !!user?.club_member;
    const block = document.getElementById('bonusBlock');
    const bal = document.getElementById('bonusBalance');
    const hintNonClub = document.getElementById('bonusNonClubHint');
    if (bal) bal.textContent = _userBonus.toLocaleString('ru-RU');
    if (block) {
      if (_clubMember) {
        block.style.display = 'block';
        if (hintNonClub) hintNonClub.style.display = 'none';
      } else {
        block.style.display = 'none';
        if (hintNonClub) hintNonClub.style.display = '';
      }
    }
    const range = document.getElementById('bonusRange');
    if (range) {
      range.addEventListener('input', () => {
        _bonusSpend = Math.max(0, Math.floor(Number(range.value || 0)));
        renderSummary();
      });
    }
  } catch {
    _userBonus = 0;
    _clubMember = false;
  }
}

async function submitCheckout(e) {
  e.preventDefault();

  if (typeof window.isUserLoggedIn === 'function' && !window.isUserLoggedIn()) {
    if (typeof window.setPostAuthRedirect === 'function') {
      window.setPostAuthRedirect('checkout.html');
    }
    showToast('Чтобы оплатить, войдите или зарегистрируйтесь', 'error');
    if (typeof window.openAuthModal === 'function') window.openAuthModal();
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    showToast('Корзина пуста', 'error');
    window.location.href = 'cart.html';
    return;
  }

  const deliveryMode =
    document.querySelector('input[name="deliveryMode"]:checked')?.value || 'delivery';
  const customerName = document.getElementById('fieldCustomerName')?.value?.trim();
  const customerPhone = document.getElementById('fieldCustomerPhone')?.value?.trim();
  const address = document.getElementById('fieldAddress')?.value?.trim();

  if (!customerName) return showToast('Введите имя', 'error');
  if (!customerPhone) return showToast('Введите телефон', 'error');
  if (deliveryMode === 'delivery' && !address)
    return showToast('Введите адрес доставки', 'error');

  const payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = 'Переход к оплате...';
  }

  try {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem('yanki_user') || 'null');
      } catch {
        return null;
      }
    })();
    const userEmail = user?.email;
    if (!userEmail) throw new Error('Нужен вход в аккаунт');

    const data = await apiJson('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        cart,
        deliveryMode,
        customerName,
        customerPhone,
        address,
        userEmail,
        bonusToSpend: _clubMember ? _bonusSpend : 0,
      }),
    });

    if (typeof data.bonus_points === 'number') {
      const prev = JSON.parse(localStorage.getItem('yanki_user') || '{}');
      localStorage.setItem(
        'yanki_user',
        JSON.stringify({ ...prev, bonus_points: data.bonus_points })
      );
    }

    const url = data?.confirmation_url;
    if (!url) throw new Error('Не удалось получить ссылку на оплату');
    window.location.href = url;
  } catch (err) {
    showToast(err?.message || 'Ошибка оплаты', 'error');
  } finally {
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.textContent = 'Перейти к оплате';
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  (async () => {
    await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());
    if (typeof window.isUserLoggedIn === 'function' && !window.isUserLoggedIn()) {
      if (typeof window.setPostAuthRedirect === 'function') {
        window.setPostAuthRedirect('checkout.html');
      }
      showToast('Войдите или зарегистрируйтесь для оформления заказа', 'error');
      if (typeof window.openAuthModal === 'function') window.openAuthModal();
      return;
    }
    const cart = getCart();
    if (!cart.length) {
      window.location.href = 'cart.html';
      return;
    }

    initBonusBlock();

    document.querySelectorAll('input[name="deliveryMode"]').forEach((el) => {
      el.addEventListener('change', syncDeliveryFields);
    });

    const form = document.getElementById('checkoutForm');
    if (form) form.addEventListener('submit', submitCheckout);

    syncDeliveryFields();
    renderSummary();
  })();
});

window.renderSummary = renderSummary;
