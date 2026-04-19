import { createFileRoute } from '@tanstack/react-router';
import { InvoicesPage } from '@/components/pages/InvoicesPage';

export const Route = createFileRoute('/_app/tek/invoices')({
  component: () => <InvoicesPage businessUnit="tek" />,
});
