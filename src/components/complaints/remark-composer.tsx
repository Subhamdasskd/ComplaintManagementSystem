"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn } from "@/lib/format";

export function RemarkComposer({ complaintId, staff }: { complaintId: string; staff: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/complaints/${complaintId}/remarks`, {
        method: "POST",
        body: JSON.stringify({ body, internal }),
      });
      setBody("");
      setInternal(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4 text-indigo-500" />
        <p className="text-sm font-semibold text-slate-800">Add a reply</p>
        {staff ? (
          <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => setInternal(false)}
              className={cn("rounded-md px-2 py-1 text-[11px] font-medium", !internal ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setInternal(true)}
              className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium", internal ? "bg-white text-amber-700 shadow-sm" : "text-slate-500")}
            >
              <Lock className="size-3" /> Internal
            </button>
          </div>
        ) : null}
      </div>

      <textarea
        className="textarea mt-3 min-h-24 resize-y text-sm"
        placeholder={internal ? "Internal note — only support staff will see this" : "Reply to the requester…"}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={3000}
      />

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">{body.length}/3000</p>
        <Button type="submit" size="sm" disabled={busy || !body.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Post {internal ? "internal note" : "reply"}
        </Button>
      </div>
    </form>
  );
}
