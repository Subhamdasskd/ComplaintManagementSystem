import Link from "next/link";
import { ArrowRight, CircleDot, Clock, Flame, Plus, Ticket, TrendingUp } from "lucide-react";
import { CategoryChart, StatusDonut, VolumeChart } from "@/components/charts";
import { Avatar, Card, PriorityBadge, ProgressBar, StatusBadge } from "@/components/ui";
import { buildDemoDataset, computeDemoMetrics } from "@/lib/demo/dataset";
import { dueLabel, formatDateTime, greeting, relativeTime } from "@/lib/format";
import { formatDuration } from "@/lib/sla";

export const dynamic = "force-dynamic";

export default function DemoDashboardPage() {
  const now = new Date();
  const complaints = buildDemoDataset(now);
  const metrics = computeDemoMetrics(complaints, 14, now);

  const donut = [
    { name: "Open", value: metrics.byStatus.OPEN, color: "#38bdf8" },
    { name: "In progress", value: metrics.byStatus.WIP, color: "#6366f1" },
    { name: "On hold", value: metrics.byStatus.HOLD, color: "#f59e0b" },
    { name: "Closed", value: metrics.byStatus.CLOSED, color: "#10b981" },
    { name: "Rejected", value: metrics.byStatus.REJECTED, color: "#f43f5e" },
  ].filter((slice) => slice.value > 0);

  const attention = complaints
    .filter((complaint) => ["OPEN", "WIP", "HOLD"].includes(complaint.status))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 5);

  const recent = [...complaints].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 7);

  const activity = complaints
    .flatMap((complaint) => complaint.events.map((event) => ({ ...event, complaint })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">{formatDateTime(now)} · Asia/Kolkata</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {greeting(now)}, Aarav
          </h1>
          <p className="mt-1 text-sm text-slate-500">A live snapshot of the whole desk — rendered from the demo dataset.</p>
        </div>
        <Link href="/login" className="btn btn-primary">
          <Plus className="size-4" /> Try the live app
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open queue", value: metrics.byStatus.OPEN + metrics.byStatus.WIP, hint: `${metrics.byStatus.OPEN} open · ${metrics.byStatus.WIP} in progress`, icon: <Ticket className="size-4" />, tone: "text-sky-600" },
          { label: "SLA breached", value: metrics.breached, hint: "Past their due time", icon: <Flame className="size-4" />, tone: "text-rose-600" },
          { label: "Avg resolution", value: metrics.avgResolutionMinutes ? formatDuration(metrics.avgResolutionMinutes) : "—", hint: `Across ${metrics.closed} closed complaints`, icon: <Clock className="size-4" />, tone: "text-emerald-600" },
          { label: "SLA compliance", value: `${metrics.slaCompliance}%`, hint: "Closed within the SLA window", icon: <TrendingUp className="size-4" />, tone: "text-indigo-600" },
        ].map((stat) => (
          <div key={stat.label} className="card card-hover p-5">
            <div className="flex items-start justify-between">
              <p className="mono-label">{stat.label}</p>
              <span className={`rounded-xl bg-white/70 p-1.5 ring-1 ring-slate-200/70 ${stat.tone}`}>{stat.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            {stat.label === "SLA compliance" ? (
              <div className="mt-2">
                <ProgressBar value={metrics.slaCompliance} tone={metrics.slaCompliance >= 80 ? "emerald" : "amber"} />
              </div>
            ) : null}
          </div>
        ))}
      </div>

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
            <VolumeChart data={metrics.trend} />
          </div>
        </Card>

        <Card>
          <p className="mono-label">Distribution</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Where complaints stand</h2>
          <StatusDonut data={donut} total={metrics.total} />
          <div className="mt-2 space-y-1.5">
            {donut.map((slice) => (
              <div key={slice.name} className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="size-2 rounded-full" style={{ background: slice.color }} />
                {slice.name}
                <span className="ml-auto font-semibold text-slate-800">{slice.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mono-label">Needs attention</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Closest to breaching</h2>
            </div>
            <Link href="/demo/complaints" className="btn btn-ghost px-2 py-1.5 text-xs">
              All active <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {attention.map((item) => {
              const overdue = item.dueAt < now;
              return (
                <Link
                  key={item.id}
                  href={`/demo/complaints/${item.id}`}
                  className="group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition hover:border-indigo-100 hover:bg-indigo-50/40"
                >
                  <span className={`mt-1 size-2 shrink-0 rounded-full ${overdue ? "bg-rose-500" : "bg-indigo-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{item.reference}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.assignee?.name ?? "Unassigned"} · {item.level}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${overdue ? "text-rose-600" : "text-slate-500"}`}>
                    {dueLabel(item.dueAt, now)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className="mono-label">Categories</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">What people complain about</h2>
          <div className="mt-3">
            <CategoryChart data={metrics.byCategory} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-0">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <div>
              <p className="mono-label">Latest</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Recent complaints</h2>
            </div>
            <Link href="/demo/complaints" className="btn btn-ghost px-2 py-1.5 text-xs">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recent.map((item) => (
              <Link key={item.id} href={`/demo/complaints/${item.id}`} className="table-row-hover flex items-center gap-3 px-5 py-3">
                <Avatar name={item.raisedBy.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{item.reference}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-800">{item.title}</p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[11px] text-slate-500">{relativeTime(item.createdAt, now)}</p>
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
                      <span className="text-violet-600">escalated {event.from} → {event.to}</span>
                    ) : event.type === "STATUS" ? (
                      <>moved {event.from} → {event.to}</>
                    ) : event.type === "ASSIGN" ? (
                      <>assigned {event.to}</>
                    ) : (
                      <>raised the complaint</>
                    )}
                  </p>
                  <Link href={`/demo/complaints/${event.complaint.id}`} className="mt-0.5 block truncate text-[11px] text-indigo-600 hover:text-indigo-700">
                    {event.complaint.reference} · {event.complaint.title}
                  </Link>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">{relativeTime(event.createdAt, now)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-indigo-50/60 to-cyan-50/40">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="mono-label">Next</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">This snapshot is read-only</h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              Five roles, the Open → In progress → Hold → Closed lifecycle and the L1 → L2 → L3 escalation watchdog all
              run for real in the shipped app. Sign in to raise a complaint, work the queue or change the SLA policy.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
