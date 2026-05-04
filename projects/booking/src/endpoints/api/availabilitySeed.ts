import type { CallableRequest } from "firebase-functions/v2/https";

import { get400Error } from "../../utils";
import { BOOKING_API_ENDPOINTS, type BookingApiEndpointTypeMap } from "../../types";
import { seedAvailabilityDays } from "../../orm/availabilityOrm";

const apiEndpoint = BOOKING_API_ENDPOINTS.availabilitySeed;
type InOut = BookingApiEndpointTypeMap[typeof apiEndpoint];
type Params = InOut["input"];
type Result = InOut["output"];

export async function availabilitySeed(request: CallableRequest<any>): Promise<Result> {
  const params = validateParams(request.data);
  return await seedAvailabilityDays(params);
}

function validateParams(input: unknown): Params {
  if (!input || typeof input !== "object") throw get400Error("Invalid params");

  const fromDate = (input as any).fromDate;
  const days = (input as any).days;
  const capacity = (input as any).capacity;

  if (typeof fromDate !== "string") throw get400Error("fromDate is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) throw get400Error("fromDate must be YYYY-MM-DD");

  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > 60) {
    throw get400Error("days must be an integer between 1 and 60");
  }

  if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 0 || capacity > 500) {
    throw get400Error("capacity must be an integer between 0 and 500");
  }

  return { fromDate, days, capacity };
}

