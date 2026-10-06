import { ServiceCatalog } from "@/components/service-catalog";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function ServicesPage() {
  return <WorkspaceShell><ServiceCatalog /></WorkspaceShell>;
}
