import { createFileRoute } from '@tanstack/react-router';
import { TaskReportsPage } from '@/components/pages/TaskReportsPage';

export const Route = createFileRoute('/_app/task-reports')({
  component: TaskReportsPage,
});
