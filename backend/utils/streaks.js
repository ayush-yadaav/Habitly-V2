function toDateOnly(d) {
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return toDateOnly(d);
}

export function computeCurrentStreak(dates, todayStr) {
  const set = new Set(dates);
  let streak = 0;
  let cursor = set.has(todayStr) ? todayStr : addDays(todayStr, -1);

  if (!set.has(cursor)) return 0;

  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function computeBestStreak(dates) {
  if (!dates.length) return 0;

  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }

  return best;
}

export function todayISO() {
  return toDateOnly(new Date());
}
