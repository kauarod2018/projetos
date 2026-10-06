import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, serviceReports } from "@/db/schema";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { consumeRateLimit } from "@/lib/auth";
import { authorizedAppointment, decodeReport, reportScope, validJpeg } from "@/lib/service-report";
import { canEditReport, reportInput } from "@/lib/service-report-policy";
import { jsonResponse } from "@/lib/http";
import { serviceId } from "@/lib/service-data";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const scope = await reportScope(request); if (!scope) return unauthorizedResponse();
    const id = serviceId((await context.params).id); if (!id) return jsonResponse({ error: "Atendimento indisponível." }, { status: 404 });
    const result = await getDb().transaction(async tx => {
      const { appointment, role } = await authorizedAppointment(tx, scope, id);
      const [row] = await tx.select().from(serviceReports).where(and(eq(serviceReports.userId, scope.ownerId), eq(serviceReports.appointmentId, id)));
      return { report: decodeReport(row), editable: canEditReport(role, appointment.status), shareable: ["owner", "admin", "editor"].includes(role) };
    });
    return jsonResponse(result);
  } catch (error) { return requestError(error, "Não foi possível carregar o relatório."); }
}
export async function PUT(request: Request, context: Context) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const scope = await reportScope(request); if (!scope) return unauthorizedResponse();
    const id = serviceId((await context.params).id); if (!id) return jsonResponse({ error: "Atendimento indisponível." }, { status: 404 });
    if (!await consumeRateLimit(`reports:${scope.actorId}`, 60, 3600)) return jsonResponse({ error: "Aguarde antes de salvar novamente." }, { status: 429 });
    const body = reportInput.parse(await readJson(request, 1_500_000));
    if (!body.photos.every(photo => validJpeg(photo.data))) return jsonResponse({ error: "Envie fotos JPEG de até 250 KB cada." }, { status: 400 });
    const report = await getDb().transaction(async tx => {
      const { appointment, role } = await authorizedAppointment(tx, scope, id);
      if (!canEditReport(role, appointment.status)) throw new Error("SAAS_FORBIDDEN");
      const [existing] = await tx.select().from(serviceReports).where(and(eq(serviceReports.userId, scope.ownerId), eq(serviceReports.appointmentId, id))).for("update");
      if ((existing?.version ?? 0) !== body.version) throw new Error("REPORT_CONFLICT");
      const now = new Date().toISOString();
      const values = { checklist: JSON.stringify(body.checklist), photos: JSON.stringify(body.photos), summary: body.summary, nextVisitOn: body.nextVisitOn, acknowledgedBy: body.acknowledgedBy, acknowledgedAt: body.acknowledgedBy ? existing?.acknowledgedBy === body.acknowledgedBy ? existing.acknowledgedAt : now : null, version: body.version + 1, updatedAt: now,
        // Any edit revokes the old link: the owner must review and share again.
        publicTokenHash: null, publicExpiresAt: null };
      if (existing) await tx.update(serviceReports).set(values).where(and(eq(serviceReports.userId, scope.ownerId), eq(serviceReports.appointmentId, id)));
      else await tx.insert(serviceReports).values({ ...values, appointmentId: id, userId: scope.ownerId });
      await tx.insert(businessActivity).values({ userId: scope.ownerId, action: "service.report", entityType: "appointment", entityId: id, title: "Registrou a execução do serviço", details: JSON.stringify({ actorId: scope.actorId, version: values.version, photoCount: body.photos.length }), reversible: false });
      return decodeReport({ ...values });
    });
    return jsonResponse({ report });
  } catch (error) { return requestError(error, "Não foi possível salvar o relatório."); }
}
