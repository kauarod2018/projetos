import { requestAccountEmail } from "@/lib/account-email-request";
export async function POST(request: Request) { return requestAccountEmail(request, "reset"); }
