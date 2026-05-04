export * from "@starter/common";

export function listIsoDatesInclusive(fromDate: string, toDate: string): string[] {
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(toDate);

  const dates: string[] = [];
  for (let d = start; d <= end; d = addDaysUtc(d, 1)) {
    dates.push(formatIsoDateUtc(d));
  }
  return dates;
}

export function parseIsoDate(date: string): Date {
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

export function addDaysUtc(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function formatIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
