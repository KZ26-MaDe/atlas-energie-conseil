# Atlas Energie Conseil

Site one-page premium en `HTML`, `CSS` et `JavaScript` pour Atlas Energie Conseil.

## Version actuelle

La version de référence actuelle est `v2.0.0`.

La branche `feature/v2.3.0-multilingual-seo-urls` prépare des URLs multilingues crawlables pour le SEO : `/fr/`, `/en/`, `/ar/` et `/es/`.

## Stack

- `index.html`
- `style.css`
- `script.js`
- `assets/images`
- `assets/video`
- `assets/docs`
- `assets/i18n`
- `assets/favicon.svg`
- `fr/`, `en/`, `ar/`, `es/`
- `tools/build_language_pages.py`

## Structure du projet

```text
atlas-energie-conseil/
├── assets/
│   ├── favicon.svg
│   ├── images/
│   ├── i18n/
│   └── video/
├── fr/
├── en/
├── ar/
├── es/
├── tools/
├── index.html
├── style.css
├── script.js
├── README.md
├── CHANGELOG.md
└── RELEASE_PROCESS.md
```

## Branch strategy recommandée

- `main`
  Utilisée uniquement pour la production live.
- `develop`
  Branche d’intégration de la prochaine release.
- `feature/*`
  Branches isolées pour chaque évolution ou correctif.

Exemples :

- `feature/hero-video-optimization`
- `feature/legal-pages`
- `feature/mobile-polish`
- `fix/contact-links`

## Workflow recommandé

1. Créer une branche depuis `develop`.
2. Développer localement sur une branche `feature/*`.
3. Vérifier la page sur desktop, tablette et mobile.
4. Déployer une preview ou un staging.
5. Valider contenu, médias, liens et rendu.
6. Fusionner dans `develop`.
7. Préparer la release et les notes de version.
8. Fusionner `develop` dans `main`.
9. Déployer `main` en production.
10. Taguer la release, par exemple `v1.8.0`.

## Déploiement

Le projet est statique et peut être déployé facilement sur :

- GitHub Pages
- Netlify
- Vercel
- n’importe quel hébergement statique HTTPS

## Génération des pages multilingues

Les pages statiques crawlables sont générées depuis `index.html` et les fichiers JSON dans `assets/i18n/`.

```powershell
python tools/build_language_pages.py
```

Le script produit :

- `fr/index.html`
- `en/index.html`
- `ar/index.html`
- `es/index.html`

## Notes de maintenance

- Garder les chemins d’assets root-relatifs pour que les pages sous `/fr/`, `/en/`, `/ar/` et `/es/` chargent correctement.
- Ne pas travailler directement sur `main`.
- Documenter chaque release dans [CHANGELOG.md](C:/Users/zergo/.codex/atlas-energie-conseil/CHANGELOG.md).
- Suivre le processus décrit dans [RELEASE_PROCESS.md](C:/Users/zergo/.codex/atlas-energie-conseil/RELEASE_PROCESS.md).

## Prochaine étape recommandée

Créer le dépôt Git/GitHub puis :

1. commit du site actuel
2. tag `v1.5.0`
3. création de `develop`
4. démarrage des futures évolutions sur `feature/*`
