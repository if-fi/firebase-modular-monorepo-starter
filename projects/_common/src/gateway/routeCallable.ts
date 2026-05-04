import type { CallableRequest } from "firebase-functions/v2/https";

export type CallableRoute<Req = unknown> = {
  load: () => Promise<unknown>;
  handler: (mod: any) => (request: CallableRequest<Req>) => unknown | Promise<unknown>;
  anonymous?: boolean;
};

export type CallableRouteTable = Record<string, CallableRoute>;

/**
 * Explicit callable routing helper for `api_<domain>` gateway functions.
 *
 * We intentionally DO NOT implement automatic routing (e.g. "scan a folder and expose everything")
 * because it is easy to accidentally expose internal modules as public endpoints.
 *
 * Risks of automatic routing include:
 * - accidental exposure of admin/debug endpoints in production
 * - auth / anonymous flags being applied incorrectly (or not at all)
 * - breaking changes when file names change (routing becomes a filesystem contract)
 * - reviewers missing security-sensitive new endpoints because there is no explicit allowlist
 *
 * Instead, every exposed endpoint must be listed in a route table and passes through an explicit
 * allowlist check.
 */
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

  if (!routeName) throw opts.unauthorized("Unauthorized");
  const route = Object.prototype.hasOwnProperty.call(opts.routes, routeName)
    ? opts.routes[routeName]
    : undefined;
  if (!route) throw opts.unauthorized("Unauthorized");

  const mod = await route.load();
  const executable = route.handler(mod);
  return opts.executeOnCallFunction(routeName, opts.request, executable, route.anonymous);
}
