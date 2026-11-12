import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Avatar, Card, ProgressBar, PriorityBadge, StatusBadge, LevelBadge } from "@/components/ui";
import { buildDemoDataset } from "@/lib/demo/dataset";
import { CATEGORY_LABELS, STATUS_META, type Status } from "@/lib/constants";
import { dueLabel, formatBytes, formatDateTime, relativeTime } from "@/lib/format";
import { formatDuration, isOverdue, slaConsumed } from "@/lib/sla";

export const dynamic = "force-dynamic";

const EVENT_ICON: Record<string, React.ReactNode> = {
  CREATED: <Sparkles className="size-3 text-indigo-500" />,
  STATUS: <CheckCircle2 className="size-3 text-emerald-500" />,
  ESCALATION: <ArrowUpRight className="size-3 text-violet-500" />,
  ASSIGN: <UserRound className="size-3 text-sky-500" />,
  FEEDBACK: <MessageSquare className="size-3 text-amber-500" />,
};

export default async function DemoComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const complaint = buildDemoDataset(now).find((item) => item.id === id);
  if (!complaint) notFound();

  const overdue = isOverdue(complaint.dueAt, complaint.status, now);
  const consumed = slaConsumed(complaint.createdAt, complaint.dueAt, now);

  const timeline = [
    ...complaint.events.map((event) => ({
      id: event.id,
      at: event.createdAt,
      kind: "event" as const,
      type: event.type,
      actor: event.actor?.name ?? "System",
      actorRole: event.actor?.role ?? null,
      from: event.from,
      to: event.to,
      note: event.note,
      automated: event.automated,
    })),
    ...complaint.remarks.map((remark) => ({
      id: remark.id,
      at: remark.createdAt,
      kind: "remark" as const,
      type: "REMARK",
      actor: remark.author.name,
      actorRole: remark.author.role,
      from: null as string | null,
      to: remark.internal ? "INTERNAL_NOTE" : "PUBLIC_REPLY",
      note: remark.body,
      automated: false,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="space-y-5">
      <div>
        <Link href="/demo/complaints" className="btn btn-ghost -ml-2 px-2 py-1.5 text-xs">
          <ArrowLeft className="size-3.5" /> Back to complaints
        </Link>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">{complaint.reference}</span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <LevelBadge level={complaint.level} />
          </div>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900">{complaint.title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Raised {formatDateTime(complaint.createdAt)}</span>
            <span>·</span>
            <span>{CATEGORY_LABELS[complaint.category as keyof typeof CATEGORY_LABELS] ?? complaint.category}</span>
            <span>·</span>
            <span>{complaint.level} · {complaint.assignee?.name ?? "Unassigned"}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card>
            <p className="mono-label">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{complaint.description}</p>

            {complaint.attachments.length > 0 ? (
              <div className="mt-5">
                <p className="mono-label mb-2">Attachments</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {complaint.attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs">
                      <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <FileText className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-700">{file.filename}</span>
                        <span className="block text-[10px] text-slate-400">{formatBytes(file.size)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Lock className="size-3" /> File contents are served only in the live app, after an authorised request.
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">Timeline</p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">Everything that happened</h2>
              </div>
              <span className="chip bg-white text-slate-500 ring-1 ring-slate-200">
                <Clock className="size-3" /> {timeline.length} events
              </span>
            </div>

            <ol className="mt-5 space-y-5">
              {timeline.map((item) => (
                <li key={item.id} className="relative flex gap-3">
                  <span className="absolute left-[13px] top-7 h-[calc(100%-6px)] w-px timeline-line" />
                  <span className={`relative z-10 mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-white ring-1 ${item.to === "INTERNAL_NOTE" ? "ring-amber-200" : "ring-slate-200"}`}>
                    {EVENT_ICON[item.type] ?? <Clock className="size-3 text-slate-400" />}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white/60 px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-800">{item.actor}</span>
                      {item.actorRole ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{item.actorRole}</span>
                      ) : null}
                      {item.automated ? (
                        <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">automated</span>
                      ) : null}
                      {item.to === "INTERNAL_NOTE" ? (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">internal</span>
                      ) : null}
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400" title={formatDateTime(item.at)}>
                        {relativeTime(item.at, now)}
                      </span>
                    </div>
                    {item.from && item.to && item.type !== "REMARK" ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.type === "ESCALATION" ? `Escalated from ${item.from} to ${item.to}` : `Status ${item.from} → ${item.to}`}
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-[11px] text-slate-500">
              Replies, internal notes and status changes are disabled here — this snapshot is read-only.
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <p className="mono-label">SLA</p>
              <span className={`text-xs font-semibold ${overdue ? "text-rose-600" : "text-slate-600"}`}>
                {complaint.status === "CLOSED" || complaint.status === "REJECTED" ? "Stopped" : dueLabel(complaint.dueAt, now)}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={consumed} tone={overdue ? "rose" : consumed > 70 ? "amber" : "brand"} />
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Due</dt>
                <dd className="font-medium text-slate-700">{formatDateTime(complaint.dueAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-700">{formatDateTime(complaint.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Escalations</dt>
                <dd className="font-medium text-slate-700">{complaint.escalationCount}</dd>
              </div>
              {complaint.resolvedInMin ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Resolved in</dt>
                  <dd className="font-medium text-slate-700">{formatDuration(complaint.resolvedInMin)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <p className="mono-label">People</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={complaint.raisedBy.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{complaint.raisedBy.name}</p>
                  <p className="truncate text-[11px] text-slate-500">Requester</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Avatar name={complaint.assignee?.name ?? "Unassigned"} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{complaint.assignee?.name ?? "Unassigned"}</p>
                  <p className="truncate text-[11px] text-slate-500">{complaint.assignee?.role ?? "—"} · assignee</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50/70 to-cyan-50/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-600" />
              <p className="text-xs font-semibold text-indigo-900">Audit trail is complete</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-indigo-700">
              Every status, level, assignment and remark is written to an append-only history — including the automated
              escalations from the watchdog.
            </p>
            <p className="mt-2 flex items-center gap-1 text-[10px] tracking-wide text-indigo-500">
              <CalendarClock className="size-3" /> {STATUS_META[complaint.status as Status]?.description}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
