# Spec: booking stayConfirm (subscriber)

Date: 2026-04-30

## Goal

Confirm a pending stay request when a Pub/Sub message is delivered via HTTP push.

## API Surface

Gateway:

- `subscribers_booking`

Route name:

- `stayConfirm`

Request:

- Pub/Sub push format (V1 will keep the validation minimal but explicit).

Payload (decoded):

```json
{ "eventId": "string", "uid": "string", "stayId": "string" }
```

Response:

- `200` on success.

## Data Model

- Writes (ORM-only):
  - update `stays/{stayId}` from `pending` to `confirmed` (idempotent)

## Events

- Publishes:
  - topic: `notification.ready_to_send`
  - template: `stay_confirmed`

## Notes

- Must be safe to run twice (duplicate Pub/Sub delivery).

