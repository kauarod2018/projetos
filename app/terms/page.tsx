import { LegalPage, legalMetadata } from '../../site/LegalPage.tsx';

export const metadata = legalMetadata('terms');

export default function Page() {
  return <LegalPage kind="terms" />;
}
