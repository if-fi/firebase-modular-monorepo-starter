import { onCall } from "firebase-functions/v2/https";

import { get401Error, routeCallable } from "@starter/common";

/**
 * `api_booking` is a single callable gateway that hosts multiple internal endpoints.
 *
 * Routing is intentionally explicit and declarative:
 * - every exposed endpoint must be listed in `apiRoutes`
 * - we do NOT auto-route based on files/folders
 *
 * Risks of automatic routing:
 * - accidental exposure of internal/debug/admin modules as public endpoints
 * - auth/anonymous requirements applied inconsistently
 * - file renames/moves become behavior changes
 * - reviewers lose a single obvious allowlist to audit
 */
export const api_booking = onCall(async (request) => {
  return routeCallable({
    request,
    routes: apiRoutes,
    unauthorized: get401Error,
    executeOnCallFunction: async (_funcName, _request, executableFunc) => {
      return await executableFunc(_request);
    },
  });
});

const apiRoutes = {
  hello: {
    load: () => import("./endpoints/api/hello"),
    handler: (m: any) => m.hello,
    anonymous: true,
  },
} as const;
