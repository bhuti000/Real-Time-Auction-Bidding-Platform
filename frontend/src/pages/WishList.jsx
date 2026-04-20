import React, { useEffect, useState } from 'react';
import AuctionCard from '../components/auction/AuctionCard';
import { api, extractApiError } from '../lib/api';
import { getAuctionImage, getTimeLeftLabel } from '../lib/formatters';
import { useAuth } from '../context/AuthContext';
import { Heart } from 'lucide-react';

export default function WishList() {
  const { isAuthenticated, user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/auctions/watched');
        const items = response.data?.data || [];
        if (mounted) {
          setAuctions(items);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Failed to load wish list'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWishlist();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.watched_auction_ids?.length]);

  const wishListItems = auctions.map((auction) => ({
    id: auction.id,
    title: auction.title,
    artist: auction.artist_name || auction.medium || auction.category,
    category: auction.category,
    price: auction.current_bid,
    timeLeft: getTimeLeftLabel(auction.end_time),
    image: getAuctionImage(auction.images),
    isLive: auction.status === 'LIVE',
    isUpcoming: auction.status === 'SCHEDULED',
  }));

  if (!isAuthenticated) {
    return (
      <div className="max-w-screen-2xl mx-auto px-8 py-24 text-center">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant">
          <Heart size={40} />
        </div>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-4">Your Wish List</h2>
        <p className="text-on-surface-variant mb-8 max-w-sm mx-auto">
          Please sign in to view and manage your watched auctions.
        </p>
        <a href="/login" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-12">
      <div className="mb-12">
        <h1 className="font-headline font-extrabold text-5xl text-on-surface mb-3 tracking-tight">
          My Wish List
        </h1>
        <p className="font-body text-base text-on-surface-variant max-w-lg leading-relaxed">
          Keep track of the extraordinary pieces you're interested in.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/4] bg-surface-container-low rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20">
          {error}
        </div>
      ) : wishListItems.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-16 text-center border border-dashed border-surface-container-highest">
          <Heart size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
          <p className="text-xl font-bold text-on-surface mb-2">Your wish list is empty</p>
          <p className="text-on-surface-variant mb-8">Start exploring auctions and click the heart icon to save items.</p>
          <div className="flex gap-4 justify-center">
            <a href="/live-auctions" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
              Explore Live
            </a>
            <a href="/upcoming" className="bg-surface-container-highest text-on-surface px-6 py-2.5 rounded-xl font-bold hover:bg-surface-container-high transition-colors">
              Upcoming Lots
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishListItems.map((item) => (
            <AuctionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
