import { create } from 'zustand';

/**
 * Zustand store for live auction bids and auction data.
 */
const useAuctionStore = create((set) => ({
  liveBids: [],
  auctions: [],

  addBid: (bid) =>
    set((state) => ({
      liveBids: [bid, ...state.liveBids].slice(0, 50),
    })),

  clearBids: () => set({ liveBids: [] }),

  setAuctions: (auctions) => set({ auctions }),
}));

export default useAuctionStore;
