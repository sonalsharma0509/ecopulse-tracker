# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-19

### Added

- Carbon footprint calculation engine with cited emission factors
  (DEFRA 2023, EPA, IPCC / Our World in Data).
- Personalized insights: Gemini on Vertex AI with a deterministic rule-based
  fallback (graceful degradation, response tagged with its source).
- Anonymous tracking history in Firestore keyed by a device id — no accounts,
  no personal data.
- Accessible React + TypeScript SPA: semantic HTML, labelled controls, skip
  link, AA-contrast theme, data-table chart equivalent, dark mode.
- Single-container deployment to Google Cloud Run (FastAPI serving API + SPA).
- Rate limiting on `/api/insights` (10 req/min via slowapi) to protect Vertex AI quota.
- Request body size guard (64 KB max) for memory-exhaustion prevention.
- Structured JSON logging (python-json-logger) with Cloud Logging-compatible fields.
- Insights response cache (60s TTL via cachetools) to eliminate duplicate Gemini calls.
- Versioned Gemini prompts (YAML) for A/B testing and rollback without code changes.
- API contract drift detection between backend OpenAPI and frontend TypeScript types.
- E2E testing with Playwright covering the full user flow.
- Automated accessibility (axe) assertions per component in CI.
- Pre-commit hooks (ruff, trailing-whitespace, secrets detection).
