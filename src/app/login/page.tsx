import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLogin } from "@/components/auth/demo-login";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="aurora -left-20 top-0 size-96 bg-indigo-300/40" />
      <div className="aurora -right-16 bottom-0 size-80 bg-cyan-200/50" />

      <div className="card relative grid w-full max-w-5xl overflow-hidden md:grid-cols-2">
        {/* brand panel */}
        <div className="relative hidden flex-col justify-between border-r border-white/70 bg-gradient-to-br from-indigo-50/80 via-white/40 to-cyan-50/60 p-8 md:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="brand-mark grid size-9 place-items-center rounded-xl text-[11px] font-bold text-white">CMS</span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Complaint Desk</span>
          </Link>

          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900">
              One queue.
              <br />
              Five roles.
              <br />
              <span className="gradient-text">Zero lost complaints.</span>
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Sign in to raise a complaint, work the queue at L1, escalate to L2 and L3, or administer the
              whole desk.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" /> Role-aware access on every route
              </li>
              <li className="flex items-center gap-2">
                <KeyRound className="size-4 text-indigo-500" /> JWT session in an httpOnly cookie
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-4 text-violet-500" /> Seeded demo data, ready to explore
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">Built with Next.js, Prisma and PostgreSQL.</p>
        </div>

        {/* form panel */}
        <div className="p-7 sm:p-9">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mono-label">Welcome back</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Sign in</h2>
            </div>
            <Link href="/" className="btn btn-ghost px-2 py-1.5 text-xs">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </div>

          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100/60" />}>
            <LoginForm />
          </Suspense>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="mono-label">or jump straight in</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <DemoLogin variant="compact" />

          <p className="mt-6 text-center text-xs text-slate-500">
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one <ArrowRight className="inline size-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
