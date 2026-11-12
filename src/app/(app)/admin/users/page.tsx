import { redirect } from "next/navigation";
import { UsersManager } from "@/components/admin/users-manager";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "People" };

export default async function AdminUsersPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard?denied=admin");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      active: true,
      createdAt: true,
      _count: { select: { assignedComplaints: true, raisedComplaints: true } },
    },
  });

  return (
    <UsersManager
      users={users.map((person) => ({
        ...person,
        createdAt: person.createdAt.toISOString(),
      }))}
      currentUserId={user.id}
    />
  );
}
