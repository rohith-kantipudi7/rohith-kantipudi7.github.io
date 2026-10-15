/* Shared behaviour for every page: theme toggle, sidebar drawer,
   footer year, reveal-on-scroll, service worker. No dependencies. */
(function () {
  'use strict';

  /* ---------- theme toggle ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-theme') || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sac-theme', next); } catch (e) {}
      window.dispatchEvent(new CustomEvent('themechange'));
    });
  }

  /* ---------- sidebar drawer (mobile) ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var sidebar = document.getElementById('sidebar');
  var scrim = document.getElementById('scrim');

  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
    if (navToggle) navToggle.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.hidden = !open;
  }

  if (navToggle && sidebar) {
    navToggle.addEventListener('click', function () {
      setDrawer(!document.body.classList.contains('drawer-open'));
    });
    if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(false);
    });
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });
  }

  /* ---------- footer year ---------- */
  var y = String(new Date().getFullYear());
  document.querySelectorAll('.year, #year').forEach(function (n) { n.textContent = y; });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      revealEls.forEach(function (n) { io.observe(n); });
    } else {
      revealEls.forEach(function (n) { n.classList.add('in'); });
    }
  }

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
