import React from 'react';
import { Bookmark } from 'lucide-react';

export default function FeaturedCollectionCard({ collection, onRequestAccess, requestPending }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="relative md:w-[55%] min-h-[320px] overflow-hidden">
          <img
            src={collection.image}
            alt={collection.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-secondary text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              {collection.status}
            </span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="md:w-[45%] p-8 lg:p-10 flex flex-col gap-5 justify-center">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-label">
              {collection.category}
            </span>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface leading-tight">
              {collection.title}
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              {collection.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1">
                Total Lots
              </span>
              <span className="font-headline font-extrabold text-3xl text-on-surface">
                {collection.totalLots}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1">
                Est. Value
              </span>
              <span className="font-headline font-extrabold text-3xl text-on-surface">
                {collection.estValue}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRequestAccess?.(collection.id)}
              disabled={requestPending}
              className="flex-1 bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {requestPending ? 'Requesting...' : 'Request Access'}
            </button>
            <button
              aria-label="Bookmark this collection"
              className="w-11 h-11 border border-surface-container-highest rounded-xl flex items-center justify-center hover:bg-surface-container-low transition-colors"
            >
              <Bookmark size={18} className="text-on-surface-variant" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
