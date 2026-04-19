import { createFileRoute } from '@tanstack/react-router';
import { EmployeePanelPage } from '@/components/pages/EmployeePanelPage';

export const Route = createFileRoute('/_app/employee')({
  component: EmployeePanelPage,
});
