# firebase-modular-monorepo-starter

Starter template for a modular Firebase Cloud Functions backend using npm workspaces.

This repo is meant for onboarding and as a reference implementation for structuring Firebase Functions as a modular backend (multiple independent workspaces + a single shared `_common`).

## What This Repo Demonstrates

- npm workspaces with multiple backend domains under `projects/`
- Separate Firebase Functions codebases per domain (deployable independently)
- Gateway exports like `api_<domain>` and `subscribers_<domain>` hiding many internal endpoints behind explicit route tables
- Common shared contracts/helpers in `projects/_common` only
- Firestore + Pub/Sub + scheduled jobs (added as the project grows)

See `docs/PROJECT_BRIEF.md` for the full project idea and roadmap.

## Prerequisites

- Optional (recommended): `mise install`
- Or install Node.js 22 + Firebase CLI manually
- `firebase login`

## Development

- Install deps: `npm install`
- Build (empty skeleton): `npm run build`
- Start emulators: `npm run serve`
