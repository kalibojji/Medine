# Audit — Vocabulaire Médine

Version analysée : `BUILD 20261112-1533` (dépôt `kalibojji/Medine`, branche `main`).
Méthode : lecture du dépôt, extraction des régions (données, application, styles), analyse statique,
lecture ciblée du moteur de révision et du routeur, captures d'écran automatisées (Chromium 390×844),
audit d'accessibilité axe-core (WCAG 2.1 AA).

## 1. Cartographie

| Partie | Mesure |
| --- | --- |
| `index.html` | 2,17 Mo → **1,78 Mo** après extraction des polices, 3 805 lignes |
| En-tête `<head>` | 526 octets → **1,8 Ko** (titre, description, canonical, Open Graph) |
| Styles | ~425 Ko, dont 400 Ko de polices base64 (désormais `fonts/*.woff`) |
| Données (`application/json`) | 34 tomes, 650 leçons, 1 404 règles, 10 556 mots, 1 223 exercices |
| Application | 693 Ko, 599 fonctions, ~50 vues, routeur central |
| PWA | `manifest.json`, `sw.js` (coquille + polices précachées), icônes 192/512 |

Le routeur (`render`) couvre une cinquantaine d'écrans : accueil, parcours guidé, cours,
entraînement adaptatif, tests, bibliothèque, analyse, Coran (sourates, juz, mémorisation, tajwid),
hadiths, alphabet, conjugaison, dictée, écoute, enregistrement, badges, objectifs, sauvegarde.

## 2. Ce qui est déjà solide

- **Moteur de révision sérieux** : modèle de type FSRS à 21 paramètres (`R`, `next`, `recallS`,
  `forgetS`, `shortS`, `interval`), historique par carte, calibrage automatique (`fit`, `auto`,
  `logLoss`) sur les révisions réelles.
- **Parcours d'apprentissage complet** : accueil avec séance du jour et séance courte, entraînement
  adaptatif, séance guidée leçon par leçon, objectif hebdomadaire, série et XP.
- **Remédiation** : vue « Mots difficiles » (échecs > réussites) avec révision dédiée.
- **Contenu massif et structuré** : leçons, règles, phrases, racines, formulaires, lexique coranique.
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
3. **Contraste insuffisant** sur les titres de section (3,6–4,3:1, seuil 4,5:1).
   → couleurs ajustées (4,8–5,1:1), vérifié en clair et en sombre par axe-core.
4. **Hiérarchie de l'accueil inversée** : le bloc de récupération de sauvegarde et le prompt
   d'installation précédaient le titre et l'action principale.
   → titre, recherche, séance du jour, puis récupération sous forme de ligne discrète.
5. **Aucun socle de vérification** : fichier édité à la main, un seul test.
   → `tools/check.mjs` (34 invariants), test navigateur + captures, test hors-ligne, CI GitHub Actions.

### Restant
6. **Poids initial** : 1,46 Mo de JS inline et 775 Ko de données dans le HTML ; rien n'est interactif
   avant le parsing complet. Piste : extraire les données en `data.json` précaché et monter la
   coquille d'abord.
7. **Monofichier** : pas de modules ni de séparation source/produit ; revue difficile.
8. **Hors-ligne partiel** : texte coranique et audio dépendent de CDN tiers, sans repli explicite.
9. **Écran d'onboarding mort** : `helloV` étape 2 (« Que veux-tu faire ? ») est inatteignable
   (`hellogo` va directement à l'accueil) — à supprimer ou à rebrancher.
10. **Rétention non mesurée** : statistiques de volume (jours, réponses, série) mais pas de taux de
    rappel à 7/30 jours, pourtant calculable depuis l'historique FSRS.
11. **Injection HTML** : 26 `innerHTML` ; une sauvegarde importée est du contenu externe à valider.

## 4. Plan

- **Phase 0 — socle** : ✅ en-tête, tests, CI, versionnement du service worker.
- **Phase 1 — performance** : ✅ polices séparées ; à suivre : données hors du HTML.
- **Phase 2 — ergonomie** : ✅ hiérarchie de l'accueil, contraste ; à suivre : onboarding, états vides.
- **Phase 3 — apprentissage** : plan de charge quotidien, taux de rétention, remédiation visible dès
  l'accueil.
- **Phase 4 — hors-ligne** : pack téléchargeable (sourates/audio choisis) et repli explicite.

## 5. Vérification

```sh
npm run verify   # 36 invariants + contenu + navigation/captures/axe + hors-ligne
```

Statut : socle opérationnel, 4 commits sur `agent/phase0-seo`.
