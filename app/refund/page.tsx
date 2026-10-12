import { LegalPage, legalMetadata } from '../../site/LegalPage.tsx';

export const metadata = legalMetadata('refund');

export default function Page() {
  return <LegalPage kind="refund" />;
}
