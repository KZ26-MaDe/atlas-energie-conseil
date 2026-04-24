# Release Process

Ce document définit le workflow simple de développement, validation et publication pour Atlas Energie Conseil.

## Objectif

Permettre des évolutions propres, testées et versionnées, sans casser la version en production.

## Branches

### `main`

- branche de production
- toujours déployable
- ne reçoit que du code validé

### `develop`

- branche de préparation de la prochaine release
- regroupe les features prêtes à être testées ensemble

### `feature/*`

- branche isolée pour chaque sujet
- créée depuis `develop`
- fusionnée dans `develop` après validation

## Workflow de release

1. Développer la fonctionnalité localement sur une branche `feature/*`
2. Tester localement
3. Déployer une preview ou un environnement de staging
4. Valider desktop, mobile, liens, médias et contenu
5. Fusionner la branche `feature/*` dans `develop`
6. Préparer les notes de release
7. Fusionner `develop` dans `main`
8. Déployer `main` en production
9. Enregistrer la release dans `CHANGELOG.md`
10. Créer un tag Git, par exemple `v1.0.1`

## Pré-release checklist

### Liens et navigation

- tous les liens de navigation fonctionnent
- les CTA Hero fonctionnent
- le lien email ouvre bien `mailto:`
- le lien WhatsApp ouvre la bonne conversation
- le lien LinkedIn pointe vers le bon profil
- le lien `Retour en haut` fonctionne

### Contact et actions

- les cartes de contact sont entièrement cliquables
- les hover states restent propres et cohérents
- aucune action ne pointe vers un placeholder

### Médias

- les images se chargent correctement
- la vidéo Hero se lance correctement
- le fallback poster fonctionne si la vidéo ne charge pas
- aucun média cassé ou doublon accidentel utilisé en production

### Responsive QA

- desktop : composition propre, aucun vide disproportionné
- laptop : Hero, cartes et footer équilibrés
- tablette : grilles et médias bien empilés
- mobile : lisibilité, espacements, boutons et cards propres

### Qualité visuelle

- typographie cohérente
- rayons et ombres cohérents
- cartes alignées
- aucune zone trop vide ou mal équilibrée

### Performance basics

- assets lourds revus avant release
- images principales optimisées
- vidéo Hero contrôlée en taille et qualité
- pas d’assets inutiles référencés dans la page

### Footer et légal

- `Mentions légales` accessibles
- `Politique de confidentialité` accessible
- footer propre et aligné
- aucun texte temporaire ou placeholder visible

## Workflow Git recommandé

### Créer la release initiale

1. `git init`
2. `git add .`
3. `git commit -m "release: v1.0.0 initial production site"`
4. `git branch -M main`
5. `git tag v1.0.0`
6. `git checkout -b develop`

### Démarrer une nouvelle fonctionnalité

1. `git checkout develop`
2. `git pull`
3. `git checkout -b feature/nom-de-la-feature`

### Préparer une nouvelle release

1. mettre à jour `CHANGELOG.md`
2. vérifier la checklist complète
3. fusionner dans `main`
4. taguer la version
5. déployer la production

## Notes importantes

- ne jamais développer directement sur `main`
- chaque release doit être identifiable par un tag
- garder une version stable déployable en permanence
- documenter tout changement visible ou structurel dans le changelog
