import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CollectionCard({ collection }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-premium overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9]">
        {collection.badge && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-on-surface text-xs font-semibold px-3 py-1.5 rounded-full">
              {collection.badge}
            </span>
          </div>
        )}
        <img
          src={collection.image}
          alt={collection.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-3 flex-grow">
        <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-label">
          {collection.category}
        </span>
        <h3 className="font-headline font-bold text-xl text-on-surface leading-tight">
          {collection.title}
        </h3>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-3 flex-grow">
          {collection.description}
        </p>
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-surface-container-low">
          <span className="font-body text-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{collection.lots} Lots</span>
            <span className="mx-2 text-outline-variant">·</span>
            Est. {collection.estValue}
          </span>
          <button
            aria-label={`View ${collection.title}`}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 text-on-surface-variant"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
