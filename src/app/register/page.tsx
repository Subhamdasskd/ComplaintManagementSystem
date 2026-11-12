import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="aurora -left-20 top-10 size-96 bg-violet-300/40" />
      <div className="aurora -right-16 bottom-0 size-80 bg-cyan-200/50" />

      <div className="card relative grid w-full max-w-4xl overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden flex-col justify-between border-r border-white/70 bg-gradient-to-br from-violet-50/70 via-white/40 to-indigo-50/60 p-8 md:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="brand-mark grid size-9 place-items-center rounded-xl text-[11px] font-bold text-white">CMS</span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Complaint Desk</span>
          </Link>

          <div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900">
              Raise it once.
              <br />
              <span className="gradient-text">Track it properly.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Requesters get a reference number, an SLA clock and a live timeline. No more email threads.
            </p>
            <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
              {[
                "Automatic assignment to the right support level",
                "Status changes you can see, hour by hour",
                "Attachments and replies in one place",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">Accounts start as requesters.</p>
        </div>

        <div className="p-7 sm:p-9">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mono-label">Get started</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Create your account</h2>
            </div>
            <Link href="/" className="btn btn-ghost px-2 py-1.5 text-xs">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
