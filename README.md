# firebase-modular-monorepo-starter

A starter for building a Firebase Cloud Functions backend as a modular monorepo: many endpoints behind a few stable Firebase exports, organized as independently deployable domains, sharing a single `_common` package.

Example domain used throughout: a pet hotel/daycare booking backend. Owners check daily availability, request a stay for a pet, and get a confirmation; stale pending requests get cleaned up.

> **Status:** work in progress. The booking API is the most fleshed out; Pub/Sub flows and scheduled jobs are scaffolded or planned. See [Status](#status) below.

## Design goals

Firebase tutorials end at `functions/src/index.ts` with a handful of exports. Real projects grow past that into a tangle of unrelated handlers in one file, with deploys that touch everything at once. This repo aims for:

- **One Firebase function per domain, many endpoints behind it.** Each codebase exports a single gateway (`api_booking`, `subscribers_notifications`, …) that dispatches to internal endpoints via an explicit route table.
- **Independently deployable domains.** Each workspace is its own Firebase codebase — deploy `booking` without touching `notifications`.
- **One shared package.** `projects/_common` holds contracts (Pub/Sub payloads, types) and infra helpers (gateway routers, error helpers). Workspaces never import from each other.

## Repo layout

```text
projects/
  _common/        Shared types + gateway helpers. No domain logic.
  booking/        Booking lifecycle + slot availability. Codebase: booking.
  notifications/  Notification delivery + history.      Codebase: notifications.
docs/             Architecture brief, guardrails, workflow, contracts.
api-requests/     .http files for IDE-based local testing.
infra/            Terraform (placeholder).
```

## The pattern

Each codebase exports one Firebase function. Internal endpoints sit behind it in an explicit route table — no filesystem auto-routing.

```ts
// projects/booking/src/index.ts
export const api_booking = onCall(async (request) =>
  routeCallable({
    request,
    routes: apiRoutes,
    unauthorized: get401Error,
    executeOnCallFunction,
  }),
);

const apiRoutes = {
  availabilityList:  { load: () => import("./endpoints/api/availabilityList"),  handler: (m) => m.availabilityList,  anonymous: true },
  stayRequestCreate: { load: () => import("./endpoints/api/stayRequestCreate"), handler: (m) => m.stayRequestCreate, anonymous: true },
  staysList:         { load: () => import("./endpoints/api/staysList"),         handler: (m) => m.staysList,         anonymous: true },
} as const;
```

The route table is the single allowlist for what's exposed. See `docs/GUARDRAILS.md` for why we avoid auto-routing.

## Quickstart

Prerequisites: Node 22 (e.g. `mise install` if you use mise) and the Firebase CLI.

```bash
npm install
npm run build
npm run serve     # starts Functions + Firestore + Pub/Sub emulators
```

You should see:

- Emulator UI: <http://localhost:4000>
- Functions:   `http://127.0.0.1:5001`
- Firestore:   `localhost:8880`
- Pub/Sub:     `localhost:8086`

### Make your first call

Open `api-requests/booking.http` in IntelliJ/WebStorm, pick the `local` environment, and click **Run** on `availabilityList`. Or via curl:

```bash
# Seed some availability first
curl -X POST http://127.0.0.1:5001/demo-no-project/us-central1/api_booking/availabilitySeed \
  -H 'Content-Type: application/json' \
  -d '{"data": {"fromDate": "2026-05-01", "days": 7, "capacity": 10}}'

# Then list it
curl -X POST http://127.0.0.1:5001/demo-no-project/us-central1/api_booking/availabilityList \
  -H 'Content-Type: application/json' \
  -d '{"data": {"fromDate": "2026-05-01", "toDate": "2026-05-03"}}'
```

The Emulator UI at <http://localhost:4000> is the easiest place to confirm Firestore writes landed.

> Emulators do not require `firebase login`. You'll only need that when you start deploying.

## Status

Booking codebase (`api_booking`):

| Endpoint            | State                   |
|---------------------|-------------------------|
| `hello`             | done                    |
| `availabilityList`  | done                    |
| `availabilitySeed`  | done (dev helper)       |
| `stayRequestCreate` | done                    |
| `staysList`         | done                    |
| `stayCancel`        | planned                 |

Notifications codebase (`subscribers_notifications`):

| Endpoint           | State                   |
|--------------------|-------------------------|
| `notificationSend` | scaffolded (Pub/Sub)    |

Cross-domain flows:

| Item                                     | State   |
|------------------------------------------|---------|
| Topic `stay.ready_to_confirm`            | planned |
| Topic `notification.ready_to_send`       | planned |
| `subscribers_booking/stayConfirm`        | planned |
| `auto_releaseExpiredHolds` (scheduler)   | planned |

Tracked in `docs/IMPLEMENTATION_PLAN.md`.

## Local testing with `api-requests/`

The `.http` files under `api-requests/` run out of the box with the JetBrains HTTP Client (IntelliJ, WebStorm, Rider). Pick the `local` environment from `api-requests/http-client.env.json`, then click Run next to any request.

For local-only values (auth tokens, secrets), create `api-requests/http-client.private.env.json` — it's gitignored.

VS Code users: install the REST Client extension (`humao.rest-client`) and add a `@function_url = http://127.0.0.1:5001/demo-no-project/us-central1` line at the top of the `.http` file.

If you change emulator ports in `firebase.json`, update `function_url` in `http-client.env.json` to match.

## Docs

- [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) — full project idea, target architecture, blog series outline.
- [`docs/GUARDRAILS.md`](docs/GUARDRAILS.md) — architectural rules (workspace isolation, ORM-only writes, explicit routing).
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — what's built, what's next.
- [`docs/CONTRACTS_V1.md`](docs/CONTRACTS_V1.md) — Firestore collections, Pub/Sub payloads, naming.
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — spec-driven contribution loop.

## Deploying

Not covered yet — coming as part of the implementation plan. Each workspace will deploy independently:

```bash
firebase deploy --only functions:booking
```
