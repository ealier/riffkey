// Fake payment API (client-only). Replace with real provider later.
async function payByCard({ amountRub, cardNumber, cardName, cardExp, cardCvc }) {
  // Basic validation: not real PCI validation, just UX guardrails.
  const digits = String(cardNumber || '').replace(/\s+/g, '');
  if (digits.length < 12) throw new Error('Введите номер карты');
  if (!cardName || String(cardName).trim().length < 2) throw new Error('Введите имя на карте');
  if (!/^\d{2}\/\d{2}$/.test(String(cardExp || '').trim())) throw new Error('Срок действия в формате MM/YY');
  if (!/^\d{3,4}$/.test(String(cardCvc || '').trim())) throw new Error('CVC должен быть 3–4 цифры');
  if (!amountRub || Number(amountRub) <= 0) throw new Error('Некорректная сумма');

  await new Promise((r) => setTimeout(r, 900));

  return {
    success: true,
    transactionId: 'TX' + Math.floor(Math.random() * 1e9).toString(10).padStart(9, '0'),
  };
}

window.payByCard = payByCard;

