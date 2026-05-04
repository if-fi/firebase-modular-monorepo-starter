import type { CallableRequest } from "firebase-functions/v2/https";

import { get400Error } from "../../utils";
import { BOOKING_API_ENDPOINTS, type BookingApiEndpointTypeMap } from "../../types";
import { createPendingStay } from "../../orm/staysOrm";

const apiEndpoint = BOOKING_API_ENDPOINTS.stayRequestCreate;
type InOut = BookingApiEndpointTypeMap[typeof apiEndpoint];
type InputParams = InOut["input"];
type Result = InOut["output"];

export async function stayRequestCreate(request: CallableRequest<any>): Promise<Result> {
  const params = validateParams(request.data);
  return await createPendingStay({ ...params, ttlMinutes: 30 });
}

function validateParams(input: unknown): {
  uid: string;
  petName: string;
  startDate: string;
  endDate: string;
} {
  if (!input || typeof input !== "object") throw get400Error("Invalid params");

  const uid: InputParams["uid"] = (input as any).uid;
  const petName: InputParams["petName"] = (input as any).petName;
  const startDate: InputParams["startDate"] = (input as any).startDate;
  const endDate: InputParams["endDate"] = (input as any).endDate;

  const resolvedUid = typeof uid === "string" && uid.trim() ? uid : "demo-user";

  if (typeof petName !== "string" || !petName.trim()) throw get400Error("petName is required");
  if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw get400Error("startDate must be YYYY-MM-DD");
  }
  if (typeof endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw get400Error("endDate must be YYYY-MM-DD");
  }
  if (startDate > endDate) throw get400Error("startDate must be <= endDate");

  return { uid: resolvedUid, petName: petName.trim(), startDate, endDate };
}
