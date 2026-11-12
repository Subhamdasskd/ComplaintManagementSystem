import Link from "next/link";
import { ArrowRight, Eye, Github } from "lucide-react";
import { Logo } from "@/components/brand";

export const metadata = { title: "Demo" };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="md" />
            <span className="text-sm font-semibold tracking-tight text-slate-900">Complaint Desk</span>
          </Link>

          <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
            <Eye className="size-3" /> Read-only demo
          </span>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Link href="/demo" className="nav-link px-3 py-2 text-xs">Overview</Link>
            <Link href="/demo/complaints" className="nav-link px-3 py-2 text-xs">Complaints</Link>
            <Link href="/demo/analytics" className="nav-link px-3 py-2 text-xs">Analytics</Link>
          </nav>

          <Link href="/login" className="btn btn-primary ml-auto px-3 py-2 text-xs md:ml-2">
            Open the live app
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <div className="border-b border-white/60 bg-white/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 text-[11px] leading-relaxed text-slate-500 sm:px-6">
          <span className="font-semibold text-slate-700">Static snapshot</span>
          <span className="hidden text-slate-300 sm:inline">·</span>
          <span className="min-w-0 flex-1">
            deterministic demo data, no database and no sign-in. The shipped app runs the same screens against
            PostgreSQL with real mutations.
          </span>
          <a
            href="https://github.com/Subhamdasskd/ComplaintManagementSystem"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Github className="size-3" /> Source
          </a>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>

      <footer className="border-t border-white/60 bg-white/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-6 text-[11px] text-slate-500 sm:px-6">
          <span>Complaint Management System · demo data is fictional</span>
          <Link href="/" className="ml-auto font-medium text-slate-600 hover:text-slate-900">Landing</Link>
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
