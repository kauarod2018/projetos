import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { assistantUsage, users } from "@/db/schema";
import { brasiliaDay } from "@/lib/appointments";

export async function reserveAssistantUsage(ownerId: number, units = 1) {
  if (!Number.isInteger(units) || units < 1 || units > 40) throw new Error("INVALID_USAGE");
  const usageDay = brasiliaDay();
  return getDb().transaction(async tx => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, ownerId)).for("update");
    const where = and(eq(assistantUsage.userId, ownerId), eq(assistantUsage.usageDay, usageDay));
    const [usage] = await tx.select({ requestCount: assistantUsage.requestCount }).from(assistantUsage).where(where).for("update");
    const requestCount = (usage?.requestCount ?? 0) + units;
    if (requestCount > 40) return false;
    if (usage) await tx.update(assistantUsage).set({ requestCount, updatedAt: new Date().toISOString() }).where(where);
    else await tx.insert(assistantUsage).values({ userId: ownerId, usageDay, requestCount, updatedAt: new Date().toISOString() });
    return true;
  });
}
