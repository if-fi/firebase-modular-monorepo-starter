import type { CallableRequest } from "firebase-functions/v2/https";

export async function hello(_request: CallableRequest<unknown>) {
  return {
    ok: true,
    message: "hello from booking",
  };
}
