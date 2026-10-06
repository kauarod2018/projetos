import { writeAppointment } from "@/lib/appointment-api";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, context: Context) { return writeAppointment(request, "edit", (await context.params).id); }
export async function PATCH(request: Request, context: Context) { return writeAppointment(request, "status", (await context.params).id); }
