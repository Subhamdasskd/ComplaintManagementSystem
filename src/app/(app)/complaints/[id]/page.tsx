import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  canAssign,
  canEscalate,
  canGiveFeedback,
  canView,
  allowedTransitions,
  requesterActions,
  roleToLevel,
  type Viewer,
} from "@/lib/rbac";
import { CATEGORY_LABELS, STATUS_META, type Status } from "@/lib/constants";
import { Avatar, Card, DueBadge, LevelBadge, PriorityBadge, ProgressBar, StatusBadge } from "@/components/ui";
import { ComplaintActions } from "@/components/complaints/complaint-actions";
import { RemarkComposer } from "@/components/complaints/remark-composer";
import { AttachmentUpload, FeedbackForm } from "@/components/complaints/complaint-extras";
import { dueLabel, formatBytes, formatDateTime, relativeTime } from "@/lib/format";
import { formatDuration, isOverdue, slaConsumed } from "@/lib/sla";

export const dynamic = "force-dynamic";

const EVENT_ICON: Record<string, React.ReactNode> = {
  CREATED: <Sparkles className="size-3 text-indigo-500" />,
  STATUS: <CheckCircle2 className="size-3 text-emerald-500" />,
  LEVEL: <ArrowUpRight className="size-3 text-violet-500" />,
  ESCALATION: <ArrowUpRight className="size-3 text-violet-500" />,
  ASSIGN: <UserRound className="size-3 text-sky-500" />,
  FEEDBACK: <MessageSquare className="size-3 text-amber-500" />,
  REMARK: <MessageSquare className="size-3 text-slate-400" />,
};

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const viewer: Viewer = { id: user.id, role: user.role as Viewer["role"], level: roleToLevel(user.role as Viewer["role"]) };
  const staffViewer = user.role !== "USER";

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      raisedBy: { select: { id: true, name: true, email: true, department: true } },
      assignee: { select: { id: true, name: true, email: true, role: true } },
      attachments: { select: { id: true, filename: true, mimeType: true, size: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      remarks: {
        where: staffViewer ? {} : { internal: false },
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      history: {
        where: { type: { not: "REMARK" } },
        include: { actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint) notFound();
  if (!canView(viewer, complaint)) notFound();

  const now = new Date();
  const overdue = isOverdue(complaint.dueAt, complaint.status, now);
  const consumed = slaConsumed(complaint.createdAt, complaint.dueAt, now);
  const transitions = allowedTransitions(viewer, complaint);
  const rActions = requesterActions(viewer, complaint);
  const canFeedback = canGiveFeedback(viewer, complaint);
  const canEscalateNow = canEscalate(viewer, complaint);

  const staff = canAssign(viewer)
    ? await prisma.user.findMany({
        where: { role: { in: ["L1", "L2", "L3"] }, active: true },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  const openCounts = staff.length
    ? await prisma.complaint.groupBy({
        by: ["assigneeId"],
        where: { assigneeId: { in: staff.map((member) => member.id) }, status: { in: ["OPEN", "WIP", "HOLD"] } },
        _count: { _all: true },
      })
    : [];
  const loadMap = new Map(openCounts.map((row) => [row.assigneeId, row._count._all]));

  const timeline = [
    ...complaint.history.map((event) => ({
      id: `event-${event.id}`,
      at: event.createdAt,
      kind: "event" as const,
      type: event.type,
      actor: event.actor?.name ?? "System",
      actorRole: event.actor?.role ?? null,
      note: event.note,
      from: event.fromValue,
      to: event.toValue,
      automated: event.automated,
    })),
    ...complaint.remarks.map((remark) => ({
      id: `remark-${remark.id}`,
      at: remark.createdAt,
      kind: "remark" as const,
      type: "REMARK",
      actor: remark.author.name,
      actorRole: remark.author.role,
      note: remark.body,
      from: null,
      to: remark.internal ? "INTERNAL_NOTE" : "PUBLIC_REPLY",
      automated: false,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="space-y-5">
      <div>
        <Link href="/complaints" className="btn btn-ghost -ml-2 px-2 py-1.5 text-xs">
          <ArrowLeft className="size-3.5" /> Back to complaints
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">{complaint.reference}</span>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              <LevelBadge level={complaint.level} />
              {complaint.slaBreached || overdue ? (
                <span className="chip bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle className="size-3" /> SLA breached
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-slate-900">{complaint.title}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Raised {formatDateTime(complaint.createdAt)}</span>
              <span>·</span>
              <span>{CATEGORY_LABELS[complaint.category as keyof typeof CATEGORY_LABELS] ?? complaint.category}</span>
              <span>·</span>
              <span>Updated {relativeTime(complaint.updatedAt)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* main column */}
        <div className="space-y-4">
          <Card>
            <p className="mono-label">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{complaint.description}</p>

            {complaint.attachments.length > 0 ? (
              <div className="mt-5">
                <p className="mono-label mb-2">Attachments</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {complaint.attachments.map((file) => (
                    <li key={file.id}>
                      <a
                        href={`/api/attachments/${file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs transition hover:border-indigo-200 hover:bg-indigo-50/40"
                      >
                        <span className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                          {file.mimeType.startsWith("image/") ? <Paperclip className="size-3.5" /> : <FileText className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-700">{file.filename}</span>
                          <span className="block text-[10px] text-slate-400">{formatBytes(file.size)}</span>
                        </span>
                        <Download className="size-3.5 text-slate-400" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5">
              <AttachmentUpload complaintId={complaint.id} />
            </div>
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
                  <span
                    className={`relative z-10 mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-white ring-1 ${
                      item.type === "REMARK" && item.to === "INTERNAL_NOTE" ? "ring-amber-200" : "ring-slate-200"
                    }`}
                  >
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
                        {relativeTime(item.at)}
                      </span>
                    </div>

                    {item.from && item.to ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.type === "ESCALATION"
                          ? `Escalated from ${item.from} to ${item.to}`
                          : item.type === "STATUS"
                            ? `Status ${item.from} → ${item.to}`
                            : `${item.from} → ${item.to}`}
                      </p>
                    ) : null}

                    {item.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.note}</p> : null}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5">
              <RemarkComposer complaintId={complaint.id} staff={staffViewer} />
            </div>
          </Card>

          {canFeedback ? <FeedbackForm complaintId={complaint.id} existingRating={complaint.rating} /> : null}

          {complaint.status === "CLOSED" ? (
            <Card className="border-emerald-100 bg-emerald-50/40">
              <p className="mono-label text-emerald-700">Resolution</p>
              <p className="mt-1 text-sm text-emerald-800">
                Closed {formatDateTime(complaint.closedAt)} after {formatDuration(complaint.resolvedInMin)}.
                {complaint.rating ? ` The requester rated it ${complaint.rating}/5.` : ""}
              </p>
              {complaint.feedback ? <p className="mt-1.5 text-xs italic text-emerald-700">“{complaint.feedback}”</p> : null}
            </Card>
          ) : null}
        </div>

        {/* sidebar */}
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
              {complaint.reopenedCount > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Reopened</dt>
                  <dd className="font-medium text-amber-700">{complaint.reopenedCount}×</dd>
                </div>
              ) : null}
            </dl>
            {overdue ? <DueBadge overdue={overdue} className="mt-3" /> : null}
          </Card>

          <Card>
            <p className="mono-label">People</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={complaint.raisedBy.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{complaint.raisedBy.name}</p>
                  <p className="truncate text-[11px] text-slate-500">Requester · {complaint.raisedBy.department ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {complaint.assignee ? (
                  <>
                    <Avatar name={complaint.assignee.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{complaint.assignee.name}</p>
                      <p className="truncate text-[11px] text-slate-500">{complaint.assignee.role} · assignee</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <UserRound className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Unassigned</p>
                      <p className="text-[11px] text-slate-400">Waiting for routing</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <ComplaintActions
              complaintId={complaint.id}
              status={complaint.status}
              level={complaint.level}
              transitions={transitions}
              requesterActions={rActions}
              canAssign={canAssign(viewer)}
              canEscalate={canEscalateNow}
              staff={staff.map((member) => ({ ...member, open: loadMap.get(member.id) ?? 0 }))}
              assigneeId={complaint.assigneeId}
            />
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50/70 to-cyan-50/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-indigo-600" />
              <p className="text-xs font-semibold text-indigo-900">Audit trail is complete</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-indigo-700">
              Every status, level, assignment and remark is written to an append-only history — including the
              automated escalations from the watchdog.
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
