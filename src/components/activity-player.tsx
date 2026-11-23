/**
 * activity-player.tsx — US10 : Lecteur d'activités interactif
 *
 * Gère l'affichage et l'interaction pour trois types de contenus actifs :
 *   - QUIZ      : questions à choix multiples, score calculé à la fin
 *   - PUZZLE    : instructions + démarrage + bouton abandon
 *   - MINI_GAME : instructions + lien externe si body.url fourni
 *
 * US10 — Tâches implémentées :
 *   ✅ Afficher la liste des questions (QUIZ)
 *   ✅ Développer l'écran d'instructions et de démarrage
 *   ✅ Calculer et afficher le score (QUIZ)
 *   ✅ Gérer l'abandon de la partie
 *
 * Le lecteur est entièrement côté client (useState) — aucune persistance serveur
 * pour cette version. L'historique des scores sera ajouté avec les tables Supabase
 * dédiées (US12 / future migration Lovable).
 */

import { useState } from 'react';
import {
  BrainCircuit, Puzzle, Gamepad2, CheckCircle2, XCircle,
  Trophy, RotateCcw, ExternalLink, Play, StopCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { fr } from '@/lib/fr';
import type { Content } from '@/lib/queries';

// ─── Types internes ───────────────────────────────────────────────────────────

/** Structure d'une question de quiz stockée dans body.questions */
interface QuizQuestion {
  q: string;        // Texte de la question
  options: string[]; // Liste des choix possibles
  answer: number;   // Index (0-based) de la bonne réponse
}

/** Phases du cycle de vie d'une activité */
type Phase = 'idle' | 'playing' | 'result';

// ─── Lecteur QUIZ ─────────────────────────────────────────────────────────────

function QuizPlayer({ questions, onAbandon }: { questions: QuizQuestion[]; onAbandon: () => void }) {
  const [index, setIndex] = useState(0);           // Index de la question courante
  const [score, setScore] = useState(0);           // Nombre de bonnes réponses
  const [chosen, setChosen] = useState<number | null>(null); // Réponse sélectionnée
  const [phase, setPhase] = useState<Phase>('playing');

  const question = questions[index];
  const isLast = index === questions.length - 1;

  /** L'utilisateur clique sur un choix de réponse */
  function choose(i: number) {
    if (chosen !== null) return; // Déjà répondu → on ignore
    setChosen(i);
    if (i === question.answer) setScore(s => s + 1);
  }

  /** Passe à la question suivante ou affiche le résultat final */
  function next() {
    if (isLast) {
      setPhase('result');
    } else {
      setIndex(i => i + 1);
      setChosen(null); // Réinitialise la sélection pour la prochaine question
    }
  }

  /** Rejouer depuis le début */
  function replay() {
    setIndex(0); setScore(0); setChosen(null); setPhase('playing');
  }

  // ── Écran de résultat ──────────────────────────────────────────────────────
  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    const perfect = score === questions.length;
    return (
      <div className="activity-result">
        <span className={`result-icon ${perfect ? 'perfect' : ''}`}>
          <Trophy size={32} />
        </span>
        <h3>{fr.quizFinished}</h3>
        {/* Affichage du score numérique */}
        <p className="result-score">{fr.quizScore(score, questions.length)}</p>
        {/* Barre de progression visuelle du score */}
        <div className="result-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="result-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="activity-actions">
          <Button variant="outline" onClick={onAbandon}>{fr.back}</Button>
          <Button onClick={replay}><RotateCcw size={15} />{fr.playAgain}</Button>
        </div>
      </div>
    );
  }

  // ── Écran de jeu (question courante) ──────────────────────────────────────
  return (
    <div className="activity-quiz">
      {/* Indicateur de progression Q X / N */}
      <div className="quiz-progress">
        <span className="quiz-index">{index + 1} / {questions.length}</span>
        <div className="quiz-bar">
          <div className="quiz-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Texte de la question */}
      <p className="quiz-question">{question.q}</p>

      {/* Boutons de réponse */}
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          // Coloration de feedback une fois qu'une réponse est sélectionnée
          const isChosen = chosen === i;
          const isCorrect = i === question.answer;
          let cls = 'quiz-option';
          if (chosen !== null) {
            if (isCorrect) cls += ' correct';
            else if (isChosen) cls += ' wrong';
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={chosen !== null}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
              {/* Icône de feedback affiché après réponse */}
              {chosen !== null && isCorrect && <CheckCircle2 size={16} className="option-icon ok" />}
              {chosen !== null && isChosen && !isCorrect && <XCircle size={16} className="option-icon bad" />}
            </button>
          );
        })}
      </div>

      {/* Feedback textuel + bouton suivant (apparaît après sélection) */}
      {chosen !== null && (
        <div className="quiz-feedback">
          <p className={chosen === question.answer ? 'feedback-ok' : 'feedback-bad'}>
            {chosen === question.answer ? fr.correctAnswer : fr.wrongAnswer}
          </p>
          <div className="activity-actions">
            <Button variant="outline" size="sm" onClick={onAbandon}>
              <StopCircle size={14} />{fr.abandonActivity}
            </Button>
            <Button size="sm" onClick={next}>
              {isLast ? fr.quizFinished : fr.nextQuestion}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lecteur PUZZLE ───────────────────────────────────────────────────────────

function PuzzlePlayer({ instructions, onAbandon }: { instructions: string; onAbandon: () => void }) {
  const [phase, setPhase] = useState<Phase>('playing');

  if (phase === 'result') {
    return (
      <div className="activity-result">
        <span className="result-icon perfect"><Trophy size={32} /></span>
        <h3>{fr.puzzleComplete}</h3>
        <div className="activity-actions">
          <Button variant="outline" onClick={onAbandon}>{fr.back}</Button>
          <Button onClick={() => setPhase('playing')}><RotateCcw size={15} />{fr.playAgain}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-puzzle">
      {/* Instructions du puzzle */}
      <div className="activity-instructions">
        <Puzzle size={20} className="instruction-icon" />
        <p>{instructions}</p>
      </div>
      <div className="activity-actions">
        <Button variant="outline" onClick={onAbandon}>
          <StopCircle size={14} />{fr.puzzleAbandon}
        </Button>
        {/* Bouton "Puzzle terminé" — l'utilisateur confirme lui-même l'accomplissement */}
        <Button onClick={() => setPhase('result')}>
          <CheckCircle2 size={14} />{fr.puzzleComplete}
        </Button>
      </div>
    </div>
  );
}

// ─── Lecteur MINI_GAME ────────────────────────────────────────────────────────

function MiniGamePlayer({
  instructions, url, onAbandon,
}: { instructions: string; url?: string; onAbandon: () => void }) {
  return (
    <div className="activity-puzzle">
      {/* Instructions du mini-jeu */}
      <div className="activity-instructions">
        <Gamepad2 size={20} className="instruction-icon" />
        <p>{instructions || fr.activityInstructions}</p>
      </div>
      <div className="activity-actions">
        <Button variant="outline" onClick={onAbandon}>
          <StopCircle size={14} />{fr.gameAbandon}
        </Button>
        {/* Si un lien externe est fourni, ouvrir dans un nouvel onglet */}
        {url && (
          <Button asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />{fr.gameExternal}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Composant principal exporté ──────────────────────────────────────────────

/**
 * ActivityPlayer — Lecteur d'activité selon le type du contenu.
 *
 * Affiche d'abord un écran d'instructions ("idle"), puis lance le lecteur
 * adapté au type (quiz interactif, puzzle, mini-jeu) quand l'utilisateur clique
 * sur "Commencer l'activité".
 *
 * Props :
 *   content — le contenu complet (body contient les données de l'activité)
 */
export function ActivityPlayer({ content }: { content: Content }) {
  const [phase, setPhase] = useState<Phase>('idle');

  // Extraction sécurisée du body JSON du contenu
  const body = (
    content.body && typeof content.body === 'object' && !Array.isArray(content.body)
      ? content.body
      : {}
  ) as Record<string, unknown>;

  // Données spécifiques selon le type d'activité
  const questions = Array.isArray(body['questions'])
    ? (body['questions'] as QuizQuestion[])
    : [];
  const instructions = typeof body['instructions'] === 'string' ? body['instructions'] : '';
  const externalUrl = typeof body['url'] === 'string' ? body['url'] : undefined;

  // Icône par type d'activité
  const TypeIcon =
    content.content_type === 'QUIZ' ? BrainCircuit :
    content.content_type === 'PUZZLE' ? Puzzle :
    Gamepad2;

  /** Revenir à l'écran d'instructions (abandon ou retour après résultat) */
  const handleAbandon = () => setPhase('idle');

  // ── Écran d'instructions (phase idle) ────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="activity-idle">
        <div className="activity-header">
          <span className={`activity-type-icon ${content.content_type}`}>
            <TypeIcon size={22} />
          </span>
          <div>
            <p className="activity-type-label">{fr.types[content.content_type]}</p>
            <p className="activity-hint">
              {content.content_type === 'QUIZ' && questions.length > 0
                ? `${questions.length} question${questions.length > 1 ? 's' : ''}`
                : fr.activityInstructions}
            </p>
          </div>
        </div>

        {/* Affichage des instructions si disponibles */}
        {instructions && (
          <div className="activity-instructions">
            <p>{instructions}</p>
          </div>
        )}

        {/* Bouton de démarrage */}
        <Button className="activity-start-btn" onClick={() => setPhase('playing')}>
          <Play size={16} />{fr.startActivity}
        </Button>
      </div>
    );
  }

  // ── Phase active : lecteur selon le type ─────────────────────────────────
  if (content.content_type === 'QUIZ') {
    // Vérification : un quiz doit avoir au moins une question valide
    if (questions.length === 0) {
      return (
        <div className="activity-idle">
          <p className="activity-hint">Ce quiz ne contient pas encore de questions.</p>
        </div>
      );
    }
    return <QuizPlayer questions={questions} onAbandon={handleAbandon} />;
  }

  if (content.content_type === 'PUZZLE') {
    return <PuzzlePlayer instructions={instructions} onAbandon={handleAbandon} />;
  }

  if (content.content_type === 'MINI_GAME') {
    return <MiniGamePlayer instructions={instructions} url={externalUrl} onAbandon={handleAbandon} />;
  }

  // Types non interactifs (VIDEO, SHORT_DOC) : pas de lecteur d'activité
  return null;
}
