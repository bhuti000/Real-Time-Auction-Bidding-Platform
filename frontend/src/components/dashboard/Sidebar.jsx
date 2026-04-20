import React from 'react';

const CATEGORIES = ['Contemporary Art', 'Photography', 'Sculpture', 'Vehicles', 'Fine Art', 'Collectibles', 'Electronics', 'Horology', 'Others'];

export default function Sidebar({ filters, onFilterChange }) {
  const { selectedCategories = [], minBid = '', maxBid = '' } = filters || {};

  const toggleCategory = (cat) => {
    const nextCategories = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    onFilterChange({ ...filters, selectedCategories: nextCategories });
  };


  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-surface-container-low p-6 rounded-xl flex flex-col gap-8 h-fit shadow-sm border border-surface-container-highest">
      <h2 className="font-headline text-lg font-bold text-on-surface">Refine Search</h2>

      {/* Category Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-headline text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Category</h3>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded accent-primary border-surface-container-highest bg-white cursor-pointer"
              />
              <span className={`font-body text-sm transition-colors ${selectedCategories.includes(cat) ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-headline text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
          Current Bid ($)
        </h3>
        <div className="flex gap-2 items-center">
          <input
            className="w-full bg-white border border-surface-container-highest rounded-lg text-sm p-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-on-surface font-body"
            placeholder="Min"
            type="number"
            value={minBid}
            onChange={(e) => onFilterChange({ ...filters, minBid: e.target.value })}
            aria-label="Minimum bid"
          />
          <span className="text-on-surface-variant font-bold">-</span>
          <input
            className="w-full bg-white border border-surface-container-highest rounded-lg text-sm p-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-on-surface font-body"
            placeholder="Max"
            type="number"
            value={maxBid}
            onChange={(e) => onFilterChange({ ...filters, maxBid: e.target.value })}
            aria-label="Maximum bid"
          />
        </div>
      </div>

    </aside>
  );
}
