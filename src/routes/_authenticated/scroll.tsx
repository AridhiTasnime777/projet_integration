/**
 * scroll.tsx — Route /scroll (US09)
 *
 * Remplace la page "coming soon" par le vrai fil de contenus validés.
 * Utilise workspaceQuery (déjà chargée par le layout parent) pour éviter
 * une requête réseau supplémentaire.
 */
import { createFileRoute } from '@tanstack/react-router';
import { ScrollFeed } from '@/components/scroll-feed';
import { WorkspaceError } from '@/components/workspace-page';
import { ListSkeleton } from '@/components/skeletons';
import { workspaceQuery } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/scroll')({
  // Pré-chargement des données (déjà en cache via le layout, coût nul)
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceQuery()),
  head: () => ({
    meta: [
      { title: 'Scroll · CreativeScroll' },
      { name: 'description', content: 'Découvrez les quiz, puzzles, mini-jeux et vidéos validés par la communauté CreativeScroll.' },
      { property: 'og:title', content: 'Scroll · CreativeScroll' },
      { property: 'og:description', content: 'Le fil de contenus positifs et stimulants.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: ScrollFeed,
  pendingComponent: ListSkeleton,
  errorComponent: WorkspaceError,
});
