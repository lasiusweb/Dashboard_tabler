<p align="center">
<img src="https://raw.githubusercontent.com/tabler/tabler/refs/heads/dev/shared/static/logo.svg" alt="FirstCrop — Premium and open source dashboard template with a responsive and high-quality UI." width="300"><br><br>
A premium and open source dashboard template with a responsive and high-quality UI.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@firstcrop/core" target="__blank"><img src="https://img.shields.io/npm/v/@firstcrop/core?color=2fb344&label=Latest+version" alt="NPM version"></a>
<a href="https://www.npmjs.com/package/@firstcrop/core" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@firstcrop/core?color=2fb344&label=Downloads"></a>
<a href="https://preview.firstcrop.in" target="__blank"><img src="https://img.shields.io/static/v1?label=Demo&message=preview&color=2fb344" alt="FirstCrop preview"></a>
<a href="https://github.com/firstcrop/firstcrop/blob/dev/LICENSE"><img src="https://img.shields.io/npm/l/tabler.svg?label=License&message=MIT&color=1c7ed6" alt="License"></a>
</p>

## Overview

FirstCrop is a Tabler-based dashboard and UI kit fork, rebranded for **firstcrop.in** — an Indian agriculture-inputs ecommerce company selling seeds, fertilizers, pesticides, tools & equipment, irrigation, and animal feed across India.

This repo contains:

- **`@firstcrop/core`** — SCSS + JS component library (`--fc-*` CSS custom properties, Bootstrap-based)
- **`@firstcrop/preview`** — 140+ demo pages including admin dashboards and a full customer-facing storefront
- **`@firstcrop/docs`** — Documentation site (Astro)
- **`@firstcrop/shared`** — Layouts, data files, and reusable Astro components

## Pages

### Dashboards (3)

| Page | Description |
|------|-------------|
| `index.html` | Default admin dashboard |
| `dashboard-crypto.html` | Crypto portfolio dashboard |
| `dashboard-crm.html` | CRM dashboard |

### Ecommerce Admin (10)

| Page | Description |
|------|-------------|
| `dashboard-ecommerce.html` | Overview — GMV, orders, AOV, conversion, fulfillment pipeline, regional sales |
| `ecommerce-orders.html` | Order pipeline, RTO trends, payment mix, delivery SLA by zone |
| `ecommerce-payments.html` | Collections, success/fail rates, refunds, settlement calendar, gateway fees |
| `ecommerce-products.html` | Inventory health, stock alerts, slow movers, price bands, subsidy tags |
| `ecommerce-customers.html` | RFM segments, cohort retention, LTV, dealer vs retail split |
| `ecommerce-marketing.html` | Channel funnel, CAC vs LTV, campaign ROAS, coupon tracking, A/B tests |
| `ecommerce-loyalty.html` | Loyalty tiers, WhatsApp funnel, seasonal reorder reminders |
| `ecommerce-support.html` | Ticket backlog, resolution time, returns workflow, CSAT |
| `ecommerce-logistics.html` | Carrier scorecard, zone SLA, pin-code serviceability, last-mile exceptions |
| `ecommerce-forecasting.html` | Seasonal demand curves, sowing calendar, reorder suggestions |

### Customer Storefront (12)

| Page | Description |
|------|-------------|
| `store-home.html` | Ecosystem index — hero, trust badges, category tiles, featured products |
| `store-shop.html` | Product catalogue with sort, filter, and search |
| `store-category.html` | Category detail page with product grid |
| `store-product.html` | Product detail — pricing, pack sizes, delivery check, reviews, price trend |
| `store-cart.html` | Cart with quantity steppers, coupon apply, price summary |
| `store-checkout.html` | Address form, payment method selection, order summary |
| `store-confirmation.html` | Order success hero, tracking steps, WhatsApp prompt |
| `store-orders.html` | Order history with timeline, reorder, filter tabs |
| `store-wishlist.html` | Wishlist grid with move-to-cart |
| `store-season.html` | Kharif/Rabi/Zaid crop calendar, sowing windows, product rails |
| `store-support.html` | FAQ accordion, contact channels, policies, escalation steps |
| `store-offers.html` | Bento grid of offers with coupon codes |

### Interface Components (80+)

Accordion, alerts, avatars, badges, buttons, cards, carousel, charts, colors, datagrid, datatables, dropdowns, forms, icons, modals, navigation, offcanvas, pagination, patterns, progress, tables, tabs, tags, toasts, typography, and more.

### Extra Pages

Activity, chat, email inbox, FAQ, gallery, invoice, job listing, license, logs, music, pricing, search results, settings, tasks, users, widgets, wizard.

## Supabase CMS (Storefront)

The storefront supports an optional Supabase no-code CMS layer for content editors. Content is fetched at build time and falls back to local JSON files when Supabase is unreachable.

```sh
# Set these to enable Supabase CMS
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

To seed Supabase with local JSON data:

```sh
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
node scripts/seed-storefront.mjs
```

## Installation

### Package Manager

```sh
pnpm add @firstcrop/core
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@firstcrop/core@latest/dist/js/firstcrop.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@firstcrop/core@latest/dist/css/firstcrop.min.css">
```

## Building Locally

1. Install [Node.js](https://nodejs.org/) (v22.12+) and [pnpm](https://pnpm.io/).
2. Clone the repo and install dependencies:

```sh
git clone https://github.com/firstcrop/firstcrop.git
cd firstcrop
pnpm install
```

3. Start the dev server:

```sh
pnpm run start
```

4. Open [http://localhost:3000](http://localhost:3000) (preview) or [http://localhost:3010](http://localhost:3010) (docs).

### Docker

```sh
docker compose up --build
```

## Testing

```sh
pnpm run test           # run all tests (JS + SCSS)
pnpm run type-check     # Astro type checking
pnpm run lint           # markdown + prettier
```

Current test suite: **743 JS tests** and **110 SCSS tests**.

## Project Structure

```
core/               @firstcrop/core — SCSS variables, mixins, components + JS
  scss/             --fc-* CSS custom properties, Bootstrap overrides
  js/src/           TypeScript component source
  js/tests/         Unit + visual tests

preview/            @firstcrop/preview — demo pages
  pages/            All .astro page files
  scss/             Demo-specific styles
  dist/             Production build output

docs/               @firstcrop/docs — documentation site (Astro)

shared/             @firstcrop/shared — cross-package code
  components/       Reusable Astro components (cards, navbar, storefront)
  data/             Menu, charts, site config, storefront JSON, ecommerce data
  layouts/          BaseLayout, DocsLayout, MarketingLayout, StoreLayout
  lib/              Utilities, storefront engine, chart config, Supabase client
  ui/               Kit components (Card, Chart, Badge, Progress, etc.)

supabase/           Storefront CMS schema (RLS-enabled)
scripts/            Seed script for Supabase
```

## Branding

- **Name**: FirstCrop
- **Primary color**: `#2fb344` (agri green, `--fc-green`)
- **Currency**: ₹ INR (domestic), USD (export)
- **CSS prefix**: `--fc-*` (was `--tblr-*` in upstream Tabler)
- **Package scope**: `@firstcrop/*`
- **Domain**: firstcrop.in

## Bugs and Feature Requests

[Open a new issue](https://github.com/firstcrop/firstcrop/issues/new).

## Credits

Built on [Tabler](https://tabler.io) by Paweł Kuna and Bartłomiej Gawęda. Licensed under [MIT](LICENSE).
