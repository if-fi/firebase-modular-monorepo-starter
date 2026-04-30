import { HttpsError } from "firebase-functions/v2/https";

export function get401Error(message: string) {
  return new HttpsError("unauthenticated", message);
}
