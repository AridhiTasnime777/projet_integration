import { useState, useEffect } from 'react';
import {
  Droplets, Footprints, BookOpen, Apple, Moon, Wind,
  Trophy, Flame, CheckCircle2, Circle, Star,
} from 'lucide-react';
import { fr } from '@/lib/fr';

// ── Données statiques des défis ──────────────────────────────────────────────

/** Définition d'un défi de bien-être */
interface Challenge {
  id: string;
  icon: React.ElementType; // Icône Lucide représentant le défi
  title: string;           // Titre court du défi
  description: string;     // Description de l'action à réaliser
  points: number;          // Points attribués en cas d'accomplissement
  color: string;           // Classe CSS pour la couleur de l'icône
}

/**
 * Liste des 6 défis du jour.
 * Ces défis sont fixes (même pour tous les utilisateurs) et se renouvellent
 * visuellement chaque jour grâce à la clé localStorage datée.
 */
const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'water',
    icon: Droplets,
    title: 'Boire de l\u2019eau',
    description: 'Boire au moins 1,5 litre d\u2019eau dans la journée.',
    points: 10,
    color: 'challenge-blue',
  },
  {
    id: 'walk',
    icon: Footprints,
    title: 'Marcher 15 minutes',
    description: 'Sortir prendre l\u2019air et marcher au moins 15 minutes.',
    points: 15,
    color: 'challenge-green',
  },
  {
    id: 'read',
    icon: BookOpen,
    title: 'Lire 10 minutes',
    description: 'Lire un livre, un article ou un contenu positif.',
    points: 10,
    color: 'challenge-purple',
  },
  {
    id: 'fruit',
    icon: Apple,
    title: 'Manger un fruit',
    description: 'Inclure au moins un fruit ou légume dans votre repas.',
    points: 10,
    color: 'challenge-orange',
  },
  {
    id: 'sleep',
    icon: Moon,
    title: 'Se coucher à l\u2019heure',
    description: 'Aller dormir avant minuit pour un sommeil réparateur.',
    points: 15,
    color: 'challenge-indigo',
  },
  {
    id: 'breathe',
    icon: Wind,
    title: 'Respiration consciente',
    description: 'Prendre 5 minutes pour faire des exercices de respiration.',
    points: 10,
    color: 'challenge-teal',
  },
];

const TOTAL_POINTS = DAILY_CHALLENGES.reduce((sum, c) => sum + c.points, 0);

// ── Clés localStorage ────────────────────────────────────────────────────────

/** Génère la clé de stockage pour la date courante — les défis se réinitialisent chaque jour */
const todayKey = () => `cs-challenges-${new Date().toISOString().slice(0, 10)}`;

/** Clé pour le streak (nombre de jours consécutifs de défis accomplis) */
const STREAK_KEY = 'cs-challenges-streak';
const STREAK_DATE_KEY = 'cs-challenges-streak-date';

// ── Hook : gestion de l'état des défis ──────────────────────────────────────

function useChallenges() {
  // Set des IDs de défis accomplis aujourd'hui
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(todayKey());
      return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  // Streak : nombre de jours consécutifs
  const [streak, setStreak] = useState<number>(() => {
    return Number(localStorage.getItem(STREAK_KEY) ?? 0);
  });

  /** Cocher / décocher un défi */
  function toggle(id: string) {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Persistance dans localStorage avec la date du jour
      localStorage.setItem(todayKey(), JSON.stringify([...next]));
      return next;
    });
  }

  // Mise à jour du streak quand tous les défis du jour sont accomplis
  useEffect(() => {
    if (done.size === DAILY_CHALLENGES.length) {
      const lastDate = localStorage.getItem(STREAK_DATE_KEY);
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

      let newStreak = streak;
      // Incrémente uniquement si ce n'est pas déjà compté aujourd'hui
      if (lastDate !== today) {
        newStreak = lastDate === yesterday ? streak + 1 : 1;
        localStorage.setItem(STREAK_KEY, String(newStreak));
        localStorage.setItem(STREAK_DATE_KEY, today);
        setStreak(newStreak);
      }
    }
  }, [done.size]);

  // Score du jour : somme des points des défis accomplis
  const scoreToday = DAILY_CHALLENGES
    .filter(c => done.has(c.id))
    .reduce((sum, c) => sum + c.points, 0);

  return { done, toggle, streak, scoreToday };
}

// ── Composant carte de défi ──────────────────────────────────────────────────

function ChallengeCard({
  challenge, isDone, onToggle,
}: { challenge: Challenge; isDone: boolean; onToggle: () => void }) {
  const Icon = challenge.icon;
  return (
    <div className={`challenge-card ${isDone ? 'is-done' : ''}`}>
      {/* Icône colorée du défi */}
      <span className={`challenge-icon ${challenge.color}`}>
        <Icon size={22} />
      </span>

      {/* Contenu textuel */}
      <div className="challenge-body">
        <strong className="challenge-title">{challenge.title}</strong>
        <p className="challenge-desc">{challenge.description}</p>
        {/* Points attribués */}
        <span className="challenge-pts">
          <Star size={12} />
          {challenge.points} {fr.challengesPoints}
        </span>
      </div>

      {/* Bouton d'accomplissement (checkbox accessible) */}
      <button
        type="button"
        className={`challenge-check ${isDone ? 'is-done' : ''}`}
        onClick={onToggle}
        aria-label={isDone ? 'Marquer comme non accompli' : 'Marquer comme accompli'}
        aria-pressed={isDone}
      >
        {isDone ? <CheckCircle2 size={26} /> : <Circle size={26} />}
      </button>
    </div>
  );
}

// ── Composant principal exporté ──────────────────────────────────────────────

/** Page complète des défis de bien-être (US11) */
export function ChallengesPage() {
  const { done, toggle, streak, scoreToday } = useChallenges();
  const allDone = done.size === DAILY_CHALLENGES.length;

  return (
    <div className="challenges-page">
      {/* En-tête */}
      <div className="page-heading">
        <div>
          <h1>{fr.challenges}</h1>
          <p>{fr.challengesSubtitle}</p>
        </div>
      </div>

      {/* Statistiques du jour */}
      <div className="challenges-stats">
        {/* Score du jour */}
        <div className="challenge-stat">
          <span className="cstat-icon"><Trophy size={16} /></span>
          <div>
            <strong>{scoreToday} / {TOTAL_POINTS}</strong>
            <small>{fr.challengesScore}</small>
          </div>
        </div>

        {/* Nombre de défis accomplis */}
        <div className="challenge-stat">
          <span className="cstat-icon"><CheckCircle2 size={16} /></span>
          <div>
            <strong>{done.size} / {DAILY_CHALLENGES.length}</strong>
            <small>{fr.challengesCompleted}</small>
          </div>
        </div>

        {/* Streak (jours consécutifs) */}
        <div className="challenge-stat">
          <span className="cstat-icon flame"><Flame size={16} /></span>
          <div>
            <strong>{streak}</strong>
            <small>{fr.challengesStreak}</small>
          </div>
        </div>
      </div>

      {/* Message de félicitations si tous les défis sont accomplis */}
      {allDone && (
        <div className="challenges-congrats">
          <Trophy size={20} />
          <p><strong>Félicitations !</strong> Tous les défis du jour sont accomplis. Revenez demain pour la suite !</p>
        </div>
      )}

      {/* Section titre + note de réinitialisation */}
      <div className="challenges-section-head">
        <h2>{fr.challengesDailyTitle}</h2>
        <small>{fr.challengesReset}</small>
      </div>

      {/* Liste des défis */}
      <div className="challenges-list">
        {DAILY_CHALLENGES.map(c => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            isDone={done.has(c.id)}
            onToggle={() => toggle(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
