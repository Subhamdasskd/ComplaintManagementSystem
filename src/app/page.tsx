import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Clock,
  FileText,
  Github,
  Layers,
  Lock,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Workflow,
} from "lucide-react";
import { DemoLogin } from "@/components/auth/demo-login";
import { PriorityBadge, StatusBadge } from "@/components/ui";

const FEATURES = [
  {
    icon: <Workflow className="size-5" />,
    title: "Automatic assignment",
    body: "Every new complaint is routed to the L1 agent with the smallest open queue, so nothing sits unowned.",
  },
  {
    icon: <Timer className="size-5" />,
    title: "SLA clocks per priority",
    body: "Critical 4h, high 24h, medium 72h, low 120h. The clock is visible on every card and breaches are flagged.",
  },
  {
    icon: <Layers className="size-5" />,
    title: "L1 → L2 → L3 escalation",
    body: "A watchdog sweeps unresolved complaints past their level window and moves them up with an audit note.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Role-based access",
    body: "Requesters, three support levels and admins each see exactly the complaints and actions they own.",
  },
  {
    icon: <Paperclip className="size-5" />,
    title: "Attachments and remarks",
    body: "Evidence files travel with the complaint. Public replies and staff-only internal notes stay separate.",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Live analytics",
    body: "Volume trends, resolution time by priority, category mix, SLA compliance and agent workload — all live.",
  },
];

const STEPS = [
  { title: "Raise", body: "Pick a category and priority. The form shows the SLA your complaint will get before you submit." },
  { title: "Own", body: "The least-loaded L1 agent is assigned instantly and notified in-app." },
  { title: "Work", body: "Status moves Open → In progress → Hold, with every change on the audit trail." },
  { title: "Escalate", body: "Anything untouched past its window climbs to L2, then L3, automatically." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* soft aurora accents */}
      <div className="aurora -left-24 top-10 size-[26rem] bg-indigo-300/50" />
      <div className="aurora right-0 top-24 size-[22rem] bg-cyan-200/60" />
      <div className="aurora bottom-40 left-1/3 size-[24rem] bg-violet-200/50" />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="brand-mark grid size-9 place-items-center rounded-xl text-[11px] font-bold text-white">CMS</span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Complaint Desk</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#escalation" className="hover:text-slate-900">Escalation</a>
            <a href="#demo" className="hover:text-slate-900">Live demo</a>
          </nav>
          <Link href="/login" className="btn btn-outline ml-auto md:ml-4">
            Sign in
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
        <div className="animate-fade-up">
          <span className="chip border-indigo-100 bg-white/80 text-indigo-700 ring-1 ring-indigo-100">
            <Sparkles className="size-3.5" />
            Internship project · PERN-style grievance desk
          </span>

          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
            Complaints that <span className="gradient-text">move</span>, escalate,
            <br className="hidden sm:block" /> and actually get closed.
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-600">
            A role-based complaint management system for real support hierarchies: automatic assignment,
            SLA clocks per priority, a watchdog that escalates L1 → L2 → L3, and analytics that show
            where the queue actually hurts.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#demo" className="btn btn-primary">
              Try it in one click
              <ArrowRight className="size-4" />
            </a>
            <a
              href="https://github.com/Subhamdasskd/ComplaintManagementSystem"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              <Github className="size-4" />
              View the repository
            </a>
          </div>

          <dl className="mt-9 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Complaints", value: "30" },
              { label: "Roles", value: "5" },
              { label: "Support levels", value: "3" },
              { label: "SLA tiers", value: "4" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="mono-label">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* hero visual */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="card animate-float relative z-10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mono-label">CMS-2026-0007</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Mailbox quota exceeded — cannot receive mail</p>
              </div>
              <StatusBadge status="WIP" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <PriorityBadge priority="HIGH" />
              <span className="chip bg-violet-50 text-violet-700 ring-1 ring-violet-200">L2 · Engineering</span>
              <span className="chip bg-white text-slate-600 ring-1 ring-slate-200">Software</span>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50/80 p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>SLA window · 24h</span>
                <span className="font-semibold text-slate-700">18h left</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
              </div>
            </div>

            <ul className="mt-5 space-y-3">
              {[
                { icon: <BadgeCheck className="size-3.5" />, text: "Assigned to Sneha Iyer", meta: "auto" },
                { icon: <ArrowUpRight className="size-3.5" />, text: "Escalated L1 → L2", meta: "watchdog" },
                { icon: <FileText className="size-3.5" />, text: "2 attachments, 3 remarks", meta: "trail" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2.5 text-xs text-slate-600">
                  <span className="grid size-6 place-items-center rounded-lg bg-white text-indigo-500 ring-1 ring-slate-200">
                    {item.icon}
                  </span>
                  {item.text}
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-slate-400">{item.meta}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="card p-3.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Watchdog live
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">2</p>
              <p className="text-[11px] text-slate-500">complaints past SLA</p>
            </div>

            <div className="card p-3.5">
              <Clock className="size-4 text-indigo-500" />
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">4.6h</p>
              <p className="text-[11px] text-slate-500">avg first response</p>
            </div>
          </div>
        </div>
      </section>

      {/* demo logins */}
      <section id="demo" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="card overflow-hidden p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono-label">Live demo</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Walk in as any role</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                The dataset is seeded with 30 complaints, 9 people and a month of history. Pick a role and the
                app opens exactly as that person sees it.
              </p>
            </div>
            <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <Lock className="size-3.5" /> No password needed
            </span>
          </div>
          <div className="mt-6">
            <DemoLogin />
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="mono-label">What it does</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            The parts a spreadsheet cannot do
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Every feature below works in the deployed demo — nothing here is a mock-up.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card card-hover p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 text-indigo-600 ring-1 ring-indigo-100">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* escalation ladder */}
      <section id="escalation" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="card relative overflow-hidden p-6 sm:p-9">
          <div className="aurora -right-10 -top-16 size-64 bg-cyan-200/50" />
          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mono-label">Escalation</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Unresolved work climbs the ladder by itself
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Each level gets a window. When it closes, the complaint moves up, the new team is notified,
                and the audit trail records who — or what — moved it.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Activity className="size-4 text-indigo-500" /> Cron sweep hits <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">/api/cron/escalate</code>
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="size-4 text-indigo-500" /> The new level and the requester are notified
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-4 text-indigo-500" /> Reassignment follows the same least-loaded rule
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              {[
                { level: "L1", window: "24h window", title: "Service desk", tone: "from-sky-50 to-white", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
                { level: "L2", window: "48h window", title: "Engineering", tone: "from-violet-50 to-white", chip: "bg-violet-50 text-violet-700 ring-violet-200" },
                { level: "L3", window: "No auto-escalation", title: "Specialist", tone: "from-fuchsia-50 to-white", chip: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200" },
              ].map((tier, index) => (
                <div key={tier.level} className={`rounded-2xl border border-white/80 bg-gradient-to-r ${tier.tone} p-4`}>
                  <div className="flex items-center gap-3">
                    <span className={`chip ring-1 ${tier.chip}`}>{tier.level}</span>
                    <p className="text-sm font-semibold text-slate-900">{tier.title}</p>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-slate-400">{tier.window}</span>
                  </div>
                  {index < 2 ? (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <ArrowUpRight className="size-3.5 text-indigo-500" />
                      Auto-escalates to {index === 0 ? "L2" : "L3"} when the window closes
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-slate-500">Terminal level — needs a human decision to close or reject</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <p className="mono-label">Lifecycle</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">From raise to close</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.title} className="card p-5">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/70 bg-white/50 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="brand-mark grid size-9 place-items-center rounded-xl text-[11px] font-bold text-white">CMS</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Complaint Management System</p>
              <p className="text-[11px] text-slate-500">Built by Subham Das · IILM University · Tata Technologies internship</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
            <Link href="/register" className="hover:text-slate-900">Create account</Link>
            <a href="#escalation" className="hover:text-slate-900">Escalation</a>
            <span className="mono-label">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
