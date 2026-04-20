import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { getTimeLeftLabel, getAuctionImage } from '../../lib/formatters';

export default function FeaturedLots() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await api.get('/api/auctions/live');
        const data = response.data?.data || [];
        // Take the top 3 items
        setLots(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch featured lots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-8 bg-surface-container-low animate-pulse">
        <div className="max-w-screen-2xl mx-auto">
          <div className="h-8 w-48 bg-surface-container-high rounded mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-[400px] bg-surface-container-high rounded-2xl" />
            <div className="h-[400px] bg-surface-container-high rounded-2xl" />
            <div className="flex flex-col gap-4">
              <div className="h-[192px] bg-surface-container-high rounded-2xl" />
              <div className="h-[192px] bg-surface-container-high rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (lots.length === 0) return null;

  const mainLot = lots[0];
  const sideLots = lots.slice(1);

  return (
    <section className="py-16 px-8 bg-surface-container-low">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <h2 className="font-headline text-3xl font-bold text-on-surface">Featured Lots</h2>
          <Link
            to="/live-auctions"
            className="text-primary font-semibold hover:text-primary-dim flex items-center gap-1 transition-colors text-sm"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {/* 3-column featured layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1: Large hero image */}
          <div className="relative rounded-2xl overflow-hidden bg-inverse-surface min-h-[360px]">
            <img
              src={getAuctionImage(mainLot.images)}
              alt={mainLot.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000';
              }}
            />
          </div>

          {/* Col 2: Featured lot detail + bid */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col justify-between shadow-premium">
            <div className="flex flex-col gap-4">
              <span className="inline-block bg-tertiary-container text-on-tertiary-container text-xs font-semibold px-3 py-1 rounded-full w-fit">
                {mainLot.category}
              </span>
              <h3 className="font-headline text-2xl font-bold text-on-surface leading-tight">
                {mainLot.title}
              </h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-4">
                {mainLot.description}
              </p>
            </div>

            <div className="pt-6 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Current Bid
                  </span>
                  <span className="font-headline text-3xl font-extrabold text-primary">
                    ${(mainLot.current_bid || mainLot.starting_price).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Ends In
                  </span>
                  <span className="font-body text-sm text-secondary flex items-center gap-1 justify-end">
                    <Clock size={13} className="text-secondary" />
                    {getTimeLeftLabel(mainLot.end_time)}
                  </span>
                </div>
              </div>
              <Link
                to={`/auction/${mainLot.id}`}
                className="block w-full bg-gradient-to-br from-primary to-primary-dim text-white text-center font-headline font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Place Bid
              </Link>
            </div>
          </div>

          {/* Col 3: Two small cards */}
          <div className="flex flex-col gap-4">
            {sideLots.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-premium flex flex-col flex-1"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={getAuctionImage(item.images)}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000';
                    }}
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-grow min-w-0 pr-4">
                    <h4 className="font-headline text-sm font-bold text-on-surface truncate">
                      {item.title}
                    </h4>
                    <span className="font-headline font-bold text-primary text-base">
                      ${(item.current_bid || item.starting_price).toLocaleString()}
                    </span>
                  </div>
                  <Link
                    to={`/auction/${item.id}`}
                    className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors shrink-0"
                  >
                    Bid Now
                  </Link>
                </div>
              </div>
            ))}
            
            {/* If only 1 side lot exists, add a placeholder or spacing handle */}
            {sideLots.length === 0 && (
                 <div className="flex-1 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center p-8 text-center">
                    <p className="text-xs font-body text-on-surface-variant">More lots coming soon</p>
                 </div>
            )}
            {sideLots.length < 2 && sideLots.length > 0 && (
                <div className="flex-1 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center p-8 text-center">
                    <p className="text-xs font-body text-on-surface-variant">Check back for more live auctions</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
