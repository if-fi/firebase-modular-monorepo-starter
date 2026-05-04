import { HttpsError } from "firebase-functions/v2/https";

export function get400Error(message: string) {
  return new HttpsError("invalid-argument", message);
}

export function get401Error(message: string) {
  return new HttpsError("unauthenticated", message);
}
