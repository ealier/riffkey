async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Ошибка запроса');
  return data;
}

function formatCardDigits(userId) {
  const n = String(5500000000000000 + Number(userId || 0)).slice(-16);
  return n.replace(/(.{4})/g, '$1 ').trim();
}

function randomCardLike(mask) {
  return String(mask || '0000 0000 0000 0000').replace(/\d/g, () =>
    String(Math.floor(Math.random() * 10))
  );
}

function animateCardNumber(target) {
  const el = document.getElementById('clubCardNumber');
  if (!el) return;
  const finalValue = String(target || '').trim() || '0000 0000 0000 0000';
  let ticks = 0;
  const maxTicks = 14;
  const timer = setInterval(() => {
    ticks += 1;
    if (ticks >= maxTicks) {
      clearInterval(timer);
      el.textContent = finalValue;
      el.classList.remove('is-revealing');
      return;
    }
    el.classList.add('is-revealing');
    el.textContent = randomCardLike(finalValue);
  }, 65);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('yanki_user') || 'null');
  } catch {
    return null;
  }
}

function renderClub() {
  const user = getUser();
  if (!user) {
    const join = document.getElementById('clubJoinSection');
    if (join) {
      join.innerHTML =
        '<p class="page-hero-sub" style="margin-top:12px">Войдите в аккаунт, чтобы оформить карту RiiFKey Club.</p>' +
        '<button type="button" class="btn-account" onclick="openAuthModal()">Войти или зарегистрироваться</button>';
    }
    const numEl = document.getElementById('clubCardNumber');
    if (numEl) numEl.textContent = '•••• •••• •••• ••••';
    const nameEl = document.getElementById('clubCardName');
    if (nameEl) nameEl.textContent = 'Гость';
    return;
  }

  const nameEl = document.getElementById('clubCardName');
  const numEl = document.getElementById('clubCardNumber');
  const joinSec = document.getElementById('clubJoinSection');
  const badge = document.getElementById('clubMemberBadge');

  if (nameEl) nameEl.textContent = user.full_name || user.email;
  const cardNumber = user.club_card_number || formatCardDigits(user.id);

  if (user.club_member) {
    if (numEl) animateCardNumber(cardNumber);
    if (joinSec) joinSec.style.display = 'none';
    if (badge) badge.style.display = 'block';
  } else {
    if (numEl) numEl.textContent = '•••• •••• •••• ••••';
    if (joinSec) joinSec.style.display = 'block';
    if (badge) badge.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderClub();

  const btn = document.getElementById('clubPayBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const user = getUser();
      const pwd = document.getElementById('clubPwd')?.value || '';
      if (!user?.email) return showToast('Войдите в аккаунт', 'error');
      if (!pwd) return showToast('Введите пароль от аккаунта', 'error');

      btn.disabled = true;
      btn.textContent = 'Переход к оплате…';
      try {
        const data = await apiJson('/api/club/create-payment', {
          method: 'POST',
          body: JSON.stringify({ userEmail: user.email, password: pwd }),
        });
        const url = data?.confirmation_url;
        if (!url) throw new Error('Нет ссылки оплаты');
        window.location.href = url;
      } catch (e) {
        showToast(e?.message || 'Ошибка', 'error');
        btn.disabled = false;
        btn.textContent = 'Оформить карту за 1 ₽';
      }
    });
  }
});
