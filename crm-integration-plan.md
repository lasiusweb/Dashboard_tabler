# FirstCrop CRM Integration Plan

## Context

Integrating `trycompai/crm` (agentic-first CRM) into the FirstCrop agriculture ecommerce platform. Three propositions:

1. **Farmer CRM + Advisory** — AI-driven crop advisory, pest alerts, market prices
2. **B2B Agri-Input Marketplace** — Distributor/retailer network, product catalog, order pipeline
3. **Crop Insurance + Finance** — Loan applications, PMFBY claims, risk assessment

The CRM provides the agent architecture (eve), evidence scoring, task queue, and auth pattern. FirstCrop adds agriculture domain models, Indian identity systems, and WhatsApp-first communication.

---

## Architecture

### What We Keep from the CRM

| Component | Reuse As-Is | Adapt | Skip |
|-----------|:-----------:|:-----:|:----:|
| Prisma schema (20+ models) | ✅ | ✅ | |
| Evidence scoring (`evidence.ts`) | ✅ | | |
| Task queue (`tasks.ts` — FOR UPDATE SKIP LOCKED) | ✅ | | |
| Agent conversation/session mgmt | ✅ | | |
| Auth pattern (better-auth) | | ✅ | |
| Agent tools (20 tools) | | ✅ | |
| eve framework | | | ✅ (self-host alternative) |
| Next.js frontend | | | ✅ (we have Astro/Tabler) |
| NestJS/tRPC API | | ✅ | |
| Vercel-specific deps | | | ✅ |
| Biome linter | | | ✅ (we use Prettier) |

### What FirstCrop Adds

- Agriculture domain models (Farmer, CropCycle, Product, Order, Loan, Insurance)
- Indian identity (Aadhaar, PAN, GST, pincodes)
- WhatsApp Business API integration
- Weather (IMD) and market price (mandi) data feeds
- PMFBY insurance scheme support
- Land record verification

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Node.js 22 + pnpm | Match existing FirstCrop setup (Bun is CRM-only) |
| **Frontend** | Astro + Tabler | Already built (148 pages) |
| **Backend API** | NestJS + tRPC | From CRM — type-safe from Prisma to UI |
| **Database** | PostgreSQL (Supabase) | Already in FirstCrop stack |
| **ORM** | Prisma 7 | From CRM — schema is the source of truth |
| **Auth** | Better Auth | From CRM — add phone OTP + email/password |
| **Agent** | Self-hosted eve or LangGraph | Containerized, not Vercel-locked |
| **Cache** | Redis (Upstash or self-hosted) | Optional, falls back to in-memory |
| **Queue** | Postgres (existing) | FOR UPDATE SKIP LOCKED, no external queue needed |
| **File Storage** | Supabase Storage | Replace Vercel Blob |

---

## Domain Model Mapping

### Existing CRM Models → FirstCrop

| CRM Model | FirstCrop Adaptation | Domain |
|-----------|---------------------|--------|
| Company | Farmer, Supplier, Retailer | All 3 propositions |
| Contact | FarmerProfile, BuyerContact | Prop A + B |
| Deal | CropCycle, Order, LoanApplication, InsuranceClaim | All 3 |
| DealStage | CropStage, OrderStatus, LoanStatus, ClaimStatus | All 3 |
| Activity | FarmActivity, OrderActivity, ComplianceActivity | All 3 |
| ContactFact | FarmerFact, SupplierFact, RiskFact | All 3 |
| ContactBrief | FarmerBrief, SupplierBrief, LoanBrief | All 3 |
| AgentTask | RecheckTask, ReorderTask, ComplianceTask | All 3 |
| AgentConversation | FarmerConversation, RetailerConversation | All 3 |

### New Agriculture Models

| Model | Purpose | Proposition |
|-------|---------|-------------|
| Farmer | Core farmer profile with farm data | A |
| Pincode | Indian pincodes with agro-zones | A + B |
| Crop | Crop definitions (season, duration, ideal conditions) | A |
| CropCycle | Active farming cycle per farmer | A |
| InputPurchase | Products bought by farmers | A + B |
| AdvisoryInsight | AI-generated recommendations | A |
| WeatherStation / WeatherReading | IMD weather data | A |
| MarketPrice | Mandi prices per crop/location | A |
| Product | Agri-input products (fertilizer, seeds, etc.) | B |
| Supplier | Manufacturers and distributors | B |
| Retailer | Local agri-input shops | B |
| Order / OrderItem | B2B wholesale orders | B |
| LoanApplication | Kisan credit, crop loans | C |
| InsurancePolicy / InsuranceClaim | PMFBY and private insurance | C |
| LandRecord | Government land records | C |
| CreditScore | Farmer credit assessment | C |

---

## Agent Domain Behavior

### Evidence Weights (Agriculture-Adapted)

| Source | Weight | Context |
|--------|--------|---------|
| `farmer.phone.verified` | 0.95 | OTP verification |
| `field.visit.observed` | 0.85 | Agronomist field visit |
| `advisory.whatsapp.reply` | 0.80 | Farmer responded to advisory |
| `purchase.dealer.record` | 0.75 | Purchase from verified dealer |
| `govt.database.cross_ref` | 0.70 | Aadhaar/PAN/GST verification |
| `weather.api.confirmed` | 0.55 | IMD weather data |
| `market.mandi.cited` | 0.40 | Public mandi price data |
| `self.reported.claim` | 0.30 | Farmer's own statement |
| `contradiction.detected` | 0.0 | Conflicting sources |

### Agent Tools (Adapted from CRM's 20 Tools)

**Directly Reusable (adapt names/context):**
- `record_fact` → agriculture fields (soilType, cropYield, creditScore)
- `schedule_recheck` → season-aware (Kharif/Rabi/Zaid cycles)
- `search_crm` → farmers, products, pincodes, suppliers
- `read_crm_history` → farmer profile + crop cycles + purchases
- `read_deal_history` → order/loan/insurance claim history
- `write_brief` → farmer profile, supplier capability, loan risk
- `list_outstanding_work` → same queue, new task kinds

**Reworked (replace LinkedIn with Indian systems):**
- `get_linkedin_profile` → `verify_farmer_identity` (Aadhaar/phone)
- `resolve_linkedin_profile` → `resolve_farmer_by_aadhaar`
- `record_job_change` → `record_crop_cycle_transition`
- `enrich_company` → `enrich_supplier` (GST, trade registries)
- `find_contact_socials` → `find_whatsapp_profile`

**New (no CRM equivalent):**
- `check_mandi_prices` — query MarketPrice by crop, mandi, pincode
- `get_weather_forecast` — IMD data for farmer's pincode
- `verify_gst_number` — validate GST against government API
- `check_insurance_eligibility` — PMFBY scheme eligibility
- `calculate_crop_risk` — risk scoring from weather + soil + history
- `verify_land_records` — government land record verification
- `check_delivery_status` — logistics tracking for input orders

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal**: Database, auth, and API skeleton

1. **Extend Prisma schema**
   - Add all agriculture models to `packages/db/prisma/schema.prisma`
   - Add new enums: `CropSeason`, `CropStage`, `OrderStatus`, `LoanStatus`, `ClaimStatus`
   - Create initial migration

2. **Wire auth**
   - Adapt `packages/auth` for FirstCrop
   - Add phone OTP alongside Google OAuth
   - Configure `ALLOWED_SIGN_IN` for FirstCrop domains
   - Add farmer-facing auth (separate from admin auth)

3. **Set up API skeleton**
   - NestJS modules: Farmers, Products, Orders, CropCycles, Loans, Insurance
   - tRPC routers for each module
   - Prisma client injection

4. **Docker Compose**
   - PostgreSQL (from CRM)
   - Redis (optional)
   - NestJS API
   - pgAdmin/Adminer for DB management

**Deliverables**:
- Database schema with 25+ models
- Auth working (Google + phone OTP)
- API skeleton with health checks
- Docker Compose running locally

### Phase 2: Farmer CRM (Weeks 4-6)

**Goal**: Core farmer management + advisory agent

1. **Admin UI (Astro/Tabler)**
   - Farmer list/detail pages
   - Crop cycle tracking
   - Activity timeline
   - Advisory insight dashboard

2. **Agent skeleton**
   - Task queue from CRM (`tasks.ts`)
   - Evidence scoring from CRM (`evidence.ts`)
   - Adapted agent instructions for agriculture
   - Basic tools: `record_fact`, `search_crm`, `read_farmer_history`

3. **Data feeds**
   - Weather API integration (IMD or OpenWeather)
   - Market price API integration (data.gov.in mandi prices)
   - Pincode database seeding

4. **WhatsApp integration**
   - WhatsApp Business API for advisory delivery
   - Farmer reply handling → agent conversation

**Deliverables**:
- Farmer CRUD with crop cycles
- Agent researching farmers automatically
- Weather and market price alerts
- WhatsApp advisory delivery

### Phase 3: B2B Marketplace (Weeks 7-9)

**Goal**: Supplier/retailer network + order pipeline

1. **Product catalog**
   - Product CRUD with agriculture metadata
   - Supplier management (GST verification)
   - Retailer management

2. **Order pipeline**
   - Quote → Confirm → Dispatch → Deliver workflow
   - Order items with tax calculation (GST)
   - Payment tracking (COD, UPI, credit)

3. **Admin UI pages**
   - Product list/detail
   - Supplier/retailer management
   - Order pipeline (Kanban or table view)
   - Inventory alerts

4. **Agent tools**
   - `verify_gst_number`
   - `check_mandi_prices`
   - `check_delivery_status`
   - Reorder point alerts

**Deliverables**:
- Full B2B order flow
- GST-verified supplier database
- Agent tracking orders and alerting on issues

### Phase 4: Insurance + Finance (Weeks 10-12)

**Goal**: Loan applications and crop insurance

1. **Loan module**
   - Application workflow (APPLIED → DISBURSED)
   - Document upload (Aadhaar, PAN, land records)
   - Risk scoring model
   - EMI tracking

2. **Insurance module**
   - PMFBY scheme integration
   - Policy management
   - Claim filing and tracking
   - Survey scheduling

3. **Admin UI pages**
   - Loan application pipeline
   - Insurance claim dashboard
   - Risk assessment reports
   - Document verification queue

4. **Agent tools**
   - `verify_land_records`
   - `calculate_crop_risk`
   - `check_insurance_eligibility`
   - `estimate_crop_loss`

**Deliverables**:
- Loan application flow
- Insurance claim processing
- Agent automating document verification and risk scoring

### Phase 5: Production Hardening (Weeks 13-16)

**Goal**: Security, performance, deployment

1. **Security**
   - RLS policies on all tables
   - API rate limiting
   - Input validation (Zod schemas from CRM)
   - Audit logging

2. **Performance**
   - Database indexes (from CRM schema)
   - Redis caching for hot data
   - Connection pooling (PgBouncer)

3. **Deployment**
   - Vercel (frontend) + Railway/Fly.io (API + agent)
   - Or Docker on a VPS
   - CI/CD pipeline
   - Monitoring (Sentry, health checks)

4. **Testing**
   - Unit tests for evidence scoring and task queue
   - Integration tests for API routes
   - E2E tests for critical flows

---

## Directory Structure (After Integration)

```
FirstCrop/
  apps/
    storefront/              Astro customer-facing (existing)
    admin/                   Astro admin dashboard (existing)
    api/                     NestJS + tRPC (from CRM, adapted)
      src/
        modules/
          farmers/           Farmer CRUD + crop cycles
          products/          Product catalog
          suppliers/         Supplier management
          retailers/         Retailer management
          orders/            B2B order pipeline
          loans/             Loan applications
          insurance/         Insurance policies + claims
          activities/        Activity timeline
          conversations/     Agent chat
          dashboard/         Summary/stats
          search/            Global search
          settings/          App settings
        generated/           tRPC server types (committed)
  packages/
    db/                      Prisma schema + migrations (extended)
    auth/                    Better Auth (Google + phone OTP)
    ui/                      Tabler components (existing)
    env/                     .env loader
    agent/                   Research agent (eve or alternative)
      agent/
        instructions.md      Agriculture-adapted system prompt
        tools/               20+ adapted/new tools
        skills/              Agriculture-specific skills
        schedules/           Dispatch scheduler
      lib/
        evidence.ts          Evidence scoring (from CRM)
        tasks.ts             Task queue (from CRM)
        weather.ts           IMD weather client
        mandi.ts             Market price client
        gst.ts               GST verification
  supabase/
    storefront-schema.sql    (existing)
    crm-schema.sql           (new — Prisma-managed)
  scripts/
    seed-storefront.mjs      (existing)
    seed-pincodes.mjs        (new)
    seed-crops.mjs           (new)
```

---

## Environment Variables (Additions)

```bash
# Agent
AGENT_URL=http://localhost:3002
AGENT_BRIDGE_SECRET=your-secret

# Weather
OPENWEATHER_API_KEY=          # or IMD API key

# Market Prices
DATA_GOV_IN_API_KEY=          # data.gov.in mandi prices

# WhatsApp Business
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# GST Verification
GST_API_URL=
GST_API_KEY=

# Insurance (PMFBY)
PMFBY_API_URL=
PMFBY_API_KEY=

# Land Records
LAND_RECORD_API_URL=          # DILRMP or state-specific

# Redis (optional)
REDIS_URL=

# Logging
SENTRY_DSN=
```

---

## Key Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Agent runtime |eve (Vercel-locked) vs LangGraph vs custom | **LangGraph** — self-hosted, Python, good tooling |
| API framework |NestJS+tRPC (from CRM) vs Astro API routes | **NestJS+tRPC** — type safety, module structure |
| Auth for farmers |Phone OTP only vs Google+phone vs email+password | **Phone OTP primary** — India context |
| WhatsApp provider |Twilio vs Meta direct vs WATI | **Meta Cloud API** — direct, no middleman |
| Deployment |Vercel+Railway vs Docker on VPS vs Supabase | **Docker on VPS** — full control, cost-effective |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| eve framework locked to Vercel | Agent can't self-host | Replace with LangGraph or custom agent |
| Phone OTP costs | High SMS volume | Use WhatsApp for OTP (free within 24h window) |
| Mandi price data availability | Agent can't give market advice | Multiple data sources, fallback to static MSP |
| PMFBY API access | Insurance proposition blocked | Government API sandbox first, production later |
| Land record digitization varies by state | Some states have good APIs, others don't | Start with digitized states (MH, KA, TN) |
| Prisma schema complexity (40+ models) | Migration conflicts | Strict branching, migration review process |
