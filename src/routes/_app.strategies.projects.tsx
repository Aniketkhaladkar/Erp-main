import { createFileRoute } from '@tanstack/react-router';
import { StrategiesProjectsPage } from '@/components/pages/StrategiesProjectsPage';

export const Route = createFileRoute('/_app/strategies/projects')({
  component: StrategiesProjectsPage,
});
