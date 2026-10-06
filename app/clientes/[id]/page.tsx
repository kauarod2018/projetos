import { WorkspaceShell } from "@/components/workspace-shell";
import { CustomerHistoryView } from "@/components/customer-history";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceShell><CustomerHistoryView key={id} customerId={id} /></WorkspaceShell>;
}
