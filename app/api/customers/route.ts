import { jsonResponse } from "@/lib/http";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businessActivity, customers, users } from "@/db/schema";
import { databaseError } from "@/lib/quote-data";
import { authenticatedUser, forbiddenMutationResponse, readJson, requestError, unauthorizedResponse } from "@/lib/api-security";
import { customerCreateSchema } from "@/lib/validation";

const fields = {
  id: customers.id, name: customers.name, phone: customers.phone, email: customers.email,
  address: customers.address, notes: customers.notes, createdAt: customers.createdAt,
};

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const rows = await getDb().select(fields).from(customers)
      .where(eq(customers.userId, user.dataOwnerId)).orderBy(asc(customers.name));
    return jsonResponse({ customers: rows });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}

export async function POST(request: Request) {
  const forbidden = forbiddenMutationResponse(request);
  if (forbidden) return forbidden;
  try {
    const user = await authenticatedUser(request);
    if (!user) return unauthorizedResponse();
    const { requestKey, ...body } = customerCreateSchema.parse(await readJson(request, 16_384));
    if (requestKey) {
      const result = await getDb().transaction(async tx => {
        // Serialize retries for this owner even before the first customer exists.
        await tx.select({ id: users.id }).from(users).where(eq(users.id, user.dataOwnerId)).for("update");
        const [existing] = await tx.select(fields).from(customers)
          .where(and(eq(customers.userId, user.dataOwnerId), eq(customers.requestKey, requestKey))).for("update");
        if (existing) {
          const matches = (Object.keys(body) as (keyof typeof body)[]).every(key => existing[key] === body[key]);
          return matches ? { customer: existing } : { error: "Esta solicitação já foi salva com outros dados. Confira a lista de clientes antes de cadastrar novamente." };
        }
        const [created] = await tx.insert(customers).values({ ...body, requestKey, userId: user.dataOwnerId }).$returningId();
        const [customer] = await tx.select(fields).from(customers)
          .where(and(eq(customers.userId, user.dataOwnerId), eq(customers.id, created.id))).for("update");
        await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "customer.created", entityType: "customer", entityId: customer.id, title: `Cadastrou o cliente ${customer.name}`, reversible: false });
        return { customer };
      });
      return jsonResponse(result, { status: "error" in result ? 409 : 201 });
    }
    const customer = await getDb().transaction(async tx => {
      const [created] = await tx.insert(customers).values({ ...body, userId: user.dataOwnerId }).$returningId();
      const [saved] = await tx.select(fields).from(customers).where(and(eq(customers.userId, user.dataOwnerId), eq(customers.id, created.id))).for("update");
      await tx.insert(businessActivity).values({ userId: user.dataOwnerId, action: "customer.created", entityType: "customer", entityId: saved.id, title: `Cadastrou o cliente ${saved.name}`, reversible: false });
      return saved;
    });
    return jsonResponse({ customer }, { status: 201 });
  } catch (error) {
    return requestError(error, databaseError(error));
  }
}
