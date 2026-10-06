import { EmployeeWorkspace } from "@/components/employee-workspace";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function EmployeesPage() {
  return <WorkspaceShell><EmployeeWorkspace /></WorkspaceShell>;
}
