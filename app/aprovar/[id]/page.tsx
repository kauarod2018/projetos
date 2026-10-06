import { ApprovalPage } from "@/components/approval-page";

export default async function PublicApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApprovalPage token={id} />;
}
