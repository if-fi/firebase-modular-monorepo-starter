import { onCall } from "firebase-functions/v2/https";

import { get401Error, routeCallable } from "@starter/common";

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
