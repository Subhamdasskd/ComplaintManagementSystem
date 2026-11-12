import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "SLA policy" };

export default async function AdminSettingsPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard?denied=admin");

  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <div>
        <p className="mono-label">Policy</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">SLA and escalation</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          These thresholds drive the SLA countdown on every complaint and the watchdog that escalates unresolved
          work from L1 to L2 to L3.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SettingsForm settings={settings.raw} />

        <div className="space-y-4">
          <Card>
            <p className="mono-label">How the sweep works</p>
            <ol className="mt-3 space-y-3 text-xs text-slate-600">
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">1</span>
                A scheduled request hits <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">/api/cron/escalate</code> with the cron secret.
              </li>
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">2</span>
                Every open complaint at L1 or L2 is compared against its window.
              </li>
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">3</span>
                Overdue ones move up a level, get a new least-loaded assignee, and both teams are notified.
              </li>
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600">4</span>
                Complaints past their due date are flagged so the dashboard shows a breach.
              </li>
            </ol>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50/70 to-cyan-50/40">
            <p className="mono-label">Current snapshot</p>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Critical SLA</dt>
                <dd className="font-semibold text-slate-800">{settings.sla.CRITICAL}h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">High SLA</dt>
                <dd className="font-semibold text-slate-800">{settings.sla.HIGH}h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">L1 → L2</dt>
                <dd className="font-semibold text-slate-800">{settings.escalation.l1Hours}h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">L2 → L3</dt>
                <dd className="font-semibold text-slate-800">{settings.escalation.l2Hours}h</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
