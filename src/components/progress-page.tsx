/**
 * progress-page.tsx — US12 : Progression
 *
 * Affiche la progression globale de l'utilisateur créateur :
 *   - Niveau calculé à partir des XP (points cumulés des défis + bonus contenus)
 *   - Barre de progression vers le prochain palier
 *   - Statistiques : XP total, streak, badges obtenus
 *   - Grille de badges (verrouillés / débloqués) selon les accomplissements
 *
 * US12 — Tâches implémentées :
 *   ✅ Développer l'écran de progression
 *   ✅ Enregistrer scores, séries et récompenses (localStorage, sans table Supabase pour l'instant)
 *   ✅ Gérer l'échec d'enregistrement réseau (non applicable — données locales)
 *
 * Note : les tables Supabase pour la progression seront gérées par Lovable.
 * Cette version utilise localStorage (même source que challenges-page.tsx).
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, Zap } from 'lucide-react';
import { workspaceQuery } from '@/lib/queries';
import { fr } from '@/lib/fr';

// ─── Constantes de progression ───────────────────────────────────────────────

/** XP requis par niveau (paliers croissants) */
const XP_PER_LEVEL = [0, 50, 120, 220, 350, 520, 730, 980, 1270, 1600, 2000];

/** Clés localStorage synchronisées avec challenges-page.tsx */
const STREAK_KEY = 'cs-challenges-streak';

// ─── Calcul du niveau à partir des XP ────────────────────────────────────────

/**
 * Retourne le niveau courant (1-based) et les XP au sein du palier.
 * Level 1 = 0 XP, Level 2 = 50 XP, etc.
 */
function computeLevel(xp: number) {
  let level = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) level = i + 1;
    else break;
  }
  const levelStart = XP_PER_LEVEL[level - 1] ?? 0;
  const levelEnd   = XP_PER_LEVEL[level] ?? XP_PER_LEVEL[XP_PER_LEVEL.length - 1] + 500;
  const xpInLevel  = xp - levelStart;
  const xpNeeded   = levelEnd - levelStart;
  const pct        = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { level, xpInLevel, xpNeeded, pct, levelEnd };
}

// ─── Calcul des XP depuis le localStorage (défis) ────────────────────────────

/**
 * Somme tous les points de défis enregistrés dans localStorage.
 * Les clés suivent le pattern `cs-challenges-YYYY-MM-DD` → tableau d'IDs accomplis.
 * Chaque défi a un nombre de points fixe (ici simplifié : 10-15 pts/défi).
 */
function getTotalXpFromStorage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('cs-challenges-20')) continue; // clé datée
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      // Points simplifiés : 12 pts par défi accompli (moyenne réelle = 11,67)
      total += ids.length * 12;
    } catch { /* ignore */ }
  }
  return total;
}

// ─── Composant principal ──────────────────────────────────────────────────────

/** Page de progression — exportée pour la route /progress */
export function ProgressPage() {
  // Données Supabase : contenus créés + validés par l'utilisateur
  const { data } = useSuspenseQuery(workspaceQuery());
  const ownContents  = data.contents.filter(c => c.author_id === data.user.id);
  const validated    = ownContents.filter(c => c.status === 'VALIDATED');

  // XP depuis localStorage (défis) + bonus contenus (20 XP / contenu validé)
  const challengeXp  = getTotalXpFromStorage();
  const contentXp    = validated.length * 20;
  const totalXp      = challengeXp + contentXp;

  // Streak depuis localStorage
  const streak = Number(localStorage.getItem(STREAK_KEY) ?? 0);

  // Niveau et avancement dans le palier
  const { level, xpInLevel, xpNeeded, pct, levelEnd } = computeLevel(totalXp);

  // ─── Badges ──────────────────────────────────────────────────────────────

  /**
   * Liste des badges disponibles.
   * `unlocked` est calculé dynamiquement selon l'état de l'utilisateur.
   */
  const badgeList = [
    {
      key: 'first',
      emoji: '🌱',
      label: fr.badges.first.label,
      desc: fr.badges.first.desc,
      unlocked: ownContents.length >= 1,
    },
    {
      key: 'five',
      emoji: '🚀',
      label: fr.badges.five.label,
      desc: fr.badges.five.desc,
      unlocked: ownContents.length >= 5,
    },
    {
      key: 'validated',
      emoji: '✅',
      label: fr.badges.validated.label,
      desc: fr.badges.validated.desc,
      unlocked: validated.length >= 1,
    },
    {
      key: 'challenger',
      emoji: '🏆',
      label: fr.badges.challenger.label,
      desc: fr.badges.challenger.desc,
      unlocked: challengeXp > 0, // A accompli au moins un défi
    },
    {
      key: 'streak3',
      emoji: '🔥',
      label: fr.badges.streak3.label,
      desc: fr.badges.streak3.desc,
      unlocked: streak >= 3,
    },
  ];

  const unlockedCount = badgeList.filter(b => b.unlocked).length;

  return (
    <div className="progress-page">
      {/* En-tête */}
      <div className="page-heading">
        <div>
          <h1>{fr.progressTitle}</h1>
          <p>{fr.progressPoints.replace('$n', String(totalXp))}</p>
        </div>
      </div>

      {/* Carte niveau — design "island" sombre */}
      <div className="progress-level-card">
        <p className="progress-level-label">{fr.progressLevel}</p>

        {/* Numéro de niveau + libellé XP */}
        <div className="progress-level-num">
          {level}
          <span>/ {XP_PER_LEVEL.length} niveaux</span>
        </div>

        {/* Barre de progression XP dans le palier */}
        <div className="progress-xp-bar-wrap">
          <div className="progress-xp-label">
            <span>{xpInLevel} XP</span>
            <span>{fr.progressNextLevel} : {levelEnd} XP</span>
          </div>
          <div className="progress-xp-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-xp-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="progress-stats">
        {/* XP total */}
        <div className="progress-stat">
          <span className="progress-stat-icon"><Zap size={20} style={{ color: 'var(--warning)' }} /></span>
          <strong>{totalXp}</strong>
          <small>XP total</small>
        </div>

        {/* Streak (jours consécutifs) */}
        <div className="progress-stat">
          <span className="progress-stat-icon"><Flame size={20} style={{ color: 'var(--warning)' }} /></span>
          <strong>{streak}</strong>
          <small>{fr.progressStreak} {fr.progressStreakDays}</small>
        </div>

        {/* Badges obtenus */}
        <div className="progress-stat">
          <span className="progress-stat-icon"><Star size={20} style={{ color: 'var(--warning)' }} /></span>
          <strong>{unlockedCount}</strong>
          <small>{fr.progressBadges}</small>
        </div>
      </div>

      {/* Section badges */}
      <div className="progress-badges-section">
        <h2>
          <Trophy size={18} />
          {fr.challengesBadgeTitle}
        </h2>

        <div className="badges-grid">
          {badgeList.map(badge => (
            <div key={badge.key} className={`badge-card ${badge.unlocked ? 'unlocked' : ''}`}>
              <span className="badge-emoji">{badge.emoji}</span>
              <span className="badge-label">{badge.label}</span>
              <span className="badge-desc">{badge.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
