import { createFileRoute } from '@tanstack/react-router';
import { ExpenseToolsPage } from '@/components/pages/ExpenseToolsPage';

export const Route = createFileRoute('/_app/tek/expenses')({
  component: ExpenseToolsPage,
});
