import React from 'react';

export default function ArtistCard({ artist }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-premium border border-surface-container-low flex flex-col gap-5">
      {/* Header: portrait + info */}
      <div className="flex gap-4 items-start">
        <img
          src={artist.portrait}
          alt={artist.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-headline font-bold text-xl text-on-surface leading-tight">
            {artist.name}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {artist.hasLiveAuction && (
              <span className="bg-secondary text-on-secondary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Live Auction
              </span>
            )}
            {artist.specialties.map((s) => (
              <span
                key={s}
                className="bg-tertiary-container text-on-tertiary-container text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-2 flex-grow">
        {artist.bio}
      </p>

      {/* Portfolio thumbnails */}
      <div className="flex gap-3 items-center">
        {artist.portfolioImages.slice(0, 2).map((img, i) => (
          <div
            key={i}
            className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-low shrink-0"
          >
            <img
              src={img}
              alt={`${artist.name} portfolio ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="flex-1 h-20 rounded-lg bg-surface-container-low flex items-center justify-center">
          <span className="text-sm font-bold text-primary font-headline">
            +{artist.workCount} Works
          </span>
        </div>
      </div>

      {/* View Portfolio button */}
      <button className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
        View Portfolio
      </button>
    </div>
  );
}
