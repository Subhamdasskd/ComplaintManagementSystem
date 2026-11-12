"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/client";
import { cn } from "@/lib/format";
import { ROLE_META, type Role } from "@/lib/constants";

const DEMO_ROLES: { role: Role; email: string; name: string }[] = [
  { role: "USER", email: "user@demo.test", name: "Isha Kapoor" },
  { role: "L1", email: "l1@demo.test", name: "Priya Nair" },
  { role: "L2", email: "l2@demo.test", name: "Sneha Iyer" },
  { role: "L3", email: "l3@demo.test", name: "Ananya Bose" },
  { role: "ADMIN", email: "admin@demo.test", name: "Aarav Mehta" },
];

export function DemoLogin({ variant = "grid" }: { variant?: "grid" | "compact" }) {
  const router = useRouter();
  const [busyRole, setBusyRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(role: Role) {
    setBusyRole(role);
    setError(null);
    try {
      await apiFetch("/api/auth/demo", { method: "POST", body: JSON.stringify({ role }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusyRole(null);
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {DEMO_ROLES.map((item) => (
          <button
            key={item.role}
            onClick={() => signIn(item.role)}
            disabled={busyRole !== null}
            className="chip border-slate-200 bg-white/80 text-slate-600 ring-1 ring-slate-200/70 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-60"
          >
            {busyRole === item.role ? <Loader2 className="size-3 animate-spin" /> : null}
            {ROLE_META[item.role].label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {DEMO_ROLES.map((item) => (
          <button
            key={item.role}
            onClick={() => signIn(item.role)}
            disabled={busyRole !== null}
            className={cn(
              "group flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-left backdrop-blur transition",
              "hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10",
              "disabled:cursor-not-allowed disabled:opacity-60",
              item.role === "ADMIN" && "sm:col-span-2",
            )}
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {ROLE_META[item.role].label}
                <span className="chip bg-indigo-50 text-[10px] text-indigo-600 ring-1 ring-indigo-100">{item.role}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {item.name} · {item.email}
              </span>
            </span>
            {busyRole === item.role ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-indigo-500" />
            ) : (
              <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            )}
          </button>
        ))}
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : (
        <p className="text-xs text-slate-500">One click, no password. Every demo account shares the same seeded dataset.</p>
      )}
    </div>
  );
}
