import React from 'react';
import ArtistCard from '../components/artists/ArtistCard';

const ABSTRACT_1 = 'https://images.pexels.com/photos/13371111/pexels-photo-13371111.jpeg';
const ABSTRACT_2 = 'https://images.pexels.com/photos/2693200/pexels-photo-2693200.jpeg';
const ABSTRACT_3 = 'https://images.pexels.com/photos/8882645/pexels-photo-8882645.jpeg';
const ABSTRACT_4 = 'https://pixabay.com/get/gb355f18aaa7a2c7b763e447c0fa50b1ba217c68c8c04d8f0f4f130c1e42057e8b7012e4236d8a0784ff7a395c6f9022e.jpg';

const ARTISTS = [
  {
    id: 'a1',
    name: 'Elena Rostova',
    portrait:
      'https://pixabay.com/get/g3baec7960c3d119c189b2d625193b030d8ec5848cc7280a7d4498bdf591102fdc1d82db55aee1dda0c4d1f408e051a9c.png',
    specialties: ['Contemporary Sculpture'],
    hasLiveAuction: false,
    bio:
      "Rostova's monumental steel works explore the tension between industrial force and organic fragility, earning her placement in over 40 permanent international collections.",
    portfolioImages: [ABSTRACT_4, ABSTRACT_1],
    workCount: 12,
  },
  {
    id: 'a2',
    name: 'Marcus Chen',
    portrait:
      'https://pixabay.com/get/gef37b511d12b94cb0a8c3229ff4ef1726bdda72c1f4426a8afeb69800a9d5125f21b74eceb78fd30865083bfa2df1af4.jpg',
    specialties: ['Neo-Expressionism'],
    hasLiveAuction: true,
    bio:
      'Known for vibrant, chaotic canvases that blend urban graffiti aesthetics with classical compositional theory, Chen commands premium prices at auction.',
    portfolioImages: [ABSTRACT_3, ABSTRACT_2],
    workCount: 8,
  },
  {
    id: 'a3',
    name: 'Sarah Jenkins',
    portrait:
      'https://images.unsplash.com/photo-1764971591006-b6eb67a8f0cb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxCbG9uZGUlMjB3b21hbiUyMHNtaWxpbmclMjBwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwwfDF8fHwxNzc2NjM0ODg2fDA&ixlib=rb-4.1.0&q=85',
    specialties: ['Fine Art Photography'],
    hasLiveAuction: true,
    bio:
      'Jenkins captures the ephemeral nature of disappearing architectural landscapes, using large-format film to document spaces before their demolition.',
    portfolioImages: [ABSTRACT_1, ABSTRACT_3],
    workCount: 24,
  },
];

export default function Artists() {
  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="font-headline font-extrabold text-5xl text-on-surface mb-3 tracking-tight">
          Featured Artists
        </h1>
        <p className="font-body text-base text-on-surface-variant max-w-lg leading-relaxed">
          Discover the visionary creators behind our curated collections. Explore their portfolios,
          track their auction history, and anticipate upcoming releases.
        </p>
      </div>

      {/* Artist Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {ARTISTS.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}
