import { createFileRoute } from '@tanstack/react-router';
import { TekProjectsPage } from '@/components/pages/TekProjectsPage';

export const Route = createFileRoute('/_app/tek/projects')({
  component: TekProjectsPage,
});
