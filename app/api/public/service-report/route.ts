import { and, eq, gt, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments, serviceReports, users, workspaces, workspaceSubscriptions } from "@/db/schema";
import { decodeReport } from "@/lib/service-report";
import { publicReportProjection } from "@/lib/service-report-policy";
import { inviteDigest, saasEnabled } from "@/lib/workspace";
import { entitlement } from "@/lib/saas-policy";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  const hidden = () => jsonResponse({ error: "Link indisponível ou expirado. Solicite um novo relatório." }, { status: 404 });
  try {
    const token = request.headers.get("x-report-token") ?? "";
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return hidden();
    const [row] = await getDb().select({ report: serviceReports, title: appointments.title, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status, provider: users.name }).from(serviceReports)
      .innerJoin(appointments, and(eq(appointments.id, serviceReports.appointmentId), eq(appointments.userId, serviceReports.userId)))
      .innerJoin(users, eq(users.id, serviceReports.userId))
      .where(and(eq(serviceReports.publicTokenHash, await inviteDigest(token)), gt(serviceReports.publicExpiresAt, new Date().toISOString()), ne(appointments.status, "Cancelado"))).limit(1);
    if (!row) return hidden();
    let provider = row.provider;
    if (saasEnabled()) {
      const [company] = await getDb().select().from(workspaces).where(eq(workspaces.ownerUserId, row.report.userId));
      const [subscription] = company ? await getDb().select().from(workspaceSubscriptions).where(eq(workspaceSubscriptions.workspaceId, company.id)) : [];
      if (!entitlement(subscription).allowed) return hidden();
      if (company) provider = company.name;
    }
    return jsonResponse({ report: { title: row.title, startsAt: row.startsAt, endsAt: row.endsAt, status: row.status, provider, ...publicReportProjection(decodeReport(row.report)) } }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch { return hidden(); }
}
