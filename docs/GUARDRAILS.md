# Guardrails

These rules are the "laws" of this repo. They exist to keep the codebase modular, reviewable, and
safe as the number of endpoints grows.

## Routing

- **Explicit routing only.** Gateways (`api_*`, `subscribers_*`, `tasks_*`, `hooks_*`) must route via
  an explicit allowlist (route table or `switch`).
- **No automatic routing** (filesystem scans, glob imports, "export everything in a folder").

Why we avoid automatic routing:

- it can accidentally expose internal/debug/admin modules as external endpoints
- it can bypass or misapply auth/anonymous requirements
- it turns file renames/moves into behavior changes
- reviewers lose a single obvious allowlist to audit

## Workspaces

- **Workspace isolation.** No imports between workspaces.
- Every workspace may import only:
  - its own code (`projects/<ws>/src/**`)
  - `projects/_common` (via local re-export bridges)
- A workspace must not depend on another workspace package directly.

## Local Re-export Bridges

- Endpoints must import shared helpers/types via local bridge modules:
  - `projects/<ws>/src/constants.ts`
  - `projects/<ws>/src/types.ts`
  - `projects/<ws>/src/utils.ts`
  - `projects/<ws>/src/context.ts` (when added)
- Endpoint modules must not import `@starter/common/*` directly.

## Firestore Access

- **ORM-only writes.** All Firestore writes/updates/deletes/transactions/batches live under:
  - `projects/<ws>/src/orm/**`
- Endpoint modules must not call Firestore `set/update/delete/runTransaction/batch` directly.
- Endpoints orchestrate and validate; ORM modules execute persistence.

## Validation and Errors

- **Validate at the boundary.** Every endpoint validates input; reject unknown/unexpected fields.
- **Consistent error mapping.** Use shared error helpers (e.g. `get400Error`, `get401Error`, etc.)
  so clients and logs are predictable.

## Logging and PII

- **No `console.*` in handlers.** Use the shared logger/context utilities (when added) so logs carry
  request context (endpoint, uid, requestId, trace).
- Avoid logging full payloads. Prefer sizes, ids, and whitelisted fields to reduce PII risk.

## Async Handlers

- **Idempotency.** Pub/Sub/task handlers must be safe to run more than once:
  - check existing state before writing
  - use stable ids/dedupe keys
  - treat "already done" as success

## `_common` Boundaries

- `_common` holds shared contracts and infrastructure helpers.
- `_common` is not a dumping ground for domain logic. Domain decisions stay in the owning workspace.

