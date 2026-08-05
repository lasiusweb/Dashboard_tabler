# firstcrop.in — Ecommerce Storefront Plan

## Context

Repo: Tabler fork (`lasiusweb/Dashboard_tabler`). This adds the **customer-facing
storefront** for **firstcrop.in**, an Indian agriculture-inputs ecommerce company
(seeds, fertilizers, pesticides, tools & equipment, irrigation, animal feed), as a
sibling to the existing admin dashboard suite (`ecommerce-*.astro`).

The storefront is a **12-page static site** (Astro, `format: 'file'`) rendered from
local JSON, with an optional **Supabase no-code CMS** layer for content editors. It
stays 100% static at runtime: content is fetched at **build time** and falls back to
the checked-in JSON files when Supabase is unreachable or unconfigured. Auth,
server-side cart, and payments are **explicitly out of scope** (auth deferred).

Branding: firstcrop.in, agri green (`#2fb344`, the `--fc-green` token), Geist /
Geist Mono, **₹ INR** formatting, Kharif/Rabi/Zaid crop seasons, Indian states.

## Decisions (from user)

- **Deliverable**: Tabler demo pages in this repo (not standalone HTML).
- **12 pages** (wishlist and offers included — all customer flows).
- **Dedicated `StoreLayout`** (customer-facing header/footer/search, no admin sidebar).
- **Images**: "real photos later" — `image: null` placeholder contract now, tiles
  render with an icon + gradient placeholder; Supabase Storage path reserved in schema.
- **No-code CMS = Supabase** (chosen over Keystatic — Astro 7.1.3 is outside
  `@keystatic/astro`'s peer range — and over Tina/hosted services). CMS admin is
  Supabase Studio; edits flow through the **build**.
- **Load strategy**: build-time fetch (anon key only, never service_role in the
  bundle) → local JSON fallback on failure/empty.
- **Data layout**: per-entry JSON files under `shared/data/storefront/**`, mirroring
  the Supabase tables 1:1 (jsonb for nested arrays keeps domain types stable).
- **Auth**: deferred (guest cart in localStorage; order confirmation is demo-only).
- **Design**: Hallmark modern-minimal + editorial season layer. Home = Ecosystem
  Index, Shop/Category = Catalogue, Season = Long Document, Support = Conversational
  FAQ, Offers = bento grid. Nav N12 banner+retract, Footer Ft5 "Grow with firstcrop.".

## Data model — `shared/data/storefront/`

Types are shared between JSON, Supabase and pages (no duplication of domain types —
keep them in `shared/lib/storefront-data.ts`).

### Collections (one file per entry, `{slug}.json`)

- **products/** — id (FC- SKUs, coherent with admin data), slug, name, categoryId,
  brand, image (`null` now / `storage://…` later), rating, ratingCount, reviewIds,
  shortDescription, longDescription, highlights[], specifications{}, packSizes[]
  (label, mrp, price, unit, subsidy?), stock (count / null), tags[], badge?, season[],
  cultivationGuide?, priceTrend[] {date, price}.
  Coherent SKUs: FC-1208 paddy seeds, FC-1042 DAP, FC-0771 Urea, FC-0554
  Imidacloprid, FC-2014 wheat seeds, Carbendazim etc.
- **categories/** — slug, name, icon, description, productIds[], season?, faqIds[].
- **offers/** — slug, title, description, code, type (percent|fixed|freeShipping),
  value, minBasket, validUntil, products[] (productIds), color, icon, featured.
- **reviews/** — id, productId, author, rating, date, title, body, verified,
  helpfulCount.
- **faqs/** — id, category (ordering|delivery|payment|returns|product), question,
  answer.
- **crops/** — slug, name, season, sowStart, sowEnd, harvestStart, harvestEnd,
  states[], productIds[], tip.
- **pincodes/** — pincode, zone (metro|urban|semi-urban|rural), deliveryDays, cod.

### Singletons (single JSON file each)

- **home.json** — hero (title, subtitle, ctas[]), categoryTiles[] (categoryId, image),
  featuredProducts[] (productId), bundles[], seasonCallout, testimonials[], stats[],
  trustBadges[].
- **checkout.json** — deliveryFees{} by zone, freeShipThreshold, codFee, payMethods[]
  (id, name, icon, disabled?), validation{} (name/phone/pincode regex, address limits),
  supportNote.
- **support.json** — channels[] (whatsapp/phone/email, hours), policies[]
  (returns/refund/replacement), escalationSteps[], footerNote.
- **cart.json** — emptyState (title, message), savedForLater[], recommended[] (productId).
- **wishlist.json** — emptyState, giftPrompt.

Order data (for **store-orders**) mirrors `ecommerce-orders.json` IDs and customer
names (Ramesh Patil, Sunita Devi, Farmers Collective Nashik, Kisan Agro Services),
5 statuses, payment-mix order (UPI 46 / COD 31 / Cards 9 / Wallets 8 / NB 6 %).

## Supabase CMS

### Schema (`supabase/storefront-schema.sql`)

Tables `storefront_categories | storefront_products | storefront_offers |
storefront_reviews | storefront_faqs | storefront_crops | storefront_pincodes |
storefront_orders | storefront_config`. Each: `id uuid pk default gen_random_uuid()`,
`slug text unique`, `data jsonb not null` (the full per-entry payload), `updated_at
timestamptz default now()`. `storefront_config` holds key/value singleton rows
(`home`, `checkout`, `support`, `cart`, `wishlist`).

### RLS

- Enable RLS on every table.
- **`select using (true)`** on all content tables — anon reads everything (public
  storefront).
- **No insert/update/delete policies** — writes happen in Supabase Studio (service
  role), which bypasses RLS.
- `storefront_orders`: select true (demo data only; auth deferred).

### Env & client

- `preview/.env.example`: `PUBLIC_SUPABASE_URL=`, `PUBLIC_SUPABASE_ANON_KEY=`.
- `shared/lib/supabase.ts`: creates the client lazily only when both env vars exist;
  `fetchStorefrontTable(table)` → rows, `fetchStorefrontEntry(table, slug)`.
- Loader (`shared/lib/storefront-data.ts`): at build (`import.meta.env.SSR`), try
  Supabase per table; on any error/empty/missing env → read local JSON; log one hint
  line (`[storefront] Supabase unavailable for <table>, using JSON fallback`).

### Seed

`scripts/seed-storefront.mjs` (repo root, node, `@supabase/supabase-js`): upserts
every `shared/data/storefront/**` entry into its table via service-role client
(`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, **never** committed). Deletes rows not
present locally (source of truth = JSON).

## Shared libs

- `shared/lib/storefront.ts` — pure engines (unit-testable, no I/O):
  - `formatINR(n)` — ₹ `en-IN` formatting.
  - `cartTotals(items)` — subtotal, discount, delivery (from zone), codFee, total.
  - `applyCoupon(items, coupon, offers)` — percent/fixed/freeShipping, minBasket.
  - `checkPinCode(pincode, pincodes)` → { zone, days, cod } or null.
  - `searchProducts(products, query)` — naive substring/normalised match on name,
    brand, tags, category (`toLowerCase`).
  - `deliveryEstimate(pin, pincodes)` → date string.
  - `orderStatusStep(status)` → 1..5 for Steps.
- `shared/lib/storefront-data.ts` — typed loaders + JSON fallback (see above) and
  the shared TypeScript types.

## New components (`shared/components/storefront/`)

Atoms:
- `ProductImage.astro` — props { product, size? }. Renders a styled placeholder tile
  (category icon + gradient) when `image` is null; real `<img>` when present.
- `PriceTag.astro` — { mrp, price, size? } → price + strikethrough mrp + discount %.
- `RatingStars.astro` — { rating, showValue? } — custom (kit `Rating.astro` needs the
  StarRating lib).
- `CategoryTile.astro` — category card with icon + count + link.

Composite:
- `ProductCard.astro` — image, badge, PriceTag, rating, name, AddToCartButton,
  wishlist toggle, `hover:true` quick-add. Links to product page.
- `AddToCartButton.astro` — 8-state button (idle → adding → added → out-of-stock /
  disabled / compact / block / icon-only), localStorage cart, toast on add.
- `QuantityStepper.astro` — +/- with value clamp, used in cart & PDP.
- `WishlistToggle.astro` — heart outline→filled, localStorage wishlist, toast.
- `CouponChip.astro` — { code, value } → coupon with apply/copy affordance.

Layout:
- `StoreLayout.astro` — wraps BaseLayout (customer-facing): StoreHeader, banner,
  `<slot>`, StoreFooter, SearchModal, cart/wishlist toasts. Props: title, description,
  pageLibs, currentNav (for retract), bodyClass.
- `StoreHeader.astro` — Nav N12: announcement banner (retracts on scroll), logo,
  nav (Home, Shop, Season, Offers, Support), search trigger, wishlist icon, cart icon
  with count badge (localStorage), mobile offcanvas menu.
- `StoreFooter.astro` — Ft5: statement "Grow with firstcrop." + 4 link columns +
  contact + WhatsApp + payments row.
- `SearchModal.astro` — modal with input; on submit → `store-shop.html?q=…`.
- `FaqAccordion.astro` — custom accordion driven by faqs (kit Accordion is bound to
  questions.json).
- `OrderTimeline.astro` — custom vertical timeline from order events (kit Timeline is
  hard-coded).

`Empty.astro` is reused from the kit (`@ui/Empty.astro`) for empty cart/wishlist.

## Menu wiring (`shared/data/menu.json`)

New top-level group, flat level-2 children (so `NavbarMenuItem.astro` active states
work), `columns: 2`:

```json
"storefront": {
  "title": "Storefront",
  "icon": "building-store",
  "columns": 2,
  "children": {
    "home":          { "url": "store-home.html",          "title": "Home",   "badge": "New" },
    "shop":          { "url": "store-shop.html",          "title": "Shop" },
    "category":      { "url": "store-category.html",      "title": "Category" },
    "product":       { "url": "store-product.html",       "title": "Product" },
    "cart":          { "url": "store-cart.html",          "title": "Cart" },
    "checkout":      { "url": "store-checkout.html",      "title": "Checkout" },
    "confirmation":  { "url": "store-confirmation.html",  "title": "Order confirmation" },
    "orders":        { "url": "store-orders.html",        "title": "My orders" },
    "wishlist":      { "url": "store-wishlist.html",      "title": "Wishlist" },
    "season":        { "url": "store-season.html",        "title": "Season" },
    "support":       { "url": "store-support.html",       "title": "Support" },
    "offers":        { "url": "store-offers.html",        "title": "Offers" }
  }
}
```

`pageMenu = storefront.<key>` on each page.

## Charts (`shared/data/charts.json`) — add 3, all ApexCharts (`pageLibs: ['apexcharts']`)

- `store-season-crop-calendar` — bar/heatmap of Kharif/Rabi/Zaid sowing windows per
  crop (used on **Season**).
- `store-pdp-price-trend` — line of product `priceTrend` (used on **Product**).
- `store-home-category-share` — donut of category share (used on **Home**, matches
  admin `ecom-overview-categories` splits).

## Pages (12) — all `preview/pages/store-*.astro`

1. **store-home** — Ecosystem Index. Hero (Kharif-ready banner, CTAs), trust badges
   (genuine inputs, COD, doorstep), category tiles, featured products row, category
   share donut, season callout → Season, bundles, testimonials, WhatsApp strip.
2. **store-shop** — Catalogue. Hero strip, category chips, sort + filter bar (plain
   `.form-select`, no TomSelect), product grid, Pagination (kit), "X of Y results",
   responsive 1/2/3/4 cols.
3. **store-category** — Catalogue detail. Breadcrumb, category hero (icon, blurb),
   season note, product grid for `categoryId`, filter chips.
4. **store-product** — Product detail. Breadcrumb, ProductImage gallery, PriceTag +
   pack size select, AddToCartButton + QuantityStepper, delivery pin check
   (input + zone/ETA result), highlights, specs table, cultivationGuide, price-trend
   chart, reviews (RatingStars + list), related products, wishlist toggle, FAQ subset.
5. **store-cart** — Cart. Line items (image, name, PriceTag, QuantityStepper,
   remove), coupon row (CouponChip + apply), saved-for-later, price summary card
   (subtotal, discount, delivery, total), checkout CTA, empty state.
6. **store-checkout** — Checkout. Steps (Cart→Details→Payment→Review), 3-column:
   address form (FormGroup/InputGroup, client-side validation from checkout.json),
   payment method radios (UPI/COD/Cards/Wallets/NB with icons), order summary
   (items + totals + delivery ETA), place-order → confirmation. Demo-only submit.
7. **store-confirmation** — Order confirmation. Success hero, order ID, Steps
   (Placed→Packed→Shipped→Delivered), summary, "track in My orders", WhatsApp
   update prompt.
8. **store-orders** — My orders. Order cards (id, date, status badge, items, amount,
   timeline mini), OrderTimeline expand, reorder button, filter tabs
   (NavSegmented: All/In-transit/Delivered/Cancelled).
9. **store-wishlist** — Wishlist. Grid of wishlist products (localStorage), move-to-cart,
   empty state, gift prompt, "browse shop" CTA.
10. **store-season** — Long Document. Season tabs (Kharif/Rabi/Zaid), crop cards
    (sow/harvest windows, states), crop calendar chart, per-crop product rails,
    agronomist tip strips.
11. **store-support** — Conversational FAQ. Contact channels (WhatsApp/phone/email
    cards), search-in-FAQ input, FaqAccordion grouped by category, policy cards,
    escalation steps.
12. **store-offers** — Bento. Featured offer hero, offer cards grid (code, value,
    min basket, valid-until, product links), "How to apply" strip, WhatsApp CTA.

All pages: `pageMenu="storefront.<key>"`, `title`, `description`; use `@ui/*` kit +
`@shared/components/storefront/*`. Import data via `@data/storefront/...` through the
typed loaders. Images render placeholders via `ProductImage`.

## Build order

1. `shared/lib/storefront.ts` + `storefront-data.ts` (types + loaders).
2. Data files: `shared/data/storefront/**` (products, categories, offers, reviews,
   faqs, crops, pincodes, orders + singletons).
3. Atoms + composite components.
4. `StoreLayout` / `StoreHeader` / `StoreFooter` / `SearchModal` / `FaqAccordion` /
   `OrderTimeline`.
5. Pages, in sets: home → shop/category/product → cart/checkout/confirmation →
   orders/wishlist → season/support/offers.
6. Wire `menu.json` + `charts.json`; add `@supabase/supabase-js` to
   `preview/package.json` deps.
7. `supabase/storefront-schema.sql`, `scripts/seed-storefront.mjs`,
   `preview/.env.example`.
8. Changesets.

## Verification

- **Offline build**: no env → JSON fallback; `pnpm --filter @firstcrop/preview build`
  succeeds with zero env vars set; a `.env` build exercises Supabase (needs credentials).
- `pnpm --filter @firstcrop/preview type-check` (`astro check`).
- `pnpm lint` / `pnpm run lint-prettier` for the touched files.
- RLS spot-check: anon `select` returns rows; anon `insert` fails.
- Studio edit loop: change a product name → re-run build → page reflects it.
- Responsive: 320 / 375 / 414 / 768 / 1440; cart & header counts sync across pages
  via localStorage events.
- Hallmark slop gate on the six distinct templates.

## Changesets

- `.changeset/storefront-pages.md` — `@firstcrop/preview` **minor**: 12 storefront
  pages + StoreLayout + storefront components.
- `.changeset/storefront-data-files.md` — `@firstcrop/preview` **minor**: storefront
  JSON data files + menu/charts wiring.
- `.changeset/storefront-supabase.md` — `@firstcrop/preview` **minor**: Supabase CMS
  layer (schema, seed, loader, env example).

## Status (completed)

- **12 pages built** in `preview/pages/store-*.astro` (home, shop, category, product,
  cart, checkout, confirmation, orders, wishlist, season, support, offers).
- **14 components** in `shared/components/storefront/` (ProductCard, ProductImage,
  PriceTag, RatingStars, CategoryTile, AddToCartButton, QuantityStepper,
  WishlistToggle, CouponChip, FaqAccordion, OrderTimeline, SearchModal,
  StoreHeader, StoreFooter).
- **3 libs** (`storefront.ts`, `storefront-data.ts`, `storefront-client.ts`).
- **~80 data files** in `shared/data/storefront/` (products, categories, offers,
  reviews, FAQs, crops, pincodes, orders + singletons).
- **3 chart configs** added to `shared/data/charts.json` (crop calendar heatmap,
  category donut, price trend line).
- **Storefront menu group** wired in `menu.json` (12 flat children, `columns: 2`,
  icon `building-store`, Home badge "New").
- **Supabase layer**: `supabase/storefront-schema.sql` (9 tables + RLS + indexes),
  `scripts/seed-storefront.mjs` (JSON → Supabase upsert), `preview/.env.example`.
- **Changesets**: storefront-pages (minor), storefront-data-files (minor),
  storefront-supabase (minor).
- **Verification**: `astro check` 0 errors/0 warnings; `astro build` emitted all 12
  storefront pages to `dist/`; menu active states render in HTML; 743 JS tests pass;
  110 SCSS tests pass; lint-prettier only reports pre-existing formatting warnings
  on storefront libs.
