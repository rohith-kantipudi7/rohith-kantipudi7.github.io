/* Runs synchronously in <head> before first paint: restores the saved
   theme and sidebar state so there is no flash of the wrong mode.
   Kept external (not inline) so pages can ship a strict CSP. */
(function () {
  try {
    var t = localStorage.getItem('sac-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    if (localStorage.getItem('sac-sidebar') === 'closed') {
      document.documentElement.classList.add('sidebar-collapsed');
    }
  } catch (e) { /* storage unavailable */ }
})();
