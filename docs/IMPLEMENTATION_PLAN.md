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

- [ ] Write/confirm `docs/CONTRACTS_V1.md` (Firestore schema + Pub/Sub topics/payloads + naming).
- [ ] Add specs in `docs/specs/` for the first booking endpoints.

### 2) Booking callable endpoints + ORM (checkpoint A)

- [ ] Implement `api_booking/availabilityList` (read-only).
- [ ] Implement `api_booking/stayRequestCreate` (creates pending stay via ORM, sets `expiresAt`, publishes `stay.ready_to_confirm`).
- [ ] Implement `api_booking/stayCancel` (updates status via ORM, publishes `notification.ready_to_send`).
- [ ] Create booking ORM modules under `projects/booking/src/orm/**` and route all writes through them.

### 3) Booking Pub/Sub subscriber + confirm handler (checkpoint B)

- [ ] Export `subscribers_booking` gateway with explicit routing.
- [ ] Implement `subscribers_booking/stayConfirm`:
  - validate payload
  - update `stays/{stayId}`: `pending` -> `confirmed` (idempotent)
  - publish `notification.ready_to_send`

### 4) Scheduled cleanup job (checkpoint C)

- [ ] Export `auto_releaseExpiredHolds` (scheduler) from booking.
- [ ] Mark stale pending stays as `expired` via ORM (batched).
- [ ] Optionally publish `notification.ready_to_send` for expired stays.

### 5) Notifications behavior (checkpoint D)

- [ ] Implement `subscribers_notifications/notificationSend`:
  - validate payload
  - write `notifications/{id}` via notifications ORM
  - log a simulated “sent email”

### 6) Shared helpers (checkpoint E)

- [ ] Add `_common` helpers to reduce repetition:
  - error helpers (`get400Error`, `get401Error`, etc.)
  - Pub/Sub publish helper (PII-safe logging, trace attributes)
  - executor wrappers (`executeOnCallFunction`, `executeSubFunction`) trimmed for the starter
  - keep routing explicit via route tables

### 7) Tests (checkpoint F)

Keep tests minimal and stable:

- [ ] unit test route-table dispatch (callable + HTTP) in `_common`
- [ ] unit test payload validators/types
- [ ] optional emulator-backed test for `stayRequestCreate` only if it remains stable

### 8) Docs + onboarding exercises (checkpoint G)

- [ ] Update `README.md`:
  - run emulators
  - call `api_booking/*`
  - explain codebases + gateways + route tables (brief)
- [ ] Add `docs/exercises.md`:
  - add a callable endpoint
  - add a subscriber endpoint
  - add a scheduled job
  - deploy only one codebase

### Note: notifications scaffold

It is OK to scaffold `projects/notifications` early (as a second codebase) to demonstrate independent
deploy and explicit routing. Keep behavior minimal until the V1 contracts/specs land.

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
