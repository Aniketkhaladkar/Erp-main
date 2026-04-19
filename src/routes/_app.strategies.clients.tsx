import { createFileRoute } from '@tanstack/react-router';
import { ClientsPage } from '@/components/pages/ClientsPage';

export const Route = createFileRoute('/_app/strategies/clients')({
  component: () => <ClientsPage businessUnit="strategies" />,
});
