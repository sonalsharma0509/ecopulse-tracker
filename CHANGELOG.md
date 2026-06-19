# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-06-18

### Added

- **Insights response cache**: 60-second TTL cache (`cachetools.TTLCache`)
  keyed by SHA-256 of the serialized input. Duplicate Gemini calls within
  the TTL window are eliminated, saving Vertex AI cost. Cached responses
  are logged with `source="cache"`.
- **Typed `source` field**: `InsightsResponse.source` changed from `str`
  to `Literal["gemini", "rules", "cache"]` for compile-time safety.
- **Streaming body guard**: Body-size middleware now reads actual bytes
  instead of trusting the `Content-Length` header, preventing spoofed
  or omitted headers from bypassing the 64 KB limit.
- **ARIA completeness**: Bar chart rows now have `aria-label` with category
  name and value. Total display has directional indicators (↑/↓) so
  information is not conveyed by color alone.
- **E2E in CI**: Playwright test job added to CI (runs on `main` pushes).
- **API drift detection**: CI job that starts the backend, generates
  TypeScript types from OpenAPI, and fails if they differ from committed types.
- **pytest-asyncio migration**: All async tests use `@pytest.mark.asyncio`.

### Changed

- Bumped version to 1.2.0.
- Added `cachetools` and `pytest-asyncio` to dependencies.

## [1.1.0] - 2026-06-16

### Added

- **Rate limiting** on `/api/insights` (10 req/min via `slowapi`) to protect
  Vertex AI quota and billing from abuse.
- **Request body size guard** (64 KB max) for memory-exhaustion prevention.
- **Structured JSON logging** (`python-json-logger`) with queryable fields:
  `endpoint`, `latency_ms`, `source`, `device_id_hash`.
- **Gemini client caching** (`@lru_cache`) avoids re-initializing credentials
  on every insight request.
- **Gemini output validation**: savings bounded between zero and total footprint,
  categories must be known, summary length limited. Invalid output triggers
  rule-based fallback transparently.
- **Async I/O**: insights and entries endpoints are now `async def`, running
  Gemini and Firestore calls in thread pools to avoid blocking the event loop.
- **Prompt versioning**: Gemini system instruction and response schema loaded
  from `v1.yaml` (configurable via `GEMINI_PROMPT_VERSION`). Supports A/B
  testing and rollback without code changes.
- **Dark mode** via `prefers-color-scheme: dark` with WCAG AA palette.
- **Enhanced focus indicators** on table rows and bar-chart elements.
- **Supply chain security**: GitHub Actions pinned to full commit SHAs,
  Dependabot configured for pip/npm/actions.
- **API contract sync** tooling: `npm run types:sync` generates TypeScript
  types from the FastAPI OpenAPI spec.
- Prompt evaluation tests: rule engine validated against 3 representative
  user profiles (heavy driver, heavy consumer, energy-heavy household).

### Changed

- `generate_insights` → `fetch_recommendations` (renamed for clarity).
- Repository Protocol extended with `async_add` and `async_list_for_device`.

## [1.0.0] - 2026-06-14

### Added

- Carbon footprint calculation engine with cited emission factors
  (DEFRA 2023, EPA, IPCC / Our World in Data).
- Personalized insights: Gemini on Vertex AI with a deterministic rule-based
  fallback (graceful degradation, response tagged with its source).
- Anonymous tracking history in Firestore keyed by a device id — no accounts,
  no personal data.
- Accessible React + TypeScript SPA: semantic HTML, labelled controls, skip
  link, AA-contrast theme, data-table chart equivalent.
- Single-container deployment to Google Cloud Run (FastAPI serving API + SPA).
- Backend test suite (pytest, coverage gate ≥90%).
- Frontend test suite (vitest + axe accessibility assertions per component).
- ESLint + Prettier with CI gates and strict mypy type checking.
- Project meta: LICENSE (MIT), CONTRIBUTING guide, architecture notes,
  `.editorconfig`, pre-commit hooks.
