/**
 * progress.tsx — Route /progress (US12)
 *
 * Page de progression de l'utilisateur créateur.
 * Charge les données workspaceQuery (déjà en cache via le layout parent).
 * Réservée aux créateurs (non aux modérateurs).
 */
import { createFileRoute } from '@tanstack/react-router';
import { ProgressPage } from '@/components/progress-page';
import { WorkspaceError } from '@/components/workspace-page';
import { ListSkeleton } from '@/components/skeletons';
import { workspaceQuery } from '@/lib/queries';
import { requireRole } from '@/lib/role-guard';

export const Route = createFileRoute('/_authenticated/progress')({
  // Réservée aux créateurs uniquement
  beforeLoad: () => requireRole('creator'),
  // Pré-chargement des données (déjà en cache via layout, coût nul)
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceQuery()),
  head: () => ({
    meta: [
      { title: 'Ma progression · CreativeScroll' },
      { name: 'description', content: 'Suivez votre niveau, vos points et vos badges de progression.' },
      { property: 'og:title', content: 'Ma progression · CreativeScroll' },
      { property: 'og:description', content: 'Niveau, XP, streak et badges : votre parcours CreativeScroll.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: ProgressPage,
  pendingComponent: ListSkeleton,
  errorComponent: WorkspaceError,
});
