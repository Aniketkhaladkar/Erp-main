import { createFileRoute } from '@tanstack/react-router';
import { SharedTrackerPage } from '@/components/pages/SharedTrackerPage';

export const Route = createFileRoute('/_app/tracker')({
  component: SharedTrackerPage,
});
