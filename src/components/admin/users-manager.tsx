"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck, UserPlus, UserX, Check } from "lucide-react";
import { Avatar, Button, Card, RoleBadge } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn, formatDate } from "@/lib/format";
import { ROLES, ROLE_META, type Role } from "@/lib/constants";

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  active: boolean;
  createdAt: string;
  _count: { assignedComplaints: number; raisedComplaints: number };
};

export function UsersManager({ users, currentUserId }: { users: Person[]; currentUserId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "L1" as Role, department: "" });
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (person) =>
        person.name.toLowerCase().includes(needle) ||
        person.email.toLowerCase().includes(needle) ||
        person.role.toLowerCase().includes(needle) ||
        (person.department ?? "").toLowerCase().includes(needle),
    );
  }, [query, users]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "L1", department: "" });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label">Directory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">People</h1>
          <p className="mt-1 text-sm text-slate-500">
            {users.length} accounts · {users.filter((person) => person.active).length} active ·{" "}
            {users.filter((person) => ["L1", "L2", "L3"].includes(person.role)).length} support agents
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <UserPlus className="size-4" /> Add a person
        </Button>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {showForm ? (
        <Card>
          <p className="mono-label">New account</p>
          <form onSubmit={create} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="new-name">Full name</label>
              <input id="new-name" className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} />
            </div>
            <div>
              <label className="field-label" htmlFor="new-email">Email</label>
              <input id="new-email" type="email" className="input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </div>
            <div>
              <label className="field-label" htmlFor="new-password">Temp password</label>
              <input id="new-password" className="input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="field-label" htmlFor="new-role">Role</label>
              <select id="new-role" className="select" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_META[role].label} · {role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="new-dept">Department</label>
              <input id="new-dept" className="input" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="Optional" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Create account
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative flex-1 min-w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, roles, departments"
              className="input pl-9 text-xs"
            />
          </div>
          <span className="text-[11px] text-slate-400">{filtered.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Workload</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((person) => (
                <tr key={person.id} className="table-row-hover">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={person.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {person.name}
                          {person.id === currentUserId ? <span className="ml-1.5 text-[10px] text-indigo-500">you</span> : null}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">{person.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {person.role === "ADMIN" ? (
                      <RoleBadge role={person.role} />
                    ) : (
                      <select
                        className="select w-32 py-1.5 text-xs"
                        value={person.role}
                        disabled={busyId === person.id}
                        onChange={(event) => patch(person.id, { role: event.target.value })}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{ROLE_META[role].label}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-500">
                    {person._count.assignedComplaints} assigned · {person._count.raisedComplaints} raised
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-500">{formatDate(person.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {busyId === person.id ? <Loader2 className="size-3.5 animate-spin text-slate-400" /> : null}
                      <span
                        className={cn(
                          "chip ring-1",
                          person.active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200",
                        )}
                      >
                        {person.active ? "Active" : "Disabled"}
                      </span>
                      <button
                        onClick={() => patch(person.id, { active: !person.active })}
                        disabled={busyId === person.id || person.id === currentUserId}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                        title={person.active ? "Deactivate" : "Reactivate"}
                      >
                        {person.active ? <UserX className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-500">No people match that search.</p> : null}
      </Card>

      <p className="text-[11px] text-slate-400">
        Role changes take effect on the next request from that person. At least one active administrator always remains.
      </p>
    </div>
  );
}
