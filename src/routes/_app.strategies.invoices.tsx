import { createFileRoute } from '@tanstack/react-router';
import { InvoicesPage } from '@/components/pages/InvoicesPage';

export const Route = createFileRoute('/_app/strategies/invoices')({
  component: () => <InvoicesPage businessUnit="strategies" />,
});
