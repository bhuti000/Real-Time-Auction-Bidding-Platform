import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import UpcomingAuctionCard from '../components/upcoming/UpcomingAuctionCard';
import { api, extractApiError } from '../lib/api';
import { formatDateLabel, getAuctionImage } from '../lib/formatters';

const SORT_OPTIONS = [
  'Date (Soonest)',
  'Date (Latest)',
  'Est. Bid (Low to High)',
  'Est. Bid (High to Low)',
];

export default function UpcomingAuctions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [sort, setSort] = useState('Date (Soonest)');
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadUpcoming = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/auctions/upcoming');
        if (mounted) {
          setAuctions(response.data?.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Failed to load upcoming auctions'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUpcoming();
    const interval = setInterval(() => loadUpcoming(false), 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(['All Categories']);
    auctions.forEach((auction) => {
      if (auction.category) {
        set.add(auction.category);
      }
    });
    return Array.from(set);
  }, [auctions]);

  const mappedLots = useMemo(
    () =>
      auctions.map((auction) => ({
        id: auction.id,
        title: auction.title,
        category: auction.category,
        description: auction.description,
        date: formatDateLabel(auction.start_time),
        sortDate: new Date(auction.start_time).getTime(),
        startingBid: auction.starting_price,
        image: getAuctionImage(auction.images),
        is_reminding: auction.is_reminding,
      })),
    [auctions]
  );

  const filtered = useMemo(() => {
    let source = mappedLots;
    
    // Category filter
    if (activeCategory !== 'All Categories') {
      source = source.filter((lot) => lot.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter((lot) => 
        lot.title.toLowerCase().includes(q) || 
        lot.description?.toLowerCase().includes(q) ||
        lot.category.toLowerCase().includes(q)
      );
    }

    const next = [...source];
    if (sort === 'Date (Latest)') {
      next.sort((a, b) => b.sortDate - a.sortDate);
    } else if (sort === 'Est. Bid (Low to High)') {
      next.sort((a, b) => a.startingBid - b.startingBid);
    } else if (sort === 'Est. Bid (High to Low)') {
      next.sort((a, b) => b.startingBid - a.startingBid);
    } else {
      next.sort((a, b) => a.sortDate - b.sortDate);
    }
    return next;
  }, [activeCategory, mappedLots, sort, searchQuery]);

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex-1 max-w-2xl">
          <h1 className="font-headline font-extrabold text-5xl text-on-surface mb-3 tracking-tight">
            Upcoming Auctions
          </h1>
          <p className="font-body text-base text-on-surface-variant leading-relaxed">
            Preview our highly anticipated collections. Set notifications to ensure you do not miss
            your opportunity to bid.
          </p>
        </div>

        <div className="w-full md:w-80">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant/40 group-focus-within:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search upcoming lots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface pl-12 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-body text-sm placeholder:text-on-surface-variant/30"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between mb-10 pb-6 border-b border-surface-container-highest">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold font-headline transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-surface-container-highest text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-surface-container-lowest border border-surface-container-highest rounded-xl pl-4 pr-10 py-2.5 text-sm font-body text-on-surface-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                Sort by: {opt}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm">
          Loading upcoming auctions...
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((lot) => (
            <UpcomingAuctionCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-6 bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm">
          No upcoming auctions found for this filter.
        </div>
      )}
    </div>
  );
}
