# Changelog

Toutes les évolutions notables de ce projet doivent être documentées ici.

Le format suit une logique simple inspirée de Keep a Changelog et du versioning sémantique.

## [Unreleased]

### Planned

- Optimisation réelle des assets médias lourds
- Suppression des doublons d’assets inutilisés
- Ajout éventuel d’un staging automatisé
- Vérifications Lighthouse / performance plus poussées

## [1.7.0] - 2026-05-05

Lead Magnet & Content Offer pour proposer une checklist de décision avant investissement solaire, stockage ou hybride.

### Added

- Added checklist lead-magnet section
- Added WhatsApp checklist request CTA
- Added email checklist request CTA
- Added checklist preview content
- Added GA4 tracking attributes for checklist CTAs

### Verified

- Verified responsive behavior

## [1.6.1] - 2026-04-30

Indexing & Analytics Review pour documenter le contrôle technique SEO, tracking et stabilité responsive.

### Verified

- Completed indexing and analytics review
- Verified GA4 tracking and CTA events
- Verified `robots.txt` and `sitemap.xml`
- Verified FAQPage and ProfessionalService JSON-LD
- Verified responsive behavior and no horizontal overflow
- No code fixes required

## [1.6.0] - 2026-04-30

FAQ & SEO Content pour renforcer la compréhension des sujets énergie, solaire photovoltaïque, stockage batterie, autoconsommation, backup et analyse énergétique au Maroc.

### Added

- Added FAQ section “Questions clés avant décision”
- Added SEO-focused visible FAQ content
- Added FAQPage JSON-LD

### Updated

- Updated sitemap lastmod

### Verified

- Verified responsive FAQ behavior

## [1.5.0] - 2026-04-30

SEO & Google Search Console Setup pour préparer le crawl et l’indexation de la one-page.

### Added

- Added `robots.txt`
- Added `sitemap.xml`
- Added structured data for Atlas Energie Conseil as a professional service

### Improved

- Improved SEO and social sharing metadata
- Prepared Google Search Console indexing setup

## [1.4.1] - 2026-04-29

Google Analytics 4 Setup pour mesurer les visites, les sources de trafic, les appareils et les actions clés.

### Added

- Added Google Analytics 4 tracking with Measurement ID `G-CKMCHRD1Q8`
- Added CTA click event tracking
- Added pre-diagnostic completion tracking

### Verified

- Verified contact links and diagnostic flow

## [1.4.0] - 2026-04-29

Pré-diagnostic énergétique pour orienter les visiteurs et préparer un premier échange qualifié sans simulation technique.

### Added

- Added the `Pré-diagnostic énergétique` lead generator section
- Added 7 multiple-choice questions to clarify site type, objective, consumption profile, battery interest, continuity needs and project stage
- Added indicative client-side result logic for energy analysis, PV, PV + battery, resilience / backup and first-exchange orientations
- Added a result CTA toward the contact section and a reset action

### Improved

- Improved mobile and responsive presentation for the new diagnostic card
- Added clear wording that the diagnostic is indicative and does not replace a technical or financial study

## [1.2.0] - 2026-04-28

Contact & Trust Optimization pour renforcer la confiance et faciliter le premier échange qualifié.

### Added

- Added subtle trust elements in the contact area
- Added prepared WhatsApp message for project inquiries
- Added prepared email subject and body for first-contact requests
- Added canonical URL and improved Open Graph / Twitter sharing metadata

### Improved

- Improved contact copy around confidential exchange, need qualification, priorities and concrete next steps
- Verified LinkedIn profile link behavior with new-tab opening and secure `rel` attributes
- Verified SEO / sharing basics using the existing Hero poster asset

## [1.1.1] - 2026-04-28

Hotfix de production pour corriger le décalage de style observé en ligne sur la section Lead Optimization.

### Fixed

- Fixed online styling mismatch for the lead optimization situations section by versioning stylesheet assets
- Versioned the JavaScript asset reference as a complementary cache-busting safeguard

## [1.1.0] - 2026-04-28

Lead Optimization pour améliorer la qualification des demandes entrantes et clarifier les situations d’intervention.

### Added

- Added the `Les situations où nous intervenons` section after the Hero
- Added decision-oriented cards for cost, profitability, storage, resilience, investment and independent review needs
- Added a dedicated call to action toward the contact section after the new situations section

### Improved

- Improved Hero positioning for industrial companies, tertiary sites, developers and investors
- Improved CTA guidance from Hero to the new situations section and contact area
- Improved contact intro copy for a more direct and confidential qualification path

## [1.0.2] - 2026-04-28

Mobile Polish & Production Stabilization pour renforcer la qualité responsive de la version live.

### Fixed

- Fixed remaining mobile horizontal overflow risks
- Fixed Hero mobile framing and text bounds
- Fixed responsive media cards for `Vision projet` and `Secteurs cibles`
- Improved mobile card grids, CTA wrapping and header stability
- Verified image and video containers across mobile, tablet and desktop widths

## [1.0.1] - 2026-04-27

Hotfix mobile de production pour corriger les débordements horizontaux et stabiliser la mise en page responsive.

### Fixed

- Fixed mobile horizontal overflow
- Fixed responsive image cards
- Improved hero mobile layout
- Improved mobile section grids

## [1.0.0] - 2026-04-24

Première release de production stable du site Atlas Energie Conseil.

### Added

- Site one-page complet en français
- Hero premium avec image/poster et vidéo de fond
- Sections `Services`, `À propos`, `Secteurs`, `Pourquoi nous choisir`, `Contact`, `Footer`
- Navigation fixe avec menu mobile
- Contact direct par email, WhatsApp et LinkedIn
- Footer avec accès aux mentions légales et à la politique de confidentialité
- Métadonnées SEO de base, Open Graph, Twitter card et favicon

### Improved

- Lisibilité du Hero sur médias lumineux
- Équilibre visuel des sections et des blocs médias
- Cohérence des cartes, boutons, espacements et micro-interactions
- Responsive desktop, laptop, tablette et mobile
- Préparation du site au déploiement statique en production

### Notes

- Cette version doit être figée comme release initiale `v1.0.0`
- Les prochaines évolutions doivent partir de la branche `develop`
