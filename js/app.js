/* Stock Average Calculator — app logic. No dependencies. */
(function () {
  'use strict';

  var rowsEl = document.getElementById('rows');
  var addBtn = document.getElementById('add-row');
  var resetBtn = document.getElementById('reset');
  var currencyEl = document.getElementById('currency');
  var outAvg = document.getElementById('out-average');
  var outShares = document.getElementById('out-shares');
  var outInvested = document.getElementById('out-invested');
  var chartEl = document.getElementById('chart');
  var chartLegend = document.getElementById('chart-legend');
  var chartEmpty = document.getElementById('chart-empty');
  var tooltipEl = document.getElementById('chart-tooltip');
  var breakdownWrap = document.getElementById('breakdown-wrap');
  var breakdownBody = document.querySelector('#breakdown tbody');
  var shareBtn = document.getElementById('share');
  var shareLabel = document.getElementById('share-label');
  var planPrice = document.getElementById('plan-price');
  var planTarget = document.getElementById('plan-target');
  var planResult = document.getElementById('plan-result');

  var rowSeq = 0;
  var lastResult = null;

  /* ---------- currency formatting ---------- */

  function fmt(value, opts) {
    var code = currencyEl.value;
    var o = opts || {};
    try {
      return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: o.min != null ? o.min : 2,
        maximumFractionDigits: o.max != null ? o.max : 2
      }).format(value);
    } catch (e) {
      return value.toFixed(2);
    }
  }

  function fmtNum(value) {
    try {
      return new Intl.NumberFormat(currencyEl.value === 'INR' ? 'en-IN' : 'en-US', {
        maximumFractionDigits: 4
      }).format(value);
    } catch (e) {
      return String(value);
    }
  }

  /* ---------- buy rows ---------- */

  function addRow(units, price) {
    rowSeq++;
    var row = document.createElement('div');
    row.className = 'buy-row';

    var badge = document.createElement('span');
    badge.className = 'row-badge';
    badge.setAttribute('aria-hidden', 'true');

    var fUnits = document.createElement('div');
    fUnits.className = 'field field-units';
    var lUnits = document.createElement('label');
    lUnits.htmlFor = 'units-' + rowSeq;
    lUnits.textContent = 'Shares';
    var iUnits = document.createElement('input');
    iUnits.type = 'number';
    iUnits.id = 'units-' + rowSeq;
    iUnits.min = '0';
    iUnits.step = 'any';
    iUnits.inputMode = 'decimal';
    iUnits.placeholder = 'e.g. 100';
    iUnits.className = 'in-units';
    if (units != null) iUnits.value = units;
    fUnits.appendChild(lUnits);
    fUnits.appendChild(iUnits);

    var fPrice = document.createElement('div');
    fPrice.className = 'field field-price';
    var lPrice = document.createElement('label');
    lPrice.htmlFor = 'price-' + rowSeq;
    lPrice.textContent = 'Price / share';
    var iPrice = document.createElement('input');
    iPrice.type = 'number';
    iPrice.id = 'price-' + rowSeq;
    iPrice.min = '0';
    iPrice.step = 'any';
    iPrice.inputMode = 'decimal';
    iPrice.placeholder = 'e.g. 120.50';
    iPrice.className = 'in-price';
    if (price != null) iPrice.value = price;
    fPrice.appendChild(lPrice);
    fPrice.appendChild(iPrice);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'row-remove';
    remove.setAttribute('aria-label', 'Remove this buy');
    remove.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    remove.addEventListener('click', function () {
      row.remove();
      renumber();
      recalc();
    });

    row.appendChild(badge);
    row.appendChild(fUnits);
    row.appendChild(fPrice);
    row.appendChild(remove);
    rowsEl.appendChild(row);
    renumber();
    return row;
  }

  function renumber() {
    var rows = rowsEl.querySelectorAll('.buy-row');
    rows.forEach(function (row, i) {
      row.querySelector('.row-badge').textContent = String(i + 1);
      var canRemove = rows.length > 1;
      row.querySelector('.row-remove').disabled = !canRemove;
      var u = row.querySelector('.in-units');
      var p = row.querySelector('.in-price');
      u.setAttribute('aria-label', 'Buy ' + (i + 1) + ' shares');
      p.setAttribute('aria-label', 'Buy ' + (i + 1) + ' price per share');
    });
  }

  function readBuys() {
    var buys = [];
    rowsEl.querySelectorAll('.buy-row').forEach(function (row, i) {
      var units = parseFloat(row.querySelector('.in-units').value);
      var price = parseFloat(row.querySelector('.in-price').value);
      if (isFinite(units) && units > 0 && isFinite(price) && price >= 0) {
        buys.push({ n: i + 1, units: units, price: price, invested: units * price });
      }
    });
    return buys;
  }

  /* ---------- core calculation ---------- */

  function recalc() {
    var buys = readBuys();

    if (!buys.length) {
      lastResult = null;
      outAvg.textContent = '—';
      outShares.textContent = '—';
      outInvested.textContent = '—';
      shareBtn.disabled = true;
      breakdownWrap.hidden = true;
      renderChart([]);
      updatePlanner();
      syncUrl([]);
      return;
    }

    var totalUnits = 0, totalInvested = 0;
    buys.forEach(function (b) { totalUnits += b.units; totalInvested += b.invested; });
    var avg = totalInvested / totalUnits;

    lastResult = { buys: buys, totalUnits: totalUnits, totalInvested: totalInvested, avg: avg };

    var prevAvg = outAvg.textContent;
    outAvg.textContent = fmt(avg);
    if (outAvg.textContent !== prevAvg) {
      outAvg.classList.remove('pulse');
      void outAvg.offsetWidth; /* restart animation */
      outAvg.classList.add('pulse');
    }
    outShares.textContent = fmtNum(totalUnits);
    outInvested.textContent = fmt(totalInvested, { min: 0, max: 2 });
    shareBtn.disabled = false;

    renderTable(buys, totalUnits, totalInvested, avg);
    renderChart(buys, avg);
    updatePlanner();
    syncUrl(buys);
  }

  function renderTable(buys, totalUnits, totalInvested, avg) {
    breakdownBody.textContent = '';
    buys.forEach(function (b) {
      var tr = document.createElement('tr');
      appendCell(tr, 'Buy ' + b.n);
      appendCell(tr, fmtNum(b.units));
      appendCell(tr, fmt(b.price));
      appendCell(tr, fmt(b.invested, { min: 0, max: 2 }));
      appendCell(tr, ((b.invested / totalInvested) * 100).toFixed(1) + '%');
      breakdownBody.appendChild(tr);
    });
    var totalTr = document.createElement('tr');
    totalTr.className = 'total-row';
    appendCell(totalTr, 'Total');
    appendCell(totalTr, fmtNum(totalUnits));
    appendCell(totalTr, fmt(avg) + ' avg');
    appendCell(totalTr, fmt(totalInvested, { min: 0, max: 2 }));
    appendCell(totalTr, '100%');
    breakdownBody.appendChild(totalTr);
    breakdownWrap.hidden = false;
  }

  function appendCell(tr, text) {
    var td = document.createElement('td');
    td.textContent = text;
    tr.appendChild(td);
  }

  /* ---------- chart (SVG, hand-rolled) ---------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function niceTicks(max, count) {
    if (max <= 0) return [0, 1];
    var rawStep = max / count;
    var mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    var norm = rawStep / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    var ticks = [];
    for (var v = 0; v <= max + step * 0.999; v += step) ticks.push(v);
    return ticks;
  }

  function compactNum(v) {
    if (v >= 1e7) return (v / 1e7).toFixed(v % 1e7 ? 1 : 0) + 'Cr';
    if (v >= 1e5) return (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + 'L';
    if (v >= 1e3) return (v / 1e3).toFixed(v % 1e3 ? 1 : 0) + 'K';
    return String(Math.round(v * 100) / 100);
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function renderChart(buys, avg) {
    chartEl.textContent = '';
    hideTooltip();

    if (!buys.length) {
      chartEmpty.style.display = '';
      chartLegend.hidden = true;
      return;
    }
    chartEmpty.style.display = 'none';
    chartLegend.hidden = false;

    var width = Math.max(chartEl.clientWidth || 480, 280);
    var height = 240;
    var pad = { top: 22, right: 14, bottom: 26, left: 44 };
    var plotW = width - pad.left - pad.right;
    var plotH = height - pad.top - pad.bottom;

    var maxVal = Math.max(avg, Math.max.apply(null, buys.map(function (b) { return b.price; })));
    var ticks = niceTicks(maxVal * 1.08, 4);
    var yMax = ticks[ticks.length - 1];
    function y(v) { return pad.top + plotH - (v / yMax) * plotH; }

    var svg = el('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      width: width,
      height: height,
      role: 'img',
      'aria-label': 'Column chart: price per share for each buy, with a line marking the average of ' + fmt(avg)
    });

    /* gridlines + y ticks (hairline, recessive) */
    ticks.forEach(function (t) {
      if (t === 0) return;
      svg.appendChild(el('line', { class: 'gridline', x1: pad.left, x2: width - pad.right, y1: y(t), y2: y(t) }));
      var txt = el('text', { class: 'tick', x: pad.left - 6, y: y(t) + 3.5, 'text-anchor': 'end' });
      txt.textContent = compactNum(t);
      svg.appendChild(txt);
    });

    /* baseline */
    svg.appendChild(el('line', { class: 'baseline', x1: pad.left, x2: width - pad.right, y1: y(0), y2: y(0) }));

    /* bars: <=24px thick, 4px rounded data-end, square baseline, >=2px gap via band padding */
    var band = plotW / buys.length;
    var barW = Math.min(24, Math.max(8, band * 0.45));
    var labelEvery = Math.ceil(buys.length / Math.floor(plotW / 48));

    buys.forEach(function (b, i) {
      var cx = pad.left + band * i + band / 2;
      var x0 = cx - barW / 2;
      var yTop = y(b.price);
      var h = Math.max(y(0) - yTop, 0);
      var r = Math.min(4, h, barW / 2);
      var d = 'M' + x0 + ' ' + y(0) +
        ' L' + x0 + ' ' + (yTop + r) +
        ' Q' + x0 + ' ' + yTop + ' ' + (x0 + r) + ' ' + yTop +
        ' L' + (x0 + barW - r) + ' ' + yTop +
        ' Q' + (x0 + barW) + ' ' + yTop + ' ' + (x0 + barW) + ' ' + (yTop + r) +
        ' L' + (x0 + barW) + ' ' + y(0) + ' Z';
      var bar = el('path', { class: 'bar', d: d });
      bar.dataset.idx = i;
      svg.appendChild(bar);

      if (i % labelEvery === 0 || buys.length <= 6) {
        var cat = el('text', { class: 'cat-label', x: cx, y: height - 8, 'text-anchor': 'middle' });
        cat.textContent = 'Buy ' + b.n;
        svg.appendChild(cat);
      }
    });

    /* average reference line (2px, series-avg) + direct label */
    var avgY = y(avg);
    svg.appendChild(el('line', { class: 'avg-line', x1: pad.left, x2: width - pad.right, y1: avgY, y2: avgY }));
    var avgLabel = el('text', {
      class: 'avg-label',
      x: width - pad.right,
      y: avgY - 6 < pad.top + 8 ? avgY + 14 : avgY - 6,
      'text-anchor': 'end'
    });
    avgLabel.textContent = 'Avg ' + fmt(avg);
    svg.appendChild(avgLabel);

    /* hit targets: full band, keyboard focusable, tooltip on hover/focus */
    buys.forEach(function (b, i) {
      var hx = pad.left + band * i;
      var hit = el('rect', {
        class: 'hit',
        x: hx, y: pad.top, width: band, height: plotH,
        tabindex: 0, role: 'img',
        'aria-label': 'Buy ' + b.n + ': ' + fmtNum(b.units) + ' shares at ' + fmt(b.price) + ', invested ' + fmt(b.invested, { min: 0, max: 2 })
      });
      var show = function () { liftBar(svg, i, true); showTooltip(b, hx + band / 2, y(b.price)); };
      var hide = function () { liftBar(svg, i, false); hideTooltip(); };
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('pointerleave', hide);
      hit.addEventListener('focus', show);
      hit.addEventListener('blur', hide);
      svg.appendChild(hit);
    });

    chartEl.appendChild(svg);
  }

  function liftBar(svg, idx, on) {
    var bar = svg.querySelector('.bar[data-idx="' + idx + '"]');
    if (bar) bar.classList.toggle('lift', on);
  }

  function showTooltip(b, svgX, svgY) {
    tooltipEl.textContent = '';
    var v = document.createElement('div');
    v.className = 'tt-value';
    v.textContent = fmt(b.price) + ' / share';
    var l1 = document.createElement('div');
    l1.className = 'tt-label';
    l1.textContent = 'Buy ' + b.n + ' · ' + fmtNum(b.units) + ' shares';
    var l2 = document.createElement('div');
    l2.className = 'tt-label';
    l2.textContent = 'Invested ' + fmt(b.invested, { min: 0, max: 2 });
    tooltipEl.appendChild(v);
    tooltipEl.appendChild(l1);
    tooltipEl.appendChild(l2);
    tooltipEl.hidden = false;

    var block = chartEl.parentElement; /* .chart-block is position:relative */
    var chartRect = chartEl.getBoundingClientRect();
    var blockRect = block.getBoundingClientRect();
    var svgEl = chartEl.querySelector('svg');
    var scale = chartRect.width / svgEl.viewBox.baseVal.width;
    var px = (chartRect.left - blockRect.left) + svgX * scale;
    var py = (chartRect.top - blockRect.top) + svgY * scale;
    var ttW = tooltipEl.offsetWidth, ttH = tooltipEl.offsetHeight;
    var left = Math.min(Math.max(px - ttW / 2, 0), blockRect.width - ttW);
    var top = py - ttH - 10;
    if (top < 0) top = py + 14;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  function hideTooltip() { tooltipEl.hidden = true; }

  /* ---------- averaging-down planner ---------- */

  function updatePlanner() {
    planResult.textContent = '';
    var p = document.createElement('p');

    if (!lastResult) {
      p.className = 'planner-placeholder';
      p.textContent = 'Enter your purchases in the calculator above first.';
      planResult.appendChild(p);
      return;
    }

    var price = parseFloat(planPrice.value);
    var target = parseFloat(planTarget.value);
    if (!isFinite(price) || !isFinite(target) || price <= 0 || target <= 0) {
      p.className = 'planner-placeholder';
      p.textContent = 'Fill both fields to see the plan. Your current average is ' + fmt(lastResult.avg) + '.';
      planResult.appendChild(p);
      return;
    }

    var A = lastResult.avg, S = lastResult.totalUnits;

    if (Math.abs(target - A) < 1e-9) {
      p.textContent = 'Your average is already ' + fmt(A) + ' — no purchase needed.';
      planResult.appendChild(p);
      return;
    }

    /* n = S(A - T) / (T - P); valid only when T is between P and A */
    var valid = (target > Math.min(A, price)) && (target < Math.max(A, price));
    if (!valid) {
      p.className = 'plan-warn';
      p.textContent = 'Not reachable: buying at ' + fmt(price) + ' can only move your average from ' +
        fmt(A) + ' toward ' + fmt(price) + '. Pick a target between the two.';
      planResult.appendChild(p);
      return;
    }

    var n = S * (A - target) / (target - price);
    var nRounded = Math.ceil(n);
    var cost = nRounded * price;
    var newTotal = S + nRounded;
    var newAvg = (lastResult.totalInvested + cost) / newTotal;

    p.className = 'plan-ok';
    var strong = document.createElement('strong');
    strong.textContent = 'Buy ' + fmtNum(nRounded) + ' shares';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(
      ' at ' + fmt(price) + ' (cost ' + fmt(cost, { min: 0, max: 2 }) + '). ' +
      'New position: ' + fmtNum(newTotal) + ' shares at an average of ' + fmt(newAvg) + '.'
    ));
    planResult.appendChild(p);
  }

  /* ---------- shareable URL state ---------- */

  function syncUrl(buys) {
    if (!window.history || !window.history.replaceState) return;
    var url = location.pathname;
    if (buys.length) {
      var b = buys.map(function (x) { return x.units + 'x' + x.price; }).join(',');
      url += '?b=' + encodeURIComponent(b) + '&c=' + currencyEl.value;
    }
    history.replaceState(null, '', url + location.hash);
  }

  function loadFromUrl() {
    var params = new URLSearchParams(location.search);
    var b = params.get('b');
    var c = params.get('c');
    if (c && currencyEl.querySelector('option[value="' + c.replace(/[^A-Z]/g, '') + '"]')) {
      currencyEl.value = c.replace(/[^A-Z]/g, '');
    }
    if (!b) return false;
    var parts = b.split(',').map(function (s) { return s.split('x').map(parseFloat); })
      .filter(function (a) { return a.length === 2 && isFinite(a[0]) && a[0] > 0 && isFinite(a[1]) && a[1] >= 0; });
    if (!parts.length) return false;
    parts.slice(0, 50).forEach(function (a) { addRow(a[0], a[1]); });
    return true;
  }

  /* ---------- share / copy ---------- */

  function buildSummary() {
    if (!lastResult) return '';
    var lines = ['My stock average:'];
    lastResult.buys.forEach(function (b) {
      lines.push('• Buy ' + b.n + ': ' + fmtNum(b.units) + ' @ ' + fmt(b.price));
    });
    lines.push('→ ' + fmtNum(lastResult.totalUnits) + ' shares, avg ' + fmt(lastResult.avg) +
      ', invested ' + fmt(lastResult.totalInvested, { min: 0, max: 2 }));
    lines.push(location.href);
    return lines.join('\n');
  }

  shareBtn.addEventListener('click', function () {
    var text = buildSummary();
    if (!text) return;
    if (navigator.share) {
      navigator.share({ title: 'Stock Average Calculator', text: text }).catch(function () {});
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      shareLabel.textContent = 'Copied!';
      setTimeout(function () { shareLabel.textContent = 'Copy result'; }, 1600);
    }).catch(function () {});
  });

  /* ---------- theme toggle ---------- */

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var root = document.documentElement;
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var current = root.getAttribute('data-theme') || (systemDark ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('sac-theme', next); } catch (e) {}
    if (lastResult) renderChart(lastResult.buys, lastResult.avg);
  });

  /* ---------- events ---------- */

  rowsEl.addEventListener('input', recalc);
  currencyEl.addEventListener('change', recalc);
  planPrice.addEventListener('input', updatePlanner);
  planTarget.addEventListener('input', updatePlanner);

  addBtn.addEventListener('click', function () {
    var row = addRow();
    row.querySelector('.in-units').focus();
  });

  resetBtn.addEventListener('click', function () {
    rowsEl.textContent = '';
    rowSeq = 0;
    addRow();
    addRow();
    planPrice.value = '';
    planTarget.value = '';
    recalc();
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (lastResult) renderChart(lastResult.buys, lastResult.avg);
    }, 150);
  });

  /* ---------- reveal on scroll ---------- */

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
    document.querySelectorAll('.reveal').forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  /* ---------- init ---------- */

  document.getElementById('year').textContent = String(new Date().getFullYear());

  if (!loadFromUrl()) {
    addRow();
    addRow();
  }
  recalc();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    });
  }
})();
