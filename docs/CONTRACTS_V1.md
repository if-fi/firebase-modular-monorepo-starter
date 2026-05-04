# Contracts (V1)

This file pins the V1 contracts for the starter repo so implementation can move quickly without
chasing “what should this look like?” questions.

Scope:

- Firestore collections and required fields
- Pub/Sub topics and payload shapes
- Endpoint/gateway naming conventions

## Naming

Gateways (stable exported Functions):

- `api_<domain>`: callable gateway (multiple internal endpoints)
- `subscribers_<domain>`: HTTP gateway for Pub/Sub push subscribers

Internal endpoint names (route names):

- lower camelCase, action-first (e.g. `availabilityList`, `stayRequestCreate`, `stayConfirm`)

## Firestore

All writes/updates must be performed by ORM modules only:

- `projects/<domain>/src/orm/**`

Dates:

- `date`, `startDate`, `endDate` are stored as ISO `YYYY-MM-DD` strings.

Timestamps:

- `createdAt`, `updatedAt`, `expiresAt` are Firestore `Timestamp`s.

### `availability/{yyyy-mm-dd}`

Represents capacity for a given day.

Required fields:

- `date: string` (document id and field match, `YYYY-MM-DD`)
- `capacity: number` (>= 0)
- `reservedCount: number` (>= 0, <= capacity)
- `updatedAt: Timestamp`

Notes:

- This is intentionally minimal. A later version can model per-room capacity or pet types.

### `stays/{stayId}`

Represents a requested stay for a pet.

Required fields:

- `stayId: string` (same as doc id; optional but useful for debugging)
- `uid: string` (owner user id)
- `petName: string`
- `startDate: string` (`YYYY-MM-DD`)
- `endDate: string` (`YYYY-MM-DD`)
- `status: "pending" | "confirmed" | "cancelled" | "expired"`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `expiresAt: Timestamp` (used for cleanup of stale pending requests)

Optional fields:

- `meta?: object` (request meta / trace fields, if added later)

Invariants:

- `startDate <= endDate`
- once `status` is terminal (`cancelled`/`expired`) it must not transition back

### `notifications/{notificationId}`

Represents a notification delivery attempt/history record.

Required fields:

- `notificationId: string` (same as doc id; optional but useful for debugging)
- `uid: string`
- `channel: "email"` (V1 uses email as a simulated channel)
- `template: "stay_confirmed" | "stay_cancelled" | "stay_expired"` (expand as needed)
- `to: string` (email address; in V1 may be synthetic/demo)
- `payload: object` (template params; avoid storing sensitive data)
- `status: "queued" | "sent" | "failed"`
- `createdAt: Timestamp`

Idempotency fields (recommended):

- `sourceEventId?: string` (Pub/Sub event id or dedupe key)

## Pub/Sub

V1 topics:

- `stay.ready_to_confirm`
- `notification.ready_to_send`

All payload types live in `_common` and are versioned by code (not by topic name) to keep the
infrastructure stable.

### `stay.ready_to_confirm`

Published by: booking (after creating a pending stay request)

Payload:

```json
{
  "eventId": "string",
  "uid": "string",
  "stayId": "string"
}
```

### `notification.ready_to_send`

Published by: booking (after confirming/cancelling/expiring a stay)

Payload:

```json
{
  "eventId": "string",
  "uid": "string",
  "template": "stay_confirmed",
  "to": "string",
  "payload": {
    "stayId": "string",
    "petName": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD"
  }
}
```

Idempotency:

- Subscribers must treat duplicate deliveries as success.
- Prefer stable `eventId` values and store them to avoid double-processing.

