import Link from "next/link";
import { ArrowRight, Gauge, Scale, Timer, TrendingUp, Users } from "lucide-react";
import { CategoryChart, ResolutionChart, StatusDonut, VolumeChart } from "@/components/charts";
import { Avatar, Card, ProgressBar, StatusBadge } from "@/components/ui";
import { buildDemoDataset, computeDemoMetrics } from "@/lib/demo/dataset";
import { formatDuration } from "@/lib/sla";

export const dynamic = "force-dynamic";

export default function DemoAnalyticsPage() {
  const now = new Date();
  const complaints = buildDemoDataset(now);
  const metrics = computeDemoMetrics(complaints, 30, now);

  const donut = [
    { name: "Open", value: metrics.byStatus.OPEN, color: "#38bdf8" },
    { name: "In progress", value: metrics.byStatus.WIP, color: "#6366f1" },
    { name: "On hold", value: metrics.byStatus.HOLD, color: "#f59e0b" },
    { name: "Closed", value: metrics.byStatus.CLOSED, color: "#10b981" },
    { name: "Rejected", value: metrics.byStatus.REJECTED, color: "#f43f5e" },
  ];
  const maxOpen = Math.max(1, ...metrics.workload.map((row) => row.open));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">Analytics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Where the desk spends its time</h1>
          <p className="mt-1 text-sm text-slate-500">Live numbers across {metrics.total} complaints in the demo dataset.</p>
        </div>
        <Link href="/login" className="btn btn-outline">See it with real data</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "SLA compliance", value: `${metrics.slaCompliance}%`, hint: `Across ${metrics.closed} closed complaints`, icon: <Gauge className="size-4" />, tone: "text-emerald-600" },
          { label: "Avg resolution", value: metrics.avgResolutionMinutes ? formatDuration(metrics.avgResolutionMinutes) : "—", hint: "From raise to close", icon: <Timer className="size-4" />, tone: "text-indigo-600" },
          { label: "Active workload", value: metrics.active, hint: `${metrics.byStatus.OPEN} unstarted`, icon: <TrendingUp className="size-4" />, tone: "text-sky-600" },
          { label: "Requester rating", value: metrics.avgRating ? metrics.avgRating.toFixed(1) : "—", hint: `${metrics.ratingCount} ratings · out of 5`, icon: <Scale className="size-4" />, tone: "text-amber-600" },
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
          <div className="mt-4"><VolumeChart data={metrics.trend} /></div>
        </Card>

        <Card>
          <p className="mono-label">Mix</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Status distribution</h2>
          <StatusDonut data={donut} total={metrics.total} />
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
          <div className="mt-3"><CategoryChart data={metrics.byCategory} /></div>
        </Card>

        <Card>
          <p className="mono-label">Resolution</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Average hours by priority</h2>
          <div className="mt-3"><ResolutionChart data={metrics.resolutionByPriority} /></div>
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
            {metrics.workload.map((member) => (
              <div key={member.name} className="flex items-center gap-3 px-5 py-3">
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
            ))}
          </div>
        </Card>

        <Card>
          <p className="mono-label">SLA health</p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">Breaches by priority</h2>
          <div className="mt-4 space-y-3">
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((priority) => {
              const total = metrics.byPriority[priority];
              const breaches = complaints.filter((c) => c.priority === priority && c.slaBreached).length;
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{priority.charAt(0) + priority.slice(1).toLowerCase()}</span>
                    <span className="text-slate-500">{breaches} of {total} breached</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={total ? (breaches / total) * 100 : 0} tone="rose" />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/demo/complaints?status=ACTIVE" className="btn btn-outline mt-5 w-full text-xs">
            Review the active queue <ArrowRight className="size-3.5" />
          </Link>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">
            <Users className="size-3" /> {metrics.workload.length} agents on the desk
          </p>
        </Card>
      </div>

      <Card>
        <p className="mono-label">Recent closures</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {complaints
            .filter((c) => c.status === "CLOSED")
            .slice(0, 12)
            .map((c) => (
              <span key={c.id} className="chip bg-white text-slate-600 ring-1 ring-slate-200">
                <StatusBadge status="CLOSED" className="border-0 bg-transparent px-0 ring-0" /> {c.resolvedInMin ? formatDuration(c.resolvedInMin) : "—"}
              </span>
            ))}
        </div>
      </Card>
    </div>
  );
}
