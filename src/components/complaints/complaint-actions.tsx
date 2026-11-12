"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2, PauseCircle, PlayCircle, UserRound, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn } from "@/lib/format";
import { STATUS_META, type Status } from "@/lib/constants";

type StaffMember = { id: string; name: string; role: string; open: number };

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; variant: "primary" | "outline" | "danger" | "ghost" }> = {
  WIP: { label: "Start work", icon: <PlayCircle className="size-4" />, variant: "primary" },
  HOLD: { label: "Put on hold", icon: <PauseCircle className="size-4" />, variant: "outline" },
  CLOSED: { label: "Close as resolved", icon: <CheckCircle2 className="size-4" />, variant: "primary" },
  REJECTED: { label: "Reject", icon: <XCircle className="size-4" />, variant: "danger" },
};

export function ComplaintActions({
  complaintId,
  status,
  level,
  transitions,
  requesterActions,
  canAssign,
  canEscalate,
  staff,
  assigneeId,
}: {
  complaintId: string;
  status: string;
  level: string;
  transitions: Status[];
  requesterActions: ("close" | "reopen")[];
  canAssign: boolean;
  canEscalate: boolean;
  staff: StaffMember[];
  assigneeId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState(assigneeId ?? "");

  async function run(label: string, promise: Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await promise;
      router.refresh();
      setNoteFor(null);
      setNote("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(next: Status, noteText?: string) {
    await run(next, apiFetch(`/api/complaints/${complaintId}/status`, { method: "POST", body: JSON.stringify({ status: next, note: noteText }) }));
  }

  const requesterClose = requesterActions.includes("close");
  const requesterReopen = requesterActions.includes("reopen");
  const canEscalateNow = canEscalate && level !== "L3" && status !== "CLOSED" && status !== "REJECTED";

  return (
    <div className="space-y-4">
      <div>
        <p className="mono-label mb-2">Actions</p>

        <div className="space-y-2">
          {transitions.length === 0 && !requesterClose && !requesterReopen ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              No status changes available for your role at this stage.
            </p>
          ) : null}

          {transitions.map((next) => {
            const meta = ACTION_META[next] ?? { label: `Move to ${next}`, icon: null, variant: "outline" as const };
            const needsNote = next === "CLOSED" || next === "REJECTED" || next === "HOLD";
            return (
              <div key={next}>
                <Button
                  variant={meta.variant}
                  className="w-full justify-start"
                  disabled={busy !== null}
                  onClick={() => (needsNote ? setNoteFor(next) : changeStatus(next))}
                >
                  {busy === next ? <Loader2 className="size-4 animate-spin" /> : meta.icon}
                  {meta.label}
                </Button>

                {noteFor === next ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5">
                    <textarea
                      className="textarea min-h-20 text-xs"
                      placeholder={next === "CLOSED" ? "What fixed it? (optional but useful)" : "Why? (recorded on the audit trail)"}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" disabled={busy !== null} onClick={() => changeStatus(next, note)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setNoteFor(null); setNote(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {requesterClose ? (
            <Button className="w-full justify-start" disabled={busy !== null} onClick={() => changeStatus("CLOSED")}>
              <CheckCircle2 className="size-4" /> Confirm it is resolved
            </Button>
          ) : null}

          {requesterReopen ? (
            <Button variant="outline" className="w-full justify-start" disabled={busy !== null} onClick={() => changeStatus("OPEN")}>
              <PlayCircle className="size-4" /> Reopen this complaint
            </Button>
          ) : null}

          {canEscalateNow ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={busy !== null}
              onClick={() =>
                run("escalate", apiFetch(`/api/complaints/${complaintId}/escalate`, { method: "POST", body: JSON.stringify({}) }))
              }
            >
              {busy === "escalate" ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}
              Escalate to next level
            </Button>
          ) : null}
        </div>
      </div>

      {canAssign ? (
        <div>
          <p className="mono-label mb-2">Assignee</p>
          <div className="space-y-2">
            <select className="select text-xs" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.role} · {member.open} open
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={busy !== null || assignee === (assigneeId ?? "")}
              onClick={() =>
                run("assign", apiFetch(`/api/complaints/${complaintId}/assign`, { method: "POST", body: JSON.stringify({ assigneeId: assignee || null }) }))
              }
            >
              {busy === "assign" ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
              Reassign
            </Button>
          </div>
        </div>
      ) : null}

      <div className={cn("rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-500", busy ? "opacity-100" : "opacity-100")}>
        Current state: <span className="font-semibold text-slate-700">{STATUS_META[status as Status]?.label ?? status}</span> at {level}
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
