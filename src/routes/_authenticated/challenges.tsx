/**
 * challenges.tsx — Route /challenges (US11)
 *
 * Page des défis de bien-être quotidiens.
 * Accessible uniquement aux créateurs authentifiés (non aux modérateurs).
 */
import { createFileRoute } from '@tanstack/react-router';
import { ChallengesPage } from '@/components/challenges-page';
import { WorkspaceError } from '@/components/workspace-page';

export const Route = createFileRoute('/_authenticated/challenges')({
  head: () => ({
    meta: [
      { title: 'Défis · CreativeScroll' },
      { name: 'description', content: 'Relevez des défis quotidiens pour adopter des habitudes plus saines.' },
      { property: 'og:title', content: 'Défis du jour · CreativeScroll' },
      { property: 'og:description', content: 'Quiz, marche, lecture : relevez des défis de bien-être chaque jour.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: ChallengesPage,
  errorComponent: WorkspaceError,
});
