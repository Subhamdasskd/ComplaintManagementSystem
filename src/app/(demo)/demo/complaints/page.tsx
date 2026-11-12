import Link from "next/link";
import { Filter, Inbox, Search, X } from "lucide-react";
import { Avatar, EmptyState, LevelBadge, PriorityBadge, StatusBadge } from "@/components/ui";
import { buildDemoDataset } from "@/lib/demo/dataset";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, STATUSES, STATUS_META } from "@/lib/constants";
import { dueLabel, relativeTime } from "@/lib/format";
import { isOverdue, slaConsumed } from "@/lib/sla";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function DemoComplaintsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q).trim().toLowerCase();
  const status = first(params.status);
  const priority = first(params.priority);
  const category = first(params.category);
  const now = new Date();

  const all = buildDemoDataset(now);
  const filtered = all.filter((complaint) => {
    if (q && !`${complaint.reference} ${complaint.title} ${complaint.description}`.toLowerCase().includes(q)) return false;
    if (status === "ACTIVE" && !["OPEN", "WIP", "HOLD"].includes(complaint.status)) return false;
    if (status && status !== "ACTIVE" && complaint.status !== status) return false;
    if (priority && complaint.priority !== priority) return false;
    if (category && complaint.category !== category) return false;
    return true;
  });

  const hasFilters = Boolean(q || status || priority || category);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">Queue</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} of {all.length} complaints{hasFilters ? " match the filters" : " in the demo dataset"}.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary">Raise one for real</Link>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4" action="/demo/complaints" method="get">
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
        <button type="submit" className="btn btn-outline"><Filter className="size-4" /> Apply</button>
        {hasFilters ? (
          <Link href="/demo/complaints" className="btn btn-ghost"><X className="size-4" /> Clear</Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="size-5" />} title="Nothing matches those filters" description="Try a wider search or clear the filters." />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const overdue = isOverdue(item.dueAt, item.status, now);
            const consumed = slaConsumed(item.createdAt, item.dueAt, now);
            return (
              <Link key={item.id} href={`/demo/complaints/${item.id}`} className="card card-hover block p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{item.reference}</span>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} />
                      <LevelBadge level={item.level} />
                      <span className="chip bg-white text-slate-600 ring-1 ring-slate-200">
                        {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold text-slate-900 sm:text-[15px]">{item.title}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{item.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5"><Avatar name={item.raisedBy.name} size="xs" /> {item.raisedBy.name}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="grid size-5 place-items-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">
                          {(item.assignee?.name ?? "?").slice(0, 1)}
                        </span>
                        {item.assignee?.name ?? "Unassigned"}
                      </span>
                      <span>{relativeTime(item.createdAt, now)}</span>
                      <span>{item.remarks.length} remarks</span>
                      {item.attachments.length > 0 ? <span>{item.attachments.length} file</span> : null}
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
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
