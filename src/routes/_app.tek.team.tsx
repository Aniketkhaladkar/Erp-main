import { createFileRoute } from '@tanstack/react-router';
import { TeamPage } from '@/components/pages/TeamPage';

export const Route = createFileRoute('/_app/tek/team')({
  component: () => <TeamPage businessUnit="tek" />,
});
