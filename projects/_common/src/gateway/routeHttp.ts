import type { Request } from "firebase-functions/v2/https";

export type HttpRoute = {
  load: () => Promise<unknown>;
  handler: (mod: any) => (req: Request, res: any) => unknown | Promise<unknown>;
};

export type HttpRouteTable = Record<string, HttpRoute>;

function extractRouteNameFromPath(path: string, prefix: string) {
  let p = path || "";
  if (p.startsWith(prefix)) p = p.slice(prefix.length);
  return p.split("/").filter(Boolean)[0] || "";
}

/**
 * Explicit HTTP routing helper for `subscribers_<domain>` / `tasks_<domain>` / `hooks_<domain>`
 * gateway functions.
 *
 * Same rationale as `routeCallable`: we keep routing explicit via route tables so each externally
 * reachable endpoint is an intentional, reviewable allowlist entry.
 */
export async function routeHttp(opts: {
  request: Request;
  response: any;
  prefix: string;
  routes: HttpRouteTable;
  unauthorized: (message: string) => any;
  logger?: { debug: (msg: string, meta?: any) => void };
  kind: "subscribers" | "tasks" | "hooks";
}): Promise<void> {
  const rawPath = opts.request.path || "";
  const routeName = extractRouteNameFromPath(rawPath, opts.prefix);

  opts.logger?.debug("Route requested", { kind: opts.kind, routeName, rawPath });

  if (!routeName) throw opts.unauthorized("Unauthorized");
  const route = Object.prototype.hasOwnProperty.call(opts.routes, routeName)
    ? opts.routes[routeName]
    : undefined;
  if (!route) throw opts.unauthorized("Unauthorized");

  const mod = await route.load();
  const handler = route.handler(mod);
  await handler(opts.request, opts.response);
}
