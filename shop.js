const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const allProducts = sections.flatMap(s => s.items);
const byId = (id) => allProducts.find(p => p.img === id);
let cartData = load('hm_cart', {});
let favData = load('hm_fav', []);
let user = load('hm_user', null);
let afterAuth = null;
let detailQty = 1;

const modalEl = $('#modal');
function openModal(html, small) {
  modalEl.innerHTML = `<div class="m-box ${small ? 'sm' : ''}"><button class="m-x" data-act="close" aria-label="إغلاق">×</button>${html}</div>`;
  modalEl.hidden = false; document.body.style.overflow = 'hidden';
}
function closeModal() { modalEl.hidden = true; modalEl.innerHTML = ''; document.body.style.overflow = ''; }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2000);
}
const thumb = (p) => imgTag(p.img, 'صورة');
const cartTotal = () => Object.entries(cartData).reduce((s, [id, q]) => s + (byId(id)?.price || 0) * q, 0);

function saveCart() {
  save('hm_cart', cartData);
  $('#cartCount').textContent = Object.values(cartData).reduce((a, b) => a + b, 0);
}
function saveFav() {
  save('hm_fav', favData);
  $('#wishCount').textContent = favData.length;
}
function addToCart(id, n = 1) { cartData[id] = (cartData[id] || 0) + n; saveCart(); toast('تمت الإضافة للسلة ✓'); }
function toggleFav(id) {
  const idx = favData.indexOf(id);
  if (idx > -1) { favData.splice(idx, 1); toast('تم الإزالة من المفضلة'); }
  else { favData.push(id); toast('تمت الإضافة للمفضلة ❤️'); }
  saveFav();
}

function showCart() {
  const rows = Object.entries(cartData).filter(([id]) => byId(id)).map(([id, q]) => {
    const p = byId(id);
    return `<div class="crow"><div class="t">${thumb(p)}</div>
      <div>${esc(p.name)}<small>${p.price} ج.م</small></div>
      <div class="qty"><button data-act="cdec" data-id="${esc(id)}">−</button><b>${q}</b><button data-act="cinc" data-id="${esc(id)}">+</button></div>
      <button class="del" data-act="cdel" data-id="${esc(id)}">حذف</button></div>`;
  }).join('');
  openModal(`<h2>سلة المشتريات</h2>` + (rows
    ? rows + `<div class="total"><span>الإجمالي</span><span>${cartTotal()} ج.م</span></div><button class="m-btn" data-act="checkout">إتمام الطلب</button>`
    : `<div class="empty">السلة فاضية — ضيف منتجات وارجع هنا.</div>`));
}

function showWishlist() {
  const rows = favData.map(id => byId(id)).filter(Boolean).map(p => `
    <div class="sr" data-act="prod" data-id="${esc(p.img)}">
      <div class="t">${thumb(p)}</div>
      <div style="flex:1">${esc(p.name)}<small style="display:block;color:#888">${p.price} ج.م</small></div>
      <button class="add" data-act="addcart" data-id="${esc(p.img)}">أضف للسلة</button>
    </div>`).join('');
  openModal(`<h2>المفضلة</h2>` + (rows || `<div class="empty">ليس لديك منتجات في المفضلة.</div>`));
}

function showProduct(id) {
  const p = byId(id); if (!p) return; detailQty = 1;
  openModal(`<div class="pd"><div class="pd-img">${thumb(p)}</div><div>
    <h2>${esc(p.name)}</h2><p>${esc(p.desc)}</p><span class="price">${p.price} ج.م</span>
    <div class="qty"><button data-act="dminus">−</button><b id="dq">1</b><button data-act="dplus">+</button></div>
    <button class="m-btn" data-act="dadd" data-id="${esc(id)}">أضف للسلة</button></div></div>`);
}

function showAuth(tab = 'login') {
  const reg = tab === 'register';
  openModal(`<div class="tabs"><button class="${reg ? '' : 'on'}" data-act="tlogin">تسجيل دخول</button><button class="${reg ? 'on' : ''}" data-act="treg">إنشاء حساب</button></div>
    <form data-form="${tab}">
      ${reg ? '<label>الاسم</label><input name="name" required>' : ''}
      <label>رقم الموبايل</label><input name="phone" inputmode="tel" placeholder="01XXXXXXXXX" required>
      <label>كلمة المرور</label><input name="pass" type="password" required>
      <div class="err" id="err"></div>
      <button class="m-btn">${reg ? 'إنشاء الحساب' : 'دخول'}</button></form>`, true);
}
function showAccount() {
  const orders = load('hm_orders', []).filter(o => o.phone === user.phone);
  openModal(`<h2>أهلاً ${esc(user.name)}</h2><p>${esc(user.phone)}</p>
    <h3 style="margin:14px 0 6px">طلباتي السابقة</h3>` +
    (orders.length ? orders.map(o => `<div class="sr"><div>طلب #${o.id}<small style="display:block;color:#888">${o.date} — ${o.total} ج.م</small></div></div>`).join('') : '<div class="empty">لسه معندكش طلبات.</div>') +
    `<button class="m-btn ghost" data-act="logout">تسجيل خروج</button>`, true);
}
function renderUser() {
  $('#loginTxt').textContent = user ? user.name : 'تسجيل دخول';
  $('#registerLink').hidden = !!user;
}

function showCheckout() {
  if (!Object.keys(cartData).length) return showCart();
  if (!user) { afterAuth = showCheckout; return showAuth('login'); }
  openModal(`<h2>إتمام الطلب</h2><form data-form="order">
    <label>عنوان التوصيل</label><textarea name="addr" rows="2" required></textarea>
    <label>ملاحظات (اختياري)</label><input name="note">
    <div class="total"><span>الإجمالي</span><span>${cartTotal()} ج.م</span></div>
    <p style="font-size:13px;color:#888">الدفع عند الاستلام</p>
    <button class="m-btn">تأكيد الطلب</button></form>`, true);
}

function doSearch() {
  const q = $('#searchInput').value.trim(); if (!q) return;
  const res = allProducts.filter(p => (p.name + p.desc).includes(q));
  openModal(`<h2>نتائج البحث عن "${esc(q)}"</h2>` + (res.length
    ? res.map(p => `<div class="sr" data-act="prod" data-id="${esc(p.img)}"><div class="t">${thumb(p)}</div><div>${esc(p.name)}<small style="display:block;color:#888">${p.price} ج.م</small></div></div>`).join('')
    : '<div class="empty">مفيش نتائج مطابقة.</div>'));
}

const actions = {
  close: closeModal,
  prod: (el) => showProduct(el.dataset.id),
  dplus: () => $('#dq').textContent = ++detailQty,
  dminus: () => { if (detailQty > 1) $('#dq').textContent = --detailQty; },
  dadd: (el) => { addToCart(el.dataset.id, detailQty); closeModal(); },
  addcart: (el) => { addToCart(el.dataset.id); },
  togglefav: (el) => { toggleFav(el.dataset.id); },
  cinc: (el) => { cartData[el.dataset.id]++; saveCart(); showCart(); },
  cdec: (el) => { if (--cartData[el.dataset.id] <= 0) delete cartData[el.dataset.id]; saveCart(); showCart(); },
  cdel: (el) => { delete cartData[el.dataset.id]; saveCart(); showCart(); },
  checkout: showCheckout,
  tlogin: () => showAuth('login'),
  treg: () => showAuth('register'),
  logout: () => { user = null; localStorage.removeItem('hm_user'); renderUser(); closeModal(); toast('تم تسجيل الخروج'); }
};

modalEl.addEventListener('click', (e) => {
  if (e.target === modalEl) return closeModal();
  const a = e.target.closest('[data-act]'); if (a) actions[a.dataset.act]?.(a);
});

modalEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), type = e.target.dataset.form;
  const err = (m) => $('#err').textContent = m;
  const users = load('hm_users', []);

  if (type === 'register') {
    if (!/^01[0125]\d{8}$/.test(f.phone)) return err('رقم الموبايل غير صحيح');
    if (f.pass.length < 6) return err('كلمة المرور لازم 6 حروف على الأقل');
    if (users.some(u => u.phone === f.phone)) return err('الرقم ده مسجّل قبل كده');
    users.push({ name: f.name.trim(), phone: f.phone, pass: f.pass }); save('hm_users', users);
    user = { name: f.name.trim(), phone: f.phone };
  } else if (type === 'login') {
    const u = users.find(u => u.phone === f.phone && u.pass === f.pass);
    if (!u) return err('الرقم أو كلمة المرور غلط');
    user = { name: u.name, phone: u.phone };
  } else if (type === 'order') {
    const orders = load('hm_orders', []), id = 1000 + orders.length + 1;
    orders.push({ id, phone: user.phone, items: cartData, total: cartTotal(), addr: f.addr, note: f.note, date: new Date().toLocaleDateString('ar-EG') });
    save('hm_orders', orders); cartData = {}; saveCart();
    return openModal(`<div class="empty"><h2>تم استلام طلبك بنجاح ✓</h2>رقم الطلب #${id}<br>هنتواصل معاك على ${esc(user.phone)}</div>`, true);
  }
  save('hm_user', user); renderUser(); closeModal(); toast('أهلاً ' + user.name);
  if (afterAuth) { const fn = afterAuth; afterAuth = null; fn(); }
});

$('#loginLink').onclick = (e) => { e.preventDefault(); user ? showAccount() : showAuth('login'); };
$('#registerLink').onclick = (e) => { e.preventDefault(); showAuth('register'); };
$('#cartLink').onclick = (e) => { e.preventDefault(); showCart(); };
$('#wishlistLink').onclick = (e) => { e.preventDefault(); showWishlist(); };
$('#searchBtn').onclick = doSearch;
$('#searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card || e.target.closest('[data-act]')) return;
  showProduct(card.dataset.id);
});

saveCart(); saveFav(); renderUser();
