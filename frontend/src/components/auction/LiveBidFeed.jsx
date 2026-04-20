import React from 'react';
import useAuctionStore from '../../store/useAuctionStore.js';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

function LiveBidFeed({ bids = [] }) {
  const storeBids = useAuctionStore((state) => state.liveBids);
  const feed = (bids.length > 0 ? bids : storeBids).slice(0, 12);

  return (
    <section className="rounded-2xl bg-surface-container-low p-6">
      <h3 className="mb-4 font-headline text-xl font-bold text-on-surface">Live Bid Feed</h3>

      {feed.length === 0 ? (
        <p className="text-sm text-on-surface-variant font-body">
          No live bids yet. Place a bid to see updates here.
        </p>
      ) : (
        <ul className="space-y-2">
          {feed.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3 text-sm shadow-premium"
            >
              <div>
                <p className="font-semibold text-on-surface font-body">
                  {item.bidderName ?? 'Anonymous'}
                </p>
                <p className="text-xs text-on-surface-variant font-body">
                  {item.auctionTitle ?? item.auctionId}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-secondary font-headline">
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-on-surface-variant font-body">
                  {new Date(item.placedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default LiveBidFeed;
