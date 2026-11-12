"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { apiFetch, errorMessage } from "@/lib/client";
import { Button } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="name">
          Full name
        </label>
        <input id="name" className="input" value={form.name} onChange={update("name")} placeholder="Isha Kapoor" required />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Work email
        </label>
        <input id="email" className="input" type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="department">
            Department <span className="normal-case tracking-normal text-slate-400">(optional)</span>
          </label>
          <input id="department" className="input" value={form.department} onChange={update("department")} placeholder="Finance" />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        {busy ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-slate-500">
        New accounts start as requesters. An administrator can promote you to a support level.
      </p>
    </form>
  );
}
