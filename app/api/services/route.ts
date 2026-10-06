import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { serviceCreateSchema } from "@/lib/service-catalog";
import { serviceFields } from "@/lib/service-data";
import { jsonResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const includeArchived = new URL(request.url).searchParams.get("incluirArquivados") === "1";
    const rows = await getDb().select(serviceFields).from(services)
      .where(and(eq(services.userId, user.dataOwnerId), includeArchived ? undefined : eq(services.archived, false)))
      .orderBy(asc(services.archived), asc(services.name), asc(services.id));
    return jsonResponse({ services: rows });
  } catch (error) { return requestError(error, "Não foi possível carregar os serviços."); }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const body = serviceCreateSchema.parse(await readJson(request, 8_192));
    const result = await getDb().transaction(async (tx) => {
      // The same request key can be retried without creating another service.
      await tx.insert(services).values({ ...body, userId: user.dataOwnerId })
        .onDuplicateKeyUpdate({ set: { requestKey: body.requestKey } });
      const [service] = await tx.select(serviceFields).from(services)
        .where(and(eq(services.userId, user.dataOwnerId), eq(services.requestKey, body.requestKey))).for("update");
      if (!service) throw new Error("SERVICE_CREATE_FAILED");
      const matches = service.name === body.name && service.description === body.description
        && service.priceCents === body.priceCents && service.durationMinutes === body.durationMinutes && !service.archived;
      return matches ? service : null;
    });
    if (!result) return jsonResponse({ error: "Este cadastro já foi recebido. Atualize a lista antes de tentar novamente." }, { status: 409 });
    return jsonResponse({ service: result }, { status: 201 });
  } catch (error) { return requestError(error, "Não foi possível salvar o serviço."); }
}
