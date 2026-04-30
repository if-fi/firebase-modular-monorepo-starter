# Spec: <feature-name>

Date: YYYY-MM-DD

## Goal

What user/system capability does this add?

## API Surface

Gateway:
- `api_<domain>` or `subscribers_<domain>` (etc.)

Route name:
- `<routeName>`

Request:
```json
{ "data": {} }
```

Response:
```json
{ "result": {} }
```

Auth:
- Required / Anonymous allowed

## Data Model

- Collections touched:
  - `...`
- Writes must go through ORM only.

## Events (if any)

- Publishes:
  - topic: `...`
  - payload: `...`
- Consumes:
  - topic: `...`
  - payload: `...`

## Acceptance Check (curl)

```bash
curl -sS -X POST 'http://127.0.0.1:5001/demo-no-project/us-central1/<gateway>/<route>' \
  -H 'Content-Type: application/json' \
  -d '{"data":{}}'
```

Expected:
```json
{ "result": {} }
```

## Notes

Risks, edge cases, and follow-ups.

