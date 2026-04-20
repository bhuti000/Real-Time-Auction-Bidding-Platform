import React, { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function DashboardHeader({ count, view, onViewChange }) {

  return (
    <header className="flex justify-between items-end mb-4">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
          Live Auctions
        </h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          {count} items matching your criteria.
        </p>
      </div>

      {/* View toggle */}
    <div className="hidden sm:flex gap-2">
      <button
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
        className={`p-2 rounded-lg transition-all duration-200 active:scale-95 ${
          view === 'grid'
            ? 'bg-surface-container-low text-primary shadow-sm'
            : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'
        }`}
      >
        <LayoutGrid size={20} />
      </button>
      <button
        onClick={() => onViewChange('list')}
        aria-label="List view"
        className={`p-2 rounded-lg transition-all duration-200 active:scale-95 ${
          view === 'list'
            ? 'bg-surface-container-low text-primary shadow-sm'
            : 'bg-surface text-on-surface-variant hover:bg-surface-container-low'
        }`}
      >
        <List size={20} />
      </button>
    </div>
    </header>
  );
}
