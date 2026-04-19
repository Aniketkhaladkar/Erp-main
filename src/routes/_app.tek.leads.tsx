import { createFileRoute } from '@tanstack/react-router';
import { LeadsPage } from '@/components/pages/LeadsPage';

export const Route = createFileRoute('/_app/tek/leads')({
  component: () => <LeadsPage businessUnit="tek" />,
});
