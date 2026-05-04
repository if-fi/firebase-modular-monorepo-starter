import type { Request } from "firebase-functions/v2/https";

export async function notificationSend(_request: Request, response: any) {
  response.status(200).json({ ok: true });
}
