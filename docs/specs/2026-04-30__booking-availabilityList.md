# Spec: booking availabilityList

Date: 2026-04-30

## Goal

Return pet hotel/daycare capacity availability for one day or a small date range.

## API Surface

Gateway:

- `api_booking`

Route name:

- `availabilityList`

Request:

```json
{
  "data": {
    "fromDate": "2026-05-01",
    "toDate": "2026-05-07"
  }
}
```

Response:

```json
{
  "result": {
    "days": [
      { "date": "2026-05-01", "capacity": 10, "reservedCount": 3 }
    ]
  }
}
```

Auth:

- Required (V1)

## Data Model

- Reads:
  - `availability/{yyyy-mm-dd}` from `docs/CONTRACTS_V1.md`
- No writes.

## Acceptance Check (curl)

```bash
curl -sS -X POST 'http://127.0.0.1:5001/demo-no-project/us-central1/api_booking/availabilityList' \
  -H 'Content-Type: application/json' \
  -d '{"data":{"fromDate":"2026-05-01","toDate":"2026-05-07"}}'
```

Expected:

- `200` with a JSON body containing `result.days`.

## Notes

- In emulator/dev we can return empty availability when docs are missing.
- Keep date parsing strict (`YYYY-MM-DD`) and reject unknown fields.

