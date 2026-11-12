import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { MarkAllRead } from "@/components/notifications/mark-all-read";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label">Inbox</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread === 0 ? "You are all caught up." : `${unread} unread of ${notifications.length}.`}
          </p>
        </div>
        {unread > 0 ? <MarkAllRead /> : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-5" />}
          title="Nothing here yet"
          description="Status changes, replies and escalations will show up in this inbox."
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <li key={item.id} className={item.read ? "" : "bg-indigo-50/30"}>
                <Link href={item.href || "/dashboard"} className="block px-5 py-3.5 transition hover:bg-white/70">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${item.read ? "bg-slate-100 text-slate-400" : "bg-indigo-100 text-indigo-600"}`}>
                      <Bell className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                        {!item.read ? <span className="size-1.5 shrink-0 rounded-full bg-indigo-500" /> : null}
                        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-slate-400" title={formatDateTime(item.createdAt)}>
                          {relativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{item.body}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
