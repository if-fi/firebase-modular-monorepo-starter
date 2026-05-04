import { onRequest } from "firebase-functions/v2/https";

import { get401Error, routeHttp } from "@starter/common";

/**
 * `subscribers_notifications` is a single HTTP gateway for Pub/Sub push deliveries.
 *
 * We keep routing explicit via `subscriberRoutes` instead of auto-routing based on files:
 * - prevents accidentally exposing internal modules as public subscriber endpoints
 * - makes it obvious in reviews which endpoints can be invoked externally
 * - avoids turning refactors (renames/moves) into behavior changes
 */
export const subscribers_notifications = onRequest(async (request, response) => {
  await routeHttp({
    kind: "subscribers",
    prefix: "/subscribers_notifications",
    request,
    response,
    routes: subscriberRoutes,
    unauthorized: get401Error,
  });
  return;
});

const subscriberRoutes = {
  notificationSend: {
    load: () => import("./endpoints/pubsub/notificationSend"),
    handler: (m: any) => m.notificationSend,
  },
} as const;
