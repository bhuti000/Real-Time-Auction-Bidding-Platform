import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import AuctionCard from '../components/auction/AuctionCard';
import { api, extractApiError, getApiBaseUrl } from '../lib/api';
import { getAuctionImage, getTimeLeftLabel } from '../lib/formatters';

export default function LiveAuctions() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Lifted Filter State
  const [filters, setFilters] = useState({
    selectedCategories: initialCategory ? [initialCategory] : [],
    minBid: '',
    maxBid: ''
  });

  // Sync URL search param with internal state if it changes externally
  useEffect(() => {
    if (initialCategory && !filters.selectedCategories.includes(initialCategory)) {
      setFilters(prev => ({
        ...prev,
        selectedCategories: [...new Set([...prev.selectedCategories, initialCategory])]
      }));
    }
  }, [initialCategory]);

  useEffect(() => {
    let mounted = true;

    const loadLiveAuctions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/auctions/live');
        const items = response.data?.data || [];
        if (mounted) {
          setAuctions(items);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Failed to load live auctions'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLiveAuctions();
    return () => {
      mounted = false;
    };
  }, []);

  const liveItems = useMemo(
    () => {
      const query = searchParams.get('q')?.toLowerCase() || '';
      let filtered = auctions;

      // 0. Search Filter
      if (query) {
        filtered = filtered.filter((a) => 
          (a.title || '').toLowerCase().includes(query) || 
          (a.description || '').toLowerCase().includes(query)
        );
      }

      // 1. Category Filter (Multiple)
      if (filters.selectedCategories.length > 0) {
        filtered = filtered.filter((a) =>
          filters.selectedCategories.some(cat => cat.toLowerCase() === (a.category || '').toLowerCase())
        );
      }


      // 3. Price Filter (Min)
      if (filters.minBid) {
        filtered = filtered.filter((a) => (a.current_bid || 0) >= Number(filters.minBid));
      }

      // 4. Price Filter (Max)
      if (filters.maxBid) {
        filtered = filtered.filter((a) => (a.current_bid || 0) <= Number(filters.maxBid));
      }

      return filtered.map((auction) => ({
        id: auction.id,
        title: auction.title,
        artist: auction.artist_name || auction.medium || auction.category,
        category: auction.category,
        price: auction.current_bid,
        timeLeft: getTimeLeftLabel(auction.end_time),
        image: getAuctionImage(auction.images),
        isLive: auction.status === 'LIVE',
      }));
    },
    [auctions, filters]
  );

  return (
    <div className="flex flex-col md:flex-row w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8 gap-8">
      {/* Sidebar with Refine Search filters */}
      <Sidebar filters={filters} onFilterChange={setFilters} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col gap-6">
        {/* Updated Dashboard Header */}
        <DashboardHeader 
          count={liveItems.length} 
          view={viewMode} 
          onViewChange={setViewMode} 
        />
        {loading && (
          <div className="bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm border border-dashed border-surface-container-highest animate-pulse">
            Loading live auctions...
          </div>
        )}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Responsive layout toggle */}
        {!loading && !error && (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" 
              : "flex flex-col gap-4"
          }>
            {liveItems.map((item) => (
              viewMode === 'grid' ? (
                <AuctionCard key={item.id} item={item} />
              ) : (
                <div key={item.id} className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-shadow group border border-surface-container-highest">
                  <div className="w-full sm:w-64 aspect-[4/3] sm:aspect-square overflow-hidden shrink-0">
                    <img 
                      src={item.image?.startsWith('http') ? item.image : `${getApiBaseUrl()}${item.image}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800'; }}
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                         <span className="bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                           {item.category}
                         </span>
                         <span className="text-error font-bold text-xs flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                           {item.timeLeft} remaining
                         </span>
                       </div>
                       <h3 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                         {item.title}
                       </h3>
                       <p className="text-sm text-on-surface-variant line-clamp-2">{item.artist}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-container-highest">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Current Bid</span>
                        <span className="text-2xl font-black text-on-surface">${(item.price || 0).toLocaleString()}</span>
                      </div>
                      <a 
                        href={`/auction/${item.id}`}
                        className="bg-primary text-white font-bold px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                      >
                        Bid Now
                      </a>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
        {!loading && !error && liveItems.length === 0 && (
          <div className="bg-surface-container-low rounded-xl p-12 text-on-surface-variant text-center border border-dashed border-surface-container-highest">
            <p className="text-lg font-bold mb-1">No items match your criteria</p>
            <p className="text-sm opacity-70">Try adjusting your filters to find more auctions.</p>
            <button 
              onClick={() => setFilters({ selectedCategories: [], minBid: '', maxBid: '' })}
              className="mt-4 text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
