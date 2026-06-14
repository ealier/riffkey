/**
 * Простой помощник по сайту YANKI: ответы по ключевым словам (без внешнего API).
 */
(function () {
  'use strict';

  const RULES = [
    {
      re: /привет|здравствуй|добрый|hello|hi\b/i,
      text: 'Здравствуйте! Я помощник YANKI. Спросите про доставку, корзину, оплату, возврат или напишите «контакты».',
    },
    {
      re: /доставк|когда привез|сколько ждать|срок|идёт достав|курьер|пункт выдач|сдэк|почт/i,
      text:
        'Доставка курьером обычно 1–3 дня, в пункт выдачи — 2–5 дней. Самовывоз бесплатно. Заказ от 5 000 ₽ часто идёт с бесплатной доставкой. Подробности на странице «Доставка».',
      link: { href: 'delivery.html', label: 'Открыть доставку' },
    },
    {
      re: /корзин|корзина|где.*корз|добавить.*товар|оформ/i,
      text:
        'Корзина — иконка с сумкой в правом верхнем углу экрана. Там же счётчик товаров. Перейти можно и по ссылке ниже.',
      link: { href: 'cart.html', label: 'Перейти в корзину' },
    },
    {
      re: /каталог|товар|найти|плать|размер|новинк|распродаж/i,
      text: 'Каталог открывается из меню (три полоски слева) или по кнопке на главной. Есть фильтры и поиск.',
      link: { href: 'catalog.html', label: 'Открыть каталог' },
    },
    {
      re: /избранн|лайк|сердечк/i,
      text: 'Избранное — иконка сердца справа в шапке. Добавленные товары сохраняются в браузере.',
      link: { href: 'favorites.html', label: 'Избранное' },
    },
    {
      re: /оплат|плат|карт|юкасс|yookassa|юmoney|yoomoney/i,
      text: 'Оплата на сайте доступна через ЮMoney (ЮKassa): банковская карта или кошелёк.',
      link: { href: 'payment.html', label: 'Способы оплаты' },
    },
    {
      re: /возврат|вернуть|обмен/i,
      text: 'Условия возврата и сроки — на странице «Возврат товара».',
      link: { href: 'returns.html', label: 'Возврат' },
    },
    {
      re: /заказ|как заказ|оформить заказ/i,
      text: 'Как оформить заказ — пошагово на отдельной странице.',
      link: { href: 'order.html', label: 'Как сделать заказ' },
    },
    {
      re: /контакт|телефон|адрес|почт|написать|связ|магазин|оренбург|самовывоз/i,
      text: 'Телефон 79510337306, почта arshanovraf@bk.ru. Адрес: Оренбург, ул. Советская, 27.',
      link: { href: 'contacts.html', label: 'Контакты' },
    },
    {
      re: /вопрос|faq|часто/i,
      text: 'Ответы на частые вопросы собраны на странице FAQ.',
      link: { href: 'faq.html', label: 'FAQ' },
    },
    {
      re: /войти|регистрац|аккаунт|логин|профиль/i,
      text: 'Вход и регистрация — по иконке человека в правом верхнем углу. Личный кабинет: раздел «Профиль» в меню аккаунта.',
      link: { href: 'profile.html', label: 'Профиль' },
    },
    {
      re: /балл|бонус|клуб|yanki club|ярнки клаб/i,
      text: 'RiiFKey Club: карта за 1 ₽, за каждые 1500 ₽ начисляется 150 бонусов, списание до 50% заказа. Подробности на странице клуба.',
      link: { href: 'club.html', label: 'RiiFKey Club' },
    },
    {
      re: /работа|время|часы|когда работ/i,
      text: 'Поддержка на линии ежедневно 10:00–22:00. Пишите на arshanovraf@bk.ru — ответим в течение дня.',
    },
  ];

  const DEFAULT_REPLY =
    'Я отвечаю на вопросы про магазин YANKI: доставка, корзина, оплата, возвраты, контакты. Переформулируйте вопрос или откройте раздел «FAQ».';

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function answerFor(text) {
    const q = String(text || '').trim();
    if (!q) return { html: escapeHtml('Напишите вопрос в поле ниже.') };
    for (let i = 0; i < RULES.length; i++) {
      const r = RULES[i];
      if (r.re.test(q)) {
        let html = '<p>' + escapeHtml(r.text) + '</p>';
        if (r.link) {
          html +=
            '<p class="support-chat-link-wrap"><a class="support-chat-link" href="' +
            escapeHtml(r.link.href) +
            '">' +
            escapeHtml(r.link.label) +
            '</a></p>';
        }
        return { html };
      }
    }
    return { html: '<p>' + escapeHtml(DEFAULT_REPLY) + '</p>' };
  }

  function ensureRoot() {
    let root = document.getElementById('supportChatRoot');
    if (root) return root;

    root = document.createElement('div');
    root.id = 'supportChatRoot';
    root.className = 'support-chat-root';
    root.innerHTML = `
      <button type="button" class="support-chat-fab" id="supportChatFab" aria-expanded="false" aria-controls="supportChatPanel" title="Поддержка">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="support-chat-fab-label">Поддержка</span>
      </button>
      <div class="support-chat-panel" id="supportChatPanel" role="dialog" aria-modal="true" aria-labelledby="supportChatTitle" hidden>
        <div class="support-chat-head">
          <div>
            <div class="support-chat-title" id="supportChatTitle">Помощник YANKI</div>
            <div class="support-chat-sub">Отвечаю на вопросы по сайту</div>
          </div>
          <button type="button" class="support-chat-close" id="supportChatClose" aria-label="Закрыть">✕</button>
        </div>
        <div class="support-chat-messages" id="supportChatMessages"></div>
        <form class="support-chat-form" id="supportChatForm">
          <input type="text" id="supportChatInput" maxlength="500" placeholder="Например: сколько идёт доставка?" autocomplete="off" />
          <button type="submit" class="support-chat-send">→</button>
        </form>
      </div>
    `;
    document.body.appendChild(root);
    return root;
  }

  function appendBubble(container, role, html) {
    const wrap = document.createElement('div');
    wrap.className = 'support-chat-bubble support-chat-bubble--' + role;
    wrap.innerHTML = html;
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  function init() {
    const root = ensureRoot();
    const fab = document.getElementById('supportChatFab');
    const panel = document.getElementById('supportChatPanel');
    const closeBtn = document.getElementById('supportChatClose');
    const messages = document.getElementById('supportChatMessages');
    const form = document.getElementById('supportChatForm');
    const input = document.getElementById('supportChatInput');

    const intro = answerFor('привет');
    appendBubble(messages, 'bot', intro.html);

    function openPanel() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      input.focus();
    }

    function closePanel() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel();
    });
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      appendBubble(messages, 'user', '<p>' + escapeHtml(q) + '</p>');
      input.value = '';
      const { html } = answerFor(q);
      setTimeout(() => appendBubble(messages, 'bot', html), 280);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) closePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
