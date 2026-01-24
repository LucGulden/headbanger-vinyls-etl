/**
 * Liste étendue d'artistes - Tous genres confondus
 */

import type { ArtistConfig } from '../src/utils/types.js';

// =============================================================================
// ROCK
// =============================================================================

export const ROCK: ArtistConfig[] = [
  // Classics
  { name: 'The Beatles', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'The Rolling Stones', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Led Zeppelin', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Pink Floyd', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'The Who', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'The Doors', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Jimi Hendrix', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'The Velvet Underground', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Deep Purple', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Black Sabbath', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Queen', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'David Bowie', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Fleetwood Mac', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'AC/DC', priority: 'high', genre: 'rock', subGenre: 'classic' },
  { name: 'Dire Straits', priority: 'high', genre: 'rock', subGenre: 'classic' },
  // 80s-90s
  { name: 'U2', priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: 'The Cure', priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: 'Depeche Mode', priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: 'The Smiths', priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: 'Talking Heads', priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: "Guns N' Roses", priority: 'high', genre: 'rock', subGenre: '80s' },
  { name: 'Nirvana', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Pearl Jam', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Soundgarden', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Red Hot Chili Peppers', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Rage Against The Machine', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Radiohead', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Oasis', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Tool', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Foo Fighters', priority: 'high', genre: 'rock', subGenre: '90s' },
  { name: 'Pixies', priority: 'high', genre: 'rock', subGenre: '90s' },
  // 2000s+
  { name: 'The Strokes', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'The White Stripes', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'Arctic Monkeys', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'Muse', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'Arcade Fire', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'Queens of the Stone Age', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'The National', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'LCD Soundsystem', priority: 'high', genre: 'rock', subGenre: '2000s' },
  { name: 'Tame Impala', priority: 'high', genre: 'rock', subGenre: '2010s' },
  { name: 'Bon Iver', priority: 'high', genre: 'rock', subGenre: '2010s' },
  { name: 'Khruangbin', priority: 'high', genre: 'rock', subGenre: '2010s' },
];

// =============================================================================
// METAL
// =============================================================================

export const METAL: ArtistConfig[] = [
  { name: 'Iron Maiden', priority: 'high', genre: 'metal', subGenre: 'classic' },
  { name: 'Judas Priest', priority: 'high', genre: 'metal', subGenre: 'classic' },
  { name: 'Motörhead', priority: 'high', genre: 'metal', subGenre: 'classic' },
  { name: 'Metallica', priority: 'high', genre: 'metal', subGenre: 'thrash' },
  { name: 'Slayer', priority: 'high', genre: 'metal', subGenre: 'thrash' },
  { name: 'Megadeth', priority: 'high', genre: 'metal', subGenre: 'thrash' },
  { name: 'Pantera', priority: 'high', genre: 'metal', subGenre: 'thrash' },
  { name: 'Opeth', priority: 'high', genre: 'metal', subGenre: 'death' },
  { name: 'Gojira', priority: 'high', genre: 'metal', subGenre: 'death' },
  { name: 'Mastodon', priority: 'high', genre: 'metal', subGenre: 'modern' },
  { name: 'Deftones', priority: 'high', genre: 'metal', subGenre: 'modern' },
  { name: 'Slipknot', priority: 'high', genre: 'metal', subGenre: 'modern' },
  { name: 'Rammstein', priority: 'high', genre: 'metal', subGenre: 'modern' },
];

// =============================================================================
// SOUL / R&B
// =============================================================================

export const SOUL_RNB: ArtistConfig[] = [
  { name: 'Marvin Gaye', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Stevie Wonder', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Aretha Franklin', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Otis Redding', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Al Green', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Curtis Mayfield', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'James Brown', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Nina Simone', priority: 'high', genre: 'soul', subGenre: 'classic' },
  { name: 'Prince', priority: 'high', genre: 'soul', subGenre: 'funk' },
  { name: 'Parliament', priority: 'high', genre: 'soul', subGenre: 'funk' },
  { name: 'Michael Jackson', priority: 'high', genre: 'rnb', subGenre: '80s' },
  { name: "D'Angelo", priority: 'high', genre: 'rnb', subGenre: '90s' },
  { name: 'Erykah Badu', priority: 'high', genre: 'rnb', subGenre: '90s' },
  { name: 'Aaliyah', priority: 'high', genre: 'rnb', subGenre: '90s' },
  { name: 'Beyoncé', priority: 'high', genre: 'rnb', subGenre: '2000s' },
  { name: 'Frank Ocean', priority: 'high', genre: 'rnb', subGenre: '2010s' },
  { name: 'The Weeknd', priority: 'high', genre: 'rnb', subGenre: '2010s' },
  { name: 'SZA', priority: 'high', genre: 'rnb', subGenre: '2010s' },
  { name: 'Steve Lacy', priority: 'high', genre: 'rnb', subGenre: '2020s' },
];

// =============================================================================
// JAZZ
// =============================================================================

export const JAZZ: ArtistConfig[] = [
  { name: 'Miles Davis', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'John Coltrane', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Charles Mingus', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Thelonious Monk', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Duke Ellington', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Herbie Hancock', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Bill Evans', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Ella Fitzgerald', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Billie Holiday', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Chet Baker', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Pharoah Sanders', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Sun Ra', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Alice Coltrane', priority: 'high', genre: 'jazz', subGenre: 'classic' },
  { name: 'Kamasi Washington', priority: 'high', genre: 'jazz', subGenre: 'modern' },
  { name: 'Robert Glasper', priority: 'high', genre: 'jazz', subGenre: 'modern' },
  { name: 'Thundercat', priority: 'high', genre: 'jazz', subGenre: 'modern' },
];

// =============================================================================
// ÉLECTRO
// =============================================================================

export const ELECTRO: ArtistConfig[] = [
  { name: 'Kraftwerk', priority: 'high', genre: 'electro', subGenre: 'pioneer' },
  { name: 'Brian Eno', priority: 'high', genre: 'electro', subGenre: 'pioneer' },
  { name: 'Aphex Twin', priority: 'high', genre: 'electro', subGenre: 'idm' },
  { name: 'Boards of Canada', priority: 'high', genre: 'electro', subGenre: 'idm' },
  { name: 'Four Tet', priority: 'high', genre: 'electro', subGenre: 'idm' },
  { name: 'Burial', priority: 'high', genre: 'electro', subGenre: 'idm' },
  { name: 'Flying Lotus', priority: 'high', genre: 'electro', subGenre: 'idm' },
  { name: 'Daft Punk', priority: 'high', genre: 'electro', subGenre: 'house' },
  { name: 'The Chemical Brothers', priority: 'high', genre: 'electro', subGenre: 'house' },
  { name: 'The Prodigy', priority: 'high', genre: 'electro', subGenre: 'house' },
  { name: 'Massive Attack', priority: 'high', genre: 'electro', subGenre: 'trip-hop' },
  { name: 'Portishead', priority: 'high', genre: 'electro', subGenre: 'trip-hop' },
  { name: 'Air', priority: 'high', genre: 'electro', subGenre: 'french-touch' },
  { name: 'Justice', priority: 'high', genre: 'electro', subGenre: 'french-touch' },
  { name: 'Laurent Garnier', priority: 'high', genre: 'electro', subGenre: 'techno' },
  { name: 'Disclosure', priority: 'high', genre: 'electro', subGenre: '2010s' },
  { name: 'Flume', priority: 'high', genre: 'electro', subGenre: '2010s' },
  { name: 'Jamie xx', priority: 'high', genre: 'electro', subGenre: '2010s' },
  { name: 'Kaytranada', priority: 'high', genre: 'electro', subGenre: '2010s' },
  { name: 'Bonobo', priority: 'high', genre: 'electro', subGenre: '2010s' },
  { name: 'Fred again..', priority: 'high', genre: 'electro', subGenre: '2020s' },
];

// =============================================================================
// REGGAE
// =============================================================================

export const REGGAE: ArtistConfig[] = [
  { name: 'Bob Marley & The Wailers', priority: 'high', genre: 'reggae', subGenre: 'roots' },
  { name: 'Peter Tosh', priority: 'high', genre: 'reggae', subGenre: 'roots' },
  { name: 'Jimmy Cliff', priority: 'high', genre: 'reggae', subGenre: 'roots' },
  { name: 'Burning Spear', priority: 'high', genre: 'reggae', subGenre: 'roots' },
  { name: 'Lee "Scratch" Perry', priority: 'high', genre: 'reggae', subGenre: 'dub' },
  { name: 'King Tubby', priority: 'high', genre: 'reggae', subGenre: 'dub' },
  { name: 'Augustus Pablo', priority: 'high', genre: 'reggae', subGenre: 'dub' },
  { name: 'Damian Marley', priority: 'high', genre: 'reggae', subGenre: 'modern' },
];

// =============================================================================
// CHANSON FRANÇAISE
// =============================================================================

export const CHANSON_FR: ArtistConfig[] = [
  { name: 'Serge Gainsbourg', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Jacques Brel', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Georges Brassens', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Édith Piaf', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Françoise Hardy', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Alain Bashung', priority: 'high', genre: 'chanson-fr', subGenre: 'classic' },
  { name: 'Téléphone', priority: 'high', genre: 'chanson-fr', subGenre: 'rock' },
  { name: 'Noir Désir', priority: 'high', genre: 'chanson-fr', subGenre: 'rock' },
  { name: 'Phoenix', priority: 'high', genre: 'chanson-fr', subGenre: 'modern' },
  { name: 'Stromae', priority: 'high', genre: 'chanson-fr', subGenre: 'modern' },
  { name: 'Christine and the Queens', priority: 'high', genre: 'chanson-fr', subGenre: 'modern' },
  { name: 'Angèle', priority: 'high', genre: 'chanson-fr', subGenre: 'modern' },
];

// =============================================================================
// AFRO / WORLD
// =============================================================================

export const AFRO_WORLD: ArtistConfig[] = [
  { name: 'Fela Kuti', priority: 'high', genre: 'afro', subGenre: 'classic' },
  { name: 'Youssou N\'Dour', priority: 'high', genre: 'afro', subGenre: 'classic' },
  { name: 'Ali Farka Touré', priority: 'high', genre: 'afro', subGenre: 'classic' },
  { name: 'Mulatu Astatke', priority: 'high', genre: 'afro', subGenre: 'classic' },
  { name: 'Burna Boy', priority: 'high', genre: 'afro', subGenre: 'afrobeats' },
  { name: 'Wizkid', priority: 'high', genre: 'afro', subGenre: 'afrobeats' },
  { name: 'Tems', priority: 'high', genre: 'afro', subGenre: 'afrobeats' },
  { name: 'Bad Bunny', priority: 'high', genre: 'world', subGenre: 'latin' },
  { name: 'Rosalía', priority: 'high', genre: 'world', subGenre: 'latin' },
  { name: 'Caetano Veloso', priority: 'high', genre: 'world', subGenre: 'brazil' },
  { name: 'Gilberto Gil', priority: 'high', genre: 'world', subGenre: 'brazil' },
];

// =============================================================================
// POP
// =============================================================================

export const POP: ArtistConfig[] = [
  { name: 'Madonna', priority: 'high', genre: 'pop', subGenre: 'classic' },
  { name: 'ABBA', priority: 'high', genre: 'pop', subGenre: 'classic' },
  { name: 'Kate Bush', priority: 'high', genre: 'pop', subGenre: 'classic' },
  { name: 'Adele', priority: 'high', genre: 'pop', subGenre: '2010s' },
  { name: 'Taylor Swift', priority: 'high', genre: 'pop', subGenre: '2010s' },
  { name: 'Lorde', priority: 'high', genre: 'pop', subGenre: '2010s' },
  { name: 'Billie Eilish', priority: 'high', genre: 'pop', subGenre: '2020s' },
  { name: 'Dua Lipa', priority: 'high', genre: 'pop', subGenre: '2020s' },
  { name: 'Charli XCX', priority: 'high', genre: 'pop', subGenre: '2020s' },
];

// =============================================================================
// COUNTRY / FOLK
// =============================================================================

export const COUNTRY_FOLK: ArtistConfig[] = [
  { name: 'Johnny Cash', priority: 'high', genre: 'country', subGenre: 'classic' },
  { name: 'Bob Dylan', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Joni Mitchell', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Neil Young', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Leonard Cohen', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Nick Drake', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Phoebe Bridgers', priority: 'high', genre: 'country', subGenre: 'folk' },
  { name: 'Sufjan Stevens', priority: 'high', genre: 'country', subGenre: 'folk' },
];

// =============================================================================
// BLUES
// =============================================================================

export const BLUES: ArtistConfig[] = [
  { name: 'Robert Johnson', priority: 'high', genre: 'blues', subGenre: 'classic' },
  { name: 'Muddy Waters', priority: 'high', genre: 'blues', subGenre: 'classic' },
  { name: 'B.B. King', priority: 'high', genre: 'blues', subGenre: 'classic' },
  { name: 'Howlin\' Wolf', priority: 'high', genre: 'blues', subGenre: 'classic' },
  { name: 'Buddy Guy', priority: 'high', genre: 'blues', subGenre: 'classic' },
  { name: 'Stevie Ray Vaughan', priority: 'high', genre: 'blues', subGenre: 'modern' },
];

// =============================================================================
// EXPORTS
// =============================================================================

export const ALL_EXTENDED_ARTISTS: ArtistConfig[] = [
  ...ROCK,
  ...METAL,
  ...SOUL_RNB,
  ...JAZZ,
  ...ELECTRO,
  ...REGGAE,
  ...CHANSON_FR,
  ...AFRO_WORLD,
  ...POP,
  ...COUNTRY_FOLK,
  ...BLUES,
];

export const EXTENDED_STATS = {
  total: ALL_EXTENDED_ARTISTS.length,
};
