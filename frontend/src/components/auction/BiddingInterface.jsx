import React, { useState, useEffect } from 'react';
import { Gavel, Clock } from 'lucide-react';
import { api, extractApiError } from '../../lib/api';
import { getTimeLeftLabel } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

export default function BiddingInterface({ item, currentBid, auctionId, onBidPlaced }) {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const safeBid = currentBid || 0;
  const minIncrement = 10;
  const [bidAmount, setBidAmount] = useState(safeBid + minIncrement);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Keep input in sync with live bid updates
  useEffect(() => {
    setBidAmount(safeBid + minIncrement);
  }, [safeBid, minIncrement]);

  const handlePlaceBid = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to place a bid.');
      return;
    }
    if (submitting || bidAmount < safeBid + minIncrement) {
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const response = await api.post(`/api/auctions/${auctionId}/bids`, {
        amount: Number(bidAmount),
      });
      const amount = response.data?.data?.amount;
      if (typeof amount === 'number') {
        onBidPlaced?.(amount);
        refreshUser?.(); // Update balance
      }
    } catch (err) {
      setError(extractApiError(err, 'Failed to place bid'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-8 flex flex-col gap-6">
      {/* Status bar */}
      <div className="flex justify-between items-center">
        {item?.status === 'LIVE' ? (
          <div className="flex items-center gap-2 bg-secondary text-on-secondary px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Now</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-surface-container-highest text-on-surface-variant px-3 py-1.5 rounded-full border border-surface-container-highest">
            <span className="text-xs font-bold uppercase tracking-wider">
              {item?.status === 'COMPLETED' ? 'SOLD' : (item?.status || 'Ended')}
            </span>
          </div>
        )}
        <span className="text-sm text-on-surface-variant flex items-center gap-1.5 font-medium">
          <Clock size={14} />
          {item?.status === 'LIVE' ? `Closes in ${getTimeLeftLabel(item?.endTime)}` : 'Auction Closed'}
        </span>
      </div>

      {/* Current bid */}
      <div>
        <span className="text-sm text-on-surface-variant block mb-1">Current Bid</span>
        <div className="text-5xl font-headline font-extrabold text-on-surface tracking-tighter">
          ${(currentBid || 0).toLocaleString()}
        </div>
        <span className="text-xs text-on-surface-variant block mt-1.5">
          Estimate: {item?.estimate}
        </span>
      </div>

      {/* Bid input card */}
      <div className="flex flex-col gap-4 bg-surface-container-low p-6 rounded-xl border border-surface-container-highest shadow-premium">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-headline font-bold text-xl">
            $
          </span>
          <input
            className="w-full bg-surface-container-highest border-none text-on-surface font-headline font-bold text-xl py-4 pl-10 pr-4 rounded-lg focus:ring-0 outline-none"
            type="number"
            value={bidAmount}
            min={safeBid + minIncrement}
            step={minIncrement}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            aria-label="Bid amount"
          />
        </div>
        <button
          onClick={handlePlaceBid}
          disabled={submitting || bidAmount < safeBid + minIncrement || item?.status !== 'LIVE'}
          className="w-full bg-gradient-to-br from-primary to-primary-dim text-white font-headline font-bold text-lg py-4 rounded-xl hover:opacity-90 transition-opacity shadow-premium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Placing...' : 'Place Bid'} <Gavel size={18} />
        </button>
        <div className="flex justify-between items-center text-xs text-on-surface-variant font-body">
          <span>Min increment: ${minIncrement.toLocaleString()}</span>
          <button className="text-primary hover:text-primary-dim transition-colors font-semibold">
            Bidding rules
          </button>
        </div>
        {item?.status !== 'LIVE' && (
          <div className="text-xs text-on-surface-variant">
            Bidding is available only when the auction status is LIVE.
          </div>
        )}
        {isAuthenticated && user?.balance !== undefined && (
          <div className="text-xs flex justify-between items-center px-1">
            <span className="text-on-surface-variant">Your Wallet Balance:</span>
            <span className={`font-bold ${user.balance < bidAmount ? 'text-red-500' : 'text-secondary'}`}>
              ${Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
