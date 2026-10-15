/* Calculator engine for all tool pages. Each init runs only when its
   root element exists, so one cached file serves every page. */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function num(id) {
    var el = $(id);
    if (!el) return NaN;
    var v = parseFloat(el.value);
    return isFinite(v) ? v : NaN;
  }

  function currencyOf(root) {
    var sel = root ? root.querySelector('.calc-currency') : null;
    return sel ? sel.value : 'INR';
  }

  function money(v, code, maxFrac) {
    try {
      return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency', currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: maxFrac != null ? maxFrac : 2
      }).format(v);
    } catch (e) { return v.toFixed(2); }
  }

  function plain(v, maxFrac) {
    try {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: maxFrac != null ? maxFrac : 2
      }).format(v);
    } catch (e) { return String(v); }
  }

  function out(id, text) { var el = $(id); if (el) el.textContent = text; }

  /* Live "reads as" hint under large money inputs, e.g. 2500000 -> ₹25,00,000 */
  document.querySelectorAll('input[data-echo]').forEach(function (inp) {
    var echo = document.createElement('div');
    echo.className = 'field-echo';
    inp.insertAdjacentElement('afterend', echo);
    var card = inp.closest('.calc-card');
    var sel = card ? card.querySelector('.calc-currency') : null;
    var update = function () {
      var v = parseFloat(inp.value);
      echo.textContent = (isFinite(v) && Math.abs(v) >= 1000)
        ? money(v, sel ? sel.value : 'INR', 0)
        : '';
    };
    inp.addEventListener('input', update);
    if (sel) sel.addEventListener('change', update);
    update();
  });

  /* Wire every input/select inside root to recalc, and run once. */
  function wire(rootId, recalc) {
    var root = $(rootId);
    if (!root) return false;
    root.addEventListener('input', recalc);
    root.addEventListener('change', recalc);
    recalc();
    return true;
  }

  /* ---------- profit / loss ---------- */
  wire('pl', function () {
    var c = currencyOf($('pl'));
    var qty = num('pl-qty'), buy = num('pl-buy'), sell = num('pl-sell');
    var charges = num('pl-charges'); if (!isFinite(charges)) charges = 0;
    if (!(qty > 0) || !(buy >= 0) || !(sell >= 0)) {
      ['pl-invested', 'pl-proceeds', 'pl-net', 'pl-pct'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var invested = qty * buy, proceeds = qty * sell;
    var net = proceeds - invested - charges;
    out('pl-invested', money(invested, c));
    out('pl-proceeds', money(proceeds, c));
    out('pl-net', (net >= 0 ? '+' : '−') + money(Math.abs(net), c));
    out('pl-pct', invested > 0 ? (net >= 0 ? '+' : '−') + plain(Math.abs(net / invested * 100)) + '%' : '—');
    var netEl = $('pl-net'), pctEl = $('pl-pct');
    [netEl, pctEl].forEach(function (el) {
      if (!el) return;
      el.classList.toggle('pos', net > 0);
      el.classList.toggle('neg', net < 0);
    });
  });

  /* ---------- SIP ---------- */
  wire('sip', function () {
    var c = currencyOf($('sip'));
    var p = num('sip-amount'), r = num('sip-rate'), y = num('sip-years');
    if (!(p > 0) || !(r >= 0) || !(y > 0)) {
      ['sip-invested', 'sip-value', 'sip-gain'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var i = r / 1200, n = Math.round(y * 12);
    var fv = i === 0 ? p * n : p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    out('sip-invested', money(p * n, c, 0));
    out('sip-value', money(fv, c, 0));
    out('sip-gain', money(fv - p * n, c, 0));
  });

  /* ---------- lumpsum ---------- */
  wire('ls', function () {
    var c = currencyOf($('ls'));
    var p = num('ls-amount'), r = num('ls-rate'), y = num('ls-years');
    if (!(p > 0) || !(r >= 0) || !(y > 0)) {
      ['ls-value', 'ls-gain', 'ls-mult'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var fv = p * Math.pow(1 + r / 100, y);
    out('ls-value', money(fv, c, 0));
    out('ls-gain', money(fv - p, c, 0));
    out('ls-mult', plain(fv / p) + '×');
  });

  /* ---------- SWP ---------- */
  wire('swp', function () {
    var c = currencyOf($('swp'));
    var corpus = num('swp-corpus'), w = num('swp-withdraw'), r = num('swp-rate'), y = num('swp-years');
    if (!(corpus > 0) || !(w > 0) || !(r >= 0) || !(y > 0)) {
      ['swp-total', 'swp-remaining', 'swp-lasts'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var i = r / 1200, n = Math.round(y * 12);
    var growth = Math.pow(1 + i, n);
    var remaining = i === 0 ? corpus - w * n : corpus * growth - w * (growth - 1) / i;

    /* months until exhaustion */
    var lastsText;
    if (i > 0 && w <= corpus * i) {
      lastsText = 'Forever (corpus grows)';
    } else {
      var m = i === 0 ? corpus / w : Math.log(w / (w - corpus * i)) / Math.log(1 + i);
      var months = Math.floor(m);
      lastsText = Math.floor(months / 12) + 'y ' + (months % 12) + 'm';
    }

    var withdrawnMonths = Math.min(n, remaining >= 0 ? n : n);
    if (remaining < 0) {
      /* corpus ran out before the period ended */
      var mExh = i === 0 ? corpus / w : Math.log(w / (w - corpus * i)) / Math.log(1 + i);
      withdrawnMonths = Math.min(n, Math.floor(mExh));
      out('swp-remaining', money(0, c, 0) + ' (exhausted)');
    } else {
      out('swp-remaining', money(remaining, c, 0));
    }
    out('swp-total', money(w * withdrawnMonths, c, 0));
    out('swp-lasts', lastsText);
  });

  /* ---------- EMI ---------- */
  wire('emi', function () {
    var c = currencyOf($('emi'));
    var p = num('emi-amount'), r = num('emi-rate'), y = num('emi-years');
    if (!(p > 0) || !(r >= 0) || !(y > 0)) {
      ['emi-monthly', 'emi-interest', 'emi-total'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var i = r / 1200, n = Math.round(y * 12);
    var emi = i === 0 ? p / n : p * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
    out('emi-monthly', money(emi, c));
    out('emi-interest', money(emi * n - p, c, 0));
    out('emi-total', money(emi * n, c, 0));
  });

  /* ---------- CAGR ---------- */
  wire('cagr', function () {
    var a = num('cagr-initial'), b = num('cagr-final'), y = num('cagr-years');
    if (!(a > 0) || !(b > 0) || !(y > 0)) {
      ['cagr-rate', 'cagr-growth'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var cagr = (Math.pow(b / a, 1 / y) - 1) * 100;
    out('cagr-rate', plain(cagr) + '% p.a.');
    out('cagr-growth', (b >= a ? '+' : '') + plain((b / a - 1) * 100) + '%');
  });

  /* ---------- percentage (three independent rows) ---------- */
  wire('pct', function () {
    var a1 = num('p1-a'), b1 = num('p1-b');
    out('p1-out', isFinite(a1) && isFinite(b1) ? '= ' + plain(a1 / 100 * b1, 4) : '—');
    var a2 = num('p2-a'), b2 = num('p2-b');
    out('p2-out', isFinite(a2) && isFinite(b2) && b2 !== 0 ? '= ' + plain(a2 / b2 * 100, 4) + '%' : '—');
    var a3 = num('p3-a'), b3 = num('p3-b');
    if (isFinite(a3) && isFinite(b3) && a3 !== 0) {
      var ch = (b3 - a3) / Math.abs(a3) * 100;
      out('p3-out', (ch >= 0 ? '+' : '−') + plain(Math.abs(ch), 4) + '%');
    } else out('p3-out', '—');
  });

  /* ---------- rule of 72 ---------- */
  wire('r72', function () {
    var r = num('r72-rate'), y = num('r72-years');
    if (r > 0) {
      out('r72-time', plain(72 / r) + ' years');
      out('r72-exact', plain(Math.log(2) / Math.log(1 + r / 100)) + ' years');
    } else { out('r72-time', '—'); out('r72-exact', '—'); }
    out('r72-need', y > 0 ? plain(72 / y) + '% p.a.' : '—');
  });

  /* ---------- stock split ---------- */
  wire('sp', function () {
    var c = currencyOf($('sp'));
    var sh = num('sp-shares'), pr = num('sp-price'), oldR = num('sp-old'), newR = num('sp-new');
    if (!(sh > 0) || !(pr >= 0) || !(oldR > 0) || !(newR > 0)) {
      ['sp-newshares', 'sp-newprice', 'sp-value'].forEach(function (id) { out(id, '—'); });
      return;
    }
    out('sp-newshares', plain(sh * newR / oldR, 4));
    out('sp-newprice', money(pr * oldR / newR, c));
    out('sp-value', money(sh * pr, c, 0));
  });

  /* ---------- bonus shares ---------- */
  wire('bn', function () {
    var c = currencyOf($('bn'));
    var sh = num('bn-shares'), pr = num('bn-price'), a = num('bn-a'), b = num('bn-b');
    if (!(sh > 0) || !(pr >= 0) || !(a > 0) || !(b > 0)) {
      ['bn-bonus', 'bn-total', 'bn-newavg'].forEach(function (id) { out(id, '—'); });
      return;
    }
    var bonus = Math.floor(sh * a / b);
    var total = sh + bonus;
    out('bn-bonus', plain(bonus, 0));
    out('bn-total', plain(total, 0));
    out('bn-newavg', money(sh * pr / total, c));
  });

  /* ---------- dividend yield ---------- */
  wire('dv', function () {
    var c = currencyOf($('dv'));
    var dps = num('dv-dps'), pr = num('dv-price'), sh = num('dv-shares');
    out('dv-yield', dps >= 0 && pr > 0 ? plain(dps / pr * 100) + '%' : '—');
    out('dv-income', dps >= 0 && sh > 0 ? money(dps * sh, c, 0) : '—');
  });

  /* ---------- stock score ---------- */
  wire('score', function () {
    var sels = document.querySelectorAll('#score select.sc');
    var sum = 0, answered = 0;
    sels.forEach(function (s) {
      if (s.value !== '') { sum += parseInt(s.value, 10); answered++; }
    });
    var bandEl = $('sc-band');
    if (answered < sels.length) {
      out('sc-out', answered ? answered + '/' + sels.length + ' answered' : '—');
      if (bandEl) { bandEl.textContent = 'Answer all eight checks to get the score.'; bandEl.className = 'score-band'; }
      return;
    }
    var score = Math.round(sum / (sels.length * 2) * 100);
    out('sc-out', score + ' / 100');
    var band, cls;
    if (score >= 75) { band = 'Strong fundamentals — worth deeper research.'; cls = 'band-strong'; }
    else if (score >= 50) { band = 'Moderate — some strengths, real weaknesses. Dig into the low scores.'; cls = 'band-mid'; }
    else { band = 'Weak — multiple red flags. Be very careful.'; cls = 'band-weak'; }
    if (bandEl) { bandEl.textContent = band; bandEl.className = 'score-band ' + cls; }
  });
})();
