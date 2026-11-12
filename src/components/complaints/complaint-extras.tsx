"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Paperclip, Star } from "lucide-react";
import { Button } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn } from "@/lib/format";

export function FeedbackForm({ complaintId, existingRating }: { complaintId: string; existingRating: number | null }) {
  const router = useRouter();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating) {
      setError("Pick a star rating first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/complaints/${complaintId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback: feedback || undefined }),
      });
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (existingRating && !done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Your rating</p>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star key={value} className={cn("size-4", value <= existingRating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
          ))}
          <span className="ml-1 text-xs text-emerald-700">{existingRating}/5</span>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-700">
        Thanks — your rating was recorded.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-slate-800">How did we do?</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(value)}
            aria-label={`${value} star`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition",
                value <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-slate-300",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        className="textarea mt-2 min-h-16 text-xs"
        placeholder="Anything to add about the resolution? (optional)"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        maxLength={1000}
      />
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      <Button type="submit" size="sm" className="mt-2 w-full" disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Star className="size-3.5" />}
        Submit rating
      </Button>
    </form>
  );
}

export function AttachmentUpload({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      await apiFetch(`/api/complaints/${complaintId}/attachments`, { method: "POST", body: form });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className={cn("btn btn-outline w-full cursor-pointer text-xs", busy && "opacity-60")}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
        {busy ? "Uploading…" : "Attach a file"}
        <input
          type="file"
          className="hidden"
          disabled={busy}
          onChange={(event) => upload(event.target.files?.[0])}
          accept="image/*,.pdf,.txt,.csv,.zip,.docx,.xlsx"
        />
      </label>
      {error ? <p className="mt-1 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
}
