/**
 * Configuration des playlists Spotify (playlists publiques)
 * 
 * NOTE: Depuis novembre 2024, les playlists officielles Spotify ne sont plus
 * accessibles via l'API. Toutes les playlists ici sont des playlists publiques
 * curatées par des utilisateurs/collectifs Spotify et accessibles via API.
 */

import type { PlaylistConfig } from '../src/utils/types.js';

export const NEW_RELEASES: PlaylistConfig[] = [
  { id: '0MF1XGKzqqeL0ZHeqMrq7R', name: 'Rap Fr | Rap Francais 2025', description: 'Hits rap français 2025', priority: 'high', trackNewReleases: true, owner: 'Digster France' },
  { id: '3aj8I39Ok1hAmzRDJ0KYPH', name: 'Top 100 Rap Français du moment', description: 'Top 100 rap FR', genre: 'rap-fr', priority: 'high', trackNewReleases: true, owner: 'Filtr France' },
  { id: '6gJph9xXMMCOH1dULIRcXL', name: 'Rock Rising: Best New Rock Songs 2025', description: 'Nouveautés rock', genre: 'rock', priority: 'high', trackNewReleases: true, owner: 'Music Gateway' },
];

export const RAP_PLAYLISTS: PlaylistConfig[] = [
  { id: '7uUpT9vczoVS0xLPR9L8aI', name: 'Top Rap Hits 2025 (Hip Hop , Rap , Trap)', description: 'Hits rap 2025', genre: 'rap-us', priority: 'high', owner: 'Tomer Aaron' },
  { id: '5pvJLjAhcKCHXGOb7pEbBZ', name: 'Best Hip Hop Hits', description: 'Meilleurs hits hip-hop', genre: 'rap-us', priority: 'high', owner: 'Mega Hits' },
  { id: '6uzQMUvSWUuchYAgfz9O3K', name: 'TOP 50 Most Popular Hip-Hop Songs 2025', description: 'Top 50 hip-hop', genre: 'rap-us', priority: 'high', owner: 'Redlist Playlists' },
  { id: '0MF1XGKzqqeL0ZHeqMrq7R', name: 'Rap Fr | Rap Francais 2025', description: 'Rap français populaire', genre: 'rap-fr', priority: 'high', owner: 'Digster France' },
  { id: '4s4wosWddfb1KCz1mwwq8b', name: 'Meilleur Musique Rap Francais 2025', description: 'Meilleur rap FR', genre: 'rap-fr', priority: 'high', owner: 'Redlist Playlists' },
];

export const ROCK_PLAYLISTS: PlaylistConfig[] = [
  { id: '6TeyryiZ2UEf3CbLXyztFA', name: 'Classic Rock Greatest Hits', description: 'Classiques rock', genre: 'rock', priority: 'high', owner: 'Scott Pruden' },
  { id: '5SiElPK9puFJFBUTKDRl1a', name: 'The Best Of Rock', description: 'Meilleur du rock', genre: 'rock', priority: 'high', owner: 'Top Music' },
  { id: '6gJph9xXMMCOH1dULIRcXL', name: 'Rock Rising: Best New Rock Songs 2025', description: 'Nouveautés rock', genre: 'rock', priority: 'high', trackNewReleases: true, owner: 'Music Gateway' },
];

export const METAL_PLAYLISTS: PlaylistConfig[] = [
  { id: '1yMlpNGEpIVUIilZlrbdS0', name: 'Best Metal Songs of All Time', description: 'Meilleur du metal', genre: 'metal', priority: 'high', owner: 'Redlist Playlists' },
  { id: '264B0D5wj2PgOr8vQvp2Ft', name: 'Best Metal Playlist 2025', description: 'Best metal 2025', genre: 'metal', priority: 'high', owner: 'Lasse Andersen' },
  { id: '2w16bIXfyPacvwOQaI8YvT', name: 'Best Heavy Metal Playlist Ever', description: 'Meilleur heavy metal', genre: 'metal-heavy', priority: 'high', owner: 'Yaman Nimer' },
];

export const RNB_SOUL_PLAYLISTS: PlaylistConfig[] = [
  { id: '5pvJLjAhcKCHXGOb7pEbBZ', name: 'Best Hip Hop Hits', description: 'Hip-hop et soul', genre: 'soul', priority: 'high', owner: 'Mega Hits' },
  { id: '4AdkQFBNp4c6H2WVrkKWbZ', name: 'JazzRap 2025 - Jazz Rap - JazzHop - RapJazz', description: 'Jazz rap et soul', genre: 'rnb', priority: 'high', owner: 'Diego Rodríguez Mesa' },
];

export const JAZZ_PLAYLISTS: PlaylistConfig[] = [
  { id: '4AdkQFBNp4c6H2WVrkKWbZ', name: 'JazzRap 2025 - Jazz Rap - JazzHop', description: 'Jazz et jazz rap', genre: 'jazz', priority: 'high', owner: 'Diego Rodríguez Mesa' },
];

export const FUNK_DISCO_PLAYLISTS: PlaylistConfig[] = [
  { id: '5SiElPK9puFJFBUTKDRl1a', name: 'The Best Of Rock', description: 'Rock et funk', genre: 'funk', priority: 'high', owner: 'Top Music' },
];

export const ELECTRO_PLAYLISTS: PlaylistConfig[] = [
  { id: '2UZk7JjJnbTut1w8fqs3JL', name: 'Pop Playlist 2025', description: 'Pop et electro', genre: 'electro', priority: 'high', owner: 'Best Playlists Ever', trackNewReleases: true },
];

export const POP_PLAYLISTS: PlaylistConfig[] = [
  { id: '2UZk7JjJnbTut1w8fqs3JL', name: 'Pop Playlist 2025', description: 'Pop hits 2025', genre: 'pop', priority: 'high', owner: 'Best Playlists Ever', trackNewReleases: true },
];

export const REGGAE_PLAYLISTS: PlaylistConfig[] = [
  { id: '1vIZxBcvgGHE9HXbQnzXYI', name: 'LATINO CALIENTE 2025', description: 'Latinos et reggae', genre: 'reggae', priority: 'high', owner: 'Filtr Éxitos' },
];

export const LATIN_PLAYLISTS: PlaylistConfig[] = [
  { id: '1vIZxBcvgGHE9HXbQnzXYI', name: 'LATINO CALIENTE 2025', description: 'Latin hits 2025', genre: 'latin', priority: 'high', trackNewReleases: true, owner: 'Filtr Éxitos' },
  { id: '3oBf7jbb5tokVOYQVGIUAg', name: 'Latino Hits 2025 – latin reggaeton hits', description: 'Latin reggaeton hits', genre: 'latin', priority: 'high', owner: 'Filtr Sweden' },
];

export const COUNTRY_PLAYLISTS: PlaylistConfig[] = [
  // À ajouter - playlists publiques fiables à identifier
];

export const BLUES_PLAYLISTS: PlaylistConfig[] = [
  // À ajouter - playlists publiques fiables à identifier
];

export const ALL_PLAYLISTS: PlaylistConfig[] = [
  ...NEW_RELEASES,
  ...RAP_PLAYLISTS,
  ...ROCK_PLAYLISTS,
  ...METAL_PLAYLISTS,
  ...RNB_SOUL_PLAYLISTS,
  ...JAZZ_PLAYLISTS,
  ...FUNK_DISCO_PLAYLISTS,
  ...ELECTRO_PLAYLISTS,
  ...POP_PLAYLISTS,
  ...REGGAE_PLAYLISTS,
  ...LATIN_PLAYLISTS,
  ...COUNTRY_PLAYLISTS,
  ...BLUES_PLAYLISTS,
];

export function getPlaylistsByGenre(genre: string): PlaylistConfig[] {
  return ALL_PLAYLISTS.filter(p => p.genre === genre);
}