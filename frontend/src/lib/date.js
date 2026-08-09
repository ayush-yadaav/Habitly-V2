// Date helpers use the user's local calendar date, not UTC.
export function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr, opts) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", opts || {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function addDays(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return todayISO(d);
}
