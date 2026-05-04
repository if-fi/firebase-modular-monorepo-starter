# firebase-modular-monorepo-starter

Starter template for a modular Firebase Cloud Functions backend using npm workspaces.

This repo is meant for onboarding and as a reference implementation for structuring Firebase Functions as a modular backend (multiple independent workspaces + a single shared `_common`).

Example domain used in docs and samples: a pet hotel/daycare booking backend.

## What This Repo Demonstrates

- npm workspaces with multiple backend domains under `projects/`
- Separate Firebase Functions codebases per domain (deployable independently)
- Gateway exports like `api_<domain>` and `subscribers_<domain>` hiding many internal endpoints behind explicit route tables
- Common shared contracts/helpers in `projects/_common` only
- Firestore + Pub/Sub + scheduled jobs (added as the project grows)

See `docs/PROJECT_BRIEF.md` for the full project idea and roadmap.

Docs:

- `docs/GUARDRAILS.md` (architecture rules)
- `docs/WORKFLOW.md` (spec-driven loop)
- `docs/IMPLEMENTATION_PLAN.md` (step-by-step roadmap)
- `api-requests/` (IDE HTTP requests for local testing)

## Prerequisites

- Optional (recommended): `mise install`
- Or install Node.js 22 + Firebase CLI manually
- `firebase login`

## Development

- Install deps: `npm install`
- Build (empty skeleton): `npm run build`
- Start emulators: `npm run serve`

## Testing With `api-requests/` (IntelliJ/WebStorm)

This repo includes an `api-requests/` folder with `.http` files meant to be run using the built-in
HTTP Client in IntelliJ IDEA / WebStorm.

It is a fast, repeatable way to exercise endpoints locally (without copy/pasting curl), and it fits
the gateway pattern because each workspace can have its own request file.

### Files

- `api-requests/http-client.env.json`
  - Defines named environments (currently `local`).
  - Contains `function_url`, the base URL for the Functions emulator. This includes host+port,
    project id, and region.
  - You can create `api-requests/http-client.private.env.json` for local-only values (secrets,
    tokens, emails) without committing them.

- `api-requests/booking.http`
  - Requests for the `booking` codebase (e.g. `api_booking/*`).

- `api-requests/notifications.http`
  - Requests for the `notifications` codebase (e.g. `subscribers_notifications/*`).

### How To Use

1) Start emulators:

- `npm run serve`

2) Select the environment:

- Open any `.http` file under `api-requests/`.
- In the IDE HTTP Client environment selector, choose `local` from `api-requests/http-client.env.json`.

3) Run requests:

- Use the “Run” icons in the IDE gutter next to each request.

### Notes / Troubleshooting

- Emulator ports in this repo are:
  - Functions: `5001`
  - Firestore: `8880`
  - Pub/Sub: `8086`
  (See `firebase.json`.)
- If you see a “port taken” error, ensure another `npm run serve` (or `firebase emulators:start`)
  process is not already running.
- If you change emulator ports in `firebase.json`, update `function_url` in `api-requests/http-client.env.json` to match.

## VS Code Note

You can also run `.http` requests from VS Code using the “REST Client” extension (`humao.rest-client`).

This repo’s `api-requests/http-client.env.json` is for JetBrains IDEs. For VS Code, either:

- set a base variable at the top of the `.http` file (easiest), or
- configure REST Client environment variables in VS Code settings.
