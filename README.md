# Stock Average Calculator

A fast, modern, SEO-optimized **stock average calculator** — add unlimited buys and get your
weighted average share price instantly, with an averaging-down planner and a visual breakdown chart.

**Live site:** https://rohith-kantipudi7.github.io/Stock-Calculator/

## Features

- ♾️ **Unlimited buy entries** — add or remove purchases freely, results update as you type
- 🎯 **Averaging-down planner** — enter a target average and today's price; it tells you exactly how many shares to buy and the cost
- 📊 **Breakdown chart** — every buy as a bar with your average marked, plus a per-purchase table
- 💱 **Multi-currency** — INR, USD, EUR, GBP, JPY with proper locale formatting
- 🔗 **Shareable links** — your inputs are encoded in the URL, so a link reproduces the calculation
- 🌗 **Dark / light themes** — follows your system, with a manual toggle
- 📱 **Installable PWA** — works fully offline after the first visit
- 🔒 **Private by design** — zero dependencies, zero tracking, nothing leaves the browser

## SEO

- Semantic HTML with a single `h1`, descriptive headings, and rich FAQ/how-to content
- JSON-LD structured data: `WebApplication`, `WebSite`, `FAQPage`, `HowTo`, `BreadcrumbList`
- Open Graph + Twitter Card tags with a generated 1200×630 preview image
- `sitemap.xml`, `robots.txt`, canonical URLs, `noindex` on the 404 page
- No external fonts, frameworks, or render-blocking third-party requests (fast Core Web Vitals)

**After deploying**, submit the site to search engines:

1. [Google Search Console](https://search.google.com/search-console) → add property
   `https://rohith-kantipudi7.github.io/Stock-Calculator/` → verify via the HTML-tag method
   (paste the `google-site-verification` meta tag into `index.html` `<head>`) → submit `sitemap.xml`.
2. [Bing Webmaster Tools](https://www.bing.com/webmasters) → it can import directly from Search Console.

## Monetization (ready, not enabled)

The site is pre-wired for ads when you want them:

- Two reserved `<aside class="ad-slot">` placements in `index.html` (hidden by default) —
  paste your ad unit inside and remove the `hidden` attribute.
- `ads.txt` template at the root — replace with your real publisher line (e.g. AdSense `pub-…` ID).
- `privacy.html` privacy policy page (required by most ad networks), linked from the footer.

## Development

It's a static site — no build step. Serve the folder locally:

```bash
python -m http.server 8080
# or
npx serve .
```

To regenerate the icons / Open Graph image (Windows):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-assets.ps1
```

## Deploying to GitHub Pages

1. Push to the `main` branch of this repository.
2. In the repo settings: **Settings → Pages → Source → Deploy from a branch**, pick `main` / `/ (root)`.
3. The site publishes at `https://<username>.github.io/Stock-Calculator/`.

## Disclaimer

For education only — not investment advice. Markets are unpredictable; always do your own research.
