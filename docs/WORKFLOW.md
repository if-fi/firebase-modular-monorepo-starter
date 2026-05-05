# Workflow (Vibe + Spec Driven)

This repo is designed for a fast feedback loop without losing architectural discipline.

## Default Loop

1. Write a small spec in `docs/specs/`.
2. Implement it behind an existing gateway (`api_*` or `subscribers_*`) with **explicit routing**.
3. Add a curl-based acceptance check to the spec.
4. Run emulators locally and verify.
5. Commit.

## Definition of Done (per endpoint)

- Spec exists under `docs/specs/` and includes a curl acceptance check.
- Endpoint is registered in an explicit route table (allowlist).
- Endpoint module validates inputs and returns consistent errors.
- Any Firestore writes are performed via ORM modules only.
- Logs are contextful and avoid payload dumps.

## Commit Style

Keep commits small and outcome-driven. Examples:

- `Add booking availabilityList endpoint`
- `Add booking stayRequestCreate endpoint`
- `Add notifications notificationSend subscriber`
- `Add spec for stayConfirm`

