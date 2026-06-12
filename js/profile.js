async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Ошибка запроса');
  return data;
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('yanki_user') || 'null');
  } catch {
    return null;
  }
}

function setUser(u) {
  if (u) localStorage.setItem('yanki_user', JSON.stringify(u));
}

function fillForm(u) {
  const n = document.getElementById('pfName');
  const e = document.getElementById('pfEmailDisplay');
  const b = document.getElementById('pfBonus');
  const club = document.getElementById('pfClubStatus');
  if (n) n.value = u.full_name || '';
  if (e) e.textContent = u.email || '';
  if (b) b.textContent = Number(u.bonus_points || 0).toLocaleString('ru-RU');
  if (club)
    club.textContent = u.club_member
      ? 'Участник RiiFKey Club'
      : 'Карта не оформлена — перейдите в раздел клуба';
}

async function init() {
  let user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  await (window.ensureProductsLoaded ? window.ensureProductsLoaded() : Promise.resolve());
  fillForm(user);

  document.getElementById('pfSendPwdCodeBtn')?.addEventListener('click', async () => {
    const u = getUser();
    try {
      const data = await apiJson('/api/auth/password-change/request-code', {
        method: 'POST',
        body: JSON.stringify({ email: u.email }),
      });
      let msg = data?.message || 'Код отправлен на почту';
      if (data?.delivered === false) msg += ' (SMTP не настроен на сервере)';
      showToast(msg, 'success');
    } catch (err) {
      showToast(err?.message || 'Не удалось отправить код', 'error');
    }
  });

  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = getUser();
    const body = {
      email: u.email,
      full_name: document.getElementById('pfName').value.trim(),
    };
    const newPwd = document.getElementById('pfNewPwd').value.trim();
    const pwdCode = document.getElementById('pfPwdCode').value.trim();
    try {
      const data = await apiJson('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setUser(data.user);
      if (newPwd) {
        if (!pwdCode) return showToast('Введите код из письма для смены пароля', 'error');
        const pwdResp = await apiJson('/api/auth/password-change/confirm', {
          method: 'POST',
          body: JSON.stringify({ email: u.email, code: pwdCode, newPassword: newPwd }),
        });
        setUser(pwdResp.user);
      }
      showToast('Профиль сохранён', 'success');
      fillForm(data.user);
      document.getElementById('pfNewPwd').value = '';
      const codeEl = document.getElementById('pfPwdCode');
      if (codeEl) codeEl.value = '';
    } catch (err) {
      showToast(err?.message || 'Ошибка', 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
