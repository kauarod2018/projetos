import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { customerSchema } from "@/lib/validation";
import { jsonResponse } from "@/lib/http";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { id } = await context.params;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
    const body = customerSchema.parse(await readJson(request, 16384));
    const customer = await getDb().transaction(async (tx) => {
      const where = and(eq(customers.id, Number(id)), eq(customers.userId, user.dataOwnerId));
      const [existing] = await tx.select().from(customers).where(where).for("update");
      if (!existing) return null;
      await tx.update(customers).set(body).where(where);
      const { userId: _owner, ...result } = { ...existing, ...body };
      return result;
    });
    return customer ? jsonResponse({ customer }) : jsonResponse({ error: "Cliente não encontrado." }, { status: 404 });
  } catch (error) { return requestError(error, "Não foi possível salvar o cliente."); }
}
