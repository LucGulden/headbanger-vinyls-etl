# FillCrate Scripts

Scripts de peuplement de la base de données FillCrate (Albums & Vinyls).

## Architecture

```
fillcrate-scripts/
├── config/
│   ├── artists.ts        # ~230 artistes rap US/FR organisés par époque
│   └── settings.ts       # Configuration globale
├── data/                 # Fichiers de progression (auto-générés)
├── src/
│   ├── utils/
│   │   ├── supabase.ts   # Client Supabase + opérations BDD
│   │   ├── spotify.ts    # Client Spotify API
│   │   ├── musicbrainz.ts # Client MusicBrainz API
│   │   ├── coverart.ts   # Client Cover Art Archive
│   │   └── progress.ts   # Gestion reprise/interruption
│   ├── import-albums.ts  # Script 1: Spotify → Albums
│   ├── import-vinyls.ts  # Script 2: MusicBrainz → Vinyls
│   └── fetch-covers.ts   # Script 3: Cover Art Archive → covers
├── .env.example
├── package.json
└── README.md
```

## Installation

```bash
# Cloner et installer
cd fillcrate-scripts
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos credentials
```

## Configuration requise

### Supabase
- `SUPABASE_URL` : URL de votre projet
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (pas la clé anon!)

### Spotify
1. Créer une app sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Récupérer Client ID et Client Secret
3. Pas besoin de redirect URI (Client Credentials Flow)

### Variables optionnelles
- `BATCH_SIZE` : Nombre d'artistes par batch (défaut: 10)
- `API_DELAY_MS` : Délai entre requêtes (défaut: 1100ms)
- `VINYL_COUNTRY` : Pays pour filtrer les pressages (défaut: FR)

## Usage

### Workflow complet

```bash
# 1. Importer les albums depuis Spotify
npm run import:albums

# 2. Importer les vinyls depuis MusicBrainz
npm run import:vinyls

# 3. Récupérer les covers depuis Cover Art Archive
npm run fetch:covers
```

### Options avancées

```bash
# Importer seulement les artistes haute priorité
npm run import:albums -- --priority=high

# Importer seulement le rap français
npm run import:albums -- --genre=rap-fr

# Importer un artiste spécifique
npm run import:albums -- --artist="Nas"

# Importer seulement les albums (pas les singles)
npm run import:albums -- --albumsOnly

# Recommencer à zéro
npm run import:albums -- --clear

# Filtrer par pays (vinyls)
npm run import:vinyls -- --country=US

# Limiter le nombre d'items
npm run import:vinyls -- --limit=100
```

## Gestion de l'interruption

Les scripts peuvent être interrompus à tout moment avec `Ctrl+C`.

- La progression est sauvegardée dans `data/progress.json`
- Les erreurs sont loggées dans `data/errors.json`
- Relancer le script reprend automatiquement où il en était

Pour recommencer à zéro :
```bash
npm run import:albums -- --clear
```

## Schéma de données

### Flow de données

```
Spotify API                    MusicBrainz API              Cover Art Archive
     │                              │                              │
     ▼                              ▼                              │
┌─────────────────┐         ┌─────────────────┐                   │
│ Artist Search   │         │ Release Group   │                   │
│ Artist Albums   │         │ Releases        │                   │
└────────┬────────┘         └────────┬────────┘                   │
         │                           │                             │
         ▼                           ▼                             ▼
    ┌─────────┐               ┌──────────┐                  ┌───────────┐
    │ albums  │◄──────────────│  vinyls  │◄─────────────────│  covers   │
    │  table  │  album_id FK  │  table   │  release_id      │   URLs    │
    └─────────┘               └──────────┘                  └───────────┘
```

### Relations

- **Album** = œuvre musicale abstraite (spotify_id, musicbrainz_release_group_id)
- **Vinyl** = pressage physique spécifique (musicbrainz_release_id)
- Un Album peut avoir plusieurs Vinyls (différents pressages)

### Colonnes ajoutées

Les scripts nécessitent ces colonnes dans votre schéma Supabase :

```sql
-- Table albums
ALTER TABLE albums ADD COLUMN IF NOT EXISTS musicbrainz_release_group_id TEXT;

-- Table vinyls
ALTER TABLE vinyls ADD COLUMN IF NOT EXISTS musicbrainz_release_id TEXT;
```

## Artistes inclus

### Rap US (~150 artistes)
- **Golden Age** : Wu-Tang Clan, Nas, 2Pac, Biggie, OutKast...
- **2000s** : Jay-Z, Eminem, Kanye West, Lil Wayne...
- **2010s** : Kendrick Lamar, Drake, Travis Scott, Tyler...
- **2020s** : Pop Smoke, JID, Baby Keem, Yeat...

### Rap FR (~80 artistes)
- **Classiques** : IAM, NTM, Booba, Rohff, Oxmo Puccino...
- **2010s** : Nekfeu, PNL, Damso, Orelsan, SCH...
- **2020s** : Freeze Corleone, Gazo, Ziak, Isha, Limsa...

### Belgique & Suisse
- Hamza, Damso, Roméo Elvis, Di-Meh, Slimka...

## Troubleshooting

### "Rate limit exceeded" (MusicBrainz)
MusicBrainz limite à 1 requête/seconde. Le script gère ça automatiquement, mais si vous voyez ce message, attendez quelques secondes.

### "Artiste non trouvé sur Spotify"
Vérifiez l'orthographe dans `config/artists.ts`. Spotify est sensible aux caractères spéciaux.

### "Aucun pressage vinyle FR trouvé"
Normal pour beaucoup d'albums! Seuls certains ont des pressages français. Vous pouvez changer le pays avec `--country=US`.

## Ajout de nouveaux genres

1. Créer un nouveau tableau dans `config/artists.ts`
2. Ajouter le genre aux exports `ALL_*`
3. Relancer `npm run import:albums -- --genre=nouveau-genre`

## Licence

Private - FillCrate Project
