# firstcrop.in — Ecommerce Dashboard Suite Plan

## Context

Repo: Tabler fork (`lasiusweb/Dashboard_tabler`). Add an ecommerce dashboard suite for
**firstcrop.in**, an Indian agriculture-inputs ecommerce company (seeds, fertilizers,
pesticides, tools & equipment, irrigation, animal feed), with a cross-border expansion
section.

Branding defaults: firstcrop.in in page headers, green/primary agri accent,
**₹ INR** domestic, **USD** for export figures, Indian states/crop-season data.

## Decisions (from user)

- Deliverable: **Tabler demo pages** in this repo (not standalone HTML).
- Scope: **Full ecommerce suite** — overview dashboard + Orders + Products + Customers +
  Marketing sub-pages, plus **cross-border section** on the overview.
- "More deep-dive into ecommerce features" → expanded to **10 pages** (see below).
- Cards inlined per page (crypto-style); shared pieces only where reused.

## Menu wiring (`shared/data/menu.json`)

New top-level group, flat children (level-2 so navbar active states work —
`NavbarMenuItem.astro` only highlights `currentPage.length === 2`):

```json
"ecommerce": {
  "title": "Ecommerce",
  "icon": "shopping-cart",
  "columns": 2,
  "children": {
    "overview":    { "url": "dashboard-ecommerce.html", "title": "Overview",    "badge": "New" },
    "orders":      { "url": "ecommerce-orders.html",     "title": "Orders" },
    "payments":    { "url": "ecommerce-payments.html",   "title": "Payments" },
    "products":    { "url": "ecommerce-products.html",   "title": "Products" },
    "customers":   { "url": "ecommerce-customers.html",  "title": "Customers" },
    "marketing":   { "url": "ecommerce-marketing.html",  "title": "Marketing" },
    "loyalty":     { "url": "ecommerce-loyalty.html",    "title": "Loyalty" },
    "support":     { "url": "ecommerce-support.html",    "title": "Support" },
    "logistics":   { "url": "ecommerce-logistics.html",  "title": "Logistics" },
    "forecasting": { "url": "ecommerce-forecasting.html", "title": "Forecasting" }
  }
}
```

`pageMenu` values: `ecommerce.overview`, `ecommerce.orders`, ... (pageMenu = level1.level2).

## Pages & features (each panel answers: healthy? / bottleneck? / changed? / action?)

### 1 · Overview (`dashboard-ecommerce.astro`) — 30-sec health check
- KPI row (8): GMV ₹, Orders, AOV, Conversion, Active customers, Cart abandonment (red),
  Repeat rate, Stock-out SKUs (red) — `SmallStats` sparklines + `Trending` deltas
- Revenue trend (area, this FY vs last FY), Orders trend (30d line), Category donut
  (Seeds/Fertilizers/Pesticides/Tools & Equip/Irrigation/Animal feed), Top-selling products
- Acquisition funnel bar (Sessions→views→add-to-cart→checkout→payment→order) + conversion by channel
- Fulfillment pipeline (pending→packed→shipped→delivered, on-time %), Low-stock alerts (→Products),
  Recent orders (→Orders), Regional sales (top 8 states, h-bar)
- Agriculture: Kharif/Rabi/Zaid seasonality stacked + sowing-calendar note; category margin/growth table
- **Cross-border**: export market scorecards, landed-cost monitor, shipping corridors,
  FX INR/USD line, compliance checklist

### 2 · Orders (`ecommerce-orders.astro`)
KPIs (orders today, delivered on-time %, RTO %, returns %, cancellations %, pending) ·
status pipeline w/ ₹ value · payment-mix donut (UPI/COD/Cards/Wallets/NB) ·
RTO trend + reason breakdown (COD refusal, address unavailable, buyer unavailable) ·
cancellations by reason · order-value distribution · delivery SLA by zone ·
recent orders table w/ status + payment badges and filters

### 3 · Payments & Settlements (`ecommerce-payments.astro`)
KPIs (collections, payment success rate, refunds pending, settlement T+days, gateway fees %) ·
success/fail by method · failure-code breakdown (insufficient balance, OTP timeout, bank down) ·
refund pipeline + value trend · settlement calendar (T+1 UPI, T+2 cards, COD cycle) ·
COD collection (out-for-collection / collected / bounced) · gateway fees vs GMV line ·
reconciliation exceptions table

### 4 · Products & Inventory (`ecommerce-products.astro`)
KPIs (live SKUs, stock-out SKUs red, low stock, inventory value ₹, days-of-inventory) ·
category performance · top sellers (stock-health badge) · slow movers + dead stock (Markdown action) ·
stock-out / low-stock alerts (Reorder) · stock-health donut (healthy/low/out) ·
inventory value by category (h-bar) · price-band + margin · subsidy-tagged fertilizer SKUs ·
worst returners by product

### 5 · Customers (`ecommerce-customers.astro`)
KPIs (active, new, repeat %, avg LTV, churn) · new vs repeat stacked area ·
cohort retention table · RFM segments donut + table (Champions/Loyal/At-risk/New/Lost) ·
top customers (region, orders, AOV, LTV, last order, segment badge) ·
dealers/wholesale vs retail-farmer split + FPO bulk buyers · CAC vs LTV by segment ·
customers by state (top 10)

### 6 · Marketing (`ecommerce-marketing.astro`)
KPIs (sessions, conversion, CAC, ROAS, coupon redemptions, repeat rate) ·
traffic by channel (Organic, Paid Google, Paid Meta, WhatsApp, Social, Referral, Direct) ·
channel funnel table (sessions→add-to-cart→orders→conversion %) · CAC vs LTV per channel (grouped bar) ·
campaign table (spend, revenue, ROAS) + spend/ROAS trend · coupons/offers table (code, type,
redemptions, GMV, burn rate) · A/B test tracker (variant, sessions, conversion, lift, significance)

### 7 · Loyalty & WhatsApp (`ecommerce-loyalty.astro`)
KPIs (members, redemption rate, reorder rate, WA orders, WA conversion) ·
points issued/redeemed trend · WhatsApp funnel (sent→delivered→read→replied→ordered) ·
reorder reminders (agri seasonal) · loyalty tiers table · cashback/points burn vs GMV

### 8 · Support & Returns (`ecommerce-support.astro`)
KPIs (open tickets, avg first response, avg resolution, CSAT %, return rate, returns TAT) ·
tickets by channel (WhatsApp/call/email/app) + category (delivery, quality, refund, damage) ·
ticket volume + backlog · resolution time by category · returns workflow
(requested→pickup→QC→refund→restock) + TAT · RTO restock vs write-off ·
rating health by category · repeat-contactus rate

### 9 · Logistics & Fulfillment (`ecommerce-logistics.astro`)
KPIs (on-time %, avg delivery days, RTO %, damages %, pending dispatches) ·
delivery SLA by zone (metro/urban/semi-urban/rural) · carrier scorecard (volume, on-time %, transit, damage) ·
pin-code serviceability by state · pick/pack queue age + dispatch SLA ·
transit timeline (placed→packed→carrier→delivered, median days) ·
last-mile exception breakdown (address, buyer unavailable, weather, delayed)

### 10 · Demand & Forecasting (`ecommerce-forecasting.astro`)
Seasonal demand curve by category (forecast vs actual, Kharif/Rabi/Zaid-aligned) ·
sowing-calendar alignment table (crop × window × bundle demand) · forecast accuracy (WAPE) ·
reorder suggestions (stock vs forecast vs supplier) · weather-risk flag (delayed monsoon states) ·
crop-input bundle attach rate (paddy/wheat kits)

## Files

**Create**
- `preview/pages/` → the 10 `.astro` pages above
- `shared/data/` → `ecommerce-dashboard.json`, `ecommerce-orders.json`, `ecommerce-payments.json`,
  `ecommerce-products.json`, `ecommerce-customers.json`, `ecommerce-marketing.json`,
  `ecommerce-loyalty.json`, `ecommerce-support.json`, `ecommerce-logistics.json`,
  `ecommerce-forecasting.json`, `ecommerce-cross-border.json`
- `shared/components/cards/EcommerceStats.astro` — reusable KPI card (reuse `SmallStats`
  where the sparkline branch fits)

**Modify**
- `shared/data/menu.json` — add `ecommerce` group
- `shared/data/charts.json` — ~40 new `ecom-*` configs (one per chart panel above)
- `.changeset/` — `ecommerce-dashboard.md` (minor `@tabler/preview`, pages) +
  `ecommerce-data-files.md` (patch `@tabler/preview`, data files) — mirrors
  `crm-dashboard-page.md` / `crypto-data-files.md` precedent (use `generate-changeset` skill)

**Conventions**
- Cards inlined per page using existing UI components (`Card`, `CardHeader`, `CardBody`,
  `Chart`, `Badge`, `Progress`, `StatusDot`, `Trending`, `DropdownDays`, `NavSegmented`,
  `Pagination`, `Avatar`, `Icon`).
- Chart configs go in `shared/data/charts.json` (schema in `shared/lib/chart-script.ts`),
  rendered via `@ui/Chart.astro` (`chartId`).
- No new vendor libs; regional view = horizontal bar (no jsvectormap India map).

## Verification
1. `pnpm --filter @tabler/preview dev` → open all 11 routes, confirm charts render + menu active states
2. `pnpm --filter @tabler/preview type-check`
3. `pnpm run lint-prettier` on new files
4. Generate changesets via `generate-changeset` skill
5. Review `git status` / `git diff`

## Open items
- Scope confirmation: full 10-page suite vs trimmed variant
  (trim options: merge Payments/Logistics→Orders, Support→Customers, Loyalty→Marketing;
  drop Forecasting or Loyalty; move cross-border section to its own page).
- Security check to be run before implementation.

## Status (completed)
- **Security audit clean** — 0 confirmed vulnerabilities (artifacts in
  `C:\Users\Lenovo\security-audit-skill\Dashboard_tabler\run-1\`).
- **All 10 pages built** in `preview/pages/` (`dashboard-ecommerce` + `ecommerce-*`),
  cross-border section on the overview page.
- **11 data files** created in `shared/data/` (`ecommerce-{dashboard,orders,payments,
  products,customers,marketing,loyalty,support,logistics,forecasting,cross-border}.json`).
- **44 `ecom-*` chart configs** appended to `shared/data/charts.json`.
- **`shared/components/cards/EcommerceStats.astro`** — reusable KPI card.
- **`shared/data/menu.json`** — `ecommerce` group wired (flat children, `columns: 2`,
  icon `shopping-cart`, Overview badge "New").
- **Changesets**: `.changeset/ecommerce-dashboard-pages.md` (minor) +
  `.changeset/ecommerce-data-files.md` (patch).
- **Verification**: `astro check` 0 errors / 0 warnings; `astro build` emitted all 10
  pages to `dist/` with nav + data confirmed in HTML. `lint-prettier` only reports
  pre-existing parser warnings on unrelated core/js + shared/lib files.
- Environment-only blockers (unrelated to this work): `assets` script `terser` call
  breaks under PowerShell quoting; post-build `prettify-html` hook fails with
  `npx ENOENT`. Page compilation itself succeeds.

