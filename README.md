# Vocabulaire Médine

Application d'apprentissage du vocabulaire arabe du **Tome de Médine** : leçons guidées, révision
espacée, phrases à construire, Coran, hadiths, alphabet et conjugaison. Application web installable
(PWA), sans compte et sans serveur : toute la progression reste sur l'appareil.

Site : https://kalibojji.github.io/Medine/

## Contenu

- **650 leçons** réparties en 34 tomes, **10 556 mots**, **1 404 règles**, **1 223 exercices**
- Parcours guidé leçon par leçon, cours et phrases types
- Révision espacée de type FSRS (21 paramètres, calibrage automatique sur les révisions réelles)
- Coran : sourates et juz, lexique, mémorisation, audio et tajwid
- Hadiths, alphabet, conjugaison, dictée, écoute, enregistrement de la voix
- Objectifs, badges, séries, statistiques, sauvegarde/restauration

## Architecture

Le déploiement est un **fichier unique** `index.html` :

| Partie | Rôle |
| --- | --- |
| `<head>` | métadonnées, manifeste, icône Apple |
| `<style>` | thème et composants (variables CSS, mode sombre) |
| `<script type="application/json">` | données pédagogiques |
| `<script>` | application (routeur, révision espacée, exercices) |

Les polices sont dans `fonts/` (`.woff`), le service worker `sw.js` précache la coquille et les
icônes. Aucune dépendance JavaScript externe.

## Développement

Prérequis : Node.js 22+.

```sh
npm install
npm run verify      # vérifications statiques + test navigateur (Playwright)
```

- `npm run check` : invariants statiques (en-tête, polices, données JSON, syntaxe, manifeste, SW).
- `npm test` : charge l'application dans Chromium, parcourt la navigation principale et capture
  des écrans dans `tests/screens/`.

La CI (`.github/workflows/ci.yml`) exécute les deux à chaque push.

## Déploiement

GitHub Pages publie la branche `main` à la racine. Le service worker met en cache la coquille ; les
mises à jour sont servies en réseau d'abord pour les navigations.

## Données personnelles

Aucun compte, aucun serveur applicatif. La progression est stockée dans le navigateur
(`localStorage` + IndexedDB) et exportable en fichier de sauvegarde. Les contenus coraniques et
audio sont chargés depuis des services publics tiers lorsque l'utilisateur les ouvre.

## Licence

Code sous licence MIT. Polices sous SIL Open Font License : voir `OFL-Figtree.txt` et
`OFL-Scheherazade.txt`. Outil d'étude indépendant, non affilié aux auteurs du Tome de Médine.
