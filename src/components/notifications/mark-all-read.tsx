"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/client";

export function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    await apiFetch("/api/notifications", { method: "POST", body: JSON.stringify({}) }).catch(() => null);
    router.refresh();
    setBusy(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={mark} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
      Mark all read
    </Button>
  );
}
