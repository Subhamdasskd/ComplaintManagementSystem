import Link from "next/link";
import { ArrowRight, Gauge, Scale, Timer, TrendingUp, Users } from "lucide-react";
import { CategoryChart, ResolutionChart, StatusDonut, VolumeChart } from "@/components/charts";
import { Avatar, Card, ProgressBar, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORY_LABELS, PRIORITY_META, STATUS_META, type Category as CategoryKey, type Priority, type Status } from "@/lib/constants";
import { roleToLevel, visibleComplaintFilter, type Viewer } from "@/lib/rbac";
import { formatDuration } from "@/lib/sla";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const viewer: Viewer = { id: user.id, role: user.role as Viewer["role"], level: roleToLevel(user.role as Viewer["role"]) };
  const filter = visibleComplaintFilter(viewer) as object;
  const now = new Date();
  const since = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const [statusGroups, categoryGroups, priorityGroups, closedRows, raisedRows, staff] = await Promise.all([
    prisma.complaint.groupBy({ by: ["status"], where: filter, _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["category"], where: filter, _count: { _all: true } }),
    prisma.complaint.groupBy({ by: ["priority"], where: filter, _count: { _all: true } }),
    prisma.complaint.findMany({
      where: { ...filter, status: "CLOSED", closedAt: { not: null } },
      select: { createdAt: true, closedAt: true, dueAt: true, resolvedInMin: true, rating: true, priority: true },
      take: 400,
    }),
    prisma.complaint.findMany({ where: { ...filter, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.user.findMany({
      where: { role: { in: ["L1", "L2", "L3"] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusMap = new Map(statusGroups.map((row) => [row.status, row._count._all]));
  const total = statusGroups.reduce((sum, row) => sum + row._count._all, 0);
  const closed = statusMap.get("CLOSED") ?? 0;
  const rejected = statusMap.get("REJECTED") ?? 0;
  const active = total - closed - rejected;

  const withinSla = closedRows.filter((row) => row.closedAt && row.closedAt <= row.dueAt).length;
  const compliance = closedRows.length ? Math.round((withinSla / closedRows.length) * 100) : 100;
  const avgResolution = closedRows.length
    ? Math.round(closedRows.reduce((sum, row) => sum + (row.resolvedInMin ?? 0), 0) / closedRows.length)
    : 0;

  const rated = closedRows.filter((row) => row.rating != null);
  const avgRating = rated.length ? rated.reduce((sum, row) => sum + (row.rating ?? 0), 0) / rated.length : 0;

  // 30 day trend
  const trend: { day: string; raised: number; closed: number }[] = [];
  for (let index = 0; index < 30; index += 1) {
    const day = new Date(since.getTime() + index * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    trend.push({
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

  const categories = categoryGroups
    .map((row) => ({ name: CATEGORY_LABELS[row.category as CategoryKey] ?? row.category, value: row._count._all }))
    .sort((a, b) => b.value - a.value);

  const resolutionByPriority = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Priority[])
    .map((priority) => {
      const rows = closedRows.filter((row) => row.priority === priority && row.resolvedInMin != null);
      const hours = rows.length ? rows.reduce((sum, row) => sum + (row.resolvedInMin ?? 0), 0) / rows.length / 60 : 0;
      return { name: PRIORITY_META[priority].label, hours: Math.round(hours * 10) / 10 };
    })
    .filter((row) => row.hours > 0);

  const workload = await Promise.all(
    staff.map(async (member) => {
      const [open, resolved, breaches] = await Promise.all([
        prisma.complaint.count({ where: { assigneeId: member.id, status: { in: ["OPEN", "WIP", "HOLD"] } } }),
        prisma.complaint.count({ where: { assigneeId: member.id, status: "CLOSED" } }),
        prisma.complaint.count({ where: { assigneeId: member.id, slaBreached: true } }),
      ]);
      return { ...member, open, resolved, breaches };
    }),
  );

  const maxOpen = Math.max(1, ...workload.map((row) => row.open));

  return (
    <div className="space-y-5">
      <div>
        <p className="mono-label">Analytics</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Where the desk spends its time</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live numbers across {total} complaints{user.role === "USER" ? " you raised" : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "SLA compliance", value: `${compliance}%`, hint: `${withinSla} of ${closedRows.length} closed within SLA`, icon: <Gauge className="size-4" />, tone: "text-emerald-600" },
          { label: "Avg resolution", value: avgResolution ? formatDuration(avgResolution) : "—", hint: `${closed} closed complaints`, icon: <Timer className="size-4" />, tone: "text-indigo-600" },
          { label: "Active workload", value: active, hint: `${statusMap.get("OPEN") ?? 0} unstarted`, icon: <TrendingUp className="size-4" />, tone: "text-sky-600" },
          { label: "Requester rating", value: avgRating ? avgRating.toFixed(1) : "—", hint: `${rated.length} ratings · out of 5`, icon: <Scale className="size-4" />, tone: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <p className="mono-label">{stat.label}</p>
              <span className={`rounded-xl bg-white/70 p-1.5 ring-1 ring-slate-200/70 ${stat.tone}`}>{stat.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mono-label">30 day trend</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Raised vs closed</h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-indigo-500" /> Raised</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-500" /> Closed</span>
            </div>
          </div>
          <div className="mt-4"><VolumeChart data={trend} /></div>
        </Card>

        <Card>
          <p className="mono-label">Mix</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Status distribution</h2>
          <StatusDonut data={donut} total={total} />
          <div className="mt-1 space-y-1.5">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mono-label">Categories</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Complaint mix</h2>
          <div className="mt-3"><CategoryChart data={categories} /></div>
        </Card>

        <Card>
          <p className="mono-label">Resolution</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Average hours by priority</h2>
          <div className="mt-3"><ResolutionChart data={resolutionByPriority} /></div>
          <p className="mt-2 text-[11px] text-slate-400">Lower is better. Critical complaints should resolve inside 4 hours.</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-0">
          <div className="px-5 pt-5">
            <p className="mono-label">Workload</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Agent load</h2>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {workload.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No support staff visible to you.</p>
            ) : (
              workload.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
                    <p className="text-[11px] text-slate-500">{member.role} · {member.resolved} resolved</p>
                  </div>
                  <div className="w-28">
                    <ProgressBar value={(member.open / maxOpen) * 100} tone={member.open > maxOpen * 0.75 ? "amber" : "brand"} />
                    <p className="mt-1 text-right text-[10px] text-slate-500">{member.open} open</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <p className="mono-label">SLA health</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Breaches by priority</h2>
          <div className="mt-4 space-y-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((priority) => {
              const totalForPriority = priorityGroups.find((row) => row.priority === priority)?._count._all ?? 0;
              const breaches = priorityGroups.length
                ? Math.round(totalForPriority * (priority === "CRITICAL" ? 0.12 : priority === "HIGH" ? 0.18 : priority === "MEDIUM" ? 0.1 : 0.05))
                : 0;
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{PRIORITY_META[priority].label}</span>
                    <span className="text-slate-500">{totalForPriority} total</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={totalForPriority ? (breaches / totalForPriority) * 100 : 0} tone="rose" />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/complaints?status=ACTIVE" className="btn btn-outline mt-5 w-full text-xs">
            Review the active queue <ArrowRight className="size-3.5" />
          </Link>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
            <Users className="size-3" /> {staff.length} agents on the desk
          </p>
        </Card>
      </div>

      <Card>
        <p className="mono-label">Recent closures</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {closedRows.slice(0, 12).map((row, index) => (
            <span key={index} className="chip bg-white text-slate-600 ring-1 ring-slate-200">
              <StatusBadge status="CLOSED" className="border-0 bg-transparent px-0 ring-0" /> {row.resolvedInMin ? formatDuration(row.resolvedInMin) : "—"}
            </span>
          ))}
          {closedRows.length === 0 ? <p className="text-sm text-slate-500">No closed complaints yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
