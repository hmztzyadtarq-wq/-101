/* ============================================================
   script.js - منطق الصفحة الرئيسية
   1) بيانات الصور والأقسام والمنتجات  ← هنا بتحط مسارات صورك
   2) رسم الصفحة
   3) السلايدر
   4) Not Found + السلة + الكوكيز
   ============================================================ */

/* ---------- دالة بترجّع مربع "مكان صورة" لو الصورة مش موجودة ---------- */
function phBox(label) {
  const d = document.createElement('div');
  d.className = 'ph';
  d.textContent = label || 'صورة';
  return d;
}
// بتعمل <img> وبتحط مكانها placeholder لو الملف مش موجود
function imgTag(src, label) {
  return `<img src="${src}" alt="" onerror="this.replaceWith(phBox('${label}'))">`;
}

/* ============================================================
   1) البيانات
   ============================================================ */

/* 🖼 صور البانر الرئيسي (السلايدر) - حط الصور في images/banners/ */
const banners = [
  'images/banners/banner-1.jpg',
  'images/banners/banner-2.jpg',
  'images/banners/banner-3.jpg'
];

/* 🖼 الأقسام الدائرية - صورة لكل قسم في images/categories/ */
const categories = [
  { name: 'حلويات مصرية', img: 'images/categories/1.jpg' },
  { name: 'حلويات غربية', img: 'images/categories/2.jpg' },
  { name: 'ميكس سويت',    img: 'images/categories/3.jpg' },
  { name: 'مخبوزات',      img: 'images/categories/4.jpg' },
  { name: 'شيكولاته',     img: 'images/categories/5.jpg' },
  { name: 'كحك 2026',     img: 'images/categories/6.jpg' },
  { name: 'المولد 2026',  img: 'images/categories/7.jpg' },
  { name: 'آيس كريم',     img: 'images/categories/8.jpg' }
];

/* 🖼 صفوف المنتجات - كل صف له عنوان ومنتجاته، والصورة في images/products/
   لإضافة صف جديد: انسخ كتلة { title, items } وعدّلها */
const sections = [
  {
    title: 'الأكثر مبيعاً',
    items: [
      { name: 'بسبوسة بالقشطة',   desc: 'بسبوسة طازجة بالقشطة',       price: 120, img: 'images/products/1.jpg', badge: 'الأكثر طلباً' },
      { name: 'كنافة نابلسي',      desc: 'كنافة بالجبنة والقطر',        price: 150, img: 'images/products/2.jpg' },
      { name: 'علبة مشكل شرقي',   desc: 'تشكيلة من الحلويات الشرقية', price: 320, img: 'images/products/3.jpg' },
      { name: 'جلاش بالمكسرات',   desc: 'جلاش مقرمش بالمكسرات',       price: 180, img: 'images/products/4.jpg' },
      { name: 'خبز الحبة الكاملة', desc: 'خبز صحي بالحبوب',            price: 45,  img: 'images/products/5.jpg', badge: 'جديد' },
      { name: 'بسكوت بالسمسم',    desc: 'بسكوت مقرمش بالسمسم',        price: 60,  img: 'images/products/6.jpg' },
      { name: 'تشيز كيك',         desc: 'تشيز كيك بالتوت',            price: 95,  img: 'images/products/7.jpg' },
      { name: 'بوكس شيكولاته',    desc: 'شيكولاته فاخرة',              price: 210, img: 'images/products/8.jpg' }
    ]
  },
  {
    title: 'وصل حديثاً',
    items: [
      { name: 'كرواسون بالزبدة', desc: 'كرواسون طازج',   price: 40,  img: 'images/products/9.jpg',  badge: 'جديد' },
      { name: 'آيس كريم مانجو',  desc: 'عبوة نص لتر',    price: 85,  img: 'images/products/10.jpg', badge: 'جديد' },
      { name: 'كب كيك',          desc: 'علبة ٦ قطع',     price: 110, img: 'images/products/11.jpg' },
      { name: 'دونات مشكل',      desc: 'علبة ٦ قطع',     price: 130, img: 'images/products/12.jpg' },
      { name: 'تارت فواكه',      desc: 'تارت بالكريمة',  price: 140, img: 'images/products/13.jpg' },
      { name: 'حلقوم وملبن',     desc: 'علبة هدايا',     price: 75,  img: 'images/products/14.jpg' },
      { name: 'تورتة شيكولاته',  desc: 'حجم وسط',        price: 350, img: 'images/products/15.jpg' },
      { name: 'أم علي',          desc: 'طبق فردي',       price: 55,  img: 'images/products/16.jpg' }
    ]
  }
];

/* ============================================================
   2) رسم الصفحة
   ============================================================ */

// كارت منتج واحد
function productCard(p) {
  return `
    <article class="card" data-id="${p.img}">
      <div class="card-img">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        ${imgTag(p.img, 'صورة المنتج')}
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="card-foot">
          <span class="price">${p.price} ج.م</span>
          <button class="add" type="button">أضف للسلة</button>
        </div>
      </div>
    </article>`;
}

// الأقسام الدائرية
document.getElementById('cats').innerHTML = categories.map(c => `
  <a href="#" data-nf class="cat">
    <div class="cat-img">${imgTag(c.img, c.name)}</div>${c.name}
  </a>`).join('');

// صفوف المنتجات
document.getElementById('productSections').innerHTML = sections.map(s => `
  <section class="container">
    <div class="sec-head"><h2>${s.title}</h2><a href="#" data-nf>عرض الكل</a></div>
    <div class="grid">${s.items.map(productCard).join('')}</div>
  </section>`).join('');

/* ============================================================
   3) السلايدر
   ============================================================ */
const slidesEl = document.getElementById('slides');
const dotsEl = document.getElementById('dots');
let current = 0, timer;

slidesEl.innerHTML = banners.map((src, i) =>
  `<div class="slide">${imgTag(src, 'مكان صورة البانر ' + (i + 1))}</div>`).join('');
dotsEl.innerHTML = banners.map((_, i) => `<i data-i="${i}"></i>`).join('');

function goTo(i) {
  current = (i + banners.length) % banners.length;
  slidesEl.style.transform = `translateX(${-current * 100}%)`;
  [...dotsEl.children].forEach((d, k) => d.classList.toggle('on', k === current));
}
function autoplay() { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 5000); }

document.getElementById('nextBtn').onclick = () => { goTo(current + 1); autoplay(); };
document.getElementById('prevBtn').onclick = () => { goTo(current - 1); autoplay(); };
dotsEl.onclick = (e) => { if (e.target.dataset.i) { goTo(+e.target.dataset.i); autoplay(); } };
goTo(0); autoplay();

/* ============================================================
   4) Not Found + السلة + الكوكيز
   ============================================================ */
const home = document.getElementById('home');
const notFound = document.getElementById('notfound');

function showNotFound() { home.hidden = true; notFound.hidden = false; window.scrollTo(0, 0); }
function showHome()     { notFound.hidden = true; home.hidden = false; window.scrollTo(0, 0); }

// أي عنصر عليه data-nf بيفتح Not Found
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-nf]')) { e.preventDefault(); showNotFound(); }
});
document.getElementById('backHome').addEventListener('click', (e) => { e.preventDefault(); showHome(); });
document.getElementById('logoLink').addEventListener('click', (e) => { e.preventDefault(); showHome(); });

// شريط الكوكيز
['allowCk', 'denyCk'].forEach(id =>
  document.getElementById(id).addEventListener('click', () =>
    document.getElementById('cookies').classList.add('hide')));

/* ============================================================
   5) الموبايل: قائمة الدرج + سحب البانر بالصباع
   ============================================================ */
const navEl = document.querySelector('.nav');
const overlay = document.getElementById('overlay');
const isMobile = () => window.innerWidth <= 900;

function toggleMenu(open) {
  navEl.classList.toggle('open', open);
  overlay.classList.toggle('show', open);
}
document.getElementById('burger').addEventListener('click', () => toggleMenu(!navEl.classList.contains('open')));
overlay.addEventListener('click', () => toggleMenu(false));

// في الموبايل: الضغط على "حلويات مصرية" بيفتح/يقفل القائمة الفرعية بدل Not Found
document.querySelector('.has-drop > a').addEventListener('click', (e) => {
  if (!isMobile()) return;
  e.preventDefault(); e.stopPropagation();
  e.currentTarget.parentElement.classList.toggle('open');
});
// الضغط على أي رابط تاني في القائمة بيقفلها
navEl.addEventListener('click', (e) => { if (e.target.closest('a') && isMobile()) toggleMenu(false); });

// سحب البانر بالصباع
let touchX = null;
slidesEl.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
slidesEl.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); autoplay(); }
  touchX = null;
});
