# Timecard Plugin

Plugin Stream Deck qui affiche l'heure locale de différents fuseaux horaires.

## Installation

Télécharger le `.streamDeckPlugin` depuis les [Releases](https://github.com/laxe4k/timecard-plugin/releases) et double-cliquer dessus.

## Utilisation

Ajouter l'action **Timecard Display** sur une touche, puis choisir :
- Un **préset** : Belgique, Canada, Suisse ou France
- Ou un **fuseau horaire personnalisé** ([liste IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) avec un label libre

Les champs personnalisés ont priorité sur le préset.

## Build

```bash
npm install
npm run build
```

Pour installer directement dans Stream Deck :

```bash
.\scripts\Install-Plugin.ps1 -Force
```

## Licence

[MIT](LICENSE)
