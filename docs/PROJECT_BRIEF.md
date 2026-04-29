# Modular Firebase Backend Example Repo

This document describes a proposed public or semi-public example repository for teaching a modular
Firebase Cloud Functions backend architecture. The goal is to give new developers a smaller system
that feels familiar before they work in a larger production backend, while also being useful to
other teams evaluating Firebase Functions as a maintainable backend platform.

## Purpose

The project should demonstrate how to build a backend with Firebase Cloud Functions without ending
up with one large `functions/src/index.ts` file. It should show how npm workspaces, Firebase
codebases, shared packages, gateway functions, Firestore, Pub/Sub, scheduled jobs, tests, emulators,
and Terraform can fit together in a clean, modular structure.

The repository should be small enough for onboarding, but realistic enough that the architecture is
not just theoretical.

## Example Product

Use a simple booking platform as the example domain.

The product lets users find available slots, create a booking, cancel a booking, receive a
confirmation notification, and have stale pending bookings cleaned up automatically.

This domain is useful because it is understandable without domain-specific banking knowledge, while
still having real backend concerns:

- transactional Firestore writes
- async workflows
- Pub/Sub messages
- scheduled cleanup
- independently deployable backend domains
- shared types and utilities
- local emulator development
- infrastructure managed outside application code

## Main Architectural Idea

The backend is organized as a monorepo with npm workspaces. Each domain lives in its own workspace
and is deployed as its own Firebase Functions codebase.

Workspaces do not import from each other directly. Shared contracts and infrastructure helpers live
in `projects/_common`.

Each domain exports a small number of Firebase functions, such as:

- `api_booking`
- `subscribers_booking`
- `api_notifications`
- `subscribers_notifications`

Multiple internal endpoints sit behind those gateway functions. The gateway parses the requested
path and dispatches to an explicit route table.

This keeps Firebase exports stable and small, while still allowing the codebase to have many focused
endpoint modules.

## Proposed Repository Structure

```text
firebase-functions-modular-backend/
  firebase.json
  package.json
  tsconfig.json
  jest.config.js
  README.md

  docs/
    architecture.md
    local-development.md
    deployment.md
    exercises.md
    blog-series.md

  infra/
    terraform/
      environments/
        dev/
      modules/
        firestore/
        pubsub/
        service_accounts/

  projects/
    _common/
      src/
        context/
        gateway/
        orm/
        shared/
        constants.ts
        types.ts
        utils.ts

    booking/
      src/
        index.ts
        endpoints/
          api/
            slotsList.ts
            bookingCreate.ts
            bookingCancel.ts
          pubsub/
            bookingConfirm.ts
          auto_triggered/
            releaseExpiredHolds.ts
        orm/
        constants.ts
        types.ts
        utils.ts

    notifications/
      src/
        index.ts
        endpoints/
          api/
            notificationList.ts
          pubsub/
            notificationSend.ts
        orm/
        constants.ts
        types.ts
        utils.ts
```

## Workspaces

### `projects/_common`

Shared package used by every workspace.

Responsibilities:

- shared TypeScript types
- Pub/Sub payload types
- common constants
- context and logger wrappers
- gateway router helpers
- validation and error helpers
- shared Firestore ORM primitives
- Pub/Sub publish helper

This package should not become a dumping ground for domain logic. Domain-specific decisions should
stay in the domain workspace that owns them.

### `projects/booking`

Owns booking lifecycle and slot availability.

Exports:

- `api_booking`
- `subscribers_booking`
- `auto_releaseExpiredHolds`

Endpoints:

- `api_booking/slotsList`
- `api_booking/bookingCreate`
- `api_booking/bookingCancel`
- `subscribers_booking/bookingConfirm`
- scheduled cleanup for stale booking holds

Firestore collections:

- `slots`
- `bookings`

### `projects/notifications`

Owns notification delivery and notification history.

Exports:

- `api_notifications`
- `subscribers_notifications`

Endpoints:

- `api_notifications/notificationList`
- `subscribers_notifications/notificationSend`

Firestore collections:

- `notifications`

The notification sender can be simulated. The point is to demonstrate an async domain boundary, not
to integrate with an email or SMS provider.

## Main Flow

1. The client calls `api_booking/slotsList`.
2. The client calls `api_booking/bookingCreate`.
3. The booking workspace validates the request and writes a pending booking through its ORM.
4. The booking workspace publishes `NotifyBookingReadyToConfirm`.
5. `subscribers_booking/bookingConfirm` receives the Pub/Sub push message.
6. The booking subscriber confirms the booking and publishes `NotifyNotificationReadyToSend`.
7. `subscribers_notifications/notificationSend` stores a notification record.
8. The client can call `api_notifications/notificationList`.
9. A scheduled function periodically releases stale pending bookings.

This single flow demonstrates callables, Firestore, Pub/Sub, subscribers, scheduled functions,
workspace boundaries, and shared contracts.

## Gateway Routing Pattern

Each workspace keeps Firebase exports small and stable.

Example shape:

```ts
export const api_booking = onCall(
    withCallableContext((request) =>
        routeCallable({
            request,
            routes: apiRoutes,
            logger,
            executeOnCallFunction,
            unauthorized: get401Error,
        }),
    ),
);
```

Internal endpoints are registered through explicit route tables:

```ts
const apiRoutes = {
    slotsList: {
        load: () => import("./endpoints/api/slotsList"),
        handler: (module) => module.slotsList,
    },
    bookingCreate: {
        load: () => import("./endpoints/api/bookingCreate"),
        handler: (module) => module.bookingCreate,
    },
    bookingCancel: {
        load: () => import("./endpoints/api/bookingCancel"),
        handler: (module) => module.bookingCancel,
    },
} as const;
```

This route table is the single source of truth for gateway routing. Separate hand-maintained
endpoint
constant lists should not be needed for routing.

## Architecture Rules

- Each workspace represents one backend domain.
- Each workspace can be built, tested, and deployed independently.
- Workspaces do not import from each other directly.
- Shared contracts and infrastructure helpers live in `projects/_common`.
- Endpoint files stay thin: validate, orchestrate, call ORM or service helpers.
- Firestore reads and writes go through ORM modules.
- Pub/Sub payload types live in `_common`.
- Gateway functions use explicit route tables.
- Local workspace files re-export shared types/utilities where useful, so endpoint code does not
  couple itself to global shared paths everywhere.
- Emulator support is a first-class workflow, not an afterthought.

## Terraform Scope

Terraform should demonstrate practical infrastructure as code without becoming the focus of the
project.

Include:

- Firestore database configuration where applicable
- Pub/Sub topics
- Pub/Sub push subscriptions
- service accounts
- IAM bindings required by the demo
- environment-specific variables for a `dev` setup

Avoid in the first version:

- VPC connectors
- complex production IAM matrices
- real third-party provider credentials
- monitoring and alerting stacks
- multi-environment production hardening

The repo can document how those pieces would be added later.

## Suggested Scripts

Root scripts:

```json
{
  "scripts": {
    "build": "tsc --build",
    "build:watch": "tsc --build --watch",
    "serve": "npm run build && firebase emulators:start",
    "test": "jest",
    "test:emulators": "firebase emulators:exec 'npm test'"
  }
}
```

Workspace scripts:

```json
{
  "scripts": {
    "build": "tsc --build --verbose",
    "test": "jest --config ../../jest.config.js --testPathPattern /projects/booking/",
    "deploy": "firebase deploy --only functions:booking"
  }
}
```

The exact deploy command can evolve, but the teaching goal is clear: developers should understand
that a domain can be deployed independently.

## Onboarding Exercises

The repo should include exercises that mirror real contribution tasks:

1. Add a new callable endpoint: `api_booking/bookingGet`.
2. Add a new Firestore field through the booking ORM.
3. Add validation and typed errors.
4. Publish a Pub/Sub message after a booking state change.
5. Add a new subscriber in `notifications`.
6. Add a focused Jest test.
7. Run everything locally with emulators.
8. Deploy only one workspace to a sandbox Firebase project.

## Blog Series

The repo can support a series of articles, each focused on one architectural angle.

1. **A Modular Firebase Functions Backend With npm Workspaces**
   Explain the monorepo layout, Firebase codebases, `_common`, and why this avoids a giant
   `index.ts`.

2. **One Gateway Function, Many Explicit Endpoints**
   Explain `api_booking`, `subscribers_booking`, route tables, dynamic imports, logging, and stable
   Firebase exports.

3. **Firestore Without Sprinkling Database Code Everywhere**
   Explain ORM modules, transactions, consistency, and testability.

4. **Async Workflows With Pub/Sub**
   Explain booking confirmation, notification dispatch, Pub/Sub payload types, and subscriber
   responsibilities.

5. **Deploying Firebase Functions by Domain**
   Explain Firebase codebases, workspace deploys, and smaller deployment blast radius.

6. **Infrastructure as Code for a Serverless Firebase Backend**
   Explain Terraform resources, Pub/Sub topics, subscriptions, service accounts, and environment
   setup.

## Success Criteria

The project is successful if a new developer can:

- understand the repo structure in less than one hour
- run the full backend locally with emulators
- add a new endpoint without touching unrelated workspaces
- trace a request from gateway to endpoint to ORM
- trace an async flow across Pub/Sub
- deploy one workspace independently
- recognize the same architectural patterns in the larger production backend

The public value is that another team can use the repo as a reference for structuring Firebase
Functions as a modular backend instead of a single unstructured functions project.
