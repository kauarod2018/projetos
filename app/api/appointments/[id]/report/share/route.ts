import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { serviceReports } from "@/db/schema";
import { forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { z } from "zod";
import { createPublicToken } from "@/lib/auth";
import { authorizedAppointment, reportScope } from "@/lib/service-report";
import { canShareReport } from "@/lib/service-report-policy";
import { inviteDigest } from "@/lib/workspace";
import { serviceId } from "@/lib/service-data";
import { jsonResponse } from "@/lib/http";
import { appOrigin } from "@/lib/deployment";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) { return share(request, context, false); }
export async function DELETE(request: Request, context: Context) { return share(request, context, true); }
async function share(request: Request, context: Context, revoke: boolean) {
  const forbidden = forbiddenMutationResponse(request); if (forbidden) return forbidden;
  try {
    const scope = await reportScope(request); if (!scope) return unauthorizedResponse();
    const id = serviceId((await context.params).id); if (!id) return jsonResponse({ error: "Atendimento indisponível." }, { status: 404 });
    const version = revoke ? null : z.object({ version: z.number().int().positive() }).strict().parse(await readJson(request, 512)).version;
    const origin = revoke ? null : appOrigin(request);
    const token = createPublicToken(), expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    await getDb().transaction(async tx => {
      const { appointment, role } = await authorizedAppointment(tx, scope, id);
      if (!canShareReport(role) || appointment.status === "Cancelado") throw new Error("SAAS_FORBIDDEN");
      const [row] = await tx.select().from(serviceReports).where(and(eq(serviceReports.userId, scope.ownerId), eq(serviceReports.appointmentId, id))).for("update");
      if (!row) throw new Error("REPORT_MISSING");
      if (!revoke && row.version !== version) throw new Error("REPORT_CONFLICT");
      await tx.update(serviceReports).set({ publicTokenHash: revoke ? null : await inviteDigest(token), publicExpiresAt: revoke ? null : expiresAt }).where(and(eq(serviceReports.userId, scope.ownerId), eq(serviceReports.appointmentId, id)));
    });
    return jsonResponse(revoke ? { ok: true } : { url: `${origin}/atendimento#${token}`, expiresAt });
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_MISSING") return jsonResponse({ error: "Salve o relatório antes de compartilhar." }, { status: 409 });
    return requestError(error, "Não foi possível compartilhar o relatório.");
  }
}
