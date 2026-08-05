# Project Folders Structure Blueprint

Generated: 2026-08-02T17:24:31+05:30
Git short HEAD: 4d04c102

Commands used to enumerate (reproducible):
- git ls-files
- git rev-parse --short HEAD
- PowerShell: Get-ChildItem -Recurse -Force
- Inspected: package.json files in repo root and packages (core/, preview/, shared/), turbo.json, pnpm-workspace.yaml, astro.config.mjs in preview/docs

Phase 0 — Detection & reconciliation
- Monorepo detected: turbo.json + pnpm-workspace.yaml + multiple package.json (core/, preview/, shared/, docs/). (IS_MONOREPO: true)
- Primary frontend stacks detected:
  - Astro sites / previews: preview/ (astro.config.mjs, pages/, public/) and docs/ (astro.config.mjs present under docs/). (Astro present)
  - Vite present in devDependencies; build helpers under .build and core/.build vite configs.
- No Supabase/functions or serverless edge functions found in repo root (INCLUDES_EDGE_FUNCTIONS: false).
- CI: .github/workflows/* present (build, lint, test, type-check)
- Structural docs: CONTRIBUTING.md, README.md, docs/ (site content) exist. No existing Project_Folders_Structure_Blueprint.md found — created fresh here.

1. Structural Overview
- Architectural approach: Monorepo of UI packages and sites orchestrated by Turborepo (turbo). Shared UI primitives and data live in shared/, core holds low-level assets (scss, js libs, dist), preview/ is a demo site (Astro) that composes shared UI, docs/ is the documentation site (Astro). Build path: turbo orchestrates per-package builds and runs; pnpm workspaces provide local linking. Vite is used for some package builds.
- Ownership zones:
  - root/ (repo orchestration): turbo.json, pnpm-workspace.yaml, CI, tooling scripts (.build/)
  - core/: low-level CSS/JS assets, dist artifacts, SCSS, fonts, libs
  - shared/: UI components, layouts, reusable assets, data used by preview/docs
  - preview/: demo site (Astro) showcasing components and pages
  - docs/: documentation site (Astro)
  - node_modules/ and package-specific node_modules (managed by pnpm)
- Organizing principle: by package (mono-repo) and by role: core (foundation) → shared (UI primitives) → preview/docs (consumers). Not a microservices repo.

2. Directory Visualization (ASCII, depth 3)
D:\sacode\Dashboard_tabler
├─ .agents/
│  ├─ rules/
│  │  ├─ docs.mdc
│  │  └─ main.mdc
│  └─ skills/
│     ├─ generate-changeset/
│     ├─ mr-description/
│     └─ write-docs/
├─ .build/
│  ├─ reformat-mdx.ts
│  ├─ vite.config.helper.ts
│  └─ zip-package.ts
├─ .changeset/
│  ├─ accordion-docs-page.md
│  ├─ active-users-chart-size.md
│  ├─ add-text-gray-utilities.md
│  ├─ angry-bananas-brake.md
│  ├─ astro-icons-docs-page.md
│  ├─ astro-migration.md
│  ├─ background-patterns-docs-refresh.md
│  ├─ background-pattern-utilities.md
│  ├─ bootstrap-exports-cleanup.md
│  ├─ bootstrap-vendor-migration.md
│  ├─ btn-icon-square.md
│  ├─ button-ghost.md
│  ├─ card-gradient-components.md
│  ├─ card-gradients-page.md
│  ├─ change-password-modal.md
│  ├─ chilled-pans-cheer.md
│  ├─ clean-up-hardcoded-rem-values.md
│  ├─ config.json
│  ├─ confirm-delete-modal.md
│  ├─ contributing-guide-astro.md
│  ├─ crm-dashboard-page.md
│  ├─ crypto-dashboard.md
│  ├─ crypto-data-files.md
│  ├─ curvy-timers-sneeze.md
│  ├─ data-tblr-attributes.md
│  ├─ dev-server-ports.md
│  ├─ docs-css-variables-font-sizes.md
│  ├─ docs-markdown-lint.md
│  ├─ docs-singular-component-names.md
│  ├─ docs-sitemap-robots.md
│  ├─ ecommerce-dashboard-pages.md
│  ├─ ecommerce-data-files.md
│  ├─ edit-profile-modal.md
│  ├─ extract-liquid-filters-to-lib.md
│  ├─ firstcrop-rebrand.md
│  ├─ fix-border-color-translucent-dark.md
│  ├─ fix-card-header-cap-bg.md
│  ├─ fix-card-tab-border-radius.md
│  ├─ fix-checkbox-dark-border.md
│  ├─ fix-countup-formatted-values.md
│  ├─ fix-dark-mode-selection-contrast.md
│  ├─ fix-disabled-input-dark-theme.md
│  ├─ fix-docs-homepage-plugins-link.md
│  ├─ fix-dropdown-viewport-boundary.md
│  ├─ fix-form-select-icon-padding.md
│  ├─ fix-form-select-input-group-shadow.md
│  ├─ fix-gradient-utilities-docs.md
│  ├─ fix-gray-fg-token-mapping.md
│  ├─ fix-gray-theme-variables.md
│  ├─ fix-icon-transform-animations.md
│  ├─ fix-input-button-size-consistency.md
│  ├─ fix-input-icon-z-index.md
│  ├─ fix-input-mask-lazy-option.md
│  ├─ fix-squircle-multi-value-border-radius.md
│  ├─ fix-status-colors-variables.md
│  ├─ fix-steps-mobile-overflow.md
│  ├─ fix-tom-select-missing-variables.md
│  ├─ fix-white-space-scrollbar.md
│  ├─ flags-avatars-updates.md
│  ├─ format-lint-tooling-sync.md
│  ├─ framework-integration-guides.md
│  ├─ fresh-rockets-retire.md
│  ├─ funny-kings-double.md
│  ├─ fw-utility-classes-preview.md
│  ├─ geist-fonts.md
│  ├─ grumpy-foxes-shake.md
│  ├─ icon-stroke-width.md
│  ├─ import-icons-scripts.md
│  ├─ language-selector.md
│  ├─ late-pugs-breathe2.md
│  ├─ many-dogs-rest.md
│  ├─ media-print-mixin.md
│  ├─ menu-structure-refactor.md
│  ├─ migrate-rgba-to-color-mix.md
│  ├─ migrate-rollup-to-vite.md
│  ├─ modern-dots-bathe.md
│  ├─ navbar-side-refactor.md
│  ├─ new-task-modal.md
│  ├─ onboarding-page.md
│  ├─ pretty-chefs-design.md
│  ├─ preview-vercel-404.md
│  ├─ progress-background.md
│  ├─ progress-sizes.md
│  ├─ progress-step-docs.md
│  ├─ progress-steps.md
│  ├─ progress-transitions.md
│  ├─ progress-variants-docs.md
│  ├─ prose-class-alias.md
│  ├─ README.md
│  ├─ redundant-nullish-operator.md
│  ├─ remove-turbo.md
│  ├─ remove-unused-bootstraplink.md
│  ├─ scss-module-migration.md
│  ├─ scss-unit-tests.md
│  ├─ silly-crabs-walk.md
│  ├─ skip-link-accessibility.md
│  ├─ star-rating-docs-page.md
│  ├─ tag-docs-page.md
│  ├─ tasks-list-page.md
│  ├─ theme-settings-auto-mode.md
│  ├─ three-seas-move.md
│  ├─ tidy-apples-ring.md
│  ├─ trending-icons.md
│  ├─ tricky-moons-laugh.md
│  ├─ twelve-tables-attack.md
│  ├─ update-card-status-size.md
│  ├─ update-icons-3.36.1.md
│  ├─ update-illustrations-1.16.0.md
│  ├─ update-shadow-tokens.md
│  ├─ upgrade-apexcharts.md
│  ├─ vitest-playwright-tests.md
│  └─ young-needles-love.md
├─ .claude/
│  ├─ agents/
│  │  └─ astro-components.md
│  └─ skills
├─ .cursor/
│  └─ commands/
│     └─ generate-pr-info.md
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  ├─ bug_report.yml
│  │  └─ feature_request.md
│  ├─ workflows/
│  │  ├─ add_to_project.yml
│  │  ├─ build.yml
│  │  ├─ bundlewatch.yml
│  │  ├─ calibreapp-image-actions.yml
│  │  ├─ close_inactive.yml
│  │  ├─ js-tests.yml
│  │  ├─ labeler.yml
│  │  ├─ lint.yml
│  │  ├─ lockfiles.yaml
│  │  ├─ release.yml
│  │  ├─ scss-tests.yml
│  │  └─ type-check.yml
│  ├─ CODE_OF_CONDUCT.md
│  ├─ dependabot.yml
│  │  └─ FUNDING.yml
│  ├─ labeler.yml
│  └─ no-response.yml
├─ .opencode/
│  └─ plans/
│     └─ ecommerce-storefront.md
├─ .vscode/
│  ├─ extensions.json
│  └─ settings.json
├─ core/
│  ├─ .build/
│  │  ├─ add-banner.ts
│  │  ├─ compare-variables.ts
{
3. Key Directory Analysis
- Monorepo & Tooling (root)
  - package.json: orchestrates turbo, scripts: dev, build, test, lint. packageManager: pnpm@11.x.
  - pnpm-workspace.yaml + turbo.json drive multi-package build/test pipelines.
  - .github/workflows: CI orchestrates lint → type-check → test → build → release.
- core/
  - Purpose: base assets and build outputs for distribution. Contains scss, js, fonts, dist artifacts. Exposes npm package used by other packages.
  - Conventions: SCSS sources under scss/, JavaScript under js/, TypeScript configs present. Dist is built output (do not edit directly).
- shared/
  - Purpose: shared UI components, layouts, data used by preview/docs and other consumers.
  - Conventions: components/ and ui/ contain reusable components, layouts/ for page shells, lib/ for helper utilities, data/ for sample datasets.
- preview/
  - Purpose: demo site (Astro) showcasing components. Has astro.config.mjs, pages/, public/ assets, scss and js for preview-only styling.
  - Routing: file-based Astro pages under pages/.
  - Build/deploy: preview/dist built output; vercel.json present for deployments.
- docs/
  - Purpose: documentation site (Astro) for the project. Contains docs pages, site config, assets.
- Edge functions / Supabase: none detected.

4. File Placement Patterns
- Pages / Routing: preview/pages/ and docs/pages/ (Astro file-based). Use kebab-case or PascalCase per existing files.
- Components: shared/components/ and shared/ui/ for primitives and composed components. Prefer PascalCase for component filenames.
- Utilities / Lib: shared/lib/ for pure JS/TS helpers (camelCase filenames for modules).
- Styles: core/scss/ for base styles, preview scss for demo overrides.
- Build scripts & tooling: .build/ (zip, reformat helper scripts), root package.json scripts orchestrate turbo tasks.
- Configs: root package.json + pnpm-workspace.yaml + turbo.json. Astro configs live in preview/ and docs/.
- Env files: env.d.ts present in preview/docs — follow repo pattern; use .env for local env and do not commit secrets. Public/static env prefixes: none enforced here; standard practice: PUBLIC_ or VITE_ for client-exposed variables.

5. Naming & Organization Conventions
- Components: PascalCase filenames (e.g., Button.tsx / Button.astro) inside shared/components/
- Hooks / utils: camelCase files in shared/lib/
- Routes / pages: kebab-case or lowercase segments in pages/ (Astro file-based routing)
- Styles: core SCSS uses kebab-case for partials and variables; follow existing core/ naming.
- Co-location: tests (vitest) exist in package roots (vitest.config.mts). Prefer colocated tests next to source when adding new components.

6. Navigation & Entry Points
- Start reading flow: README.md → docs/ (site) → preview/ (demo) → shared/ (components) → core/ (base assets)
- Recipes:
  - Add new UI component: add to shared/components/<ComponentName>/ with component file, style, and test. Export from shared/ui index.
  - Add demo page: create preview/pages/<feature>/index.astro and import shared component.
  - Add release publish: use changesets (changeset workflow present) and run pnpm changeset/changeset publish as per scripts.

7. Build & Output
- Build command (root): pnpm run build (runs turbo build then zip-package). Individual package builds via turbo pipeline.
- Output: package-specific dist/ folders, preview/dist (static site), docs/dist for docs site. Vercel config present for preview/docs deploys.
- Tests: vitest present in packages; CI runs js-tests.yml. Type-checking via turbo type-check script.
- Dev workflow: pnpm start -> turbo dev runs local dev for sites.

8. Structure Enforcement
- Linting & formatting: prettier, markdownlint, stylelint configs exist and are enforced in CI and scripts (lint, format).
- Release & versioning: changesets for version management and publishing.
- CI: .github workflows enforce checks on PRs.
- Recommended: add a simple repo-level structure check script (tools/check-structure.js) if stricter enforcement desired.

9. Templates (Add-by-example)
- New component (shared):
  - shared/components/MyWidget/MyWidget.astro (or .tsx)
  - shared/components/MyWidget/index.ts (re-export)
  - shared/components/MyWidget/MyWidget.test.ts
  - Update shared/ui/index.ts to export MyWidget
- Demo page (preview): preview/pages/components/my-widget.astro — import from shared/ui and document usage

Close-out / Maintenance
- When to update this blueprint: when packages are added/removed, when build orchestration changes (turbo/pnpm), or when Astro/Vite is removed from the repo.
- Verification: every path cited was verified against the repository tree during generation (core/, shared/, preview/, docs/, .github/, turbo.json, pnpm-workspace.yaml present).

Notes & Drift
- Existing docs/ and preview/ both have astro.config.mjs — confirm intended duplication (docs site vs demo site). If one is legacy, file an issue to consolidate.

Questions / Next steps
- Would you like file counts per top-level package and a deeper ASCII tree to depth 3 with dead/empty-dir markers? (can run quick counts and update file)

---
(End of blueprint)
