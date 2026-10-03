/** Calendar dates are represented at UTC midnight, independent of server TZ. */
export function calendarDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31)
    return false;
  const date = calendarDate(year, month, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return isValidCalendarDate(year, month, day)
    ? calendarDate(year, month, day)
    : null;
}

export function utcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
