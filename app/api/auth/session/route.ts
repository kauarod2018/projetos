import { jsonResponse } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { resolveWorkspace, saasEnabled } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return jsonResponse({ user: null }, { status: 401 });
    if (!saasEnabled()) return jsonResponse({ user });
    try {
      const workspace = await resolveWorkspace(request, user);
      return jsonResponse({ user, workspace: workspace.summary });
    } catch {
      return jsonResponse({ user, workspaceError: "Empresa indisponível. Escolha outra empresa em Configurações." });
    }
  } catch {
    return jsonResponse({ user: null }, { status: 401 });
  }
}
