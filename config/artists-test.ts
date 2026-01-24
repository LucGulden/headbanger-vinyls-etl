/**
 * Dataset de test réduit (~10 artistes)
 */

import type { ArtistConfig } from '../src/utils/types.js';

export const TEST_ARTISTS: ArtistConfig[] = [
  { name: 'Nas', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Wu-Tang Clan', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'OutKast', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'IAM', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Booba', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'PNL', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Kendrick Lamar', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Freeze Corleone', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Run-D.M.C.', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Damso', priority: 'high', genre: 'rap-be', subGenre: '2010s' },
];
