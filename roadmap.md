# Roadmap CreativeScroll

## Migration vers Lovable Cloud

- [x] Migrer l'app CreativeScroll, la base de données, les rôles, les règles d'accès et le stockage média vers Lovable Cloud
- [x] Première connexion pour les utilisateurs migrés via « Mot de passe oublié ou première connexion » (vérification email + nouveau mot de passe)
- [ ] Importer les enregistrements et utilisateurs existants (bloqué : exports CSV/JSON de l'ancienne base de données non fournis)
- [ ] Importer les anciens fichiers médias (bloqué : fichiers de stockage de contenu-media non fournis)
- [ ] Attribuer le rôle modérateur aux bons comptes après import des utilisateurs (bloqué : export utilisateurs manquant)
- [ ] Publier et basculer depuis l'ancienne adresse de l'app (en attente côté utilisateur)

---

## Backlog produit — Sprint 2 : Visiteurs, Utilisateurs, Signalements et UX

> Les captures d'écran du backlog sont archivées dans `docs/backlog/`.

| Fonctionnalité | ID | User story | Tâches | Story points |
|---|---|---|---|---|
| Accès visiteur | US08 | En tant que visiteur, je veux m'inscrire comme utilisateur afin d'accéder au contenu de l'application. | • Adapter les écrans d'inscription pour le rôle « utilisateur » • Réutiliser Supabase Auth • Rediriger vers le fil après connexion | 3 |
| Fil de contenu | US09 | En tant qu'utilisateur, je veux consulter un fil de contenus validés afin de découvrir des contenus positifs. | • Développer le défilement vertical fluide • Récupérer les contenus au statut « Validé » • Afficher les cartes (titre, catégorie, aperçu) • Gérer les cas « aucun contenu » et « erreur réseau » | 8 |
| Activités | US10 | En tant qu'utilisateur, je veux jouer à des mini-jeux, répondre à des quiz et résoudre des puzzles afin de remplacer le défilement passif par des activités stimulantes. | • Afficher la liste des activités • Développer l'écran d'instructions et le démarrage • Calculer et afficher le score • Gérer l'abandon de la partie | 5 |
| Défis de bien-être | US11 | En tant qu'utilisateur, je veux relever des défis de bien-être afin d'adopter des habitudes plus saines. | • Créer le modèle de défi • Développer la liste et le détail des défis • Valider l'accomplissement • Attribuer des points | 5 |
| Progression | US12 | En tant qu'utilisateur, je veux suivre ma progression afin de rester motivé. | • Créer la table Progress • Enregistrer scores, séries et récompenses • Développer l'écran de progression • Gérer l'échec d'enregistrement (réseau) | 3 |
| Signalement | US13 | En tant qu'utilisateur, je veux signaler un contenu inapproprié afin de protéger la communauté. | • Ajouter le bouton « Signaler » • Choisir un motif de signalement • Enregistrer le signalement dans la table Report • Afficher une confirmation | 3 |
| UX et lancement | US14 | En tant qu'utilisateur, je veux une application fluide et claire afin d'avoir une bonne expérience. | • Harmoniser les écrans et la navigation • Gérer les états vides, chargements et erreurs • Optimiser les performances • Préparer le lancement (CI/CD) | 5 |
