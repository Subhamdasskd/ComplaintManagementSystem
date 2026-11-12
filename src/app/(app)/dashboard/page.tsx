import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Clock,
  Flame,
  Plus,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { CategoryChart, StatusDonut, VolumeChart } from "@/components/charts";
import { Avatar, Card, EmptyState, PriorityBadge, ProgressBar, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dueLabel, formatDateTime, relativeTime } from "@/lib/format";
import { CATEGORY_LABELS, STATUS_META, type Category as CategoryKey, type Status } from "@/lib/constants";
import { visibleComplaintFilter, type Viewer } from "@/lib/rbac";
import { roleToLevel } from "@/lib/rbac";
import { formatDuration } from "@/lib/sla";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const viewer: Viewer = { id: user.id, role: user.role as Viewer["role"], level: roleToLevel(user.role as Viewer["role"]) };
  const filter = visibleComplaintFilter(viewer) as object;
  const now = new Date();
  const since = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const [statusGroups, breached, closed, recent, neighbourhood, activity, categories, resolved] = await Promise.all([
    prisma.complaint.groupBy({ by: ["status"], where: filter, _count: { _all: true } }),
    prisma.complaint.count({ where: { ...filter, status: { in: ["OPEN", "WIP", "HOLD"] }, dueAt: { lt: now } } }),
    prisma.complaint.count({ where: { ...filter, status: "CLOSED" } }),
    prisma.complaint.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        raisedBy: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.complaint.findMany({
      where: { ...filter, status: { in: ["OPEN", "WIP", "HOLD"] } },
      orderBy: [{ dueAt: "asc" }],
      take: 5,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.statusEvent.findMany({
      where: { complaint: filter },
      orderBy: { createdAt: "desc" },
      take: 7,
      include: {
        actor: { select: { name: true } },
        complaint: { select: { id: true, reference: true, title: true } },
      },
    }),
    prisma.complaint.groupBy({ by: ["category"], where: filter, _count: { _all: true }, orderBy: { _count: { category: "desc" } } }),
    prisma.complaint.findMany({
      where: { ...filter, status: "CLOSED", resolvedInMin: { not: null } },
      select: { resolvedInMin: true, createdAt: true, closedAt: true, dueAt: true },
      take: 200,
    }),
  ]);

  const statusMap = new Map(statusGroups.map((group) => [group.status, group._count._all]));
  const openCount = statusMap.get("OPEN") ?? 0;
  const wipCount = statusMap.get("WIP") ?? 0;
  const holdCount = statusMap.get("HOLD") ?? 0;
  const rejectedCount = statusMap.get("REJECTED") ?? 0;
  const total = openCount + wipCount + holdCount + closed + rejectedCount;

  const avgResolution = resolved.length
    ? Math.round(resolved.reduce((sum, row) => sum + (row.resolvedInMin ?? 0), 0) / resolved.length)
    : 0;

  const withinSla = resolved.filter((row) => row.closedAt && row.closedAt <= row.dueAt).length;
  const slaCompliance = resolved.length ? Math.round((withinSla / resolved.length) * 100) : 100;

  // 14 day volume trend.
  const days: { day: string; raised: number; closed: number }[] = [];
  const raisedRows = await prisma.complaint.findMany({
    where: { ...filter, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const closedRows = await prisma.complaint.findMany({
    where: { ...filter, closedAt: { gte: since } },
    select: { closedAt: true },
  });

  for (let index = 0; index < 14; index += 1) {
    const day = new Date(since.getTime() + index * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    days.push({
      day: day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      raised: raisedRows.filter((row) => row.createdAt.toISOString().slice(0, 10) === key).length,
      closed: closedRows.filter((row) => row.closedAt && row.closedAt.toISOString().slice(0, 10) === key).length,
    });
  }

  const donut = (["OPEN", "WIP", "HOLD", "CLOSED", "REJECTED"] as Status[]).map((status) => ({
    name: STATUS_META[status].label,
    value: statusMap.get(status) ?? 0,
    color: { OPEN: "#38bdf8", WIP: "#6366f1", HOLD: "#f59e0b", CLOSED: "#10b981", REJECTED: "#f43f5e" }[status],
  }));

  const categoryData = categories.map((row) => ({
    name: CATEGORY_LABELS[row.category as CategoryKey] ?? row.category,
    value: row._count._all,
  }));

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const scopeLabel = user.role === "USER" ? "your complaints" : user.role === "ADMIN" ? "the whole desk" : "your queue";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">{formatDateTime(now)} · Asia/Kolkata</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">A live snapshot of {scopeLabel}.</p>
        </div>
        <Link href="/complaints/new" className="btn btn-primary">
          <Plus className="size-4" />
          Raise a complaint
        </Link>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card card-hover relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gradient-to-br from-sky-500/15 to-transparent blur-2xl" />
          <div className="flex items-start justify-between">
            <p className="mono-label">Open queue</p>
            <span className="rounded-xl bg-white/70 p-1.5 text-sky-600 ring-1 ring-slate-200/70"><Ticket className="size-4" /></span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{openCount + wipCount}</p>
          <p className="mt-1 text-xs text-slate-500">{openCount} open · {wipCount} in progress</p>
        </div>

        <div className="card card-hover relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gradient-to-br from-rose-500/15 to-transparent blur-2xl" />
          <div className="flex items-start justify-between">
            <p className="mono-label">SLA breached</p>
            <span className="rounded-xl bg-white/70 p-1.5 text-rose-600 ring-1 ring-slate-200/70"><Flame className="size-4" /></span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{breached}</p>
          <p className="mt-1 text-xs text-slate-500">{breached === 0 ? "Nothing overdue right now" : "Past their due time"}</p>
        </div>

        <div className="card card-hover relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gradient-to-br from-emerald-500/15 to-transparent blur-2xl" />
          <div className="flex items-start justify-between">
            <p className="mono-label">Avg resolution</p>
            <span className="rounded-xl bg-white/70 p-1.5 text-emerald-600 ring-1 ring-slate-200/70"><Clock className="size-4" /></span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{avgResolution ? formatDuration(avgResolution) : "—"}</p>
          <p className="mt-1 text-xs text-slate-500">Across {resolved.length} closed complaints</p>
        </div>

        <div className="card card-hover relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gradient-to-br from-indigo-500/15 to-transparent blur-2xl" />
          <div className="flex items-start justify-between">
            <p className="mono-label">SLA compliance</p>
            <span className="rounded-xl bg-white/70 p-1.5 text-indigo-600 ring-1 ring-slate-200/70"><TrendingUp className="size-4" /></span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{slaCompliance}%</p>
          <div className="mt-2"><ProgressBar value={slaCompliance} tone={slaCompliance >= 80 ? "emerald" : slaCompliance >= 60 ? "amber" : "rose"} /></div>
        </div>
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mono-label">Volume</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Raised vs closed · last 14 days</h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" /> Raised</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-500" /> Closed</span>
            </div>
          </div>
          <div className="mt-4">
            <VolumeChart data={days} />
          </div>
        </Card>

        <Card>
          <p className="mono-label">Distribution</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Where complaints stand</h2>
          <StatusDonut data={donut} total={total} />
          <div className="mt-2 space-y-1.5">
            {donut.filter((slice) => slice.value > 0).map((slice) => (
              <div key={slice.name} className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="size-2 rounded-full" style={{ background: slice.color }} />
                {slice.name}
                <span className="ml-auto font-semibold text-slate-800">{slice.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* attention + categories */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Needs attention</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Closest to breaching</h2>
            </div>
            <Link href="/complaints?status=ACTIVE" className="btn btn-ghost px-2 py-1.5 text-xs">
              All active <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {neighbourhood.length === 0 ? (
              <EmptyState title="Nothing waiting" description="No active complaints in your scope." />
            ) : (
              neighbourhood.map((item) => {
                const overdue = item.dueAt < now;
                return (
                  <Link
                    key={item.id}
                    href={`/complaints/${item.id}`}
                    className="group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition hover:border-indigo-100 hover:bg-indigo-50/40"
                  >
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${overdue ? "bg-rose-500" : "bg-indigo-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{item.reference}</span>
                        <StatusBadge status={item.status} />
                        <PriorityBadge priority={item.priority} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.assignee?.name ?? "Unassigned"} · L{item.level.slice(1)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold ${overdue ? "text-rose-600" : "text-slate-500"}`}>
                      {dueLabel(item.dueAt, now)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <p className="mono-label">Categories</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">What people complain about</h2>
          <div className="mt-3">
            <CategoryChart data={categoryData} />
          </div>
        </Card>
      </div>

      {/* recent + activity */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div>
              <p className="mono-label">Latest</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Recent complaints</h2>
            </div>
            <Link href="/complaints" className="btn btn-ghost px-2 py-1.5 text-xs">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recent.map((item) => (
              <Link key={item.id} href={`/complaints/${item.id}`} className="table-row-hover flex items-center gap-3 px-5 py-3">
                <Avatar name={item.raisedBy.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{item.reference}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-800">{item.title}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[11px] text-slate-500">{relativeTime(item.createdAt)}</p>
                  <p className="text-[10px] text-slate-400">{item.assignee?.name ?? "Unassigned"}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mono-label">Audit trail</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Recent activity</h2>
          <ol className="mt-4 space-y-4">
            {activity.map((event) => (
              <li key={event.id} className="relative flex gap-3 pl-1">
                <span className="absolute left-[7px] top-5 h-[calc(100%-4px)] w-px timeline-line" />
                <span className="relative mt-1 grid size-3.5 shrink-0 place-items-center rounded-full bg-white ring-2 ring-indigo-200">
                  <CircleDot className="size-2 text-indigo-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">{event.actor?.name ?? "System"}</span>{" "}
                    {event.type === "ESCALATION" ? (
                      <span className="text-violet-600">escalated {event.fromValue} → {event.toValue}</span>
                    ) : event.type === "STATUS" ? (
                      <>moved {event.fromValue} → {event.toValue}</>
                    ) : event.type === "REMARK" ? (
                      <>commented</>
                    ) : event.type === "ASSIGN" ? (
                      <>reassigned</>
                    ) : (
                      <>{event.type.toLowerCase()}</>
                    )}
                  </p>
                  <Link href={`/complaints/${event.complaint.id}`} className="mt-0.5 block truncate text-[11px] text-indigo-600 hover:text-indigo-700">
                    {event.complaint.reference} · {event.complaint.title}
                  </Link>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{relativeTime(event.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
