import { Timestamp } from "firebase-admin/firestore";

import { getDb } from "./firestore";

export type AvailabilityDay = {
  date: string; // YYYY-MM-DD
  capacity: number;
  reservedCount: number;
  updatedAt?: Timestamp;
};

export async function getAvailabilityDaysByDateRange(opts: {
  fromDate: string;
  toDate: string;
}): Promise<AvailabilityDay[]> {
  const dates = listDatesInclusive(opts.fromDate, opts.toDate);
  const db = getDb();

  const snapshots = await Promise.all(
    dates.map((date) => db.collection("availability").doc(date).get()),
  );

  return snapshots.map((snap) => {
    const date = snap.id;
    const data = snap.data() as Partial<AvailabilityDay> | undefined;

    return {
      date,
      capacity: typeof data?.capacity === "number" ? data.capacity : 0,
      reservedCount: typeof data?.reservedCount === "number" ? data.reservedCount : 0,
      updatedAt: data?.updatedAt,
    };
  });
}

function listDatesInclusive(fromDate: string, toDate: string): string[] {
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(toDate);

  const dates: string[] = [];
  for (let d = start; d <= end; d = addDaysUtc(d, 1)) {
    dates.push(formatIsoDateUtc(d));
  }
  return dates;
}

function parseIsoDate(date: string): Date {
  // Strict YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }
  const [y, m, d] = date.split("-").map((p) => Number(p));
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${date}`);
  }
  // Reject impossible dates like 2026-02-30
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    throw new Error(`Invalid date value: ${date}`);
  }
  return parsed;
}

function addDaysUtc(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
