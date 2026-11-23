import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fr } from './fr';
export const workspaceQuery = () => queryOptions({
  queryKey: ['workspace'],
  queryFn: async () => {
    const [contents, categories, profile, roles] = await Promise.all([
      supabase.from('contents').select('*, categories(name), author:profiles!contents_author_id_fkey(display_name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.auth.getUser(),
      supabase.from('user_roles').select('role'),
    ]);
    if (contents.error || categories.error || profile.error || roles.error) throw new Error(fr.error);
    const user = profile.data.user;
    if (!user) throw new Error(fr.authError);
    const ownProfile = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
    const moderator = roles.data.some(r => r.role === 'moderator');
    // Un "viewer" est un utilisateur dont le intended_role dans les metadata est 'viewer'
    // et qui n'a pas de rôle créateur/modérateur explicite dans user_roles
    const hasExplicitCreator = roles.data.some(r => r.role === 'creator');
    // Viewer = pas de rôle creator/moderator en DB ET intended_role !== 'creator'
    const isViewer = !moderator && !hasExplicitCreator
      && user.user_metadata?.['intended_role'] !== 'creator';
    const [reports, decisions] = moderator ? await Promise.all([
      supabase.from('reports').select('*').eq('status', 'OPEN'),
      supabase.from('moderation_decisions').select('*, contents(title)').order('created_at', { ascending: false }),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (reports.error || decisions.error) throw new Error(fr.error);
    return { contents: contents.data, categories: categories.data, user, name: ownProfile.data?.display_name || fr.account, moderator, isViewer, reports: reports.data || [], decisions: decisions.data || [] };
  },
});
export type Content = import('@/integrations/supabase/types').Database['public']['Tables']['contents']['Row'] & { categories: { name: string } | null; author: { display_name: string } | null };
export const notificationsQuery = () => queryOptions({
  queryKey: ['workspace', 'notifications'],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('creator_notifications');
    if (error) throw new Error(fr.error);
    return data ?? [];
  },
});
export type CreatorNotification = import('@/integrations/supabase/types').Database['public']['Functions']['creator_notifications']['Returns'][number];
