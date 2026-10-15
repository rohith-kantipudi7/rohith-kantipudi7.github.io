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

  /* ---------- sidebar: collapsible on desktop, drawer on mobile ----------
     Desktop (>=1024px): open by default, the header button collapses or
     expands it and the choice is persisted. Mobile: overlay drawer, closed
     by default, with scrim / Escape / link-click to dismiss. */
  var navToggle = document.getElementById('nav-toggle');
  var sidebar = document.getElementById('sidebar');
  var scrim = document.getElementById('scrim');
  var mqDesktop = window.matchMedia('(min-width: 1024px)');

  function sidebarOpen() {
    return mqDesktop.matches
      ? !document.documentElement.classList.contains('sidebar-collapsed')
      : document.body.classList.contains('drawer-open');
  }

  function syncToggle() {
    if (navToggle) navToggle.setAttribute('aria-expanded', String(sidebarOpen()));
  }

  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
    if (scrim) scrim.hidden = !open;
    syncToggle();
  }

  if (navToggle && sidebar) {
    navToggle.addEventListener('click', function () {
      if (mqDesktop.matches) {
        var collapsed = document.documentElement.classList.toggle('sidebar-collapsed');
        try { localStorage.setItem('sac-sidebar', collapsed ? 'closed' : 'open'); } catch (e) {}
        syncToggle();
      } else {
        setDrawer(!document.body.classList.contains('drawer-open'));
      }
    });
    if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mqDesktop.matches) setDrawer(false);
    });
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a') && !mqDesktop.matches) setDrawer(false);
    });
    var onBreakpoint = function () { setDrawer(false); };
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onBreakpoint);
    syncToggle();
  }

  /* ---------- footer year ---------- */
  var y = String(new Date().getFullYear());
  document.querySelectorAll('.year, #year').forEach(function (n) { n.textContent = y; });

  /* ---------- service worker ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
