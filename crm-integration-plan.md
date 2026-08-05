# FirstCrop — Manufacturing ERP Integration Plan

## Context

FirstCrop is a **microbial manufacturer** producing bio-fertilizers, bio-pesticides, bio-fungicides, and organic inputs. This plan maps `trycompai/crm` (agentic-first CRM) to build a full ERP system covering manufacturing, quality control, inventory, sales, distribution, and compliance.

---

## Architecture

### What We Take from the CRM (60% reusable)

| Component | Reuse | Adapt | Skip |
|-----------|:-----:|:-----:|:----:|
| Prisma schema structure | ✅ | ✅ | |
| Evidence scoring (`evidence.ts`) | ✅ | ✅ | |
| Task queue (`tasks.ts` — FOR UPDATE SKIP LOCKED) | ✅ | ✅ | |
| Agent conversation/session mgmt | ✅ | | |
| Auth (better-auth) | | ✅ | |
| Activity timeline | ✅ | ✅ | |
| Email/Calendar tracking | ✅ | | |
| Agent tools (20) | | ✅ | |
| eve framework | | | ✅ (LangGraph) |
| Next.js frontend | | | ✅ (Astro/Tabler) |
| NestJS/tRPC API | | ✅ | |
| Vercel-specific deps | | | ✅ |

### What FirstCrop Adds (40% new)

- Manufacturing domain (Products, Batches, QC, Inventory)
- Microbial specifics (strains, CFU counts, fermentation data)
- Indian compliance (FSSAI, organic certs, GST, BIS)
- Distribution network (distributors, retailers, field agents)
- Fleet/logistics (vehicles, shipments, cold chain)
- Finance (invoicing, payments, TDS)

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Runtime** | Node.js 22 + pnpm | Match existing setup |
| **Frontend** | Astro + Tabler | 148 pages already built |
| **Backend API** | NestJS + tRPC | Type-safe, module structure |
| **Database** | PostgreSQL (Supabase) | Already in stack |
| **ORM** | Prisma 7 | Schema as source of truth |
| **Auth** | Better Auth | Google + phone OTP |
| **Agent** | LangGraph (self-hosted) | Not Vercel-locked |
| **Cache** | Redis (optional) | Falls back to in-memory |

---

## Domain Models

### Models That Map Directly (from CRM)

| CRM Model | FirstCrop Adaptation | Reuse % |
|-----------|---------------------|---------|
| User | User (add plant, department, shift) | 85% |
| Session/Account/Verification | Auth stack (as-is) | 95% |
| Organization/Member/Invitation | Org + roles (owner, admin, plant_manager, qc_manager, sales_manager, field_agent, accountant) | 85% |
| Company | Party (Customer, Distributor, Retailer, Vendor, Farm, Cooperative, Govt Agency) | 80% |
| Contact | Contact (add aadhaar, landholding, village/taluka/district) | 80% |
| Activity | Activity (add QC_TEST, BATCH_CREATED, DISPATCH_UPDATE, FIELD_VISIT types) | 90% |
| EmailThread/EmailMessage | Communication tracking (as-is) | 95% |
| CalendarEvent/CalendarAttendee | Scheduling (field visits, QC inspections, deliveries) | 95% |
| AppSetting | Settings (plant settings, QC params, reorder rules) | 90% |
| WorkspaceProfile | Company profile (manufacturing capabilities) | 85% |
| SuppressedDomain/Contact | Exclusion lists (as-is) | 100% |

### Models That Need Adaptation

| CRM Model | FirstCrop Adaptation | Key Changes |
|-----------|---------------------|-------------|
| Deal → **SalesOrder** | Stage pipeline for manufacturing orders | New stages: IN_PRODUCTION, QC_PENDING, PACKAGED, DISPATCHED |
| DealContact → **OrderContact** | Buyer, decision maker, delivery contact | Minimal changes |
| AgentTask → **ManufacturingTask** | Task kinds for production, QC, expiry, compliance | New kinds: QC_TEST_SCHEDULED, EXPIRY_ALERT, REORDER_RAW_MATERIAL |
| AgentConversation → **BatchDiscussion/OrderDiscussion** | Attach to batches, orders, QC events | Extend relations |
| ContactFact → **QCFact/BatchFact** | Evidence-scored test results | New evidence kinds: lab.test-certificate, qc.officer-signoff |
| ContactBrief → **ProductBrief/VendorBrief** | Product profiles, vendor summaries | New sections |
| CompanyEnrichment → **VendorVerification** | FSSAI, GST, organic cert verification | New sources |
| RecordSource → **RecordSource** | Add PRODUCTION, PURCHASE_ORDER | Extend enum |

### Completely New for Manufacturing

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Product** | Microbial product catalog | strainName, cfuCount, formulationType, shelfLifeDays, fssaiNumber, mrpPerUnit |
| **RawMaterial** | Strains, media, packaging | strainName, cultureCollection, materialType, currentStock, reorderLevel |
| **Batch** | Production batch tracking | batchNumber, status, fermenterId, incubationTemp, qcStatus, expiryDate |
| **BatchIngredient** | Bill of materials per batch | rawMaterialId, plannedQuantity, actualQuantity |
| **QCTest** | Quality control testing | testType (CFU_COUNT, PH_LEVEL, etc.), actualValue, result, certificateNumber |
| **InventoryLocation** | Warehouses, cold storage | type (WAREHOUSE, COLD_STORAGE, PRODUCTION_FLOOR, QC_LAB) |
| **InventoryMovement** | Stock transactions | type (RECEIPT, PRODUCTION_OUTPUT, DISPATCH, EXPIRY_WRITE_OFF) |
| **Supplier** | Vendor management | category (STRAIN, MEDIA, PACKAGING), rating, paymentTerms |
| **SalesOrder/OrderItem** | Order management | orderType (DISTRIBUTOR, DIRECT, GOVERNMENT, EXPORT), paymentStatus |
| **Distributor** | Distribution network | territory, targetQuantity, coldStorageAvail, fieldAgent |
| **Vehicle/Shipment** | Fleet & logistics | hasColdChain, temperatureLog, gpsTrackingId |
| **ComplianceRecord** | Certifications | certType (FSSAI, ORGANIC, BIS, ISO), expiryDate, status |
| **Invoice** | Finance | cgst/sgst/igst, tds, paymentStatus |

---

## Enums

### DealStage → OrderStatus
```
PLACED → CONFIRMED → IN_PRODUCTION → READY_FOR_DISPATCH
→ PARTIALLY_SHIPPED → FULLY_SHIPPED → DELIVERED → RETURNED → CANCELLED
```

### BatchStatus
```
PLANNED → IN_PROGRESS → FERMENTATION → PROCESSING
→ QC_PENDING → QC_PASSED → QC_REJECTED
→ PACKAGING → READY_FOR_DISPATCH → DISPATCHED → EXPIRED → CANCELLED
```

### QCResult
```
PENDING → PASS → FAIL → CONDITIONAL_PASS → INCONCLUSIVE
```

### ActivityType (extended)
```
NOTE, CALL, EMAIL, MEETING, TASK, STAGE_CHANGE, ENRICHMENT,
QC_TEST, QC_APPROVAL, QC_REJECTION, BATCH_CREATED, BATCH_COMPLETED,
DISPATCH_UPDATE, DELIVERY_CONFIRMED, PAYMENT_RECEIVED,
CROP_ADVISORY, FIELD_VISIT, COMPLIANCE_CHECK
```

### ProductCategory
```
BIO_FERTILIZER, BIO_PESTICIDE, BIO_FUNGICIDE, BIO_INSECTICIDE,
ORGANIC_FERTILIZER, PLANT_GROWTH_REGULATOR, SOIL_CONDITIONER, SEED_TREATMENT
```

---

## Agent Domain Behavior

### Evidence Weights (Manufacturing-Adapted)

| Source | Weight | Context |
|--------|--------|---------|
| `lab.test-certificate` | 0.95 | Lab-tested, certificate available |
| `fssai.license-match` | 0.90 | FSSAI license verified |
| `vendor.invoice-match` | 0.85 | Purchase invoice matches records |
| `qc.officer-signoff` | 0.85 | QC officer approved |
| `gst.registration-verified` | 0.85 | GST registration confirmed |
| `field.visit-confirmed` | 0.75 | Physical visit by field agent |
| `third-party.certification` | 0.60 | External certification body |
| `batch.number-match` | 0.50 | Batch number cross-reference |
| `trade.directory-listing` | 0.40 | Listed in trade directory |
| `vendor.claimed-supply` | 0.30 | Vendor's own claim |
| `contradiction` | 0 | Conflicting sources |

### Agent Tools (Adapted from CRM's 20)

**Directly Reusable (adapt context):**
- `record_fact` → QC test results, batch metrics, vendor compliance
- `schedule_recheck` → batch expiry alerts, certification renewals, reorder triggers
- `search_crm` → search products, batches, vendors, orders by SKU/batch#/GST
- `read_crm_history` → batch production + QC history
- `read_deal_history` → order status, dispatches, payments
- `write_brief` → product profiles, vendor summaries
- `list_outstanding_work` → batches pending QC, orders pending dispatch, expiring inventory

**Reworked (replace LinkedIn with manufacturing systems):**
- `get_linkedin_profile` → `get_vendor_fssai_status`
- `resolve_linkedin_profile` → `resolve_vendor_by_gst`
- `record_job_change` → `record_supplier_ownership_change`
- `enrich_company` → `enrich_vendor` (trade directories, govt portals)
- `find_contact_socials` → `find_vendor_online_presence`

**New (no CRM equivalent):**
- `check_batch_expiry` — scan inventory for approaching expiry
- `analyze_qc_trends` — CFU count trends, contamination patterns
- `recommend_reorder` — raw material levels vs reorder points
- `verify_compliance` — check certifications are current
- `generate_production_schedule` — orders + materials → production plan
- `calculate_batch_cost` — raw material + labor + overhead
- `track_cold_chain` — temperature logs during shipment
- `assess_vendor_performance` — delivery, quality, pricing scores
- `generate_qc_certificate` — auto-populate from test results

---

## Data Flow

### End-to-End Manufacturing Flow

```
RAW MATERIALS          PRODUCTION              QC                    INVENTORY              SALES                 DELIVERY
    |                      |                     |                      |                     |                     |
    |  Purchase Order      |  Batch Created      |  QC Tests Scheduled  |  Stock Updated       |  Sales Order        |  Shipment Created
    |  Supplier Verified   |  Ingredients Alloc  |  Tests Performed     |  Batch Registered    |  Order Confirmed    |  Vehicle Assigned
    |  Material Received   |  Fermentation Start |  Results Recorded    |  Expiry Date Set     |  Production Linked  |  GPS Tracking
    |  QC at Receiving     |  Fermentation Mon   |  Pass/Fail Decision  |  Reorder Alerts      |  Dispatch Scheduled |  Temperature Log
    |  Stock Updated       |  Processing Done    |  Certificate Issued  |  FIFO Enforcement    |  Invoice Generated  |  POD Collected
    |                      |  Packaging          |                      |                     |  Payment Tracked     |  Delivery Confirmed
    v                      v                     v                      v                     v                     v
```

### Key Data Flows

**1. Raw Material Intake**
```
Vendor ships → InventoryMovement(RECEIPT) → QC at receiving → RawMaterial.currentStock updated → Reorder check
```

**2. Batch Production**
```
Sales order confirmed → Batch(PLANNED) → Ingredients allocated → Stock decremented → Fermentation → Processing → QC_PENDING
```

**3. Quality Control**
```
Batch in QC_PENDING → QCTest records created → Lab tests → All complete → PASS: move to finished goods / FAIL: rework/reject → Certificate issued
```

**4. Order Fulfillment**
```
Order placed → Link batches (FIFO) → Shipment created → Vehicle assigned → GPS + temp tracking → POD → Invoice → Payment
```

**5. Expiry Management**
```
Daily scan → Batches within warning window → Alerts → Markdown/donation suggestions → If expired: write-off
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Database, auth, API skeleton**

1. Extend Prisma schema with all manufacturing models
2. Set up auth (Google + phone OTP)
3. NestJS API skeleton: Products, Batches, Orders, Inventory, QC modules
4. Docker Compose (Postgres, Redis, API)

**Deliverables**: Database with 25+ models, auth working, API skeleton, Docker running

### Phase 2: Manufacturing Core (Weeks 4-6)

**Product catalog + batch tracking + QC**

1. Product CRUD (microbial specifics: strain, CFU, shelf life)
2. Raw material management
3. Batch lifecycle (create → production → packaging)
4. QC test recording and approval workflow
5. Admin UI pages for all above

**Deliverables**: Product catalog, batch tracking, QC workflow

### Phase 3: Inventory + Procurement (Weeks 7-9)

**Stock management + vendor management**

1. Inventory locations (warehouse, cold storage, production floor)
2. Inventory movements (receipt, production, dispatch, expiry)
3. Expiry tracking with alerts
4. Supplier/vendor management (GST verification, ratings)
5. Purchase orders
6. Admin UI for inventory and procurement

**Deliverables**: Full inventory management, vendor database, purchase workflow

### Phase 4: Sales + Distribution (Weeks 10-12)

**Orders + distribution + logistics**

1. Sales order pipeline (distributor, direct, government, export)
2. Order fulfillment (batch allocation, dispatch)
3. Distributor network management
4. Fleet/vehicle management
5. Shipment tracking (GPS, cold chain temperature)
6. Admin UI for sales and logistics

**Deliverables**: Order pipeline, distribution network, shipment tracking

### Phase 5: Agent + Compliance + Finance (Weeks 13-16)

**AI agent + certifications + invoicing**

1. Agent skeleton (LangGraph, task queue, evidence scoring)
2. Agent tools (batch expiry, QC trends, reorder, compliance)
3. Compliance records (FSSAI, organic, BIS, ISO)
4. Invoicing (GST, TDS)
5. Dashboard with manufacturing KPIs

**Deliverables**: AI agent automating alerts, compliance tracking, invoicing

### Phase 6: Production Hardening (Weeks 17-20)

**Security, performance, deployment**

1. RLS policies, API rate limiting, audit logging
2. Database indexes, Redis caching, connection pooling
3. Deployment (Docker on VPS or Vercel+Railway)
4. CI/CD, monitoring, testing

**Deliverables**: Production-ready system

---

## Directory Structure

```
FirstCrop/
  apps/
    storefront/              Astro customer-facing (existing)
    admin/                   Astro admin dashboard (existing)
    api/                     NestJS + tRPC
      src/
        modules/
          auth/              Better Auth
          users/             User management
          parties/           Customers, distributors, vendors
          contacts/          Contact management
          products/          Product catalog
          raw-materials/     Raw material management
          batches/           Production batches
          qc/                Quality control
          inventory/         Stock management
          procurement/       Purchase orders
          orders/            Sales orders
          distributors/      Distribution network
          fleet/             Vehicle + shipment tracking
          compliance/        Certifications
          finance/           Invoicing + payments
          activities/        Activity timeline
          conversations/     Agent chat
          dashboard/         Manufacturing KPIs
          search/            Global search
          settings/          Plant + QC settings
        generated/           tRPC server types
  packages/
    db/                      Prisma schema + migrations
    auth/                    Better Auth
    ui/                      Tabler components
    env/                     .env loader
    agent/                   Research agent (LangGraph)
      tools/                 20+ adapted/new tools
      lib/
        evidence.ts          Evidence scoring (from CRM)
        tasks.ts             Task queue (from CRM)
        weather.ts           Weather client
        mandi.ts             Market price client
  supabase/
    storefront-schema.sql    (existing)
    erp-schema.sql           (Prisma-managed)
  scripts/
    seed-storefront.mjs      (existing)
    seed-pincodes.mjs
    seed-crops.mjs
    seed-products.mjs
```

---

## Environment Variables

```bash
# Agent
AGENT_URL=http://localhost:3002
AGENT_BRIDGE_SECRET=your-secret

# Weather
OPENWEATHER_API_KEY=

# Market Prices
DATA_GOV_IN_API_KEY=

# WhatsApp Business
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# GST Verification
GST_API_URL=
GST_API_KEY=

# FSSAI Verification
FSSAI_API_URL=
FSSAI_API_KEY=

# Redis (optional)
REDIS_URL=

# Logging
SENTRY_DSN=
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| LangGraph maturity | Agent may lack features | Fall back to custom agent with eve patterns |
| FSSAI API access | Vendor verification blocked | Manual entry + periodic bulk verification |
| Cold chain monitoring | Product quality risk | IoT sensors + WhatsApp alerts to field agents |
| Batch traceability | Regulatory non-compliance | Strict FIFO, batch-to-order linking, audit trail |
| Multi-state GST | Compliance complexity | Use GSTN API for automated filing data |
| Prisma schema complexity (35+ models) | Migration conflicts | Strict branching, migration review process |
