/**
 * scroll-feed.tsx — US09 : Fil de contenus validés
 *
 * Affiche un fil vertical de tous les contenus avec status = 'VALIDATED'.
 * Chaque carte présente la couverture, le type, le titre, la description
 * et un bouton d'accès à l'activité.
 *
 * Filtres disponibles : tous les types de contenus (QUIZ, PUZZLE, MINI_GAME, VIDEO, SHORT_DOC)
 * Tri : plus récents en premier (ordre chronologique inverse).
 *
 * US09 — Tâches implémentées :
 *   ✅ Afficher la liste des activités validées
 *   ✅ Filtrage rapide par type de contenu
 *   ✅ Gestion de l'état vide ("aucun contenu")
 *   ✅ Gestion de l'état "erreur réseau" (géré par la route parente via workspaceQuery)
 *   ✅ Lien vers la page de détail de chaque contenu
 */

import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, BrainCircuit, FileText, Gamepad2, Play, Puzzle } from 'lucide-react';
import { ContentCover } from './content-cover';
import { workspaceQuery, type Content } from '@/lib/queries';
import { fr } from '@/lib/fr';

// Types de contenus disponibles pour le filtre rapide
const TYPES = ['ALL', 'QUIZ', 'PUZZLE', 'MINI_GAME', 'VIDEO', 'SHORT_DOC'] as const;
type FilterType = (typeof TYPES)[number];

// Icônes et libellés par type de contenu
const TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  QUIZ:      { icon: BrainCircuit, label: fr.types.QUIZ,      color: 'info' },
  PUZZLE:    { icon: Puzzle,       label: fr.types.PUZZLE,    color: 'warning' },
  MINI_GAME: { icon: Gamepad2,     label: fr.types.MINI_GAME, color: 'info' },
  SHORT_DOC: { icon: FileText,     label: fr.types.SHORT_DOC, color: 'success' },
  VIDEO:     { icon: Play,         label: fr.types.VIDEO,     color: 'info' },
};

// Libellé du bouton d'action selon le type (activité interactive vs document/vidéo)
function actionLabel(type: Content['content_type']): string {
  if (type === 'QUIZ' || type === 'PUZZLE' || type === 'MINI_GAME') return fr.playActivity;
  return fr.openContent;
}

/** Carte d'un seul contenu dans le fil Scroll */
function FeedCard({ content }: { content: Content }) {
  const meta = TYPE_META[content.content_type];
  const Icon = meta.icon;
  return (
    <article className="feed-card">
      {/* Couverture visuelle (image CDN ou placeholder coloré) */}
      <Link to="/content/$id" params={{ id: content.id }} className="feed-cover" aria-label={content.title}>
        <ContentCover content={content} />
        {/* Badge type affiché en superposition sur la couverture */}
        <span className={`feed-type-badge ${content.content_type}`}>
          <Icon size={12} />
          {meta.label}
        </span>
      </Link>

      {/* Corps de la carte */}
      <div className="feed-body">
        <div className="feed-meta">
          <span className="feed-category">{content.categories?.name}</span>
          <span className="feed-author">{content.author?.display_name}</span>
        </div>

        <h2 className="feed-title">
          <Link to="/content/$id" params={{ id: content.id }}>{content.title}</Link>
        </h2>

        <p className="feed-description">{content.description}</p>

        {/* Bouton d'accès à l'activité — libellé adapté au type */}
        <Link to="/content/$id" params={{ id: content.id }} className="feed-action">
          {actionLabel(content.content_type)}
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

/** Boutons de filtre rapide par type de contenu */
function TypeFilter({ active, onChange }: { active: FilterType; onChange: (t: FilterType) => void }) {
  const labels: Record<FilterType, string> = {
    ALL:       fr.scrollFilterAll,
    QUIZ:      fr.types.QUIZ,
    PUZZLE:    fr.types.PUZZLE,
    MINI_GAME: fr.types.MINI_GAME,
    VIDEO:     fr.types.VIDEO,
    SHORT_DOC: fr.types.SHORT_DOC,
  };
  return (
    <div className="feed-filters" role="group" aria-label="Filtrer par type">
      {TYPES.map(t => (
        <button
          key={t}
          type="button"
          className={`feed-filter-btn ${active === t ? 'active' : ''}`}
          onClick={() => onChange(t)}
          aria-pressed={active === t}
        >
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

/** Fil principal — composant exporté utilisé dans /scroll */
export function ScrollFeed() {
  const { data } = useSuspenseQuery(workspaceQuery());
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Filtrage : uniquement les contenus VALIDATED, triés du plus récent au plus ancien
  const validated = data.contents
    .filter(c => c.status === 'VALIDATED')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Application du filtre par type si sélectionné
  const displayed = filter === 'ALL'
    ? validated
    : validated.filter(c => c.content_type === filter);

  return (
    <div className="scroll-feed-page">
      {/* En-tête de la page */}
      <div className="page-heading">
        <div>
          <h1>{fr.scrollFeedTitle}</h1>
          <p>{fr.scrollFeedSubtitle}</p>
        </div>
        {/* Compteur de contenus disponibles */}
        <span className="count-bubble">{validated.length} {fr.count}</span>
      </div>

      {/* Barre de filtres par type */}
      <TypeFilter active={filter} onChange={setFilter} />

      {/* Grille du fil — ou état vide */}
      {displayed.length > 0 ? (
        <div className="feed-grid">
          {displayed.map(c => <FeedCard key={c.id} content={c} />)}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><Play size={26} /></span>
          <h2>{filter !== 'ALL' ? fr.emptyFiltered : fr.scrollEmpty}</h2>
          <p>{filter !== 'ALL' ? 'Essayez un autre type de contenu.' : fr.scrollEmptySubtitle}</p>
          {filter !== 'ALL' && (
            <button type="button" className="feed-filter-btn active" onClick={() => setFilter('ALL')}>
              {fr.clearFilters}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
