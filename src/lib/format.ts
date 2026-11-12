const IST = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return timeFormatter.format(new Date(value));
}

/** Hour of day (0-23) in the desk's timezone, so greetings are not computed in UTC. */
export function hourOfDay(value: Date = new Date(), timeZone: string = IST): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(value);
  return Number(formatted);
}

export function greeting(value: Date = new Date()): string {
  const hour = hourOfDay(value);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Short relative label: "just now", "12m ago", "3h ago", "2d ago". */
export function relativeTime(value: Date | string | null | undefined, now: Date = new Date()): string {
  if (!value) return "—";
  const diff = now.getTime() - new Date(value).getTime();
  if (diff < 45_000) return "just now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

/** Hours left until a deadline, negative when overdue. */
export function hoursLeft(due: Date | string, now: Date = new Date()): number {
  return Math.round((new Date(due).getTime() - now.getTime()) / 3_600_000);
}

export function dueLabel(due: Date | string, now: Date = new Date()): string {
  const hours = hoursLeft(due, now);
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours < 1) return "due now";
  if (hours < 48) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
