import { EmployeeWorkspace } from "@/components/employee-workspace";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function MyWorkPage() {
  return <WorkspaceShell><EmployeeWorkspace worker /></WorkspaceShell>;
}
