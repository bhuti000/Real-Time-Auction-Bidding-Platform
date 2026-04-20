import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ImageGallery from '../components/auction/ImageGallery';
import BiddingInterface from '../components/auction/BiddingInterface';
import BidHistory from '../components/auction/BidHistory';
import { SocketContext } from '../context/SocketContext';
import { api, extractApiError } from '../lib/api';
import { timeAgoLabel } from '../lib/formatters';

const getInitials = (name) => {
  if (!name) return 'BD';
  const cleanName = name.replace('Bidder ', '');
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
};

const mapBidHistoryItem = (bid) => ({
  id: bid.user_id ? String(bid.user_id).slice(-4) : '----',
  initial: getInitials(bid.bidder_name),
  time: timeAgoLabel(bid.placed_at),
  amount: bid.amount,
  rawPlacedAt: bid.placed_at,
  bidderName: bid.bidder_name,
});

export default function AuctionDetail() {
  const { id } = useParams();
  const socket = useContext(SocketContext);

  const [auction, setAuction] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidLogs, setBidLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAuction = async () => {
      setLoading(true);
      setError('');
      try {
        const [auctionResponse, bidsResponse] = await Promise.all([
          api.get(`/api/auctions/${id}`),
          api.get(`/api/auctions/${id}/bids?limit=20&page=1`),
        ]);

        if (!mounted) {
          return;
        }

        const auctionData = auctionResponse.data?.data;
        const bidsData = bidsResponse.data?.data || [];
        setAuction(auctionData);
        setCurrentBid(auctionData?.current_bid || 0);
        setBidLogs(bidsData.map(mapBidHistoryItem));
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Failed to load auction details'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAuction();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) {
      return;
    }

    socket.emit('join_auction', { auction_id: id });

    const onBidPlaced = (payload) => {
      if (payload?.auction_id !== id) {
        return;
      }

      setCurrentBid(payload.amount);
      setBidLogs((prev) =>
        [
          {
            id: payload.bidder_id ? String(payload.bidder_id).slice(-4) : '----',
            initial: getInitials(payload.bidder_name),
            time: 'just now',
            amount: payload.amount,
            rawPlacedAt: payload.timestamp,
            bidderName: payload.bidder_name,
          },
          ...prev,
        ].slice(0, 50)
      );
    };

    const onAuctionStarted = (payload) => {
      if (payload?.auction_id === id) {
        setStatusNotice('Auction is live now.');
        setAuction((prev) => (prev ? { ...prev, status: 'LIVE' } : prev));
      }
    };

    const onAuctionEnded = (payload) => {
      if (payload?.auction_id === id) {
        setStatusNotice('Auction has ended.');
        setAuction((prev) => (prev ? { ...prev, status: 'COMPLETED' } : prev));
      }
    };

    socket.on('BID_PLACED', onBidPlaced);
    socket.on('AUCTION_STARTED', onAuctionStarted);
    socket.on('AUCTION_ENDED', onAuctionEnded);

    return () => {
      socket.off('BID_PLACED', onBidPlaced);
      socket.off('AUCTION_STARTED', onAuctionStarted);
      socket.off('AUCTION_ENDED', onAuctionEnded);
      socket.emit('leave_auction', { auction_id: id });
    };
  }, [id, socket]);

  const details = useMemo(
    () => {
      const all = {
        Medium: auction?.medium,
        Dimensions: auction?.dimensions,
        Provenance: auction?.provenance,
        Condition: auction?.condition,
      };
      // Only return entries that have a value
      return Object.entries(all).filter(([_, v]) => v && v !== 'Not specified');
    },
    [auction]
  );

  if (loading) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-12 text-on-surface-variant animate-pulse">
        Loading auction details...
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error || 'Auction not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-12">
      <div className="flex-1 flex flex-col gap-12">
        <ImageGallery images={auction.images} category={auction.category} />

        <div className="flex flex-col gap-6 bg-surface-container-low p-8 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface leading-tight">
              {auction.title}
            </h1>
            <p className="text-xl font-body text-on-surface-variant font-medium">
              {auction.artist_name ? `${auction.artist_name}${auction.year ? `, ${auction.year}` : ''}` : auction.category}
            </p>
            {statusNotice && (
              <div className="mt-2 flex items-center gap-2 text-sm text-secondary font-bold bg-secondary/10 w-fit px-3 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                {statusNotice}
              </div>
            )}
          </div>

          <div className="prose prose-slate max-w-none font-body text-on-surface-variant leading-relaxed text-lg">
            <p className="whitespace-pre-line">{auction.description}</p>
          </div>

          {details.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 pt-8 border-t border-surface-container-highest mt-4">
              {details.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">
                    {key}
                  </span>
                  <span className="text-base text-on-surface font-body font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-[420px] flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pb-12">
        <BiddingInterface
          item={{
            endTime: auction.end_time,
            estimate: auction.estimate_low
              ? `$${Number(auction.estimate_low).toLocaleString()} - $${Number(
                  auction.estimate_high || auction.estimate_low
                ).toLocaleString()}`
              : 'Estimate on request',
            status: auction.status,
            minIncrement: auction.min_increment,
          }}
          currentBid={currentBid}
          auctionId={id}
          onBidPlaced={(amount) => setCurrentBid(amount)}
        />

        <BidHistory history={bidLogs.slice(0, 10)} />
      </div>
    </div>
  );
}
