import { createFileRoute } from '@tanstack/react-router';
import { ExpenseToolsPage } from '@/components/pages/ExpenseToolsPage';

export const Route = createFileRoute('/_app/strategies/expenses')({
  component: () => <ExpenseToolsPage businessUnit="strategies" />,
});
