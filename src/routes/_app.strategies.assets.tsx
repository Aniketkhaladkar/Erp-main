import { createFileRoute } from '@tanstack/react-router';
import { AssetsPage } from '@/components/pages/AssetsPage';

export const Route = createFileRoute('/_app/strategies/assets')({
  component: AssetsPage,
});
