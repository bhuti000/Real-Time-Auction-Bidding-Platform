import React, { useState } from 'react';
import { Bell, Calendar, CheckCircle, Heart } from 'lucide-react';
import { getApiBaseUrl, api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const formatBid = (amount) => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  return `$${amount.toLocaleString()}`;
};

export default function UpcomingAuctionCard({ lot }) {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [notified, setNotified] = useState(lot.is_reminding || false);
  const [loading, setLoading] = useState(false);

  const isWatched = user?.watched_auction_ids?.includes(lot.id);

  const toggleReminder = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const resp = await api.post(`/api/auctions/${lot.id}/reminder`);
      setNotified(resp.data.data.reminding);
      
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: {
          title: resp.data.data.reminding ? "Reminder Set" : "Reminder Removed",
          message: resp.data.data.reminding 
            ? "We'll notify you when this auction goes live." 
            : "You've unsubscribed from this auction's notifications."
        } 
      }));
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatch = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      await api.post(`/api/auctions/${lot.id}/watch`);
      await refreshUser();
    } catch (err) {
      console.error('Failed to toggle wishlist status', err);
    }
  };

  const fullImageUrl = lot.image?.startsWith('http') 
    ? lot.image 
    : `${getApiBaseUrl()}${lot.image}`;

  return (
    <article className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-premium flex flex-col group hover:-translate-y-1 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
        <img
          src={fullImageUrl}
          alt={lot.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-tertiary-container text-on-tertiary-container text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
            {lot.category}
          </span>
        </div>
        
        {/* Date and Wishlist Actions */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <span className="bg-white/90 backdrop-blur-sm shadow-sm text-on-surface text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase">
            <Calendar size={10} />
            {lot.date}
          </span>
          {isAuthenticated && (
            <button
              onClick={handleToggleWatch}
              className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all shadow-sm ${
                isWatched 
                  ? 'bg-secondary text-white' 
                  : 'bg-white/70 text-on-surface-variant hover:bg-white hover:text-secondary'
              }`}
            >
              <Heart size={16} fill={isWatched ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex flex-col gap-4 flex-grow">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline text-lg font-bold text-on-surface leading-tight">
            {lot.title}
          </h3>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-2">
            {lot.description}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-surface-container-low">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant font-label block mb-1">
              Starting Bid
            </span>
            <span className="font-headline text-2xl font-extrabold text-primary">
              {formatBid(lot.startingBid)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
