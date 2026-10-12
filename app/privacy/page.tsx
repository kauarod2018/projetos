import { LegalPage, legalMetadata } from '../../site/LegalPage.tsx';

export const metadata = legalMetadata('privacy');

export default function Page() {
  return <LegalPage kind="privacy" />;
}
