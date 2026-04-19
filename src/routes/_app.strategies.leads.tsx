import { createFileRoute } from '@tanstack/react-router';
import { LeadsPage } from '@/components/pages/LeadsPage';

export const Route = createFileRoute('/_app/strategies/leads')({
  component: () => <LeadsPage businessUnit="strategies" />,
});
