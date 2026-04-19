import { createFileRoute } from '@tanstack/react-router';
import { StrategiesDashboardPage } from '@/components/pages/StrategiesDashboardPage';

export const Route = createFileRoute('/_app/strategies/dashboard')({
  component: StrategiesDashboardPage,
});
