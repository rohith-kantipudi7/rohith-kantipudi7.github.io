// Generates all tool pages from one config so the shell (head/SEO/header/
// sidebar/footer) stays identical across the site. Run: node tools/build-pages.mjs
// index.html is hand-maintained; its sidebar must match SIDEBAR below.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://rohith-kantipudi7.github.io/Stock-Calculator/';

/* ---------------- sidebar (single source of truth) ---------------- */

export const SIDEBAR = [
  ['Calculators', [
    ['./', 'Stock Average'],
    ['profit-loss-calculator.html', 'Stock Profit / Loss'],
    ['sip-calculator.html', 'SIP'],
    ['lumpsum-calculator.html', 'Lumpsum'],
    ['swp-calculator.html', 'SWP'],
    ['emi-calculator.html', 'EMI'],
    ['cagr-calculator.html', 'CAGR'],
    ['percentage-calculator.html', 'Percentage'],
    ['rule-of-72-calculator.html', 'Rule of 72'],
    ['stock-split-calculator.html', 'Stock Split'],
    ['bonus-share-calculator.html', 'Bonus Shares'],
  ]],
  ['Market info', [
    ['dividend-details.html', 'Dividend Details'],
    ['bonus-buyback-details.html', 'Bonus & Buyback'],
    ['split-demerger.html', 'Split & Demerger'],
    ['stock-score.html', 'Stock Score'],
    ['trading-holidays.html', 'Trading Holidays 2026'],
  ]],
  ['More', [
    ['books.html', 'Investment Books'],
    ['support.html', 'Support'],
    ['contact.html', 'Contact'],
  ]],
];

function sidebarHtml(currentFile) {
  const groups = SIDEBAR.map(([title, links]) => {
    const items = links.map(([href, label]) => {
      const current = href === currentFile ? ' aria-current="page"' : '';
      return `        <li><a href="./${href === './' ? '' : href}"${current}>${label}</a></li>`;
    }).join('\n');
    return `      <p class="sidebar-group">${title}</p>\n      <ul>\n${items}\n      </ul>`;
  }).join('\n');
  return `  <aside id="sidebar" class="sidebar" aria-label="All tools">
    <nav>
${groups}
    </nav>
  </aside>
  <div class="scrim" id="scrim" hidden></div>`;
}

/* ---------------- shared fragments ---------------- */


export const FOOTER = `  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-about">
        <p class="footer-brand">StockCalc</p>
        <p class="footer-fine">Free, private financial calculators for investors. Everything runs in your browser — nothing is uploaded.</p>
      </div>
      <nav aria-label="Calculators">
        <p class="footer-head">Calculators</p>
        <a href="./">Stock Average Calculator</a>
        <a href="./profit-loss-calculator.html">Profit / Loss Calculator</a>
        <a href="./sip-calculator.html">SIP Calculator</a>
        <a href="./emi-calculator.html">EMI Calculator</a>
        <a href="./cagr-calculator.html">CAGR Calculator</a>
        <a href="./lumpsum-calculator.html">Lumpsum Calculator</a>
      </nav>
      <nav aria-label="More tools">
        <p class="footer-head">More tools</p>
        <a href="./swp-calculator.html">SWP Calculator</a>
        <a href="./percentage-calculator.html">Percentage Calculator</a>
        <a href="./rule-of-72-calculator.html">Rule of 72</a>
        <a href="./stock-split-calculator.html">Stock Split Calculator</a>
        <a href="./bonus-share-calculator.html">Bonus Share Calculator</a>
        <a href="./stock-score.html">Stock Score</a>
      </nav>
      <nav aria-label="Market and site">
        <p class="footer-head">Market &amp; site</p>
        <a href="./dividend-details.html">Dividend Details</a>
        <a href="./trading-holidays.html">Trading Holidays 2026</a>
        <a href="./books.html">Investment Books</a>
        <a href="./contact.html">Contact</a>
        <a href="./privacy.html">Privacy Policy</a>
      </nav>
    </div>
    <div class="container footer-bottom">
      <p>© <span class="year">2026</span> StockCalc · For education only — not investment advice.</p>
    </div>
  </footer>`;

const THEME_TOGGLE = `<button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch theme">
        <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12h2.5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/></g></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" fill="currentColor"/></svg>
      </button>`;

const NAV_TOGGLE = `<button id="nav-toggle" class="nav-toggle" type="button" aria-label="Toggle tools menu" aria-expanded="true" aria-controls="sidebar">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>`;

function currencySelect(id) {
  return `<label class="currency-field"><span class="visually-hidden">Currency</span>
      <select id="${id}" class="calc-currency" aria-label="Currency">
        <option value="INR" selected>₹ INR</option><option value="USD">$ USD</option>
        <option value="EUR">€ EUR</option><option value="GBP">£ GBP</option><option value="JPY">¥ JPY</option>
      </select></label>`;
}

function field(id, label, placeholder, extra = '') {
  return `<div class="field"><label for="${id}">${label}</label>
        <input id="${id}" type="number" inputmode="decimal" min="0" step="any" placeholder="${placeholder}"${extra}></div>`;
}

function tile(id, label) {
  return `<div class="stat-tile"><p class="stat-label">${label}</p><p class="stat-value-sm" id="${id}">—</p></div>`;
}

function faqHtml(faqs) {
  if (!faqs || !faqs.length) return '';
  const items = faqs.map(([q, a]) =>
    `        <details class="faq-item"><summary>${q}</summary><p>${a}</p></details>`).join('\n');
  return `\n      <section aria-label="Frequently asked questions">\n        <h2>Frequently asked questions</h2>\n${items}\n      </section>`;
}

function jsonLd(page) {
  const graph = [
    {
      '@type': page.appType || 'SoftwareApplication',
      name: page.h1,
      url: SITE + page.file,
      description: page.description,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Stock Average Calculator', item: SITE },
        { '@type': 'ListItem', position: 2, name: page.h1, item: SITE + page.file },
      ],
    },
  ];
  if (page.appType === 'WebPage') delete graph[0].applicationCategory, delete graph[0].offers, delete graph[0].operatingSystem;
  if (page.faqs && page.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(([q, a]) => ({
        '@type': 'Question', name: q.replace(/<[^>]+>/g, ''),
        acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

function render(page) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <link rel="canonical" href="${SITE}${page.file}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Stock Average Calculator">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${SITE}${page.file}">
  <meta property="og:image" content="${SITE}assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${page.h1} — free online tool">
  <meta property="og:locale" content="en_IN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="${SITE}assets/og-image.png">
  <meta name="theme-color" content="#ffffff">
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="./assets/icon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="./assets/icon-180.png">
  <link rel="stylesheet" href="./css/style.css">
  <script>
    (function () {
      try {
        var t = localStorage.getItem('sac-theme');
        if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
        if (localStorage.getItem('sac-sidebar') === 'closed') {
          document.documentElement.classList.add('sidebar-collapsed');
        }
      } catch (e) {}
    })();
  </script>
  <script type="application/ld+json">
${jsonLd(page)}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <div class="container header-inner">
      ${NAV_TOGGLE}
      <a class="brand" href="./" aria-label="Stock Average Calculator — home">StockCalc</a>
      <nav class="site-nav" aria-label="Main">
        <a href="./">Home</a>
        <a href="./books.html">Books</a>
        <a href="./contact.html">Contact</a>
      </nav>
      ${THEME_TOGGLE}
    </div>
  </header>

  <div class="shell container-wide">
${sidebarHtml(page.file)}
    <main id="main" class="content">
      <h1>${page.h1}</h1>
      <p class="page-intro">${page.intro}</p>
${page.body}${faqHtml(page.faqs)}
    </main>
  </div>

${FOOTER}

  <script src="./js/common.js" defer></script>
${page.needsCalcJs === false ? '' : '  <script src="./js/calc.js" defer></script>\n'}</body>
</html>
`;
}

/* ---------------- page definitions ---------------- */

const PAGES = [

  /* ------- Stock Profit / Loss ------- */
  {
    file: 'profit-loss-calculator.html',
    title: 'Stock Profit/Loss Calculator — Net Gain After Charges (Free)',
    description: 'Free stock profit and loss calculator. Enter buy price, sell price, quantity, and charges to see your net profit or loss and return percentage instantly.',
    h1: 'Stock Profit / Loss Calculator',
    intro: 'Find your exact profit or loss on a stock trade — including brokerage and other charges — with the return percentage calculated for you.',
    body: `      <div class="card calc-card" id="pl">
        <div class="card-head"><h2>Trade details</h2>${currencySelect('pl-cur')}</div>
        <div class="calc-grid">
          ${field('pl-qty', 'Quantity (shares)', 'e.g. 100')}
          ${field('pl-buy', 'Buy price / share', 'e.g. 250')}
          ${field('pl-sell', 'Sell price / share', 'e.g. 290')}
          ${field('pl-charges', 'Total charges (optional)', 'brokerage, taxes…')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('pl-invested', 'Invested')}
          ${tile('pl-proceeds', 'Sell value')}
          ${tile('pl-net', 'Net profit / loss')}
          ${tile('pl-pct', 'Return')}
        </div>
      </div>`,
    faqs: [
      ['Does the calculator include brokerage and taxes?', 'Yes — enter the total of all charges (brokerage, STT, exchange fees, stamp duty, GST) in the charges field and it is subtracted from your gross profit to give the net figure.'],
      ['What is a good return percentage on a stock trade?', 'There is no universal number — compare your return to the index over the same period and to the risk you took. A 10% gain in a month is excellent; the same gain over five years lags most benchmarks.'],
    ],
  },

  /* ------- SIP ------- */
  {
    file: 'sip-calculator.html',
    title: 'SIP Calculator — Monthly Investment Future Value (Free)',
    description: 'Free SIP calculator. Enter your monthly investment, expected return, and duration to see your invested amount, estimated future value, and wealth gain.',
    h1: 'SIP Calculator',
    intro: 'See what a monthly systematic investment plan (SIP) can grow into, with total invested, estimated value, and wealth gained.',
    body: `      <div class="card calc-card" id="sip">
        <div class="card-head"><h2>SIP details</h2>${currencySelect('sip-cur')}</div>
        <div class="calc-grid">
          ${field('sip-amount', 'Monthly investment', 'e.g. 10000', ' data-echo="1"')}
          ${field('sip-rate', 'Expected return (% p.a.)', 'e.g. 12')}
          ${field('sip-years', 'Duration (years)', 'e.g. 10')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('sip-invested', 'Total invested')}
          ${tile('sip-value', 'Estimated value')}
          ${tile('sip-gain', 'Wealth gain')}
        </div>
      </div>`,
    faqs: [
      ['Is the SIP return guaranteed?', 'No. The calculator projects a constant assumed return; real market returns vary year to year. Use a conservative rate for planning — many investors model equity SIPs at 10–12% per annum.'],
      ['What happens if I increase my SIP every year?', 'A step-up SIP (increasing the instalment annually) can significantly raise the final corpus. This calculator models a fixed instalment; add a margin or recalculate with a higher monthly amount to approximate a step-up.'],
    ],
  },

  /* ------- Lumpsum ------- */
  {
    file: 'lumpsum-calculator.html',
    title: 'Lumpsum Calculator — One-Time Investment Growth (Free)',
    description: 'Free lumpsum calculator. See what a one-time investment grows into with compound returns — future value and total gain, calculated instantly.',
    h1: 'Lumpsum Calculator',
    intro: 'Calculate the future value of a one-time investment under compound growth.',
    body: `      <div class="card calc-card" id="ls">
        <div class="card-head"><h2>Investment details</h2>${currencySelect('ls-cur')}</div>
        <div class="calc-grid">
          ${field('ls-amount', 'Investment amount', 'e.g. 100000', ' data-echo="1"')}
          ${field('ls-rate', 'Expected return (% p.a.)', 'e.g. 12')}
          ${field('ls-years', 'Duration (years)', 'e.g. 10')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('ls-value', 'Estimated value')}
          ${tile('ls-gain', 'Total gain')}
          ${tile('ls-mult', 'Growth multiple')}
        </div>
      </div>`,
    faqs: [
      ['Lumpsum or SIP — which is better?', 'If you already have the money and a long horizon, lumpsum captures compounding earliest. If you earn monthly or worry about market timing, a SIP averages your entry price. Many investors combine both.'],
    ],
  },

  /* ------- SWP ------- */
  {
    file: 'swp-calculator.html',
    title: 'SWP Calculator — Systematic Withdrawal Plan (Free)',
    description: 'Free SWP calculator. Enter your corpus, monthly withdrawal, and expected return to see how long your money lasts and what remains after your chosen period.',
    h1: 'SWP Calculator',
    intro: 'Model a systematic withdrawal plan: how long your corpus lasts, what you withdraw in total, and what remains.',
    body: `      <div class="card calc-card" id="swp">
        <div class="card-head"><h2>Withdrawal plan</h2>${currencySelect('swp-cur')}</div>
        <div class="calc-grid">
          ${field('swp-corpus', 'Starting corpus', 'e.g. 5000000', ' data-echo="1"')}
          ${field('swp-withdraw', 'Monthly withdrawal', 'e.g. 30000', ' data-echo="1"')}
          ${field('swp-rate', 'Expected return (% p.a.)', 'e.g. 8')}
          ${field('swp-years', 'Period (years)', 'e.g. 20')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('swp-total', 'Total withdrawn')}
          ${tile('swp-remaining', 'Remaining corpus')}
          ${tile('swp-lasts', 'Corpus lasts')}
        </div>
      </div>
      <section>
        <h2>How an SWP works</h2>
        <p>You withdraw a fixed amount monthly while the rest keeps earning. Withdraw less than the corpus earns and it lasts forever; more, and the "corpus lasts" figure shows when it runs out.</p>
      </section>`,
    faqs: [
      ['What withdrawal rate makes a corpus last forever?', 'If the monthly withdrawal is no more than the corpus times the monthly return rate, the corpus never shrinks. For example, at 8% per annum a corpus of ₹50 lakh sustains about ₹33,000 per month indefinitely before inflation.'],
      ['Does this account for inflation?', 'No — it models a fixed withdrawal. In real life you will likely need to increase withdrawals with inflation, which shortens how long the corpus lasts. Plan with a buffer.'],
    ],
  },

  /* ------- EMI ------- */
  {
    file: 'emi-calculator.html',
    title: 'EMI Calculator — Loan Monthly Payment & Interest (Free)',
    description: 'Free EMI calculator. Enter loan amount, interest rate, and tenure to get your exact monthly EMI, total interest payable, and total repayment.',
    h1: 'EMI Calculator',
    intro: 'Work out the exact monthly instalment on a loan, plus the total interest you will pay over the full tenure.',
    body: `      <div class="card calc-card" id="emi">
        <div class="card-head"><h2>Loan details</h2>${currencySelect('emi-cur')}</div>
        <div class="calc-grid">
          ${field('emi-amount', 'Loan amount', 'e.g. 2500000', ' data-echo="1"')}
          ${field('emi-rate', 'Interest rate (% p.a.)', 'e.g. 8.5')}
          ${field('emi-years', 'Tenure (years)', 'e.g. 20')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('emi-monthly', 'Monthly EMI')}
          ${tile('emi-interest', 'Total interest')}
          ${tile('emi-total', 'Total payment')}
        </div>
      </div>`,
    faqs: [
      ['How can I reduce my total interest?', 'Three levers: a shorter tenure (higher EMI, far less interest), part-prepayments early in the loan when the interest share is highest, and refinancing to a lower rate.'],
    ],
  },

  /* ------- CAGR ------- */
  {
    file: 'cagr-calculator.html',
    title: 'CAGR Calculator — Compound Annual Growth Rate (Free)',
    description: 'Free CAGR calculator. Enter the starting value, final value, and years to get the compound annual growth rate and total growth of your investment.',
    h1: 'CAGR Calculator',
    intro: 'Find the compound annual growth rate of any investment from its start value, end value, and duration.',
    body: `      <div class="card calc-card" id="cagr">
        <div class="card-head"><h2>Investment values</h2></div>
        <div class="calc-grid">
          ${field('cagr-initial', 'Starting value', 'e.g. 100000', ' data-echo="1"')}
          ${field('cagr-final', 'Final value', 'e.g. 250000', ' data-echo="1"')}
          ${field('cagr-years', 'Duration (years)', 'e.g. 7')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('cagr-rate', 'CAGR')}
          ${tile('cagr-growth', 'Total growth')}
        </div>
      </div>`,
    faqs: [
      ['What is the difference between CAGR and absolute return?', 'Absolute return ignores time: doubling your money is 100% whether it took 2 years or 20. CAGR annualises it — doubling in 2 years is a 41.4% CAGR; in 20 years it is only 3.5%.'],
    ],
  },

  /* ------- Percentage ------- */
  {
    file: 'percentage-calculator.html',
    title: 'Percentage Calculator — % Of, % Change, Ratio (Free)',
    description: 'Free percentage calculator: find X% of a number, what percent one number is of another, and the percentage increase or decrease between two values.',
    h1: 'Percentage Calculator',
    intro: 'Three quick percentage tools: a percentage of a number, one number as a percentage of another, and percentage change.',
    body: `      <div class="card calc-card" id="pct">
        <h2 class="visually-hidden">Percentage tools</h2>
        <div class="pct-row">
          <p class="pct-q">What is ${'<input id="p1-a" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="Percentage">'}% of ${'<input id="p1-b" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="Number">'}?</p>
          <p class="pct-a" id="p1-out" aria-live="polite">—</p>
        </div>
        <div class="pct-row">
          <p class="pct-q">${'<input id="p2-a" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="Part">'} is what % of ${'<input id="p2-b" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="Whole">'}?</p>
          <p class="pct-a" id="p2-out" aria-live="polite">—</p>
        </div>
        <div class="pct-row">
          <p class="pct-q">Change from ${'<input id="p3-a" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="Old value">'} to ${'<input id="p3-b" class="inline-num" type="number" step="any" inputmode="decimal" aria-label="New value">'}?</p>
          <p class="pct-a" id="p3-out" aria-live="polite">—</p>
        </div>
      </div>
      <section>
        <h2>Worth remembering</h2>
        <p>Losses and gains are not symmetric: a 50% loss needs a 100% gain to break even.</p>
      </section>`,
    faqs: [
      ['How do I calculate a percentage increase?', 'Use the third row of this calculator — enter the old value and the new value, and it shows the increase or decrease instantly.'],
    ],
  },

  /* ------- Rule of 72 ------- */
  {
    file: 'rule-of-72-calculator.html',
    title: 'Rule of 72 Calculator — Years to Double Your Money (Free)',
    description: 'Free Rule of 72 calculator. Enter a return rate to see how many years your money takes to double, or enter years to find the required rate — with exact math too.',
    h1: 'Rule of 72 Calculator',
    intro: 'Estimate how fast money doubles: enter a return rate to get the years, or a number of years to get the required rate.',
    body: `      <div class="card calc-card" id="r72">
        <div class="calc-grid">
          ${field('r72-rate', 'Annual return (%)', 'e.g. 12')}
          ${field('r72-years', 'Or: years to double', 'e.g. 6')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('r72-time', 'Doubling time (Rule of 72)')}
          ${tile('r72-exact', 'Exact doubling time')}
          ${tile('r72-need', 'Required rate for your years')}
        </div>
      </div>`,
    faqs: [
      ['How accurate is the Rule of 72?', 'Very accurate for typical returns between roughly 4% and 15% a year. The calculator also shows the exact doubling time next to the estimate so you can compare.'],
    ],
  },

  /* ------- Stock Split ------- */
  {
    file: 'stock-split-calculator.html',
    title: 'Stock Split Calculator — New Shares & Adjusted Price (Free)',
    description: 'Free stock split calculator. Enter your shares, price, and split ratio to see your new share count and the adjusted price per share after the split.',
    h1: 'Stock Split Calculator',
    intro: 'See how many shares you hold and at what adjusted price after a stock split — your investment value stays the same.',
    body: `      <div class="card calc-card" id="sp">
        <div class="card-head"><h2>Split details</h2>${currencySelect('sp-cur')}</div>
        <div class="calc-grid">
          ${field('sp-shares', 'Shares held', 'e.g. 50')}
          ${field('sp-price', 'Current price / share', 'e.g. 2400')}
          ${field('sp-old', 'Split ratio — old', '1')}
          ${field('sp-new', 'Split ratio — new', 'e.g. 5')}
        </div>
        <p class="field-hint">A 1 → 5 split means every 1 share becomes 5 (e.g. face value ₹10 → ₹2).</p>
        <div class="calc-results" aria-live="polite">
          ${tile('sp-newshares', 'Shares after split')}
          ${tile('sp-newprice', 'Adjusted price')}
          ${tile('sp-value', 'Investment value')}
        </div>
      </div>
      <section>
        <h2>What a split changes</h2>
        <p>Your share count multiplies, the price divides by the same factor, and your holding's value is unchanged. More detail: <a href="./split-demerger.html">face value splits &amp; demergers</a>.</p>
      </section>`,
    faqs: [
      ['Do I lose money in a stock split?', 'No. If you held 10 shares at ₹1,000 (₹10,000) and the stock splits 1:5, you now hold 50 shares at ₹200 — still ₹10,000. Only the unit size changes.'],
    ],
  },

  /* ------- Bonus Shares ------- */
  {
    file: 'bonus-share-calculator.html',
    title: 'Bonus Share Calculator — Shares & Adjusted Price (Free)',
    description: 'Free bonus share calculator. Enter your holding and the bonus ratio to see the bonus shares you receive, your new total, and the adjusted average price.',
    h1: 'Bonus Share Calculator',
    intro: 'Calculate the bonus shares you will receive, your total holding after the bonus issue, and your new effective price per share.',
    body: `      <div class="card calc-card" id="bn">
        <div class="card-head"><h2>Bonus details</h2>${currencySelect('bn-cur')}</div>
        <div class="calc-grid">
          ${field('bn-shares', 'Shares held', 'e.g. 100')}
          ${field('bn-price', 'Average buy price', 'e.g. 500')}
          ${field('bn-a', 'Bonus ratio — bonus shares', 'e.g. 1')}
          ${field('bn-b', 'Bonus ratio — for every', 'e.g. 2')}
        </div>
        <p class="field-hint">A 1:2 bonus means 1 free share for every 2 held.</p>
        <div class="calc-results" aria-live="polite">
          ${tile('bn-bonus', 'Bonus shares')}
          ${tile('bn-total', 'Total shares')}
          ${tile('bn-newavg', 'Adjusted avg price')}
        </div>
      </div>
      <section>
        <h2>How a bonus issue works</h2>
        <p>Free shares are issued in ratio to your holding; your invested amount is unchanged, so your average cost drops. Fractions are rounded down, as exchanges do. See also: <a href="./bonus-buyback-details.html">bonus &amp; buyback details</a>.</p>
      </section>`,
    faqs: [
      ['Is a bonus share free money?', 'Not quite — the share price adjusts down on the ex-bonus date so the total value of your holding stays the same. The benefit is more liquid units and a signal of confidence from the company.'],
    ],
  },

  /* ------- Dividend Details ------- */
  {
    file: 'dividend-details.html',
    title: 'Dividend Details & Yield Calculator — Dates Explained',
    description: 'Understand stock dividends: declaration, ex-date, record date, and payment — plus a free dividend yield calculator and links to official NSE/BSE announcements.',
    h1: 'Dividend Details',
    intro: 'What dividends are, the four dates that matter, and a quick yield calculator — with links to the official exchange feeds for live announcements.',
    body: `      <div class="card calc-card" id="dv">
        <div class="card-head"><h2>Dividend yield calculator</h2>${currencySelect('dv-cur')}</div>
        <div class="calc-grid">
          ${field('dv-dps', 'Annual dividend / share', 'e.g. 12')}
          ${field('dv-price', 'Current share price', 'e.g. 400')}
          ${field('dv-shares', 'Shares held (optional)', 'e.g. 100')}
        </div>
        <div class="calc-results" aria-live="polite">
          ${tile('dv-yield', 'Dividend yield')}
          ${tile('dv-income', 'Your annual income')}
        </div>
      </div>
      <section>
        <h2>The four dividend dates</h2>
        <ol class="steps">
          <li><strong>Declaration date</strong> — the board announces the dividend amount.</li>
          <li><strong>Ex-dividend date</strong> — buy on or after this date and you do <em>not</em> get the dividend; the price typically opens lower by roughly the dividend amount.</li>
          <li><strong>Record date</strong> — the company checks its shareholder register; you must already be a holder.</li>
          <li><strong>Payment date</strong> — the money lands in your bank account.</li>
        </ol>
        <h2>Where to find official dividend announcements</h2>
        <p>Always verify against the exchanges' own corporate-action feeds:
          <a href="https://www.nseindia.com/companies-listing/corporate-filings-actions" rel="noopener">NSE corporate actions</a> ·
          <a href="https://www.bseindia.com/corporates/corporate_act.html" rel="noopener">BSE corporate actions</a>.
        </p>
      </section>`,
    faqs: [
      ['What is a good dividend yield?', 'Indian large-caps typically yield 1–3%; utilities and PSUs often more. A very high yield can be a warning sign — it may reflect a falling share price rather than a generous company.'],
      ['Are dividends taxable?', 'In India, dividends are added to your income and taxed at your slab rate, with TDS deducted above a threshold. Rules change — confirm current law or ask a tax professional.'],
    ],
  },

  /* ------- Bonus & Buyback Details ------- */
  {
    file: 'bonus-buyback-details.html',
    title: 'Bonus Issues & Share Buybacks Explained — Key Dates',
    description: 'How bonus issues and share buybacks work, what happens to the share price, and where to track live announcements on NSE and BSE.',
    h1: 'Bonus & Buyback Details',
    intro: 'Two corporate actions that change your share count or the company’s — how each works, and where to track live announcements.',
    appType: 'WebPage',
    body: `      <section>
        <h2>Bonus issues</h2>
        <p>A bonus issue gives existing shareholders free additional shares in a fixed ratio (say 1:1 — one new share per share held). The company converts reserves into share capital; nothing changes about the business, so the price adjusts down proportionally on the ex-date. Work out your post-bonus holding with the <a href="./bonus-share-calculator.html">bonus share calculator</a>.</p>
        <h2>Share buybacks</h2>
        <p>In a buyback the company repurchases its own shares — via a tender offer at a fixed (usually premium) price, or by buying from the open market. Buybacks shrink the share count, which lifts earnings per share, and often signal that management considers the stock undervalued. In a tender offer, small shareholders in India get a reserved quota, so acceptance ratios can be attractive.</p>
        <h2>Track live announcements</h2>
        <p>Official sources, always current:
          <a href="https://www.nseindia.com/companies-listing/corporate-filings-actions" rel="noopener">NSE corporate actions</a> ·
          <a href="https://www.bseindia.com/corporates/corporate_act.html" rel="noopener">BSE corporate actions</a>.
        </p>
      </section>`,
    faqs: [
      ['Should I tender my shares in a buyback?', 'Compare the buyback price to the market price and your own view of fair value, and check the likely acceptance ratio. If only part of your tender is accepted, you keep the rest — there is no obligation to participate.'],
    ],
  },

  /* ------- Split & Demerger ------- */
  {
    file: 'split-demerger.html',
    title: 'Face Value Split & Demerger Explained — Price Adjustment',
    description: 'What a face value split and a demerger mean for your shares: how prices adjust, what happens to your cost basis, and where to verify record dates.',
    h1: 'Face Value Split & Demerger',
    intro: 'How splits and demergers change your share count and price — and what happens to your original cost.',
    appType: 'WebPage',
    body: `      <section>
        <h2>Face value split</h2>
        <p>A split reduces the face value of each share (₹10 → ₹2, say) and multiplies the share count to match. The market price divides by the same ratio on the record date, leaving your investment value unchanged. Model it precisely with the <a href="./stock-split-calculator.html">stock split calculator</a>.</p>
        <h2>Demerger</h2>
        <p>A demerger carves a business division out into a separate listed company, and you receive shares of the new entity in a fixed ratio. The parent's price drops by roughly the value of the business that left. Your original purchase cost gets apportioned between the two companies in a ratio the company publishes — keep that circular, you will need it for capital-gains tax.</p>
        <h2>Verify dates</h2>
        <p>Record dates and ratios are published on
          <a href="https://www.nseindia.com/companies-listing/corporate-filings-actions" rel="noopener">NSE</a> and
          <a href="https://www.bseindia.com/corporates/corporate_act.html" rel="noopener">BSE</a>.
        </p>
      </section>`,
    faqs: [
      ['Why did a stock in my portfolio suddenly fall 50%?', 'Check for a corporate action first. A 1:2 split or a large demerger halves the quoted price without losing you any money — your broker usually credits the extra or new shares within a few days.'],
    ],
  },

  /* ------- Stock Score ------- */
  {
    file: 'stock-score.html',
    title: 'Stock Score — Rate a Stock on 8 Fundamental Checks',
    description: 'Score any stock out of 100 on eight fundamental checks: growth, debt, ROE, valuation, promoter holding, moat, cash flow, and governance. Free and private.',
    h1: 'Stock Score',
    intro: 'Rate a stock on eight fundamental checks and get a score out of 100 — a structured second opinion before you buy, not a prediction.',
    body: `      <div class="card calc-card" id="score">
        <h2 class="visually-hidden">Scorecard</h2>
        <div class="score-grid">
          <div class="field"><label for="sc-growth">Revenue &amp; profit growth (last 3–5 yrs)</label>
            <select id="sc-growth" class="sc"><option value="">— pick —</option><option value="2">Consistently growing</option><option value="1">Flat / uneven</option><option value="0">Declining</option></select></div>
          <div class="field"><label for="sc-debt">Debt level (debt-to-equity)</label>
            <select id="sc-debt" class="sc"><option value="">— pick —</option><option value="2">Low or zero debt</option><option value="1">Moderate</option><option value="0">Heavy debt</option></select></div>
          <div class="field"><label for="sc-roe">Return on equity</label>
            <select id="sc-roe" class="sc"><option value="">— pick —</option><option value="2">Above 15%</option><option value="1">8–15%</option><option value="0">Below 8%</option></select></div>
          <div class="field"><label for="sc-val">Valuation vs peers (P/E, P/B)</label>
            <select id="sc-val" class="sc"><option value="">— pick —</option><option value="2">Cheaper than peers</option><option value="1">In line</option><option value="0">Expensive</option></select></div>
          <div class="field"><label for="sc-promoter">Promoter holding &amp; pledging</label>
            <select id="sc-promoter" class="sc"><option value="">— pick —</option><option value="2">High holding, no pledge</option><option value="1">Average</option><option value="0">Low / heavily pledged</option></select></div>
          <div class="field"><label for="sc-moat">Competitive moat</label>
            <select id="sc-moat" class="sc"><option value="">— pick —</option><option value="2">Strong brand / network / cost edge</option><option value="1">Some advantage</option><option value="0">Commodity business</option></select></div>
          <div class="field"><label for="sc-cash">Cash flow quality</label>
            <select id="sc-cash" class="sc"><option value="">— pick —</option><option value="2">Profits convert to cash</option><option value="1">Mixed</option><option value="0">Profits but no cash</option></select></div>
          <div class="field"><label for="sc-gov">Governance record</label>
            <select id="sc-gov" class="sc"><option value="">— pick —</option><option value="2">Clean history</option><option value="1">Minor concerns</option><option value="0">Red flags</option></select></div>
        </div>
        <div class="score-result" aria-live="polite">
          <p class="stat-label">Score</p>
          <p class="stat-value" id="sc-out">—</p>
          <p id="sc-band" class="score-band"></p>
        </div>
      </div>
      <section>
        <h2>How to use the score</h2>
        <p>Pull each answer from the annual report or any stock screener. A high score is a reason to research further — never a buy signal by itself.</p>
      </section>`,
    faqs: [
      ['Is this an AI prediction of the stock price?', 'No. It is a transparent, rules-based scorecard: eight fundamental checks, equally weighted, scored out of 100. No model can reliably predict short-term stock prices — be wary of tools that claim to.'],
    ],
  },

  /* ------- Trading Holidays ------- */
  {
    file: 'trading-holidays.html',
    title: 'NSE & BSE Trading Holidays 2026 — Full Market Holiday List',
    description: 'Complete list of NSE and BSE stock market trading holidays in 2026, including Muhurat trading on Diwali and holidays that fall on weekends.',
    h1: 'Trading Holidays 2026 (NSE & BSE)',
    intro: 'All days the Indian equity markets are closed in 2026, plus Muhurat trading. Always confirm near the date on the NSE site — exchanges occasionally revise the list.',
    appType: 'WebPage',
    body: `      <div class="card">
        <div class="table-wrap">
          <table class="breakdown holiday-table">
            <caption class="visually-hidden">NSE and BSE trading holidays 2026</caption>
            <thead><tr><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Holiday</th></tr></thead>
            <tbody>
              <tr><td>15 January</td><td>Thursday</td><td>Municipal Corporation Election (Maharashtra)</td></tr>
              <tr><td>26 January</td><td>Monday</td><td>Republic Day</td></tr>
              <tr><td>3 March</td><td>Tuesday</td><td>Holi</td></tr>
              <tr><td>26 March</td><td>Thursday</td><td>Shri Ram Navami</td></tr>
              <tr><td>31 March</td><td>Tuesday</td><td>Shri Mahavir Jayanti</td></tr>
              <tr><td>3 April</td><td>Friday</td><td>Good Friday</td></tr>
              <tr><td>14 April</td><td>Tuesday</td><td>Dr. Baba Saheb Ambedkar Jayanti</td></tr>
              <tr><td>1 May</td><td>Friday</td><td>Maharashtra Day</td></tr>
              <tr><td>28 May</td><td>Thursday</td><td>Bakri Id</td></tr>
              <tr><td>26 June</td><td>Friday</td><td>Muharram</td></tr>
              <tr><td>14 September</td><td>Monday</td><td>Ganesh Chaturthi</td></tr>
              <tr><td>2 October</td><td>Friday</td><td>Mahatma Gandhi Jayanti</td></tr>
              <tr><td>20 October</td><td>Tuesday</td><td>Dussehra</td></tr>
              <tr><td>10 November</td><td>Tuesday</td><td>Diwali — Balipratipada</td></tr>
              <tr><td>24 November</td><td>Tuesday</td><td>Prakash Gurpurb Sri Guru Nanak Dev</td></tr>
              <tr><td>25 December</td><td>Friday</td><td>Christmas</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <section>
        <h2>Muhurat trading</h2>
        <p><strong>Sunday, 8 November 2026 (Diwali — Laxmi Pujan):</strong> markets hold a special one-hour Muhurat trading session; exact timings are notified by the exchanges closer to the date.</p>
        <h2>Holidays falling on weekends</h2>
        <p>Mahashivratri (15 Feb, Sun), Id-Ul-Fitr (21 Mar, Sat), Independence Day (15 Aug, Sat), and Diwali Laxmi Pujan (8 Nov, Sun) fall on non-trading days in 2026.</p>
        <p class="note"><strong>Verify before you plan:</strong> the official calendar lives at
          <a href="https://www.nseindia.com/resources/exchange-communication-holidays" rel="noopener">NSE — exchange holidays</a>.
          Exchanges can add or revise holidays during the year.</p>
      </section>`,
    faqs: [
      ['Are NSE and BSE holidays the same?', 'Almost always yes for equity trading — both follow the same list of trading holidays. Settlement holidays and commodity-market (MCX) timings can differ.'],
    ],
  },

  /* ------- Books ------- */
  {
    file: 'books.html',
    title: 'Best Investment & Stock Market Books — Curated List',
    description: 'A curated list of the best books on investing, trading, and the stock market — classics for beginners, value investors, and India-focused readers.',
    h1: 'Best Books on Investing & the Stock Market',
    intro: 'A short, honest shelf — the books investors actually recommend to each other, grouped by where you are in the journey.',
    appType: 'WebPage',
    needsCalcJs: false,
    body: `      <section>
        <h2>Start here</h2>
        <ul class="book-list">
          <li><strong>The Psychology of Money</strong> — Morgan Housel. Why behaviour, not intelligence, decides investing outcomes.</li>
          <li><strong>One Up on Wall Street</strong> — Peter Lynch. Finding great companies in everyday life before analysts do.</li>
          <li><strong>The Little Book of Common Sense Investing</strong> — John C. Bogle. The case for low-cost index funds, from the man who invented them.</li>
        </ul>
        <h2>Value investing</h2>
        <ul class="book-list">
          <li><strong>The Intelligent Investor</strong> — Benjamin Graham. Margin of safety and Mr. Market; the foundation text Warren Buffett credits.</li>
          <li><strong>Common Stocks and Uncommon Profits</strong> — Philip Fisher. Judging business quality through the "scuttlebutt" method.</li>
          <li><strong>The Dhandho Investor</strong> — Mohnish Pabrai. Low-risk, high-uncertainty bets, explained simply.</li>
        </ul>
        <h2>India-focused</h2>
        <ul class="book-list">
          <li><strong>Stocks to Riches</strong> — Parag Parikh. Behavioural finance written for the Indian retail investor.</li>
          <li><strong>Coffee Can Investing</strong> — Saurabh Mukherjea. Buying quality Indian compounders and leaving them alone.</li>
          <li><strong>Bulls, Bears and Other Beasts</strong> — Santosh Nair. The story of Dalal Street through its booms and scams.</li>
        </ul>
        <h2>Trading & market history</h2>
        <ul class="book-list">
          <li><strong>Reminiscences of a Stock Operator</strong> — Edwin Lefèvre. A century old and still the best book on speculation and its costs.</li>
          <li><strong>Trading in the Zone</strong> — Mark Douglas. The mental discipline side of trading that charts don't teach.</li>
        </ul>
        <p class="note">Availability tip: all of these are easy to find at any major bookseller or library. Read one well rather than five quickly.</p>
      </section>`,
  },

  /* ------- Support ------- */
  {
    file: 'support.html',
    title: 'Support This Site — Stock Average Calculator',
    description: 'This calculator suite is free, private, and ad-light. Here is how you can support its development.',
    h1: 'Support this site',
    intro: 'Every tool here is free, private, and open — if it saves you time, here are two ways to support it.',
    appType: 'WebPage',
    needsCalcJs: false,
    body: `      <div class="card">
        <h2>Ways to help</h2>
        <p><a class="btn btn-primary" href="https://github.com/rohith-kantipudi7/Stock-Calculator" rel="noopener">⭐ Star the project on GitHub</a></p>
        <p>A star helps other investors find these tools — it costs nothing and takes two seconds.</p>
        <!-- Buy Me a Coffee: create an account at buymeacoffee.com, then replace USERNAME
             below and remove the surrounding comment markers.
        <p><a class="btn btn-ghost" href="https://www.buymeacoffee.com/USERNAME" rel="noopener">☕ Buy me a coffee</a></p>
        -->
        <p>You can also share the calculator with anyone averaging a stock — the share button on the <a href="./">home page</a> copies a link with your numbers filled in (share your own carefully!).</p>
      </div>`,
  },

  /* ------- Contact ------- */
  {
    file: 'contact.html',
    title: 'Contact — Stock Average Calculator',
    description: 'Found a bug, want a new calculator, or have feedback? Here is how to reach the maintainer of the Stock Average Calculator.',
    h1: 'Contact',
    intro: 'Bug reports, feature requests, and feedback are all welcome.',
    appType: 'WebPage',
    needsCalcJs: false,
    body: `      <div class="card">
        <h2>Get in touch</h2>
        <p><a class="btn btn-primary" href="https://github.com/rohith-kantipudi7/Stock-Calculator/issues/new" rel="noopener">Open an issue on GitHub</a></p>
        <p>The fastest way to report a bug or request a calculator — no account email needed beyond GitHub, and the conversation stays public so others benefit.</p>
        <!-- Prefer email? Add your address here:
        <p>Email: <a href="mailto:you@example.com">you@example.com</a></p>
        -->
        <p class="note">Please don't send personal financial details — nothing on this site needs them, and no one here will ever ask.</p>
      </div>`,
  },
];

/* ---------------- write files ---------------- */

for (const page of PAGES) {
  writeFileSync(join(ROOT, page.file), render(page), 'utf8');
  console.log('wrote', page.file);
}
console.log(`\n${PAGES.length} pages generated.`);
