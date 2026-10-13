/* MAIN SCRIPT: mobile menu, announcement-banner offset, bubbles, van animation, scroll reveal, before/after sliders, form.
   No dependencies. Every block checks the element exists, so it is safe on every page. */
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Announcement banner: push the hero down by its height, keep the fixed header just below it until you scroll
const banner = $('#banner'), header = $('#header');
const bannerH = () => banner ? banner.offsetHeight : 0;
const place = () => { document.documentElement.style.setProperty('--banner-h', bannerH() + 'px'); header.style.top = Math.max(0, bannerH() - scrollY) + 'px'; };
place(); addEventListener('scroll', place, { passive: true }); addEventListener('resize', place);

// Mobile menu
const menu = $('#menu'), btn = $('#menu-btn');
btn.addEventListener('click', () => { const open = menu.classList.toggle('hidden') === false; btn.setAttribute('aria-expanded', open); });
$$('#menu a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));

// Header turns solid after scrolling
const solid = () => header.classList.toggle('bg-ink/80', scrollY > 24);
addEventListener('scroll', solid, { passive: true }); solid();

// Hero bubbles (decorative, only behind the house). Change 12 for more/fewer.
const bub = $('#bubbles');
if (bub) for (let i = 0; i < 12; i++) {
  const b = document.createElement('span'), s = 8 + Math.random() * 40;
  b.className = 'bubble';
  b.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 14}s;--x:${(Math.random() - .5) * 80}px`;
  bub.appendChild(b);
}

// Van: wait until the image has fully loaded (slow wifi!), THEN play the drive-in animation
const van = $('.van');
if (van) {
  const go = () => requestAnimationFrame(() => van.classList.add('loaded'));
  if (van.complete && van.naturalWidth) go(); else { van.addEventListener('load', go); van.addEventListener('error', go); }
}

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('[data-reveal]').forEach(el => io.observe(el));

// Before/after sliders: the range input drives a CSS variable
$$('.ba').forEach(ba => $('input', ba).addEventListener('input', e => ba.style.setProperty('--pos', e.target.value + '%')));

// Contact form: send visitors back to THIS site's thanks page, and stop double-clicks sending twice
const form = $('#quote-form');
if (form) {
  if (location.protocol.startsWith('http')) $('[name=_next]', form).value = new URL('/thanks.html', location.origin).href;
  form.addEventListener('submit', () => { const b = $('button[type=submit]', form); b.disabled = true; b.textContent = 'Sending...'; });
}
