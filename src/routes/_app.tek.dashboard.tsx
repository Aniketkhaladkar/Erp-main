import { createFileRoute } from '@tanstack/react-router';
import { TekDashboardPage } from '@/components/pages/TekDashboardPage';

export const Route = createFileRoute('/_app/tek/dashboard')({
  component: TekDashboardPage,
});
