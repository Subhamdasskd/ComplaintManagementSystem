import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        department: user.department,
      }}
    >
      {children}
    </AppShell>
  );
}
