import { and, asc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, customers, workspaceEmployees } from "@/db/schema";
import { authenticatedUser, requestError, unauthorizedResponse } from "@/lib/api-security";
import { appointmentRangeSchema, moveDay } from "@/lib/appointments";
import { appointmentFields, writeAppointment } from "@/lib/appointment-api";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const query = new URL(request.url).searchParams;
    const { from, to } = appointmentRangeSchema.parse({ from: query.get("from"), to: query.get("to") });
    const rows = await getDb().select({ ...appointmentFields, customerPhone: customers.phone, employeeName: workspaceEmployees.name }).from(appointments)
      .leftJoin(customers, and(eq(appointments.customerId, customers.id), eq(customers.userId, user.dataOwnerId)))
      .leftJoin(workspaceEmployees, and(eq(appointments.employeeId, workspaceEmployees.id), eq(workspaceEmployees.workspaceId, user.workspace?.id ?? 0)))
      .where(and(eq(appointments.userId, user.dataOwnerId), lt(appointments.startsAt, moveDay(to, 1) + "T00:00"), gt(appointments.endsAt, from + "T00:00")))
      .orderBy(asc(appointments.startsAt), asc(appointments.id));
    return jsonResponse({ appointments: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar a agenda."); }
}
export async function POST(request: Request) { return writeAppointment(request, "create"); }
