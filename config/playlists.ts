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
  { id: '37i9dQZF1DWVA1Gq4XHa6U', name: '90s Hip-Hop', description: 'Classiques 90s', genre: 'rap-us', priority: 'high' },
  { id: '37i9dQZF1DX6ziVCJqLRPl', name: 'Hip-Hop Classics', description: 'Classiques du hip-hop', genre: 'rap-us', priority: 'high' },
];

export const ROCK_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXcF6B6QPhFDv', name: 'Rock Classics', description: 'Classiques rock', genre: 'rock', priority: 'high' },
  { id: '37i9dQZF1DX1rVvRgjX59F', name: 'Rock This', description: 'Rock actuel', genre: 'rock', priority: 'high' },
  { id: '37i9dQZF1DXcBcG2kXs6kz', name: 'Rock Legends', description: 'Légendes du rock', genre: 'rock', priority: 'high' },
  { id: '37i9dQZF1DWZeKCadgRdWr', name: 'Punk Classics', description: 'Classiques punk', genre: 'rock-punk', priority: 'high' },
  { id: '37i9dQZF1DX2qVQBXLCheU', name: 'Alternative Hits', description: 'Alternative populaire', genre: 'rock-alt', priority: 'high' },
  { id: '37i9dQZF1DX7QOv5yX6mkG', name: 'Indie Favorites', description: 'Indie favori', genre: 'indie', priority: 'high' },
];

export const METAL_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DX9qNs32fujYe', name: 'Heavy Metal', description: 'Heavy metal traditionnel', genre: 'metal-heavy', priority: 'high' },
  { id: '4ykSr52Ff3ysihmAO0z1Dw', name: 'The Sound of Death Metal', description: 'Death metal', genre: 'metal-death', priority: 'high' },
  { id: '27gN69ebwiJRtXEboL12Ih', name: 'Heavy Metal Classics', description: 'Classiques metal', genre: 'metal', priority: 'high' },
];

export const RNB_SOUL_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DWULEW2gqsocT', name: 'Soul Classics', description: 'Classiques soul', genre: 'soul', priority: 'high' },
  { id: '37i9dQZF1DWYmmr74INQlb', name: 'R&B Favourites', description: 'R&B populaire', genre: 'rnb', priority: 'high' },
  { id: '37i9dQZF1DX5IDhnLq32Px', name: 'Soul Rising', description: 'Nouveau soul', genre: 'soul', priority: 'medium', trackNewReleases: true },
];

export const JAZZ_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXbITWG1ZJKYt', name: 'Jazz Classics', description: 'Classiques jazz', genre: 'jazz', priority: 'high' },
  { id: '37i9dQZF1DX7gIoqjc86XJ', name: 'Smooth Jazz', description: 'Jazz lisse', genre: 'jazz-smooth', priority: 'medium' },
];

export const FUNK_DISCO_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DWWvhKV4FBciw', name: 'Funk & Soul Classics', description: 'Classiques funk et soul', genre: 'funk', priority: 'high' },
  { id: '53piQaZBey1bh4T2WY9doa', name: 'Soul Classics / Funk & Soul Essentials', description: 'Funk et soul fusion', genre: 'funk', priority: 'high' },
];

export const ELECTRO_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DX4pbGJDhTXK3', name: 'Electronic Rising', description: 'Électro actuelle', genre: 'electro', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DWVY4eLfA3XFQ', name: 'Tech House Operator', description: 'Tech house', genre: 'electro-house', priority: 'high' },
  { id: '37i9dQZF1EIePtuqoXzsC3', name: 'House Techno Mix', description: 'House et techno mix', genre: 'electro-house', priority: 'high' },
  { id: '0QObIGI6C5lv4X2CBlXpwX', name: 'Synthwave Sounds', description: 'Synthwave et synth-pop', genre: 'electro-synth', priority: 'high' },
];

export const POP_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DWUa8ZRTfalHk', name: 'Pop Rising', description: 'Nouveau pop', genre: 'pop', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DX4v0Y84QklHD', name: 'Classic Pop Picks', description: 'Grands classiques pop', genre: 'pop', priority: 'high' },
];

export const REGGAE_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXbSbnqxMTGx9', name: 'Reggae Classics', description: 'Classiques reggae', genre: 'reggae', priority: 'high' },
  { id: '37i9dQZF1DX2oc5aN4UDfD', name: 'Ultimate Reggae', description: 'Reggae essentiel', genre: 'reggae', priority: 'high' },
];

export const LATIN_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DWVcbzTgVpNRm', name: 'Latin Party Anthems', description: 'Anthèmes latins', genre: 'latin', priority: 'high', trackNewReleases: true },
  { id: '37i9dQZF1DWX0o6sD1a6P5', name: 'Afro Hits', description: 'Afrobeats actuels', genre: 'afrobeats', priority: 'high' },
  { id: '37i9dQZF1EQqFPe2ux3rbj', name: 'Afrobeats Mix', description: 'Mix afrobeats', genre: 'afrobeats', priority: 'high' },
];

export const COUNTRY_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DX5gMBaRFQjOY', name: 'Classic Country', description: 'Classiques country', genre: 'country', priority: 'high' },
  { id: '37i9dQZF1DXadasIcsfbqh', name: 'Pop Country', description: 'Country populaire', genre: 'country', priority: 'high' },
];

export const BLUES_PLAYLISTS: PlaylistConfig[] = [
  { id: '37i9dQZF1DXd9rSDyQguIk', name: 'Blues Classics', description: 'Classiques blues', genre: 'blues', priority: 'high' },
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

export const NEW_RELEASES_TRACKING = ALL_PLAYLISTS.filter(p => p.trackNewReleases);

export function getPlaylistsByGenre(genre: string): PlaylistConfig[] {
  return ALL_PLAYLISTS.filter(p => p.genre === genre);
}