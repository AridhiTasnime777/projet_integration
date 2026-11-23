import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { FolderOpen, House, Play, ShieldCheck, Flag, History, LogOut, Layers, Settings, PanelLeftClose, PanelLeftOpen, Moon, Plus, Bell, ChevronRight, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useTheme } from './theme-provider';
import { supabase } from '@/integrations/supabase/client';
import { useElasticScroll } from '@/hooks/use-elastic-scroll';
import { fr } from '@/lib/fr';

export function Brand() { return <Link to="/" className="brand" aria-label="CreativeScroll"><span className="brand-mark"><Layers size={21}/></span><span className="brand-name">Creative<span className="brand-scroll">Scroll</span><span className="brand-dot">.</span></span></Link>; }

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'C';

const creatorNav = [
  { to: '/scroll' as const, label: fr.scroll, icon: Play },
  { to: '/creator' as const, label: fr.home, icon: House },
  { to: '/contents' as const, label: fr.contents, icon: FolderOpen },
  // US11 : défis de bien-être quotidiens
  { to: '/challenges' as const, label: fr.challenges, icon: Dumbbell },
  // US12 : page de progression (niveau, XP, badges)
  { to: '/progress' as const, label: fr.progressTitle, icon: TrendingUp },
];
const viewerNav = [
  { to: '/scroll' as const, label: fr.scroll, icon: Play },
  // US11 : défis de bien-être quotidiens
  { to: '/challenges' as const, label: fr.challenges, icon: Dumbbell },
  // US12 : page de progression (niveau, XP, badges)
  { to: '/progress' as const, label: fr.progressTitle, icon: TrendingUp },
];
const moderatorNav = [
  { to: '/moderation' as const, label: fr.pending, icon: ShieldCheck },
  { to: '/reports' as const, label: fr.reports, icon: Flag },
  { to: '/history' as const, label: fr.history, icon: History },
];

function QuickMenu({ name, email, moderator, isViewer }: { name: string; email: string; moderator: boolean; isViewer: boolean }) {
  const [open, setOpen] = useState(false);
  const { dark, setDark } = useTheme();
  const navigate = useNavigate(); const client = useQueryClient();
  async function logout() { setOpen(false); await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: '/auth', replace: true }); }
  const go = (to: '/settings' | '/creator' | '/moderation') => { setOpen(false); void navigate({ to }); };
  // Chip de rôle : Modérateur > Utilisateur > Créateur
  const roleLabel = moderator ? fr.moderatorAccount : isViewer ? fr.viewerAccount : fr.account;
  return <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
    <PopoverPrimitive.Trigger asChild>
      <button type="button" className={`avatar-trigger ${open ? 'is-open' : ''}`} aria-label={fr.quickMenu}><span className="avatar">{initials(name)}</span></button>
    </PopoverPrimitive.Trigger>
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content side="bottom" align="start" sideOffset={10} collisionPadding={12} className="quick-menu">
        <div className="quick-menu-head"><span className="avatar large">{initials(name)}</span><div><strong>{name}</strong><small>{email}</small><span className="role-chip">{roleLabel}</span></div></div>
        <div className="quick-actions">
          {moderator
            ? <button type="button" className="quick-action" onClick={() => go('/moderation')}><ShieldCheck size={18}/><span>{fr.pending}</span></button>
            : <>
              {/* Lien "Nouveau contenu" masqué pour les viewers */}
              {!isViewer && (
                <Link to="/contents" search={{ nouveau: true }} className="quick-action" onClick={() => setOpen(false)}><Plus size={18}/><span>{fr.newContent}</span></Link>
              )}
              <button type="button" className="quick-action" onClick={() => go('/creator')}><Bell size={18}/><span>{fr.notifications}</span></button>
            </>}
        </div>
        <div className="quick-row"><label htmlFor="quick-dark"><Moon size={16}/>{fr.darkTheme}</label><Switch id="quick-dark" checked={dark} onCheckedChange={setDark}/></div>
        <button type="button" className="quick-link" onClick={() => go('/settings')}><Settings size={16}/><span>{fr.profileSettings}</span><ChevronRight size={15}/></button>
        <button type="button" className="quick-link danger" onClick={() => void logout()}><LogOut size={16}/><span>{fr.logout}</span></button>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}

export function WorkspaceShell({ children, moderator, isViewer, name, email }: { children: ReactNode; moderator: boolean; isViewer: boolean; name: string; email: string }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  useElasticScroll(mainRef);
  // Sélection de la navigation selon le rôle
  const items = moderator ? moderatorNav : isViewer ? viewerNav : creatorNav;
  const isActive = (to: string) => path === to || (path.startsWith('/content/') && to === (moderator ? '/moderation' : '/contents'));
  return <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className="sidebar">
      <Brand/>
      <div className="workspace-label">{moderator ? fr.moderation : fr.workspace}</div>
      <nav className="side-nav" aria-label="Navigation principale">{items.map(item => <Button variant="ghost" asChild key={item.to} className={isActive(item.to) ? 'nav-item active' : 'nav-item'}><Link to={item.to} title={item.label} aria-current={isActive(item.to) ? 'page' : undefined}><item.icon size={19}/><span>{item.label}</span></Link></Button>)}</nav>
      <div className="sidebar-bottom"><Button variant="ghost" className="nav-item" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'} title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}>{collapsed ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}<span>Réduire</span></Button></div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <QuickMenu name={name} email={email} moderator={moderator} isViewer={isViewer}/>
        <span className="topbar-section">{moderator ? fr.moderation : fr.workspace}</span>
        <span className="mobile-brand"><Brand/></span>
      </header>
      <main ref={mainRef} className="workspace-main"><div key={path} className="page-enter">{children}</div></main>
    </div>
    <nav className="bottom-nav" aria-label="Navigation mobile">{items.map(item => { const active = isActive(item.to); return <Link key={item.to} to={item.to} aria-label={item.label} aria-current={active ? 'page' : undefined} className={active ? 'bottom-item active' : 'bottom-item'}><item.icon size={19} strokeWidth={active ? 2.3 : 2}/><span>{item.label}</span></Link>; })}</nav>
  </div>;
}
