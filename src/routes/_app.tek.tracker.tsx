import { createFileRoute } from '@tanstack/react-router';
import { TrackerPage } from '@/components/pages/TrackerPage';

export const Route = createFileRoute('/_app/tek/tracker')({
  component: () => <TrackerPage businessUnit="tek" />,
});
