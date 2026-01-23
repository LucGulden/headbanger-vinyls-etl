/**
 * Configuration globale des scripts d'import
 */

import 'dotenv/config';

export const config = {
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Spotify API
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    // Endpoints
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBaseUrl: 'https://api.spotify.com/v1',
  },

  // MusicBrainz API
  musicBrainz: {
    apiBaseUrl: 'https://musicbrainz.org/ws/2',
    userAgent: 'FillCrate/1.0.0 (contact@fillcrate.com)', // Requis par MusicBrainz
    // Rate limit: 1 requête par seconde
    rateLimitMs: 1100,
  },

  // Cover Art Archive
  coverArtArchive: {
    apiBaseUrl: 'https://coverartarchive.org',
  },

  // Configuration import
  import: {
    // Nombre d'artistes à traiter par batch
    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
    // Délai entre requêtes API (ms)
    apiDelayMs: parseInt(process.env.API_DELAY_MS || '1100'),
    // Pays pour filtrer les pressages
    vinylCountry: process.env.VINYL_COUNTRY || 'FR',
    // Formats vinyles acceptés
    vinylFormats: ['12" Vinyl', 'Vinyl', 'LP', '2xLP', '3xLP', '7" Vinyl', '10" Vinyl'],
  },

  // Fichiers de données
  paths: {
    dataDir: './data',
    progressFile: './data/progress.json',
    errorsFile: './data/errors.json',
    albumsCache: './data/albums-cache.json',
  },
};

// Validation de la configuration
export function validateConfig(): void {
  const required = [
    ['SUPABASE_URL', config.supabase.url],
    ['SUPABASE_SERVICE_ROLE_KEY', config.supabase.serviceRoleKey],
    ['SPOTIFY_CLIENT_ID', config.spotify.clientId],
    ['SPOTIFY_CLIENT_SECRET', config.spotify.clientSecret],
  ];

  const missing = required.filter(([_, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
}
