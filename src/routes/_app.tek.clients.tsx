import { createFileRoute } from '@tanstack/react-router';
import { ClientsPage } from '@/components/pages/ClientsPage';

export const Route = createFileRoute('/_app/tek/clients')({
  component: () => <ClientsPage businessUnit="tek" />,
});
