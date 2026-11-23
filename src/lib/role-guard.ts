import { redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

/** Vérifie uniquement qu'un utilisateur est connecté (toutes routes authentifiées). */
export async function requireAuth() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw redirect({ to: '/auth' });
}

export async function requireRole(role: 'creator' | 'moderator') {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw redirect({ to: '/auth' });

  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.user.id);
  if (error) throw new Error('Impossible de vérifier les permissions.');

  const moderator = data.some(r => r.role === 'moderator');
  const hasExplicitCreator = data.some(r => r.role === 'creator');

  // Un viewer est un utilisateur sans rôle créateur ou modérateur en DB.
  // Si intended_role vaut 'creator' ET qu'il n'a pas le rôle en DB, il reste viewer.
  const intendedRole = user.user.user_metadata?.['intended_role'];
  const isViewer = !moderator && !hasExplicitCreator && intendedRole !== 'creator';

  // Viewer → redirigé vers /scroll (pas accès aux routes creator/moderator)
  if (isViewer) throw redirect({ to: '/scroll' });

  if (role === 'moderator' && !moderator) throw redirect({ to: '/creator' });
  if (role === 'creator' && moderator) throw redirect({ to: '/moderation' });
}