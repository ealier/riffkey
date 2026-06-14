const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git']);

const replacements = [
  ['Москва, ул. Примерная, 1', 'Оренбург, ул. Советская, 27'],
  ['Оренбург, ул. Гаранькина 25', 'Оренбург, ул. Советская, 27'],
  ['Оренбург, ул. Советская, 27 (центр)', 'Оренбург, ул. Советская, 27'],
  ['Весна-Лето 2025', 'Весна-Лето 2026'],
  ['TRENDS 2025', 'TRENDS 2026'],
  ['© 2025 YANKI. Все права защищены.', '© 2026 RiiFKey. Все права защищены.'],
  ['© 2025 YANKI', '© 2026 RiiFKey'],
  [
    '<div class="footer-payments"><div class="footer-payment">VISA</div><div class="footer-payment">MC</div><div class="footer-payment">MIR</div><div class="footer-payment">SBP</div></div>',
    '<div class="footer-payments"><div class="footer-payment">ЮMoney</div></div>',
  ],
  [
    `<div class="footer-payment">VISA</div>
          <div class="footer-payment">MC</div>
          <div class="footer-payment">MIR</div>
          <div class="footer-payment">SBP</div>`,
    '<div class="footer-payment">ЮMoney</div>',
  ],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
  }
}
console.log('Updated', changed, 'html files');
