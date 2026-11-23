import type { Database } from '@/integrations/supabase/types';
export type Status = Database['public']['Enums']['content_status'];
export type Kind = Database['public']['Enums']['content_kind'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const canEdit = (status: Status) => status === 'PENDING' || status === 'REJECTED';
export const canDeleteUnreviewed = (status: Status, reviewedAt: string | null) => status === 'PENDING' && reviewedAt === null;
// Un viewer ne peut jamais créer de contenu
export const canCreate = (role: 'creator' | 'moderator' | 'viewer') => role !== 'viewer';
// US13 : les modérateurs signalent les contenus VALIDATED (sans restriction sur l'auteur).
// Les créateurs peuvent aussi signaler un contenu VALIDATED qui n'est pas le leur.
export const canReport = (
  role: 'creator' | 'moderator' | 'viewer',
  status: Status,
  authorId?: string | null,
  userId?: string | null,
) => {
  if (status !== 'VALIDATED') return false;
  if (role === 'moderator') return true;
  // Créateur et viewer : peuvent signaler uniquement si ce n'est pas leur propre contenu
  return (role === 'creator' || role === 'viewer') && authorId !== userId;
};
export function canTransition(role: 'creator' | 'moderator' | 'viewer', from: Status, to: Status) {
  // Viewer : aucune transition possible
  if (role === 'viewer') return false;
  if (role === 'creator') return canEdit(from) && to === 'PENDING';
  return (from === 'PENDING' && (to === 'VALIDATED' || to === 'REJECTED')) || (from === 'VALIDATED' && to === 'REMOVED') || (from === 'REMOVED' && to === 'VALIDATED');
}
export function validMedia(file: { size: number; type: string }) { return file.size <= MAX_FILE_SIZE && /^(image\/|video\/|application\/pdf$)/.test(file.type); }
export function safeUrl(value: string) { try { return new URL(value).protocol === 'https:'; } catch { return false; } }