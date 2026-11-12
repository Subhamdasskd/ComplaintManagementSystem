import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PAGE_SIZE, CATEGORIES, CATEGORY_LABELS, LEVELS, PRIORITIES, STATUSES, STATUS_META, type Priority, type Status } from "@/lib/constants";
import { roleToLevel, visibleComplaintFilter, type Viewer } from "@/lib/rbac";
import { DueBadge, PriorityBadge, StatusBadge, Avatar, EmptyState, LevelBadge } from "@/components/ui";
import { isOverdue, slaConsumed } from "@/lib/sla";
import { dueLabel, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ComplaintsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const viewer: Viewer = { id: user.id, role: user.role as Viewer["role"], level: roleToLevel(user.role as Viewer["role"]) };

  const q = first(params.q).trim();
  const status = first(params.status);
  const priority = first(params.priority);
  const category = first(params.category);
  const level = first(params.level);
  const assignee = first(params.assignee);
  const sort = first(params.sort) || "newest";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const now = new Date();
  const where: Record<string, unknown> = { ...(visibleComplaintFilter(viewer) as object) };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status === "ACTIVE") where.status = { in: ["OPEN", "WIP", "HOLD"] };
  else if (STATUSES.includes(status as Status)) where.status = status;
  if (PRIORITIES.includes(priority as Priority)) where.priority = priority;
  if (CATEGORIES.includes(category as never)) where.category = category;
  if (LEVELS.includes(level as never)) where.level = level;
  if (assignee === "unassigned") where.assigneeId = null;
  else if (assignee) where.assigneeId = assignee;

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "due"
        ? { dueAt: "asc" as const }
        : sort === "priority"
          ? { priority: "desc" as const }
          : { createdAt: "desc" as const };

  const [total, complaints, staff] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        raisedBy: { select: { name: true } },
        assignee: { select: { name: true, role: true } },
        _count: { select: { remarks: true, attachments: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["L1", "L2", "L3"] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(q || status || priority || category || level || assignee);
  const isStaff = user.role !== "USER";

  function href(overrides: Record<string, string | number | undefined>) {
    const next = new URLSearchParams();
    const base: Record<string, string> = {
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
      ...(assignee ? { assignee } : {}),
      ...(sort ? { sort } : {}),
    };
    for (const [key, value] of Object.entries({ ...base, ...overrides })) {
      if (value !== undefined && value !== "") next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `/complaints?${qs}` : "/complaints";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">Queue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? "complaint" : "complaints"} in your scope
            {hasFilters ? " with the current filters" : ""}.
          </p>
        </div>
        <Link href="/complaints/new" className="btn btn-primary">
          <Plus className="size-4" /> Raise a complaint
        </Link>
      </div>

      {/* filters */}
      <form className="card flex flex-wrap items-end gap-3 p-4" action="/complaints" method="get">
        <div className="min-w-[220px] flex-1">
          <label className="field-label" htmlFor="q">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input id="q" name="q" defaultValue={q} placeholder="Reference, title or description" className="input pl-9" />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="select w-36">
            <option value="">Any</option>
            <option value="ACTIVE">Active</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_META[item].label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="priority">Priority</label>
          <select id="priority" name="priority" defaultValue={priority} className="select w-32">
            <option value="">Any</option>
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={category} className="select w-40">
            <option value="">Any</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>
            ))}
          </select>
        </div>

        {isStaff ? (
          <>
            <div>
              <label className="field-label" htmlFor="level">Level</label>
              <select id="level" name="level" defaultValue={level} className="select w-28">
                <option value="">Any</option>
                {LEVELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="assignee">Assignee</label>
              <select id="assignee" name="assignee" defaultValue={assignee} className="select w-44">
                <option value="">Anyone</option>
                <option value="unassigned">Unassigned</option>
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} · {item.role}</option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        <div>
          <label className="field-label" htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={sort} className="select w-36">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="due">Due soonest</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <input type="hidden" name="page" value="1" />

        <button type="submit" className="btn btn-outline">
          <Filter className="size-4" /> Apply
        </button>
        {hasFilters ? (
          <Link href="/complaints" className="btn btn-ghost">
            <X className="size-4" /> Clear
          </Link>
        ) : null}
      </form>

      {/* list */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title={hasFilters ? "No complaints match those filters" : "No complaints yet"}
          description={hasFilters ? "Try widening the filters or clearing the search." : "Raise the first complaint and it will show up here immediately."}
          action={<Link href="/complaints/new" className="btn btn-primary"><Plus className="size-4" /> Raise a complaint</Link>}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => {
            const overdue = isOverdue(item.dueAt, item.status, now);
            const consumed = slaConsumed(item.createdAt, item.dueAt, now);
            return (
              <Link key={item.id} href={`/complaints/${item.id}`} className="card card-hover block p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{item.reference}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <LevelBadge level={item.level} />
                      <span className="chip bg-white text-slate-600 ring-1 ring-slate-200">{CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}</span>
                    </div>

                    <h2 className="mt-2 text-sm font-semibold text-slate-900 sm:text-[15px]">{item.title}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={item.raisedBy.name} size="xs" /> {item.raisedBy.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="grid size-5 place-items-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">
                          {(item.assignee?.name ?? "?").slice(0, 1)}
                        </span>
                        {item.assignee?.name ?? "Unassigned"}
                      </span>
                      <span>{relativeTime(item.createdAt)}</span>
                      <span>{item._count.remarks} remarks</span>
                      {item._count.attachments > 0 ? <span>{item._count.attachments} files</span> : null}
                    </div>
                  </div>

                  <div className="w-full shrink-0 sm:w-40">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">SLA</span>
                      <span className={overdue ? "font-semibold text-rose-600" : "font-medium text-slate-600"}>
                        {item.status === "CLOSED" || item.status === "REJECTED" ? "Closed" : dueLabel(item.dueAt, now)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className={`h-full rounded-full ${overdue ? "bg-gradient-to-r from-rose-500 to-pink-400" : consumed > 70 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-indigo-500 to-sky-400"}`}
                        style={{ width: `${consumed}%` }}
                      />
                    </div>
                    {overdue ? <DueBadge overdue={overdue} className="mt-2" /> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* pagination */}
      {pages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-3 backdrop-blur">
          <p className="text-xs text-slate-500">
            Page {page} of {pages} · {total} complaints
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={href({ page: Math.max(1, page - 1) })}
              aria-disabled={page === 1}
              className={`btn btn-outline px-3 py-1.5 text-xs ${page === 1 ? "pointer-events-none opacity-40" : ""}`}
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Link>
            <Link
              href={href({ page: Math.min(pages, page + 1) })}
              aria-disabled={page === pages}
              className={`btn btn-outline px-3 py-1.5 text-xs ${page === pages ? "pointer-events-none opacity-40" : ""}`}
            >
              Next <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-2 py-2 text-[11px] text-slate-400">
          <SlidersHorizontal className="size-3.5" /> {total} results
        </p>
      )}
    </div>
  );
}
