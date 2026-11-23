/**
 * auth-screen.tsx
 *
 * Écran d'authentification de CreativeScroll.
 * Gère trois phases :
 *   - 'form'    → formulaire de connexion ou d'inscription
 *   - 'leaving' → animation de sortie (scroll vers le haut) avant navigation
 *   - 'confirm' → message de confirmation d'email (après inscription)
 *
 * ASSET VISUEL (image de droite) :
 *   L'image "creative-studio.jpg" est hébergée sur le CDN Lovable.
 *   Elle est référencée via src/assets/creative-studio.jpg.asset.json
 *   et affichée dans le panneau visuel de droite (.auth-visual) pour
 *   illustrer l'univers créatif de la plateforme.
 *
 * FLUX D'AUTHENTIFICATION :
 *   - Connexion  → supabase.auth.signInWithPassword → redirect /creator ou /moderation
 *   - Inscription → supabase.auth.signUp → email de confirmation → phase 'confirm'
 *   - Rôle      → la table user_roles détermine si l'utilisateur est modérateur
 */

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles, Check, MailCheck, PenLine, User } from 'lucide-react';
import { Button } from './ui/button';
import { Brand } from './workspace-shell';
import { Spinner } from './spinner';
import { supabase } from '@/integrations/supabase/client';
import { fr } from '@/lib/fr';

// --- Asset visuel panneau de droite ---
// creative-studio.jpg : photo d'un atelier lumineux avec carnet et thé,
// choisie pour évoquer la créativité et l'inspiration de la plateforme.
// L'URL est résolue à la compilation depuis le fichier .asset.json Lovable.
import studioAsset from '@/assets/creative-studio.jpg.asset.json';
const studio = studioAsset.url;

// Les trois états de l'écran auth (affichage, animation de sortie, confirmation)
type Phase = 'form' | 'leaving' | 'confirm';

// Durée en ms de l'animation de sortie "scroll away" avant d'afficher l'écran suivant
const EXIT_MS = 1050;

// Génère les variables CSS --i pour décaler l'animation stagger de chaque élément
const at = (i: number) => ({ '--i': i }) as CSSProperties;

// Vérifie si l'utilisateur a activé "Préférer les mouvements réduits" (accessibilité)
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AuthScreen() {
  const [signup, setSignup] = useState(false);    // Mode inscription vs connexion
  const [show, setShow] = useState(false);         // Affichage/masquage du mot de passe
  const [busy, setBusy] = useState(false);         // Requête en cours (désactive le bouton)
  const [error, setError] = useState('');          // Message d'erreur affiché sous le formulaire
  const [phase, setPhase] = useState<Phase>('form');
  const [sentTo, setSentTo] = useState('');        // Email auquel le lien de confirmation a été envoyé
  // Rôle choisi à l'inscription : 'creator' (mode dev) ou 'viewer' (utilisateur normal)
  const [intendedRole, setIntendedRole] = useState<'creator' | 'viewer'>('viewer');
  const navigate = useNavigate();

  /**
   * Déclenche l'animation de sortie, puis exécute `next` après EXIT_MS ms.
   * Si l'utilisateur a activé "reduced motion", on saute l'animation.
   */
  function leaveThen(next: () => void) {
    if (reducedMotion()) { next(); return; }
    setPhase('leaving');
    window.setTimeout(next, EXIT_MS);
  }

  /**
   * Gestionnaire principal du formulaire.
   * Valide les champs côté client, puis appelle Supabase Auth.
   * Après succès :
   *   - Inscription sans session → affiche la phase de confirmation email
   *   - Connexion avec session   → détermine le rôle et redirige (/creator ou /moderation)
   */
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const fields = new FormData(e.currentTarget);
    const email = String(fields.get('email'));
    const password = String(fields.get('password'));

    // Validations côté client pour l'inscription
    if (signup && password.length < 8) { setError(fr.weak); return; }
    if (signup && password !== fields.get('confirm')) { setError(fr.mismatch); return; }

    setBusy(true);
    try {
      // Appel Supabase : signUp ou signInWithPassword selon le mode actif
      const result = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: String(fields.get('name')),
                intended_role: intendedRole,  // 'creator' | 'viewer'
              },
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        // Traduction des erreurs Supabase en messages français
        const msg = result.error.message.toLowerCase();
        throw new Error(
          msg.includes('already') ? fr.used :
          msg.includes('invalid') ? fr.invalid :
          msg.includes('weak')    ? fr.weak :
          fr.authError
        );
      }

      // Pas de session = inscription réussie mais email non confirmé
      if (!result.data.session) {
        if (!signup) throw new Error(fr.authError);
        setSentTo(email);
        leaveThen(() => setPhase('confirm'));
        return;
      }

      // Connexion réussie : vérification du rôle pour la redirection
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error(fr.authError);

      // Lecture de la table user_roles pour déterminer le rôle
      const roles = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.user.id);
      if (roles.error) throw new Error(fr.authError);

      const isModerator = roles.data.some(x => x.role === 'moderator');
      const isCreatorInDb = roles.data.some(x => x.role === 'creator');
      const userIntendedRole = user.user.user_metadata?.['intended_role'];
      // Viewer = pas de rôle creator/moderator en DB ET intended_role !== 'creator'
      const isViewerUser = !isModerator && !isCreatorInDb && userIntendedRole !== 'creator';

      const to = isModerator
        ? '/moderation' as const
        : isViewerUser
          ? '/scroll' as const
          : '/creator' as const;

      leaveThen(() => void navigate({ to }));
    } catch (err) {
      setError(err instanceof Error ? err.message : fr.authError);
    } finally {
      setBusy(false);
    }
  }

  const toggleMode = () => { setSignup(!signup); setError(''); };

  // Compteur d'index pour les animations stagger (chaque élément apparaît avec un délai croissant)
  let i = 0;

  return (
    <div className={`auth-page ${phase === 'leaving' ? 'is-leaving' : ''}`}>

      {/* En-tête : logo de marque + slogan de sécurité */}
      <header className="auth-header">
        <Brand/>
        <span className="auth-tag"><LockKeyhole size={14}/>{fr.authFoot}</span>
      </header>

      <main className="auth-main">

        {/* Phase 'confirm' : message de confirmation email après inscription */}
        {phase === 'confirm' ? (
          <div className="auth-form-area auth-confirm" key="confirm">
            <span className="confirm-icon stagger-item" style={at(0)}><MailCheck size={28}/></span>
            <h1 className="stagger-item" style={at(1)}>{fr.confirmTitle}<span className="brand-dot">.</span></h1>
            <p className="auth-subtitle stagger-item" style={at(2)}>
              {fr.confirmSent} <strong>{sentTo}</strong>. {fr.confirmNext}
            </p>
            <Button size="lg" className="stagger-item" style={at(3)} onClick={() => { setSignup(false); setPhase('form'); }}>
              {fr.backToLogin}<ArrowRight size={18}/>
            </Button>
          </div>
        ) : (
          /* Phase 'form' : formulaire de connexion / inscription */
          <div className="auth-form-area" key={signup ? 'signup' : 'login'}>
            <div className="auth-eyebrow stagger-item" style={at(i++)}><span className="online-dot"/>{fr.welcome}</div>
            <h1 className="stagger-item" style={at(i++)}>
              {signup ? fr.signupTitle : fr.loginTitle}<span className="brand-dot">.</span>
            </h1>
            <p className="auth-subtitle stagger-item" style={at(i++)}>{fr.authSubtitle}</p>

            <form onSubmit={submit} className="auth-form">
              {/* Champ Nom : visible uniquement en mode inscription */}
              {signup && (
                <label className="stagger-item" style={at(i++)}>
                  {fr.name}<input name="name" required autoComplete="name" placeholder="Alex Morgan"/>
                </label>
              )}

              {/* Sélecteur de rôle : visible uniquement en mode inscription */}
              {signup && (
                <div className="role-picker stagger-item" style={at(i++)}>
                  <p className="role-picker-label">{fr.roleChoice}</p>
                  <div className="role-cards">
                    {/* Carte Utilisateur normal */}
                    <button
                      type="button"
                      id="role-viewer"
                      className={`role-card ${intendedRole === 'viewer' ? 'selected' : ''}`}
                      onClick={() => setIntendedRole('viewer')}
                    >
                      <span className="role-card-icon"><User size={22}/></span>
                      <span className="role-card-title">{fr.roleViewer}</span>
                      <span className="role-card-desc">{fr.roleViewerDesc}</span>
                      {intendedRole === 'viewer' && <span className="role-card-check"><Check size={14}/></span>}
                    </button>

                    {/* Carte Créateur (mode développeur) */}
                    <button
                      type="button"
                      id="role-creator"
                      className={`role-card ${intendedRole === 'creator' ? 'selected' : ''}`}
                      onClick={() => setIntendedRole('creator')}
                    >
                      <span className="role-card-icon creator"><PenLine size={22}/></span>
                      <span className="role-card-title">{fr.roleCreator}</span>
                      <span className="role-card-desc">{fr.roleCreatorDesc}</span>
                      {intendedRole === 'creator' && <span className="role-card-check"><Check size={14}/></span>}
                    </button>
                  </div>
                </div>
              )}

              <label className="stagger-item" style={at(i++)}>
                {fr.email}<input name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr"/>
              </label>

              {/* Champ mot de passe avec bouton œil pour afficher/masquer */}
              <label className="stagger-item" style={at(i++)}>
                {fr.password}
                <div className="password-input">
                  <input
                    name="password"
                    type={show ? 'text' : 'password'}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    required
                    placeholder="••••••••"
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label={show ? fr.hidePassword : fr.showPassword} onClick={() => setShow(!show)}>
                    {show ? <EyeOff/> : <Eye/>}
                  </Button>
                </div>
              </label>

              {/* Confirmation mot de passe : visible uniquement en mode inscription */}
              {signup && (
                <label className="stagger-item" style={at(i++)}>
                  {fr.confirmPassword}
                  <input name="confirm" type={show ? 'text' : 'password'} required autoComplete="new-password" placeholder="••••••••"/>
                </label>
              )}

              {/* Affichage de l'erreur (rôle="alert" pour l'accessibilité) */}
              {error && <p role="alert" className="form-error">{error}</p>}

              {/* Lien "mot de passe oublié / première connexion" : route publique obligatoire
                  pour les utilisateurs migrés qui n'ont pas encore de mot de passe */}
              {!signup && (
                <Link to="/forgot-password" className="auth-forgot stagger-item" style={at(i++)}>
                  {fr.forgot}
                </Link>
              )}

              <Button size="lg" disabled={busy || phase !== 'form'} type="submit" className="stagger-item" style={at(i++)}>
                {busy ? fr.loading : signup ? fr.signup : fr.login}
                {busy ? <Spinner size={18}/> : <ArrowRight size={18}/>}
              </Button>
            </form>

            {/* Lien pour basculer entre connexion et inscription */}
            <p className="auth-switch stagger-item" style={at(i++)}>
              {signup ? fr.hasAccount : fr.noAccount}{' '}
              <Button variant="link" onClick={toggleMode}>{signup ? fr.login : fr.signup}</Button>
            </p>
            <div className="auth-trust stagger-item" style={at(i++)}><Check size={15}/>{fr.authFoot}</div>
          </div>
        )}

        {/* Panneau visuel de droite : image d'ambiance + accroche de la marque
            L'image studio (atelier créatif) est hébergée sur le CDN Lovable. */}
        <div className="auth-visual stagger-item" style={at(3)}>
          <img src={studio} alt="Carnet créatif et thé dans un atelier lumineux"/>
          <div className="auth-visual-copy">
            <span><Sparkles size={19}/>{fr.brand}</span>
            <h2>Les petites idées font<br/>les grandes découvertes.</h2>
            <p>{fr.studioSubtitle}</p>
          </div>
          <div className="visual-caption">CRÉER · PARTAGER · INSPIRER</div>
        </div>

      </main>

      <footer className="auth-footer">© 2026 CreativeScroll<span>{fr.authFoot}</span></footer>
    </div>
  );
}
