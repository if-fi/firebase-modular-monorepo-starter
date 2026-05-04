import { Timestamp } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { getDb } from "./firestore";
import { addDaysUtc, formatIsoDateUtc, listIsoDatesInclusive, parseIsoDate } from "../utils";

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
  const dates = listIsoDatesInclusive(opts.fromDate, opts.toDate);
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

export async function seedAvailabilityDays(opts: {
  fromDate: string;
  days: number;
  capacity: number;
}): Promise<{ fromDate: string; toDate: string; daysWritten: number }> {
  const start = parseIsoDate(opts.fromDate);
  const db = getDb();

  const batch = db.batch();
  for (let i = 0; i < opts.days; i++) {
    const date = formatIsoDateUtc(addDaysUtc(start, i));
    const ref = db.collection("availability").doc(date);
    batch.set(
      ref,
      {
        date,
        capacity: opts.capacity,
        reservedCount: 0,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();

  const toDate = formatIsoDateUtc(addDaysUtc(start, Math.max(0, opts.days - 1)));
  return { fromDate: opts.fromDate, toDate, daysWritten: opts.days };
}
