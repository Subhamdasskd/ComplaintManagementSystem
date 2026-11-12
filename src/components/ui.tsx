import Link from "next/link";
import type { ReactNode } from "react";
import { cn, initials } from "@/lib/format";
import { LEVEL_META, PRIORITY_META, ROLE_META, STATUS_META, type Level, type Priority, type Role, type Status } from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];
  const sizeClass = size === "sm" ? "px-3 py-2 text-xs rounded-xl" : "";
  return <button className={cn("btn", variantClass, sizeClass, className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  const variantClass = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];
  const sizeClass = size === "sm" ? "px-3 py-2 text-xs rounded-xl" : "";
  return (
    <Link href={href} className={cn("btn", variantClass, sizeClass, className)}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as Status] ?? STATUS_META.OPEN;
  return (
    <span className={cn("chip ring-1", meta.tone, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = PRIORITY_META[priority as Priority] ?? PRIORITY_META.MEDIUM;
  return (
    <span className={cn("chip ring-1", meta.tone, meta.ring, className)}>
      <span className={cn("size-1.5 rounded-full", meta.bar)} />
      {meta.label}
    </span>
  );
}

export function LevelBadge({ level, className }: { level: string; className?: string }) {
  const meta = LEVEL_META[level as Level] ?? LEVEL_META.L1;
  return <span className={cn("chip ring-1", meta.tone, className)}>{meta.label}</span>;
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const meta = ROLE_META[role as Role] ?? ROLE_META.USER;
  return <span className={cn("chip ring-1", meta.tone, className)}>{meta.label}</span>;
}

export function DueBadge({ overdue, className }: { overdue: boolean; className?: string }) {
  if (!overdue) return null;
  return (
    <span className={cn("chip bg-rose-50 text-rose-700 ring-1 ring-rose-200", className)}>
      <span className="size-1.5 rounded-full bg-rose-500" />
      SLA breached
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("chip border-slate-200 bg-white/70 text-slate-600 ring-1 ring-slate-200/70", className)}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                     */
/* -------------------------------------------------------------------------- */

const AVATAR_TONES = [
  "from-indigo-500 to-sky-400",
  "from-violet-500 to-fuchsia-400",
  "from-cyan-500 to-emerald-400",
  "from-amber-400 to-orange-500",
  "from-rose-500 to-pink-400",
  "from-slate-500 to-slate-400",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
  }[size];
  const tone = AVATAR_TONES[(name.charCodeAt(0) + name.length) % AVATAR_TONES.length];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/80",
        tone,
        sizeClass,
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mono-label mb-2">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-14 text-center">
      {icon ? <div className="mb-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 p-3 text-indigo-500">{icon}</div> : null}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "amber" | "rose" | "emerald" }) {
  const toneClass = {
    brand: "from-indigo-500 to-sky-400",
    amber: "from-amber-500 to-orange-400",
    rose: "from-rose-500 to-pink-400",
    emerald: "from-emerald-500 to-teal-400",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", toneClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "brand" | "sky" | "amber" | "rose" | "emerald" | "violet";
}) {
  const accents = {
    brand: "from-indigo-500/12 to-indigo-500/0 text-indigo-600",
    sky: "from-sky-500/12 to-sky-500/0 text-sky-600",
    amber: "from-amber-500/14 to-amber-500/0 text-amber-600",
    rose: "from-rose-500/12 to-rose-500/0 text-rose-600",
    emerald: "from-emerald-500/12 to-emerald-500/0 text-emerald-600",
    violet: "from-violet-500/12 to-violet-500/0 text-violet-600",
  }[accent];

  return (
    <div className="card card-hover relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br blur-2xl", accents)} />
      <div className="flex items-start justify-between gap-3">
        <p className="mono-label">{label}</p>
        {icon ? <span className={cn("rounded-xl bg-white/70 p-1.5 ring-1 ring-slate-200/70", accents.split(" ").pop())}>{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card p-5 sm:p-6", className)}>{children}</div>;
}
