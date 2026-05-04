# Spec: booking stayRequestCreate

Date: 2026-04-30

## Goal

Create a pending stay request for a pet and trigger async confirmation.

## API Surface

Gateway:

- `api_booking`

Route name:

- `stayRequestCreate`

Request:

```json
{
  "data": {
    "petName": "Milo",
    "startDate": "2026-05-01",
    "endDate": "2026-05-03"
  }
}
```

Response:

```json
{
  "result": {
    "stayId": "string",
    "status": "pending"
  }
}
```

Auth:

- Required (V1)

## Data Model

- Writes (ORM-only):
  - create `stays/{stayId}` with `status=pending` and `expiresAt` (see `docs/CONTRACTS_V1.md`)

## Events

- Publishes:
  - topic: `stay.ready_to_confirm`
  - payload:
    ```json
    { "eventId": "string", "uid": "string", "stayId": "string" }
    ```

## Acceptance Check (curl)

```bash
curl -sS -X POST 'http://127.0.0.1:5001/demo-no-project/us-central1/api_booking/stayRequestCreate' \
  -H 'Content-Type: application/json' \
  -d '{"data":{"petName":"Milo","startDate":"2026-05-01","endDate":"2026-05-03"}}'
```

Expected:

- `200` with `result.stayId` and `result.status="pending"`.

## Notes

- Input validation must reject unknown fields.
- Actual “capacity check” can be simplified in V1.

