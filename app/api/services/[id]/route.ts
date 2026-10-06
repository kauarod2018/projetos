import { getDb } from "@/db";
import { services } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { serviceArchiveSchema, serviceUpdateSchema } from "@/lib/service-catalog";
import { ownedService, serviceFields, serviceId } from "@/lib/service-data";
import { jsonResponse } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

async function update(request: Request, context: Context, archive: boolean) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const id = serviceId((await context.params).id);
    if (!id) return jsonResponse({ error: "Serviço não encontrado." }, { status: 404 });
    const input = await readJson(request, 8_192);
    const body = archive ? serviceArchiveSchema.parse(input) : serviceUpdateSchema.parse(input);
    const result = await getDb().transaction(async (tx) => {
      const where = ownedService(id, user.dataOwnerId);
      const [existing] = await tx.select(serviceFields).from(services).where(where).for("update");
      if (!existing) return { status: 404, body: { error: "Serviço não encontrado." } };
      if (existing.version !== body.version) return { status: 409, body: { error: "Este serviço mudou em outra aba. Atualize a lista e revise os dados antes de salvar." } };
      const { version: _version, ...changes } = body;
      const patch = { ...changes, version: existing.version + 1, updatedAt: new Date().toISOString() };
      await tx.update(services).set(patch).where(where);
      return { status: 200, body: { service: { ...existing, ...patch } } };
    });
    return jsonResponse(result.body, { status: result.status });
  } catch (error) { return requestError(error, "Não foi possível atualizar o serviço."); }
}

export async function PUT(request: Request, context: Context) { return update(request, context, false); }
export async function PATCH(request: Request, context: Context) { return update(request, context, true); }
