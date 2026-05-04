import type { CallableRequest } from "firebase-functions/v2/https";

import { get400Error } from "../../utils";
import { BOOKING_API_ENDPOINTS, type BookingApiEndpointTypeMap } from "../../types";

import { getAvailabilityDaysByDateRange } from "../../orm/availabilityOrm";

const apiEndpoint = BOOKING_API_ENDPOINTS.availabilityList;
type InOut = BookingApiEndpointTypeMap[typeof apiEndpoint];
type Params = InOut["input"];
type Result = InOut["output"];

export async function availabilityList(request: CallableRequest<any>): Promise<Result> {
  const params = validateParams(request.data);
  const days = await getAvailabilityDaysByDateRange(params);

  return {
    days: days.map((d) => ({ date: d.date, capacity: d.capacity, reservedCount: d.reservedCount })),
  };
}

function validateParams(input: unknown): Params {
  if (!input || typeof input !== "object") {
    throw get400Error("Invalid params");
  }

  const keys = Object.keys(input as Record<string, unknown>);
  for (const key of keys) {
    if (key !== "fromDate" && key !== "toDate") {
      throw get400Error(`Unknown param: ${key}`);
    }
  }

  const fromDate = (input as any).fromDate;
  const toDate = (input as any).toDate;

  if (typeof fromDate !== "string" || typeof toDate !== "string") {
    throw get400Error("fromDate and toDate are required");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    throw get400Error("Dates must be in YYYY-MM-DD format");
  }

  if (fromDate > toDate) {
    throw get400Error("fromDate must be <= toDate");
  }

  // Keep V1 small and predictable.
  const maxDays = 31;
  const days = countDaysInclusive(fromDate, toDate);
  if (days > maxDays) {
    throw get400Error(`Date range too large (max ${maxDays} days)`);
  }

  return { fromDate, toDate };
}

function countDaysInclusive(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map((p) => Number(p));
  const [ty, tm, td] = toDate.split("-").map((p) => Number(p));
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  const diffDays = Math.floor((end - start) / (24 * 60 * 60 * 1000));
  return diffDays + 1;
}
