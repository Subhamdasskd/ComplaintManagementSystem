import type { Level } from "./constants";
import { prisma } from "./db";

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  href?: string;
};

export async function notify(input: NotificationInput | NotificationInput[]): Promise<void> {
  const items = Array.isArray(input) ? input : [input];
  if (items.length === 0) return;
  await prisma.notification.createMany({ data: items });
}

/** Notifies every active agent of a level plus all administrators. */
export async function notifyLevel(level: Level, payload: Omit<NotificationInput, "userId">): Promise<void> {
  const team = await prisma.user.findMany({
    where: { active: true, role: { in: [level, "ADMIN"] } },
    select: { id: true },
  });
  await notify(team.map((u) => ({ ...payload, userId: u.id })));
}

export async function notifyUser(userId: string | null | undefined, payload: Omit<NotificationInput, "userId">): Promise<void> {
  if (!userId) return;
  await notify({ ...payload, userId });
}
