/**
 * Central endpoint type registry.
 *
 * This is the single source of truth for endpoint request/response types across workspaces.
 *
 * Why this exists:
 * - avoids scattering `type Params` / `type Result` across many endpoint files
 * - makes it feasible to generate documentation (e.g. OpenAPI) from one registry
 * - makes refactors safer: changing an endpoint contract is a single diff
 *
 * Note: In V1 we only model TypeScript types. A later step can attach JSON Schema metadata
 * per endpoint for straightforward OpenAPI generation.
 */

export type ApiEndpointDef<
  Input,
  Output,
  Auth extends "required" | "anonymous" = "required",
> = {
  input: Input;
  output: Output;
  auth: Auth;
  description?: string;
};

export type ApiEndpointTypeMap = Record<string, ApiEndpointDef<any, any, any>>;

// ---- booking (callable) -----------------------------------------------------

export const BOOKING_API_ENDPOINTS = {
  hello: "hello",
  availabilityList: "availabilityList",
  stayRequestCreate: "stayRequestCreate",
  stayCancel: "stayCancel",
} as const;

export type BookingApiEndpoint = (typeof BOOKING_API_ENDPOINTS)[keyof typeof BOOKING_API_ENDPOINTS];

export type BookingAvailabilityListInput = {
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
};

export type BookingAvailabilityListOutput = {
  days: Array<{ date: string; capacity: number; reservedCount: number }>;
};

export interface BookingApiEndpointTypeMap extends ApiEndpointTypeMap {
  [BOOKING_API_ENDPOINTS.hello]: ApiEndpointDef<{}, { ok: true; message: string }, "anonymous">;
  [BOOKING_API_ENDPOINTS.availabilityList]: ApiEndpointDef<
    BookingAvailabilityListInput,
    BookingAvailabilityListOutput,
    "anonymous"
  >;
  // Planned (spec-first) endpoints:
  [BOOKING_API_ENDPOINTS.stayRequestCreate]: ApiEndpointDef<any, any, "required">;
  [BOOKING_API_ENDPOINTS.stayCancel]: ApiEndpointDef<any, any, "required">;
}
