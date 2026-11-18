# Calendrier de l’Avent — Pour Mélanie (édition experte)

Site statique : une page d’accueil affiche les 24 jours de décembre sous forme de
boutons ; chaque bouton ne devient cliquable qu’à sa date (heure de Paris),
comme un calendrier de l’Avent. Chaque jour ouvre une page avec une histoire et
une énigme ; la page des solutions se débloque le 24 décembre.

## Structure

- `index.html` — accueil, grille des 24 boutons (verrouillés / ouverts / vus)
- `jours/1.html` … `jours/24.html` — une page par jour
- `a-propos.html` — couverture + mode d’emploi
- `solutions.html` — solutions (verrouillée jusqu’au 24 décembre)
- `assets/css/style.css`, `assets/js/calendar.js` — styles et logique de déblocage
- `assets/source/calendrier-de-l-avent-source.html` — livret HTML d’origine (référence)
- `tools/split_pages.py` — régénère toutes les pages HTML à partir de la source

## Utilisation

Aucune dépendance, aucun build. Ouvrir `index.html` dans un navigateur, ou servir
localement :

```sh
python3 -m http.server 8000
# puis http://localhost:8000/
```

Hébergement prévu : GitHub Pages (Settings → Pages → Deploy from branch `main`, racine `/`).

## Règles de déblocage (`assets/js/calendar.js`)

- Fuseau horaire : `Europe/Paris` (constante `TIMEZONE`).
- Le jour N est accessible à partir du N décembre et reste accessible ensuite.
- Avant le 1er décembre : tout est verrouillé. À partir du 25 décembre : tout est ouvert.
- Les jours déjà ouverts sont cochés ✓ (stocké en `localStorage`, purement local).
- Paramètre de test : `?date=2025-12-15` simule une date (ex. `index.html?date=2025-12-15`).

## Régénérer les pages après modification de la source

```sh
python3 tools/split_pages.py
```
