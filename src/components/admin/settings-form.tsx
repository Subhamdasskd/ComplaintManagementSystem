"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { apiFetch, errorMessage } from "@/lib/client";
import { PRIORITIES, PRIORITY_META } from "@/lib/constants";

const SLA_FIELDS = [
  { key: "sla_critical_hours", label: "Critical SLA", hint: "Work stopped for the requester" },
  { key: "sla_high_hours", label: "High SLA", hint: "Blocking the requester's work" },
  { key: "sla_medium_hours", label: "Medium SLA", hint: "Workaround exists" },
  { key: "sla_low_hours", label: "Low SLA", hint: "Cosmetic or minor" },
] as const;

const ESCALATION_FIELDS = [
  { key: "escalation_l1_hours", label: "L1 → L2 window", hint: "Hours an L1 complaint may sit unresolved" },
  { key: "escalation_l2_hours", label: "L2 → L3 window", hint: "Hours an L2 complaint may sit unresolved" },
] as const;

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    sla_critical_hours: settings.sla_critical_hours ?? "4",
    sla_high_hours: settings.sla_high_hours ?? "24",
    sla_medium_hours: settings.sla_medium_hours ?? "72",
    sla_low_hours: settings.sla_low_hours ?? "120",
    escalation_l1_hours: settings.escalation_l1_hours ?? "24",
    escalation_l2_hours: settings.escalation_l2_hours ?? "48",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]))),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setValues({
      sla_critical_hours: "4",
      sla_high_hours: "24",
      sla_medium_hours: "72",
      sla_low_hours: "120",
      escalation_l1_hours: "24",
      escalation_l2_hours: "48",
    });
    setSaved(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mono-label">Service levels</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">SLA windows by priority</h2>
            <p className="mt-1 text-xs text-slate-500">
              Applied to new complaints immediately. Existing complaints keep the deadline they were created with.
            </p>
          </div>
          <span className="chip bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{PRIORITIES.length} tiers</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SLA_FIELDS.map((field) => (
            <div key={field.key} className="rounded-2xl border border-slate-200 bg-white/60 p-3.5">
              <label className="field-label" htmlFor={field.key}>{field.label}</label>
              <div className="flex items-center gap-2">
                <input
                  id={field.key}
                  type="number"
                  min={1}
                  max={720}
                  className="input w-24"
                  value={values[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                />
                <span className="text-xs text-slate-500">hours</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{field.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mono-label">Watchdog</p>
        <h2 className="mt-1 text-base font-semibold text-slate-900">Escalation windows</h2>
        <p className="mt-1 text-xs text-slate-500">
          When a complaint sits at a level past its window, the cron sweep moves it up one level and notifies the new team.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ESCALATION_FIELDS.map((field) => (
            <div key={field.key} className="rounded-2xl border border-slate-200 bg-white/60 p-3.5">
              <label className="field-label" htmlFor={field.key}>{field.label}</label>
              <div className="flex items-center gap-2">
                <input
                  id={field.key}
                  type="number"
                  min={1}
                  max={720}
                  className="input w-24"
                  value={values[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                />
                <span className="text-xs text-slate-500">hours</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{field.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 text-[11px] text-amber-800">
          L3 is the top of the ladder — complaints at L3 never escalate automatically. The sweep runs from{" "}
          <code className="rounded bg-white/70 px-1 py-0.5 font-mono">/api/cron/escalate</code>.
        </div>
      </Card>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save policy
        </Button>
        <Button type="button" variant="outline" onClick={reset} disabled={busy}>
          <RotateCcw className="size-4" /> Reset to defaults
        </Button>
        {saved ? <span className="text-xs font-medium text-emerald-600">Policy saved.</span> : null}
      </div>

      <p className="text-[11px] text-slate-400">
        Defaults: critical {PRIORITY_META.CRITICAL.slaHours}h · high {PRIORITY_META.HIGH.slaHours}h · medium{" "}
        {PRIORITY_META.MEDIUM.slaHours}h · low {PRIORITY_META.LOW.slaHours}h.
      </p>
    </form>
  );
}
