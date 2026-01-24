# FillCrate Scripts v2

Pipeline ETL pour peupler la base de données FillCrate (Albums & Vinyls).

## Architecture

```
fillcrate-scripts/
├── config/
│   ├── artists.ts           # ~170 artistes rap US/FR & ~200 artistes autres genres
│   ├── artists-test.ts      # 10 artistes de test
│   ├── playlists.ts         # Playlists Spotify configurées
│   └── settings.ts          # Configuration
├── data/                    # JSON intermédiaires (générés)
├── src/
│   ├── utils/
│   │   ├── types.ts         # Types TypeScript
│   │   ├── json-store.ts    # Gestion des fichiers pipeline
│   │   ├── spotify.ts       # Client Spotify API
│   │   ├── musicbrainz.ts   # Client MusicBrainz API
│   │   ├── coverart.ts      # Client Cover Art Archive
│   │   └── supabase.ts      # Client Supabase
│   ├── extract-spotify.ts   # Phase 1: Extraction Spotify
│   ├── enrich-musicbrainz.ts # Phase 2: Enrichissement MB
│   ├── enrich-covers.ts     # Phase 3: Récupération covers
│   ├── load-database.ts     # Phase 4: Chargement BDD
│   ├── import-full.ts       # Pipeline complet
│   └── pipeline-status.ts   # Statut des pipelines
└── README.md
```

## Installation

```bash
npm install
cp .env.example .env
# Éditer .env avec vos credentials
```

## Configuration

### Variables d'environnement

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
MB_USER_AGENT=your-email@example.com
VINYL_COUNTRIES=FR,DE,UK,US
```

### Colonnes Supabase requises

```sql
ALTER TABLE albums ADD COLUMN IF NOT EXISTS musicbrainz_release_group_id TEXT;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE vinyls ADD COLUMN IF NOT EXISTS musicbrainz_release_id TEXT;
```

## Usage

### Pipeline complet (recommandé)

```bash
# Test rapide (10 artistes)
npm run import:full -- --test

# Artistes rap
npm run import:full -- --artists

# Tous les genres
npm run import:full -- --all

# Depuis une playlist
npm run import:full -- --playlist=37i9dQZF1DX0XUsuxWHRQd
```

### Étape par étape

```bash
# Phase 1: Extract (Spotify)
# Options de filtrage
npm run extract -- --test              # Artistes de test
npm run extract -- --albums-only       # Exclure les singles (Recommandé)

# Options de sources
npm run extract -- --artists           # Liste Artistes
npm run extract -- --all               # Liste complète (Artistes + Playlist + new-releases)
npm run extract -- --genre=jazz        # Filtrer par genre dans les listes
npm run extract -- --playlist=ID       # Extraire depuis une playlist spécifique
npm run extract -- --new-releases      # Extraire les dernières sorties Spotify

# Nouveautés (Bulk & Search)
npm run extract -- --all-genres        # Boucle sur les genres (config/genres.ts)
npm run extract -- --query="year:2024" # Recherche libre via l'API Spotify

# Phase 2: Enrich (MusicBrainz)
npm run enrich:mb -- --latest
npm run enrich:mb -- --latest --countries=FR,US

# Phase 3: Enrich (Covers)
npm run enrich:covers -- --latest

# Phase 4: Load (Supabase)
npm run load -- --latest
npm run load -- --latest --dry-run
```

### Utilitaires

```bash
# Voir le statut des pipelines
npm run pipeline:status
```

## Workflow

```
┌─────────────────┐
│  PHASE 1        │
│  extract        │ ──► data/pipeline_*.json (status: extracted)
│  (Spotify)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PHASE 2        │
│  enrich:mb      │ ──► Ajoute: musicbrainz.*, vinyls[]
│  (MusicBrainz)  │     (status: enriched_mb ou skipped)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PHASE 3        │
│  enrich:covers  │ ──► Ajoute: vinyls[].cover_url
│  (Cover Art)    │     (status: enriched_covers)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PHASE 4        │
│  load           │ ──► Insert albums & vinyls en BDD
│  (Supabase)     │     (status: loaded)
└─────────────────┘
```

## Genres disponibles

### Artists.ts
- `rap-us` : Rap américain
- `rap-fr` : Rap français
- `rap-be` : Rap belge
- `rap-ch` : Rap suisse
- `rock` : Rock classique → moderne
- `metal` : Metal tous sous-genres
- `soul` : Soul classique
- `rnb` : R&B
- `jazz` : Jazz classique + moderne
- `electro` : Électro, house, techno
- `reggae` : Reggae, dub
- `chanson-fr` : Chanson française
- `afro` : Afrobeats
- `world` : Musiques du monde
- `pop` : Pop internationale
- `country` : Country, folk
- `blues` : Blues

## Données intermédiaires

Le pipeline stocke les données dans `data/pipeline_*.json`:

```json
{
  "phase": "enrich_mb",
  "albums": [
    {
      "spotify": { "spotify_id": "...", "title": "...", ... },
      "musicbrainz": { "release_group_id": "..." },
      "vinyls": [
        { "musicbrainz_release_id": "...", "country": "FR", ... }
      ],
      "status": "enriched_mb"
    }
  ],
  "stats": { "total_extracted": 100, "total_with_vinyls": 42, ... }
}
```

Cela permet:
- Reprise en cas d'interruption
- Inspection/debug des données
- Modification manuelle si nécessaire

## Troubleshooting

### "Rate limit" MusicBrainz
Normal, le script gère automatiquement (1 req/sec).

### "Artiste non trouvé"
Vérifiez l'orthographe dans les fichiers config/*.ts

### Aucun vinyle trouvé
Essayez avec plus de pays: `--countries=FR,DE,UK,US,JP`

## Licence

Private - FillCrate Project
