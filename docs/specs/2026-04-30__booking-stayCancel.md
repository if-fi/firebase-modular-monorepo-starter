# Spec: booking stayCancel

Date: 2026-04-30

## Goal

Cancel a stay (pending or confirmed) and trigger a notification.

## API Surface

Gateway:

- `api_booking`

Route name:

- `stayCancel`

Request:

```json
{
  "data": {
    "stayId": "string"
  }
}
```

Response:

```json
{
  "result": {
    "stayId": "string",
    "status": "cancelled"
  }
}
```

Auth:

- Required (V1)

## Data Model

- Writes (ORM-only):
  - update `stays/{stayId}` to `status=cancelled` (idempotent)

## Events

- Publishes:
  - topic: `notification.ready_to_send`
  - payload: see `docs/CONTRACTS_V1.md`
  - template: `stay_cancelled`

## Acceptance Check (curl)

```bash
curl -sS -X POST 'http://127.0.0.1:5001/demo-no-project/us-central1/api_booking/stayCancel' \
  -H 'Content-Type: application/json' \
  -d '{"data":{"stayId":"<stayId>"}}'
```

Expected:

- `200` with `result.status="cancelled"`.

