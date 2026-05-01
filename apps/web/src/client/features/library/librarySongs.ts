export type LibraryGenre = 'Indie' | 'Electronic' | 'Jazz' | 'Rock'

export type LibrarySong = {
  id: number
  title: string
  artist: string
  album: string
  genre: LibraryGenre
  duration: string
  cover: string
  eqLabel?: string
}

export const librarySongs: LibrarySong[] = [
  {
    id: 1,
    title: 'Neon Genesis',
    artist: 'Cyber Architect',
    album: 'Digital Frontier',
    genre: 'Electronic',
    duration: '3:42',
    cover: 'https://i.scdn.co/image/ab67616d00001e02e2829416e5011fb749cc3fde',
    eqLabel: 'PRO EQ',
  },
  {
    id: 2,
    title: 'Midnight Glitch',
    artist: 'The Synthesizer',
    album: 'Analog Dreams',
    genre: 'Indie',
    duration: '5:18',
    cover:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHjuAtK9I0-TYrXESEK0Q3ZLkD5TNm7e5-0Q&s',
  },
  {
    id: 3,
    title: 'Urban Pulse',
    artist: 'Metric Flow',
    album: 'City Rhythms',
    genre: 'Jazz',
    duration: '2:55',
    cover:
      'https://cdn-images.dzcdn.net/images/cover/3ee64426f51389cd6fce941a2fb87ba2/0x1900-000000-80-0-0.jpg',
    eqLabel: 'VOCAL BOOST',
  },
  {
    id: 4,
    title: 'Static Bloom',
    artist: 'Nova Sequence',
    album: 'Afterimage',
    genre: 'Rock',
    duration: '4:11',
    cover:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzfP0M8hP_VVWj9WW9r5cXfav8npmI5wspDA&s',
  },
]
