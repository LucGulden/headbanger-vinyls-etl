/**
 * Configuration des playlists Spotify
 */

import type { PlaylistConfig } from '../src/utils/types.js';

export const NEW_RELEASES: PlaylistConfig[] = [
  { id: '37i9dQZF1DX4JAvHpjipBk', name: 'New Music Friday', description: 'Nouveautés globales', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DWTl4y3vgJOXW', name: 'New Music Friday FR', description: 'Nouveautés françaises', genre: 'all-fr', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DX4SBhb3fqCJd', name: 'New Music Friday US', description: 'Nouveautés US', genre: 'all-us', priority: 'high', trackNewReleases: true },
];

export const RAP_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DX0XUsuxWHRQd', name: 'RapCaviar', description: 'La plus grande playlist rap', genre: 'rap-us', priority: 'high' },
  { id: '37i9dQZF1DWU4xkXueiKGW', name: 'Rap FR', description: 'Rap français', genre: 'rap-fr', priority: 'high' },
  { id: '37i9dQZF1DX1X7WV84927n', name: 'Fraîche', description: 'Nouveautés rap FR', genre: 'rap-fr', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DWVA1Gq4XHa6U', name: "90s Hip-Hop", description: 'Classiques 90s', genre: 'rap-us', priority: 'high' },
];

export const ROCK_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXcF6B6QPhFDv', name: 'Rock Classics', description: 'Classiques rock', genre: 'rock', priority: 'high' },
  { id: '37i9dQZF1DX1rVvRgjX59F', name: 'Rock This', description: 'Rock actuel', genre: 'rock', priority: 'high' },
];

export const RNB_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DWULEW2gqsocT', name: 'Soul Classics', description: 'Classiques soul', genre: 'soul', priority: 'high' },
  { id: '37i9dQZF1DWYmmr74INQlb', name: 'R&B Favourites', description: 'R&B populaire', genre: 'rnb', priority: 'high' },
];

export const JAZZ_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXbITWG1ZJKYt', name: 'Jazz Classics', description: 'Classiques jazz', genre: 'jazz', priority: 'high' },
];

export const ELECTRO_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DX4pbGJDhTXK3', name: 'Electronic Rising', description: 'Électro actuelle', genre: 'electro', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DX2TRYkJECvfC', name: 'French Touch', description: 'French touch', genre: 'electro', priority: 'high' },
];

export const ALL_PLAYLISTS: PlaylistConfig[] = [
  ...NEW_RELEASES,
  ...RAP_PLAYLISTS,
  ...ROCK_PLAYLISTS,
  ...RNB_PLAYLISTS,
  ...JAZZ_PLAYLISTS,
  ...ELECTRO_PLAYLISTS,
];

export const NEW_RELEASES_TRACKING = ALL_PLAYLISTS.filter(p => p.trackNewReleases);

export function getPlaylistsByGenre(genre: string): PlaylistConfig[] {
  return ALL_PLAYLISTS.filter(p => p.genre === genre);
}
