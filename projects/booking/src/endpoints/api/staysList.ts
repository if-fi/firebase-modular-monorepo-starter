import type { CallableRequest } from "firebase-functions/v2/https";

import { get400Error } from "../../utils";
import { BOOKING_API_ENDPOINTS, type BookingApiEndpointTypeMap } from "../../types";
import { listStays } from "../../orm/staysOrm";

const apiEndpoint = BOOKING_API_ENDPOINTS.staysList;
type InOut = BookingApiEndpointTypeMap[typeof apiEndpoint];
type InputParams = InOut["input"];
type Result = InOut["output"];

export async function staysList(request: CallableRequest<any>): Promise<Result> {
  const params = validateParams(request.data);
  const stays = await listStays(params);
  return { stays };
}

function validateParams(input: unknown): { limit: number } {
  if (input == null) return { limit: 20 };
  if (typeof input !== "object") throw get400Error("Invalid params");

  const limit: InputParams["limit"] = (input as any).limit;
  if (limit == null) return { limit: 20 };
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw get400Error("limit must be an integer between 1 and 100");
  }
  return { limit };
}
