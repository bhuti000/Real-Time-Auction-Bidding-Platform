import React, { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import FeaturedCollectionCard from '../components/collections/FeaturedCollectionCard';
import CollectionCard from '../components/collections/CollectionCard';
import { api, extractApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const formatEstValue = (low, high) => {
  const lower = Number(low || 0).toLocaleString();
  const upper = Number(high || 0).toLocaleString();
  return `$${lower} - $${upper}`;
};

export default function PrivateCollections() {
  const { isAuthenticated } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCollections = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/api/collections/private');
        if (mounted) {
          setCollections(response.data?.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(extractApiError(err, 'Failed to load private collections'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCollections();
    return () => {
      mounted = false;
    };
  }, []);

  const mappedCollections = useMemo(
    () =>
      collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        category: collection.subtitle || 'Private Collection',
        badge: collection.status === 'PREVIEW_OPEN' ? 'Preview Open' : null,
        status: collection.status,
        description: collection.description,
        lots: collection.total_lots,
        estValue: formatEstValue(collection.est_value_low, collection.est_value_high),
        image:
          collection.cover_image ||
          'https://images.pexels.com/photos/5823946/pexels-photo-5823946.jpeg',
      })),
    [collections]
  );

  const featuredCollection = mappedCollections[0];
  const secondaryCollections = mappedCollections.slice(1);

  const handleRequestAccess = async (collectionId) => {
    setRequestMessage('');
    if (!isAuthenticated) {
      setRequestMessage('Please sign in to request access.');
      return;
    }
    setRequestingId(collectionId);
    try {
      await api.post(`/api/collections/${collectionId}/request`, {
        message: 'Interested in reviewing this private collection.',
      });
      setRequestMessage('Access request submitted successfully.');
    } catch (err) {
      setRequestMessage(extractApiError(err, 'Failed to submit access request'));
    } finally {
      setRequestingId('');
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
        <div>
          <h1 className="font-headline font-extrabold text-5xl text-on-surface mb-3 tracking-tight">
            Private Collections
          </h1>
          <p className="font-body text-base text-on-surface-variant max-w-lg leading-relaxed">
            Exclusive access to highly curated, single-owner portfolios.
          </p>
        </div>
        <button
          aria-label="Filter collections"
          className="flex items-center gap-2 text-sm font-semibold text-primary border border-surface-container-highest px-4 py-2.5 rounded-xl hover:bg-surface-container-low transition-colors shrink-0 self-start"
        >
          <SlidersHorizontal size={15} />
          Filter
        </button>
      </div>

      {loading && (
        <div className="bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm">
          Loading collections...
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && featuredCollection && (
        <div className="mb-12">
          <FeaturedCollectionCard
            collection={featuredCollection}
            onRequestAccess={handleRequestAccess}
            requestPending={requestingId === featuredCollection.id}
          />
        </div>
      )}

      {requestMessage && (
        <div className="mb-8 bg-surface-container-low rounded-xl p-4 text-sm text-on-surface-variant">
          {requestMessage}
        </div>
      )}

      {!loading && !error && secondaryCollections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {secondaryCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}

      {!loading && !error && mappedCollections.length === 0 && (
        <div className="bg-surface-container-low rounded-xl p-6 text-on-surface-variant text-sm">
          No private collections available right now.
        </div>
      )}
    </div>
  );
}
