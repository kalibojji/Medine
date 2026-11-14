# Audit — Vocabulaire Médine

Version analysée : `BUILD 20261112-1533` (dépôt `kalibojji/Medine`, branche `main`).
Méthode : lecture du dépôt, extraction des régions (données, application, styles), analyse statique,
lecture ciblée du moteur de révision et du routeur, mesures de taille.

## 1. Cartographie

| Partie | Mesure |
| --- | --- |
| `index.html` | 2,17 Mo, 3 805 lignes, 849 Ko compressé |
| En-tête `<head>` | 526 octets, sans `title` ni description |
| Styles | 399 Ko (dont ~400 Ko de polices en base64) + 25 Ko d'interface |
| Données (`application/json`) | 34 tomes, 650 leçons, 1 404 règles, 10 556 mots, 1 223 exercices |
| Application | 693 Ko, 599 fonctions, ~50 vues, routeur central |
| PWA | `manifest.json`, `sw.js` (cache versionné), icônes 192/512 |

Le routeur (`render`, app.js) couvre une cinquantaine d'écrans : accueil, parcours guidé, cours,
entraînement, tests, bibliothèque, analyse, Coran (sourates, juz, mémorisation, tajwid), hadiths,
alphabet, conjugaison, dictée, écoute, enregistrement, badges, objectifs, sauvegarde.

## 2. Ce qui est déjà solide

- **Moteur de révision sérieux** : modèle de type FSRS à 21 paramètres (`R`, `next`, `recallS`,
  `forgetS`, `shortS`, `interval`), historique par carte, calibrage automatique (`fit`, `auto`,
  `logLoss`) sur les révisions réelles. C'est le point le plus avancé du produit.
- **Contenu massif et structuré** : leçons, règles, phrases, racines, formulaires, lexique coranique,
  exercices — la matière d'un vrai produit d'apprentissage.
- **Sobriété technique** : zéro framework, zéro back-end, zéro compte ; données locales.
- **Design system cohérent** : variables CSS, mode sombre, `focus-visible`, zones sûres iOS,
  barre d'onglets à quatre entrées.
- **Bases d'accessibilité** : `aria-*`, libellés, `alt`, navigation clavier sur les contrôles.

## 3. Faiblesses, par priorité

### P0 — bloquantes pour un produit « sérieux »
1. **En-tête incomplet** : `title` et un `meta` sont dans le `<body>` ; pas de description, canonical,
   Open Graph ni Twitter. Le partage social et l'indexation sont quasi nuls.
2. **Aucun socle de construction ni de vérification** : le fichier de 2,17 Mo est édité à la main ;
   un seul test fumée (Playwright) ; aucune intégration continue ; service worker versionné manuellement.
3. **Poids au premier chargement** : 2,17 Mo dont 1,46 Mo de JS et ~400 Ko de polices encodées ;
   rien n'est interactif avant le parsing complet.

### P1 — qualité et durabilité
4. **Polices en base64** : elles gonflent le HTML et ne bénéficient pas du cache séparé.
5. **Dépendances réseau non déclarées** : texte coranique et audio via `api.alquran.cloud`,
   `qurancdn`, `islamic.app`, `everyayah`, `jsdelivr`. Hors-ligne partiel, disponibilité et vie privée
   dépendantes de tiers, sans repli explicite.
6. **Injection HTML** : 26 `innerHTML` ; une sauvegarde importée est du contenu externe.
7. **Monofichier** : pas de modules, pas de séparation source/produit, revue de code difficile.

### P2 — produit et apprentissage
8. **Accueil dense** : dix blocs empilés, trois sections repliées, plusieurs actions primaires
   concurrentes. La prochaine action utile n'est pas unique.
9. **Charge cognitive** : ~50 vues, de nombreux modes d'entraînement sans parcours guidé unique
   au-delà du parcours « leçon ».
10. **Moteur FSRS sans gestion des cartes « leech »** (échecs répétés) ni plan de charge quotidien
    explicite (plafond de révisions, répartition, priorisation).
11. **Pas de tableau de bord de rétention** : intervalles et prédictions existent, mais pas de
    mesure lisible « ce que je retiens à 7/30 jours ».
12. **Hors-ligne partiel** : seuls la coquille et les polices sont précachées.

## 4. Plan proposé

- **Phase 0 — socle** : en-tête/SEO, script de construction reproductible, tests et CI,
  versionnement automatique du service worker.
- **Phase 1 — performance** : polices `.woff2` séparées, découpage des ressources, cache.
- **Phase 2 — ergonomie** : refonte de l'accueil (une action primaire), onboarding en 3 étapes,
  parcours quotidien unique, états vides et retours cohérents.
- **Phase 3 — apprentissage** : plan de charge quotidien, traitement des cartes faibles,
  tableau de bord de rétention, séance adaptative.
- **Phase 4 — hors-ligne** : pack téléchargeable (sourates/audio choisis), repli et mode avion.

## 5. Critères d'acceptation
- En-tête complet et valide ; partage social correct.
- `index.html` reconstruit par un script, sortie vérifiée par un test.
- Première interaction < 1 s sur mobile milieu de gamme ; JS initial réduit d'au moins 30 %.
- Un utilisateur nouveau comprend quoi faire en moins de 10 secondes.
- Score d'accessibilité automatisé sans erreur bloquante sur les parcours principaux.

Statut : Phase 0 en cours.
