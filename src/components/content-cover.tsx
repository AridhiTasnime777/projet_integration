/**
 * content-cover.tsx
 *
 * Affiche la couverture visuelle d'un contenu dans les cartes et miniatures.
 *
 * SYSTÈME D'ASSETS LOVABLE :
 *   Les images de couverture (forest, nutrition, creative-studio) sont hébergées
 *   sur le CDN Lovable via des fichiers .asset.json dans src/assets/.
 *   Chaque fichier .asset.json contient l'URL publique de l'image côté serveur.
 *   Ces images sont associées aux contenus via le champ `body.cover` en base de données.
 *
 * LOGIQUE D'AFFICHAGE :
 *   - Si le contenu a un champ `body.cover` valide → on affiche l'image correspondante.
 *   - Sinon → on affiche un placeholder CSS animé coloré selon le type de contenu.
 */

import { BrainCircuit, Puzzle, Gamepad2, FileText, Play } from 'lucide-react';
import type { Content } from '@/lib/queries';
import { fr } from '@/lib/fr';

// --- Import des métadonnées d'assets Lovable ---
// Ces fichiers JSON contiennent l'URL CDN générée par Lovable lors de l'upload.
// Ne pas modifier manuellement : ils sont gérés par le système d'assets Lovable.
import forestAsset from '@/assets/forest.jpg.asset.json';
const forest = forestAsset.url; // ex: /__l5e/assets-v1/.../forest.jpg

import nutritionAsset from '@/assets/nutrition.jpg.asset.json';
const nutrition = nutritionAsset.url; // ex: /__l5e/assets-v1/.../nutrition.jpg

import studioAsset from '@/assets/creative-studio.jpg.asset.json';
const studio = studioAsset.url; // ex: /__l5e/assets-v1/.../creative-studio.jpg

// Mapping icône par type de contenu (utilisé comme placeholder visuel)
export const typeIcons = {
  QUIZ: BrainCircuit,
  PUZZLE: Puzzle,
  MINI_GAME: Gamepad2,
  SHORT_DOC: FileText,
  VIDEO: Play,
};

/** Badge coloré affichant le statut de modération d'un contenu */
export function StatusBadge({ status }: { status: Content['status'] }) {
  return <span className={`status-badge ${status}`}>{fr.statuses[status]}</span>;
}

/**
 * ContentCover — Couverture d'un contenu
 *
 * Résout quelle image afficher à partir du champ `body.cover` du contenu :
 *   - 'forest'    → photo de forêt (image inspirante, calme)
 *   - 'nutrition' → photo nutrition/santé
 *   - 'studio'    → atelier créatif avec carnet et thé
 *   - null/autre  → placeholder CSS généré selon le type (QUIZ, PUZZLE, etc.)
 */
export function ContentCover({ content }: { content: Content }) {
  // Extraction sécurisée du champ `cover` depuis le corps JSON du contenu
  const body = content.body;
  const key =
    body && typeof body === 'object' && !Array.isArray(body)
      ? body['cover']
      : null;

  // Résolution de l'URL de l'image selon la clé stockée en base
  const image =
    key === 'forest'
      ? forest
      : key === 'nutrition'
        ? nutrition
        : key === 'studio'
          ? studio
          : null;

  const Icon = typeIcons[content.content_type];

  // Affichage : image si disponible, sinon placeholder avec icône du type
  return image ? (
    <img src={image} alt={content.title} />
  ) : (
    <div className={`cover-art ${content.content_type}`}>
      <div className="cover-lines" />
      <Icon />
    </div>
  );
}