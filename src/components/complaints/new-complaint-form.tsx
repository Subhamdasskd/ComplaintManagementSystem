"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  AppWindow,
  Building2,
  CircleHelp,
  CloudUpload,
  KeyRound,
  Loader2,
  Monitor,
  Send,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn } from "@/lib/format";
import { CATEGORIES, CATEGORY_LABELS, PRIORITIES, PRIORITY_META, type Category, type Priority } from "@/lib/constants";

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  HARDWARE: <Monitor className="size-4" />,
  SOFTWARE: <AppWindow className="size-4" />,
  NETWORK: <Wifi className="size-4" />,
  ACCESS: <KeyRound className="size-4" />,
  HR: <Users className="size-4" />,
  FACILITIES: <Building2 className="size-4" />,
  OTHER: <CircleHelp className="size-4" />,
};

const MAX_FILES = 3;
const MAX_SIZE = 2 * 1024 * 1024;

export function NewComplaintForm({ nowMs }: { nowMs: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("HARDWARE");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const due = useMemo(() => {
    const date = new Date(nowMs + PRIORITY_META[priority].slaHours * 3600_000);
    return date.toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [priority, nowMs]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected);
    const oversize = incoming.find((file) => file.size > MAX_SIZE);
    if (oversize) {
      setError(`${oversize.name} is larger than 2 MB`);
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("description", description);
      form.set("category", category);
      form.set("priority", priority);
      for (const file of files) form.append("files", file);

      const data = await apiFetch<{ complaint: { id: string } }>("/api/complaints", {
        method: "POST",
        body: form,
      });
      router.push(`/complaints/${data.complaint.id}`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <div className="card p-5">
          <label className="field-label" htmlFor="title">Title</label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="One line that describes the problem"
            minLength={6}
            maxLength={140}
            required
          />
          <p className="mt-1.5 text-[11px] text-slate-400">{title.length}/140 characters</p>

          <label className="field-label mt-4" htmlFor="description">What happened?</label>
          <textarea
            id="description"
            className="textarea min-h-40 resize-y"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What you tried, what you expected, how long it has been happening, and who else is affected."
            minLength={20}
            maxLength={5000}
            required
          />
          <p className="mt-1.5 text-[11px] text-slate-400">{description.length} characters · minimum 20</p>
        </div>

        <div className="card p-5">
          <p className="field-label">Category</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                  category === item
                    ? "border-indigo-300 bg-indigo-50/70 text-indigo-800 shadow-sm"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-indigo-200 hover:bg-white",
                )}
              >
                <span className={cn("grid size-7 place-items-center rounded-lg", category === item ? "bg-white text-indigo-600" : "bg-slate-50 text-slate-500")}>
                  {CATEGORY_ICONS[item]}
                </span>
                {CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="field-label">Priority</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRIORITIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPriority(item)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition",
                  priority === item
                    ? "border-indigo-300 bg-indigo-50/70 shadow-sm"
                    : "border-slate-200 bg-white/70 hover:border-indigo-200 hover:bg-white",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className={cn("size-2 rounded-full", PRIORITY_META[item].bar)} />
                  {PRIORITY_META[item].label}
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-slate-400">
                    {PRIORITY_META[item].slaHours}h SLA
                  </span>
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {item === "CRITICAL" ? "Work stopped for you or several people" : item === "HIGH" ? "Blocking your work today" : item === "MEDIUM" ? "Annoying but you can work around it" : "Cosmetic or low impact"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <p className="mono-label">Before you submit</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">What happens next</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" /> A reference and an SLA clock are created instantly.</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" /> The least-loaded L1 agent is assigned and notified.</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" /> If it is untouched in 24h it escalates to L2 automatically.</li>
          </ul>

          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Target resolution</p>
            <p className="mt-1 text-sm font-semibold text-indigo-900">{due} IST</p>
            <p className="mt-0.5 text-[11px] text-indigo-600">Based on {PRIORITY_META[priority].slaHours}h {PRIORITY_META[priority].label.toLowerCase()} SLA</p>
          </div>
        </div>

        <div className="card p-5">
          <p className="field-label">Attachments</p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <CloudUpload className="size-5 text-indigo-500" />
            <span className="text-xs font-medium text-slate-700">Add screenshots or documents</span>
            <span className="text-[11px] text-slate-400">Up to {MAX_FILES} files · 2 MB each</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
            accept="image/*,.pdf,.txt,.csv,.zip,.docx,.xlsx"
          />

          {files.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                  <span className="truncate text-slate-700">{file.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-500"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {busy ? "Submitting…" : "Submit complaint"}
        </Button>
        <p className="text-center text-[11px] text-slate-400">You will be taken to the complaint timeline immediately.</p>
      </div>
    </form>
  );
}
