/**
 * Liste des artistes à importer, organisés par genre et époque
 * Chaque artiste sera recherché sur Spotify pour récupérer sa discographie
 */

export interface ArtistConfig {
  name: string;
  priority: 'high' | 'medium' | 'low'; // Pour ordonner l'import
  genre: string;
  subGenre?: string;
}

// =============================================================================
// RAP US (~150 artistes)
// =============================================================================

export const RAP_US_PIONEERS: ArtistConfig[] = [
  // Pionniers & Golden Age (80s-90s)
  { name: 'Run-D.M.C.', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Beastie Boys', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'LL Cool J', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Public Enemy', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'N.W.A', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Ice-T', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Eric B. & Rakim', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Big Daddy Kane', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Slick Rick', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'EPMD', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'De La Soul', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'A Tribe Called Quest', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Jungle Brothers', priority: 'low', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Queen Latifah', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'MC Lyte', priority: 'low', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Salt-N-Pepa', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Naughty by Nature', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Cypress Hill', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Ice Cube', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Dr. Dre', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Snoop Dogg', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: '2Pac', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'The Notorious B.I.G.', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Nas', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Wu-Tang Clan', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Mobb Deep', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Redman', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Method Man', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'GZA', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Raekwon', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Ghostface Killah', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Ol\' Dirty Bastard', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'The Fugees', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Lauryn Hill', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'OutKast', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Goodie Mob', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Bone Thugs-N-Harmony', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'DJ Quik', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Too $hort', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'E-40', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Scarface', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'UGK', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
  { name: '8Ball & MJG', priority: 'medium', genre: 'rap-us', subGenre: 'golden-age' },
  { name: 'Three 6 Mafia', priority: 'high', genre: 'rap-us', subGenre: 'golden-age' },
];

export const RAP_US_2000S: ArtistConfig[] = [
  // Late 90s - 2000s
  { name: 'Jay-Z', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'DMX', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Eminem', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: '50 Cent', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'The Game', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Lil Wayne', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'T.I.', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Ludacris', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Nelly', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Ja Rule', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Busta Rhymes', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Missy Elliott', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Eve', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Lil\' Kim', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Foxy Brown', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Cam\'ron', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Dipset', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'The LOX', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Jadakiss', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Fat Joe', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Big Pun', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Common', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Mos Def', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Talib Kweli', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Pharrell Williams', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'N.E.R.D', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Kanye West', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Lupe Fiasco', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Kid Cudi', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'T-Pain', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Akon', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Chamillionaire', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Paul Wall', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Mike Jones', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Slim Thug', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Young Jeezy', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Gucci Mane', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Boosie Badazz', priority: 'medium', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Webbie', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Plies', priority: 'low', genre: 'rap-us', subGenre: '2000s' },
  { name: 'Rick Ross', priority: 'high', genre: 'rap-us', subGenre: '2000s' },
];

export const RAP_US_2010S: ArtistConfig[] = [
  // 2010s
  { name: 'Drake', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Nicki Minaj', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'J. Cole', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Kendrick Lamar', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'A$AP Rocky', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'A$AP Ferg', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'ScHoolboy Q', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Ab-Soul', priority: 'low', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Joey Bada$$', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Mac Miller', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Wiz Khalifa', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Big Sean', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Meek Mill', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'French Montana', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: '2 Chainz', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Future', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Young Thug', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Migos', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Quavo', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Offset', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Takeoff', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Travis Scott', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Post Malone', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Juice WRLD', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'XXXTentacion', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Lil Uzi Vert', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Lil Yachty', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Playboi Carti', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: '21 Savage', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Metro Boomin', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Kodak Black', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Lil Baby', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Gunna', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'DaBaby', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Cardi B', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Megan Thee Stallion', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Doja Cat', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Chance the Rapper', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Vince Staples', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Tyler, The Creator', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Earl Sweatshirt', priority: 'medium', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Frank Ocean', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Anderson .Paak', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
  { name: 'Pusha T', priority: 'high', genre: 'rap-us', subGenre: '2010s' },
];

export const RAP_US_2020S: ArtistConfig[] = [
  // 2020s
  { name: 'Lil Durk', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Rod Wave', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Polo G', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Lil Tjay', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Pop Smoke', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Fivio Foreign', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Central Cee', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Ice Spice', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'GloRilla', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Sexyy Red', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Latto', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'JID', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Denzel Curry', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Cordae', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Baby Keem', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Don Toliver', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Yeat', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Ken Carson', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Destroy Lonely', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'NBA YoungBoy', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'NLE Choppa', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Moneybagg Yo', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'EST Gee', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Jack Harlow', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Lil Nas X', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: '$uicideboy$', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Freddie Gibbs', priority: 'high', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Boldy James', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Larry June', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Curren$y', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
  { name: 'Action Bronson', priority: 'medium', genre: 'rap-us', subGenre: '2020s' },
];

// =============================================================================
// RAP FR (~80 artistes)
// =============================================================================

export const RAP_FR_CLASSICS: ArtistConfig[] = [
  // Pionniers & Classiques (90s-2000s)
  { name: 'IAM', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'NTM', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'MC Solaar', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Assassin', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Ministère A.M.E.R.', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Ärsenik', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Lunatic', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Booba', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Rohff', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'La Fouine', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Diam\'s', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Kery James', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Oxmo Puccino', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Fabe', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Fonky Family', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Psy4 de la Rime', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: '113', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Sniper', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Sinik', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Sefyu', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Salif', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Mac Tyer', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Kennedy', priority: 'low', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Rim\'K', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Soprano', priority: 'high', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Disiz', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Youssoupha', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
  { name: 'Médine', priority: 'medium', genre: 'rap-fr', subGenre: 'classic' },
];

export const RAP_FR_2010S: ArtistConfig[] = [
  // 2010s
  { name: 'Nekfeu', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'PNL', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Damso', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Orelsan', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Bigflo & Oli', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'SCH', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Jul', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Lacrim', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Gradur', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Kaaris', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'MHD', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Niska', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Alonzo', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Ninho', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Dadju', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Gims', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Lomepal', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Vald', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Hamza', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Alkpote', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Alpha Wann', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Georgio', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Hugo TSR', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Hippocampe Fou', priority: 'low', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'L\'Entourage', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Caballero & JeanJass', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Roméo Elvis', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Angèle', priority: 'medium', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Dinos', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Josman', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
  { name: 'Laylow', priority: 'high', genre: 'rap-fr', subGenre: '2010s' },
];

export const RAP_FR_2020S: ArtistConfig[] = [
  // 2020s (nouvelle génération)
  { name: 'SDM', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Gazo', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Tiakola', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Werenoi', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'PLK', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'RK', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Ziak', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Favé', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Dadi', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'La Fève', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Le Classico Organisé', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Fresh LaDouille', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Bushi', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Enigma LM', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Benjamin Epps', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Zamdane', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Sto', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Zinée', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Zola', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Guy2Bezbar', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Rsko', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Koba LaD', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Green Montana', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Genezio', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Jok\'Air', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'So La Lune', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Houdi', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Bekar', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Meryl', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Chilla', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Lala &ce', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Davinhor', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  // Artistes ajoutés
  { name: 'Isha', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Limsa d\'Aulnay', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Freeze Corleone', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Osirus Jack', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Larry', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Luv Resval', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Pirate', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Maes', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Leto', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'DA Uzi', priority: 'medium', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'Soolking', priority: 'high', genre: 'rap-fr', subGenre: '2020s' },
  { name: 'L\'Allemand', priority: 'low', genre: 'rap-fr', subGenre: '2020s' },
];

// =============================================================================
// BELGIQUE & SUISSE
// =============================================================================

export const RAP_BELGIUM: ArtistConfig[] = [
  { name: 'Zwangere Guy', priority: 'medium', genre: 'rap-be', subGenre: 'belgium' },
  { name: 'ICO', priority: 'low', genre: 'rap-be', subGenre: 'belgium' },
  { name: 'Frenetik', priority: 'low', genre: 'rap-be', subGenre: 'belgium' },
  { name: 'Shay', priority: 'medium', genre: 'rap-be', subGenre: 'belgium' },
];

export const RAP_SWITZERLAND: ArtistConfig[] = [
  { name: 'Di-Meh', priority: 'medium', genre: 'rap-ch', subGenre: 'switzerland' },
  { name: 'Makala', priority: 'medium', genre: 'rap-ch', subGenre: 'switzerland' },
  { name: 'Slimka', priority: 'medium', genre: 'rap-ch', subGenre: 'switzerland' },
  { name: 'Danitsa', priority: 'low', genre: 'rap-ch', subGenre: 'switzerland' },
  { name: 'KT Gorique', priority: 'low', genre: 'rap-ch', subGenre: 'switzerland' },
  { name: 'Varnish La Piscine', priority: 'low', genre: 'rap-ch', subGenre: 'switzerland' },
];

// =============================================================================
// EXPORTS GROUPÉS
// =============================================================================

export const ALL_RAP_US = [
  ...RAP_US_PIONEERS,
  ...RAP_US_2000S,
  ...RAP_US_2010S,
  ...RAP_US_2020S,
];

export const ALL_RAP_FR = [
  ...RAP_FR_CLASSICS,
  ...RAP_FR_2010S,
  ...RAP_FR_2020S,
];

export const ALL_RAP_EUROPE = [
  ...RAP_BELGIUM,
  ...RAP_SWITZERLAND,
];

export const ALL_ARTISTS = [
  ...ALL_RAP_US,
  ...ALL_RAP_FR,
  ...ALL_RAP_EUROPE,
];

// Fonction utilitaire pour filtrer par priorité
export function getArtistsByPriority(priority: 'high' | 'medium' | 'low'): ArtistConfig[] {
  return ALL_ARTISTS.filter(a => a.priority === priority);
}

// Fonction utilitaire pour filtrer par genre
export function getArtistsByGenre(genre: string): ArtistConfig[] {
  return ALL_ARTISTS.filter(a => a.genre === genre);
}

// Stats
export const ARTIST_STATS = {
  total: ALL_ARTISTS.length,
  rapUS: ALL_RAP_US.length,
  rapFR: ALL_RAP_FR.length,
  rapEurope: ALL_RAP_EUROPE.length,
  highPriority: getArtistsByPriority('high').length,
  mediumPriority: getArtistsByPriority('medium').length,
  lowPriority: getArtistsByPriority('low').length,
};
