import type { CallableRequest } from "firebase-functions/v2/https";

export type CallableRoute<Req = unknown> = {
  load: () => Promise<unknown>;
  handler: (mod: any) => (request: CallableRequest<Req>) => unknown | Promise<unknown>;
  anonymous?: boolean;
};

export type CallableRouteTable = Record<string, CallableRoute>;

export async function routeCallable<Req = unknown, Res = unknown>(opts: {
  request: CallableRequest<Req>;
  routes: CallableRouteTable;
  executeOnCallFunction: (
    funcName: string,
    request: CallableRequest<any>,
    executable: any,
    isAnonymous?: boolean,
  ) => Promise<Res>;
  unauthorized: (message: string) => any;
  logger?: { debug: (msg: string, meta?: any) => void };
}) {
  const rawPath = opts.request.rawRequest.path || "";
  const routeName = rawPath.split("/").filter(Boolean)[0] || "";

  opts.logger?.debug("Route requested", { kind: "callable", routeName, rawPath });

  const route = opts.routes[routeName];
  if (!route) throw opts.unauthorized("Unauthorized");

  const mod = await route.load();
  const executable = route.handler(mod);
  return opts.executeOnCallFunction(routeName, opts.request, executable, route.anonymous);
}
