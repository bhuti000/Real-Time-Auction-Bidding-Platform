import React from 'react';

/**
 * BidHistory Component
 * Strictly follows the "No-Line Rule" and handles real-time data safely.
 *
 */
export default function BidHistory({ history = [] }) {
  // Use mock data from the source if history prop is empty for initial UI check
  const displayBids = (history && history.length > 0) ? history : [
    { id: "8492", initial: "J.D", time: "2 mins ago", amount: 14500 },
    { id: "1104", initial: "M.S", time: "15 mins ago", amount: 14000 },
    { id: "3391", initial: "A.L", time: "1 hour ago", amount: 13000 },
    { id: "9920", initial: "K.W", time: "3 hours ago", amount: 12500 },
  ];

  return (
    <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-4">
      {/* No-Line Rule: Removed the border-b from the header.
          Boundaries are defined by background color shifts.
      */}
      <h3 className="font-headline font-bold text-lg text-on-surface pb-2">
        Bid History ({displayBids.length})
      </h3>

      {/* Tonal Layering: The list items sit inside the surface-container-low block.
          Using a custom-scrollbar class for a premium feel.
      */}
      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {displayBids.map((bid, index) => (
          <div
            key={`${bid.rawPlacedAt || bid.time}-${index}`}
            className={`flex justify-between items-center py-2 ${index !== 0 ? 'opacity-70' : 'opacity-100'}`}
          >
            <div className="flex items-center gap-3">
              {/* Profile Avatar using Primary colors */}
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-xs">
                {bid.initial || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-body font-semibold text-on-surface">
                  {bid.bidderName || `Bidder ${bid.id}`}
                </span>
                <span className="text-xs font-body text-on-surface-variant">
                  {bid.time}
                </span>
              </div>
            </div>

            {/* Safety Check: Using a fallback (|| 0) before calling .toLocaleString()
                to prevent the white screen crash if data is missing.
            */}
            <span className="font-headline font-bold text-on-surface">
              ${(Number(bid.amount) || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
