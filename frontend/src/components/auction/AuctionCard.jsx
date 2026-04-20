import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart } from 'lucide-react';
import { formatCurrency, formatCurrencyCompact } from '../../lib/formatters';
import { getApiBaseUrl, api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function AuctionCard({ item }) {
  const { user, refreshUser, isAuthenticated } = useAuth();
  
  const displayPrice =
    typeof item.price === 'number' ? formatCurrencyCompact(item.price) : item.price;
  const ctaLabel = item.isLive ? 'Bid Now' : item.isUpcoming ? 'Preview Lot' : 'View Details';

  const fullImageUrl = item.image?.startsWith('http') 
    ? item.image 
    : `${getApiBaseUrl()}${item.image}`;

  const isWatched = user?.watched_auction_ids?.includes(item.id);

  const handleToggleWatch = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      await api.post(`/api/auctions/${item.id}/watch`);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle wishlist status', err);
    }
  };

  return (
    <article className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col group shadow-[0_20px_40px_rgba(29,52,77,0.02)] hover:shadow-premium transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-highest">
        <Link to={`/auction/${item.id}`} className="block w-full h-full">
          <img
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={fullImageUrl}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800';
            }}
          />
        </Link>
        
        {/* Badges and Actions */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {item.isLive && (
            <div className="bg-secondary/90 backdrop-blur-md text-on-secondary px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              <span className="font-label text-xs font-semibold tracking-wide uppercase">
                Live Now
              </span>
            </div>
          )}
          {item.isUpcoming && (
            <div className="bg-primary/90 backdrop-blur-md text-on-primary px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="font-label text-xs font-semibold tracking-wide uppercase">
                Upcoming
              </span>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <button
            onClick={handleToggleWatch}
            className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
              isWatched 
                ? 'bg-secondary text-white shadow-lg' 
                : 'bg-white/70 text-on-surface-variant hover:bg-white hover:text-secondary'
            }`}
          >
            <Heart size={18} fill={isWatched ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4 flex-grow bg-surface-container-lowest rounded-t-xl -mt-4 relative z-10">
        <div>
          <span className="inline-block bg-tertiary-container text-on-tertiary-container text-xs font-semibold px-2 py-0.5 rounded-full mb-2">
            {item.category}
          </span>
          <Link to={`/auction/${item.id}`}>
            <h3 className="font-headline text-lg font-bold text-on-surface leading-tight hover:text-primary transition-colors">
              {item.title}
            </h3>
          </Link>
          <p className="font-body text-sm text-on-surface-variant mt-1">{item.artist}</p>
        </div>

        <div className="flex justify-between items-end mt-auto pt-4 border-t border-outline-variant/10">
          <div className="flex flex-col">
            <span className="font-body text-xs text-on-surface-variant uppercase tracking-wider">
              Current Bid
            </span>
            <span className="font-headline text-xl font-extrabold text-on-surface">
              {displayPrice?.startsWith?.('$') ? displayPrice : formatCurrency(item.price)}
            </span>
          </div>
          <span className="font-body text-xs text-error flex items-center gap-1">
            <Clock size={13} className="text-error" />
            {item.timeLeft}
          </span>
        </div>

        <Link
          to={`/auction/${item.id}`}
          className="w-full mt-2 bg-gradient-to-r from-primary to-primary-dim text-white text-center font-headline font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
