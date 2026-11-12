import type { Level } from "./constants";
import { ACTIVE_STATUSES } from "./constants";
import { prisma } from "./db";

export type AgentLoad = { id: string; name: string; email: string; role: string; open: number };

/** Open workload per active agent at a support level. */
export async function agentLoad(level: Level): Promise<AgentLoad[]> {
  const agents = await prisma.user.findMany({
    where: { role: level, active: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
  if (agents.length === 0) return [];

  const counts = await prisma.complaint.groupBy({
    by: ["assigneeId"],
    where: {
      assigneeId: { in: agents.map((a) => a.id) },
      status: { in: ACTIVE_STATUSES },
    },
    _count: { _all: true },
  });

  const byId = new Map(counts.map((c) => [c.assigneeId, c._count._all]));
  return agents.map((a) => ({ ...a, open: byId.get(a.id) ?? 0 }));
}

/**
 * Least-loaded active agent for a level. Returns null when the level has no staff,
 * in which case the complaint stays unassigned for an admin to route.
 */
export async function pickAssignee(level: Level, excludeId?: string): Promise<string | null> {
  const loads = (await agentLoad(level)).filter((a) => a.id !== excludeId);
  if (loads.length === 0) return null;
  loads.sort((a, b) => a.open - b.open || a.name.localeCompare(b.name));
  return loads[0].id;
}
