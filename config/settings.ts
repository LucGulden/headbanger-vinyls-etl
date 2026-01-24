/**
 * Configuration globale des scripts FillCrate
 */

import 'dotenv/config';

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
  },
  musicbrainz: {
    userAgent: process.env.MB_USER_AGENT || 'fillcrate@example.com',
  },
  vinyl: {
    defaultCountries: (process.env.VINYL_COUNTRIES || 'FR,DE,UK,US').split(','),
  },
};

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

export function validateSpotifyConfig(): void {
  if (!config.spotify.clientId || !config.spotify.clientSecret) {
    throw new Error('Variables manquantes: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET');
  }
}

export function validateSupabaseConfig(): void {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Variables manquantes: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  }
}
