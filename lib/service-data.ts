import { and, eq } from "drizzle-orm";
import { services } from "@/db/schema";

export const serviceFields = {
  id: services.id, name: services.name, description: services.description,
  priceCents: services.priceCents, durationMinutes: services.durationMinutes,
  archived: services.archived, version: services.version,
  createdAt: services.createdAt, updatedAt: services.updatedAt,
};

export function ownedService(id: number, userId: number) {
  return and(eq(services.id, id), eq(services.userId, userId));
}

export function serviceId(value: string) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isInteger(id) && id <= 4_294_967_295 ? id : null;
}
