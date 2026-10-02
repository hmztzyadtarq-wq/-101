/* ============================================================
   shop.js - الوظائف: تسجيل / دخول / سلة / صفحة منتج / طلب / بحث
   ⚠ البيانات بتتخزن في localStorage (جوه متصفح العميل) للعرض التجريبي.
   عشان موقع حقيقي لازم سيرفر + قاعدة بيانات (شوف الشرح في الرد).
   ============================================================ */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- الحالة ---------- */
const allProducts = sections.flatMap(s => s.items);              // كل المنتجات من script.js
const byId = (id) => allProducts.find(p => p.img === id);        // المنتج بيتعرف بمسار صورته
let cartData = load('hm_cart', {});                              // { id: كمية }
let user = load('hm_user', null);                                // المستخدم المسجّل دخول
let afterAuth = null;                                            // اعمل إيه بعد الدخول (مثلاً كمّل الطلب)
let detailQty = 1;

/* ---------- أدوات ---------- */
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
const thumb = (p) => imgTag(p.img, 'صورة');                      // imgTag من script.js
const cartTotal = () => Object.entries(cartData).reduce((s, [id, q]) => s + (byId(id)?.price || 0) * q, 0);

/* ---------- السلة ---------- */
function saveCart() {
  save('hm_cart', cartData);
  $('#cartCount').textContent = Object.values(cartData).reduce((a, b) => a + b, 0);
}
function addToCart(id, n = 1) { cartData[id] = (cartData[id] || 0) + n; saveCart(); toast('تمت الإضافة للسلة ✓'); }

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

/* ---------- صفحة المنتج ---------- */
function showProduct(id) {
  const p = byId(id); if (!p) return; detailQty = 1;
  openModal(`<div class="pd"><div class="pd-img">${thumb(p)}</div><div>
    <h2>${esc(p.name)}</h2><p>${esc(p.desc)}</p><span class="price">${p.price} ج.م</span>
    <div class="qty"><button data-act="dminus">−</button><b id="dq">1</b><button data-act="dplus">+</button></div>
    <button class="m-btn" data-act="dadd" data-id="${esc(id)}">أضف للسلة</button></div></div>`);
}

/* ---------- تسجيل / دخول / حساب ---------- */
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
    <h3 style="margin:14px 0 6px">طلباتي</h3>` +
    (orders.length ? orders.map(o => `<div class="sr"><div>طلب #${o.id}<small style="display:block;color:#888">${o.date} — ${o.total} ج.م</small></div></div>`).join('') : '<div class="empty">لسه معندكش طلبات.</div>') +
    `<button class="m-btn ghost" data-act="logout">تسجيل خروج</button>`, true);
}
function renderUser() {
  $('#loginTxt').textContent = user ? user.name : 'تسجيل دخول';
  $('#registerLink').hidden = !!user;
}

/* ---------- إتمام الطلب ---------- */
function showCheckout() {
  if (!Object.keys(cartData).length) return showCart();
  if (!user) { afterAuth = showCheckout; return showAuth('login'); }   // لازم يسجل الأول
  openModal(`<h2>إتمام الطلب</h2><form data-form="order">
    <label>عنوان التوصيل</label><textarea name="addr" rows="2" required></textarea>
    <label>ملاحظات (اختياري)</label><input name="note">
    <div class="total"><span>الإجمالي</span><span>${cartTotal()} ج.م</span></div>
    <p style="font-size:13px;color:#888">الدفع عند الاستلام</p>
    <button class="m-btn">تأكيد الطلب</button></form>`, true);
}

/* ---------- البحث ---------- */
function doSearch() {
  const q = $('#searchInput').value.trim(); if (!q) return;
  const res = allProducts.filter(p => (p.name + p.desc).includes(q));
  openModal(`<h2>نتائج البحث عن "${esc(q)}"</h2>` + (res.length
    ? res.map(p => `<div class="sr" data-act="prod" data-id="${esc(p.img)}"><div class="t">${thumb(p)}</div><div>${esc(p.name)}<small style="display:block;color:#888">${p.price} ج.م</small></div></div>`).join('')
    : '<div class="empty">مفيش نتائج.</div>'));
}

/* ---------- الأوامر (أي عنصر عليه data-act) ---------- */
const actions = {
  close: closeModal,
  prod: (el) => showProduct(el.dataset.id),
  dplus: () => $('#dq').textContent = ++detailQty,
  dminus: () => { if (detailQty > 1) $('#dq').textContent = --detailQty; },
  dadd: (el) => { addToCart(el.dataset.id, detailQty); closeModal(); },
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

/* ---------- الفورمات ---------- */
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
    return openModal(`<div class="empty"><h2>تم استلام طلبك ✓</h2>رقم الطلب #${id}<br>هنتواصل معاك على ${esc(user.phone)}</div>`, true);
  }
  save('hm_user', user); renderUser(); closeModal(); toast('أهلاً ' + user.name);
  if (afterAuth) { const fn = afterAuth; afterAuth = null; fn(); }
});

/* ---------- ربط الصفحة ---------- */
$('#loginLink').onclick = (e) => { e.preventDefault(); user ? showAccount() : showAuth('login'); };
$('#registerLink').onclick = (e) => { e.preventDefault(); showAuth('register'); };
$('#cartLink').onclick = (e) => { e.preventDefault(); showCart(); };
$('#searchBtn').onclick = doSearch;
$('#searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ضغطة على الكارت تفتح صفحة المنتج، وعلى "أضف للسلة" تضيف مباشرة
document.addEventListener('click', (e) => {
  const card = e.target.closest('.card'); if (!card) return;
  e.target.closest('.add') ? addToCart(card.dataset.id) : showProduct(card.dataset.id);
});

saveCart(); renderUser();

/* ============================================================
   الصفحات الداخلية - كل لينك بيفتح صفحة حقيقية (مفيش 404)
   ============================================================ */
const pageEl = $('#page');

// 🗂 كل منتج تابع لأنهي قسم (غيّرها لما تضيف منتجات)
const catMap = {
  'بسبوسة بالقشطة': 'حلويات مصرية', 'كنافة نابلسي': 'حلويات مصرية', 'علبة مشكل شرقي': 'حلويات مصرية',
  'جلاش بالمكسرات': 'حلويات مصرية', 'أم علي': 'حلويات مصرية',
  'تشيز كيك': 'حلويات غربية', 'كب كيك': 'حلويات غربية', 'دونات مشكل': 'حلويات غربية',
  'تارت فواكه': 'حلويات غربية', 'تورتة شيكولاته': 'حلويات غربية',
  'خبز الحبة الكاملة': 'مخبوزات', 'بسكوت بالسمسم': 'مخبوزات', 'كرواسون بالزبدة': 'مخبوزات',
  'بوكس شيكولاته': 'شيكولاته', 'حلقوم وملبن': 'ميكس سويت', 'آيس كريم مانجو': 'آيس كريم'
};
// القائمة المنسدلة: كل بند بيدور بكلمة
const subMap = { 'بسبوسه': 'بسبوس', 'كنافه': 'كنافة', 'جلاش': 'جلاش', 'علب مشكل': 'مشكل', 'مكس شرقي': 'مشكل', 'علب شرقي جاهزة': 'مشكل', 'اطباق': 'أم علي' };

// ✏ نصوص الصفحات التعريفية - عدّلها بمعلومات العميل
const infoPages = {
  'من نحن': '<p>حلو الملك بيقدّم أفضل الحلويات الشرقية والغربية والمخبوزات بأجود المكونات، وبنهتم بالطعم والجودة في كل منتج.</p>',
  'الفروع': '<h3>فرع مكرم عبيد</h3><p>مدينة نصر، القاهرة<br>اتصل بنا: 16312</p>',
  'وظائف': '<p>عايز تشتغل معانا؟ ابعتلنا بياناتك من صفحة "اتصل بنا" وهنراجعها.</p>',
  'الشروط والأحكام': '<p>بإتمامك الطلب فإنت بتوافق على بيانات التوصيل والأسعار المعروضة وقت الطلب. الأسعار قابلة للتغيير. لو في مشكلة في الطلب كلمنا خلال 24 ساعة من الاستلام.</p>',
  'سياسة الخصوصية': '<p>بنستخدم بياناتك (الاسم والموبايل والعنوان) لتوصيل طلبك والتواصل معاك بس، ومش بنشاركها مع أي جهة تانية.</p>'
};

function showPage(title, body) {
  home.hidden = true; notFound.hidden = true; pageEl.hidden = false;
  pageEl.innerHTML = `<div class="crumb"><a href="#" id="crumbHome">الرئيسية</a> / ${esc(title)}</div><h1 class="pg-title">${esc(title)}</h1>${body}`;
  window.scrollTo(0, 0);
}
// نخلّي زرار "الرجوع للرئيسية" واللوجو يقفلوا الصفحة الداخلية كمان
showHome = function () { pageEl.hidden = true; notFound.hidden = true; home.hidden = false; window.scrollTo(0, 0); };

const grid = (list, emptyMsg) => list.length
  ? `<div class="grid wrap">${list.map(productCard).join('')}</div>`   // productCard من script.js
  : `<div class="empty">${emptyMsg || 'المنتجات دي هتتضاف قريباً.'}</div>`;

function contactForm() {
  return `<div class="info"><p>اتصل بنا: 16312 — info@etoileeg.online</p>
    <form data-form="contact"><label>الاسم</label><input name="name" required>
    <label>الموبايل</label><input name="phone" required>
    <label>رسالتك</label><textarea name="msg" rows="3" required></textarea>
    <button class="m-btn">إرسال</button></form></div>`;
}

// 🧭 الراوتر: بياخد اسم اللينك ويفتح الصفحة المناسبة
function route(label, el) {
  if (label === 'اتصل بنا') return showPage(label, contactForm());
  if (infoPages[label]) return showPage(label, `<div class="info">${infoPages[label]}</div>`);
  if (label === 'عرض الكل') {                                   // "عرض الكل" جنب كل صف منتجات
    const t = el.closest('section').querySelector('h2').textContent;
    return showPage(t, grid(sections.find(s => s.title === t).items));
  }
  if (!label) return showPage('كل المنتجات', grid(allProducts));   // البانرات الإعلانية
  if (subMap[label]) {
    const list = allProducts.filter(p => p.name.includes(subMap[label]));
    return showPage(label, grid(list));
  }
  if (label === 'الخصومات') return showPage(label, grid([], 'مفيش عروض متاحة دلوقتي — تابعنا قريباً.'));
  showPage(label, grid(allProducts.filter(p => catMap[p.name] === label)));   // أي قسم تاني
}

// بنلقط كل ضغطة على data-nf قبل ما script.js يفتح 404
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-nf]'); if (!el) return;
  if (el.parentElement.classList.contains('has-drop') && isMobile()) return;   // موبايل: افتح القائمة الفرعية
  e.preventDefault(); e.stopImmediatePropagation();
  if (isMobile()) toggleMenu(false);
  route(el.textContent.trim().replace(/\s+/g, ' '), el);
}, true);

pageEl.addEventListener('click', (e) => { if (e.target.id === 'crumbHome') { e.preventDefault(); showHome(); } });
pageEl.addEventListener('submit', (e) => {                       // فورم اتصل بنا
  e.preventDefault();
  const msgs = load('hm_msgs', []); msgs.push(Object.fromEntries(new FormData(e.target))); save('hm_msgs', msgs);
  e.target.innerHTML = '<div class="empty">وصلتنا رسالتك ✓ هنرد عليك قريباً.</div>';
});

/* ---------- العنوان واللغة ---------- */
const areas = ['مكرم عبيد', 'مدينة نصر', 'التجمع الخامس', 'المعادي', 'الدقي'];   // ✏ عدّل المناطق
$('#areaTxt').textContent = load('hm_area', 'مكرم عبيد');
$('#areaLink').onclick = (e) => {
  e.preventDefault();
  openModal('<h2>اختار منطقتك</h2>' + areas.map(a => `<button class="area ${a === $('#areaTxt').textContent ? 'on' : ''}" data-act="area" data-v="${a}">${a}</button>`).join(''), true);
};
actions.area = (el) => { save('hm_area', el.dataset.v); $('#areaTxt').textContent = el.dataset.v; closeModal(); };
$('#langLink').onclick = (e) => { e.preventDefault(); toast('النسخة الإنجليزية هتتضاف قريباً'); };
