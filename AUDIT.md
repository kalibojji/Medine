# Audit — Vocabulaire Médine

Version analysée : `BUILD 20261112-1533` (dépôt `kalibojji/Medine`, branche `main`).
Méthode : lecture du dépôt, extraction des régions (données, application, styles), analyse statique,
lecture ciblée du moteur de révision et du routeur, captures d'écran automatisées (Chromium 390×844),
audit d'accessibilité axe-core (WCAG 2.1 AA), parcours de test réels (accueil, exercices, statistiques,
leçons, quiz, livres, Coran).

## 1. Cartographie

| Partie | Mesure |
| --- | --- |
| `index.html` | 2,17 Mo → **1,78 Mo** après extraction des polices, 3 805 lignes |
| En-tête `<head>` | 526 octets → **1,8 Ko** (titre, description, canonical, Open Graph) |
| Styles | ~425 Ko, dont 400 Ko de polices base64 (désormais `fonts/*.woff`) |
| Données des tomes | 34 tomes, 650 leçons, 10 556 entrées de vocabulaire de leçon |
| Application | 693 Ko, 599 fonctions, ~50 vues, routeur central |
| Révision noyau | 23 groupes, 525 mots, deux sens (arabe → français et inverse) |
| PWA | `manifest.json`, `sw.js` (coquille + polices précachées), icônes 192/512 |

Le routeur (`render`) couvre une cinquantaine d'écrans : accueil, parcours guidé, cours,
entraînement adaptatif, tests, bibliothèque, analyse, Coran (sourates, juz, mémorisation, tajwid),
hadiths, alphabet, conjugaison, dictée, écoute, enregistrement, badges, objectifs, sauvegarde.

## 2. Ce qui est déjà solide

- **Moteur de révision sérieux** : modèle de type FSRS à 21 paramètres (`R`, `next`, `recallS`,
  `forgetS`, `shortS`, `interval`), historique par carte, calibrage automatique (`fit`, `auto`,
  `logLoss`) sur les révisions réelles.
- **Révision étendue** : les mots rencontrés dans les quiz des autres livres (tomes 2-3, Riyadh,
  Al-Asâsî) reviennent via le même moteur (`xDueIds`, `xGrade`, `xStat`).
- **Parcours d'apprentissage complet** : séance du jour et séance courte, entraînement adaptatif,
  séance guidée leçon par leçon, objectif hebdomadaire, série et XP.
- **Remédiation** : vue « Mots difficiles » (échecs > réussites) avec révision dédiée, désormais
  visible aussi dans *S'entraîner*.
- **Contenu massif et structuré** : leçons, règles, phrases, racines, formulaires, lexique coranique.
- **Hors-ligne** : service worker, précache des polices, téléchargement des sourates (`offdl`).
- **Sobriété technique** : zéro framework, zéro back-end, zéro compte ; données locales.
- **Design system cohérent** : variables CSS, mode sombre, `focus-visible`, zones sûres iOS,
  barre d'onglets à quatre entrées.
- **Bases d'accessibilité** : `aria-*`, libellés, `alt`, navigation clavier.

## 3. Faiblesses constatées et corrections

### Corrigé
1. **En-tête incomplet** : `title` dans le `<body>`, aucune description/canonical/Open Graph.
   → en-tête complet, partage social et indexation fonctionnels.
2. **Polices en base64** (400 Ko dans le HTML, non cacheables séparément).
   → `fonts/*.woff` + précache service worker ; `index.html` −18 %.
3. **Contraste insuffisant** sur les titres de section (3,6–4,3:1) et les puces d'état (4,29:1).
   → couleurs ajustées (4,8–5,1:1 et 4,94:1), vérifié en clair et en sombre par axe-core.
4. **Hiérarchie de l'accueil inversée** : le bloc de récupération de sauvegarde et le prompt
   d'installation précédaient le titre et l'action principale.
   → titre, recherche, séance du jour, puis récupération sous forme de ligne discrète.
5. **Aucun socle de vérification** : fichier édité à la main, un seul test.
   → `tools/check.mjs` (36 invariants dont budgets de poids), `tools/data-check.mjs`,
   test navigateur sur 8 écrans avec captures et axe-core (clair/sombre), test hors-ligne, CI GitHub Actions.
6. **Rétention non mesurée** : → carte « Mémoire » dans *Statistiques* (rappel après 7 jours ou plus,
   calculé sur l'historique FSRS).
7. **Remédiation peu visible** : → carte « À consolider » dans *S'entraîner* dès 3 mots en échec
   répété, avec révision dédiée.
8. **Accueil de plus de 3 000 px** et six grilles de fonctions qui dupliquaient le menu : → accueil
   ramené à ~1 650 px avec six entrées vers un écran **Explorer** par catégorie ; menu *Plus*
   regroupé par usage (Mon suivi, Apprendre, Données et rappels, Aide).
9. **Hiérarchie visuelle et cibles tactiles** inégales sur mobile : → couche de raffinement (cibles
   52–60 px, rayons, ombres et espacements cohérents, onglet actif en pastille, recherche agrandie),
   *S'entraîner* allégé, focus déplacé sur le titre à chaque changement d'écran, aide des raccourcis
   affichée seulement au clavier, et respect de `prefers-reduced-motion`.

### Restant
8. **Poids initial** : 1,46 Mo de JS inline et 775 Ko de données dans le HTML ; rien n'est interactif
   avant le parsing complet (522 Ko compressés). Piste : mesurer le démarrage réel et décider d'un
   découpage données/application.
9. **Monofichier** : pas de modules ni de séparation source/produit ; revue difficile.
10. **Écran d'onboarding mort** : `helloV` étape 2 (« Que veux-tu faire ? ») est inatteignable
    (`hellogo` va directement à l'accueil) — à supprimer ou à rebrancher.
11. **Injection HTML** : 26 `innerHTML` ; une sauvegarde importée est du contenu externe à valider.
12. **Hors-ligne à la première visite** : le texte coranique et l'audio restent des services tiers
    jusqu'au téléchargement de la sourate.

## 4. Plan

- **Phase 0 — socle** : ✅ en-tête, tests, CI, versionnement du service worker.
- **Phase 1 — performance** : ✅ polices séparées, budgets ; à suivre : mesurer le démarrage et décider du découpage.
- **Phase 2 — ergonomie** : ✅ hiérarchie de l'accueil, contrastes ; à suivre : onboarding, états vides.
- **Phase 3 — apprentissage** : ✅ rétention 7 jours, remédiation visible ; à suivre : plan de charge.
- **Phase 4 — hors-ligne** : téléchargement par sourate existant ; à suivre : repli explicite.

## 5. Vérification

```sh
npm run verify   # 36 invariants + contenu + navigation/captures/axe + hors-ligne
```

Statut : socle opérationnel, 12 commits sur `agent/phase0-seo`, PR #1, CI verte.
