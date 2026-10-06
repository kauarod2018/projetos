import { AuthPanel } from "@/components/auth-panel";
import { legalLinks } from "@/lib/legal-links";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <AuthPanel mode="register" freeMonth={process.env.SAAS_ENABLED === "true"} legal={legalLinks()} />;
}
