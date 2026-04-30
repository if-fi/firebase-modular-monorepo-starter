# Implementation Plan (V1)

This document captures the step-by-step implementation plan for the starter repo.

## Goal

Deliver a small but realistic modular Firebase backend that demonstrates:

- npm workspaces with independent backend domains under `projects/`
- separate Firebase Functions codebases per domain (deployable independently)
- gateway exports like `api_<domain>` / `subscribers_<domain>` routing to multiple internal endpoints via explicit route tables
- Firestore + Pub/Sub + scheduled jobs

Example domain: pet hotel/daycare bookings.

## V1 Scope

Workspaces/codebases:

- `projects/_common` (shared package, not a Firebase codebase)
- `projects/booking` (Firebase Functions codebase: `booking`)
- `projects/notifications` (Firebase Functions codebase: `notifications`)

Optional V2:

- `projects/admin` (Firebase Functions codebase: `admin`)

## Checkpoints

### 1) Lock V1 contracts (fast)

- Decide minimal Firestore collections and fields:
  - `availability/{yyyy-mm-dd}`: `{ date, capacity, reservedCount }`
  - `stays/{stayId}`: `{ uid, petName, startDate, endDate, status, createdAt, expiresAt }`
  - `notifications/{id}`: `{ uid, channel, template, to, payload, status, createdAt }`
- Decide Pub/Sub topics and payload types (in `_common`):
  - `stay.ready_to_confirm`
  - `notification.ready_to_send`

### 2) Add `notifications` workspace (checkpoint A)

- Create `projects/notifications` with `src/index.ts` exporting `subscribers_notifications` (HTTP gateway).
- Add an explicit route table for subscriber endpoints.
- Implement `endpoints/pubsub/notificationSend`:
  - validate payload
  - write `notifications/{id}` in Firestore
  - log a simulated “sent email”
- Wire `firebase.json` with a second codebase:
  - `source: projects/notifications`
  - `codebase: notifications`
- Add root `tsconfig.json` reference to `projects/notifications`.

### 3) Add shared Pub/Sub helpers (checkpoint B)

In `projects/_common`:

- payload types: `NotifyStayReadyToConfirm`, `NotifyNotificationReadyToSend`
- `publishToTopic(topic, message)` helper (Pub/Sub)
- consistent logging fields (uid/requestId where available)

### 4) Add `booking` Pub/Sub gateway (checkpoint C)

- Export `subscribers_booking` (HTTP gateway) from `projects/booking/src/index.ts`.
- Add subscriber route table:
  - `stayConfirm`
- Implement `endpoints/pubsub/stayConfirm`:
  - validate payload
  - update `stays/{stayId}`: `pending` -> `confirmed` (idempotent)
  - publish `NotifyNotificationReadyToSend` to `notification.ready_to_send`

### 5) Add real callable endpoints in `booking` (checkpoint D)

Behind `api_booking` route table, add:

- `availabilityList`: read `availability/*`
- `stayRequestCreate`: validate, create pending stay, set `expiresAt`, publish `NotifyStayReadyToConfirm`
- `stayCancel`: cancel a stay, publish `NotifyNotificationReadyToSend`

Also add booking ORM stubs in `projects/booking/src/orm/*` and have endpoints call ORM functions (even if small at first).

### 6) Scheduled cleanup job (checkpoint E)

- Export `auto_releaseExpiredHolds` (scheduler) from `projects/booking/src/index.ts`.
- Query pending stays with `expiresAt < now` and mark them `expired` (batched).
- Optionally publish a notification event for expired stays.

### 7) Tests (checkpoint F)

Keep tests minimal and stable:

- unit test route-table dispatch (callable + HTTP) in `_common`
- unit test payload validators/types
- optional emulator-backed test for `stayRequestCreate` only if it remains stable

### 8) Docs + onboarding exercises (checkpoint G)

- Update `README.md`:
  - run emulators
  - call `api_booking/*`
  - explain codebases + gateways + route tables (brief)
- Add `docs/exercises.md`:
  - add a callable endpoint
  - add a subscriber endpoint
  - add a scheduled job
  - deploy only one codebase

## Optional V2: `admin` codebase

Add a third deployable domain to demonstrate independent deploy cadence and blast radius:

- `api_admin/setDailyCapacity`
- `api_admin/listStays`
- optional: `api_admin/approveStay` (publishes confirm event)

## Optional: Terraform dev infrastructure (last)

Under `infra/terraform/environments/dev`, create:

- Pub/Sub topics
- push subscriptions
- service accounts + IAM

Terraform should not block onboarding. The repo must be useful with emulators first.
