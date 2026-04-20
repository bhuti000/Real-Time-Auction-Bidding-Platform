import React, { useState } from 'react';
import { getApiBaseUrl } from '../../lib/api';

export default function ImageGallery({ images: imageUrls = [], category = 'Contemporary Art' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (imageUrls.length === 0) {
    imageUrls = ['https://images.pexels.com/photos/12826332/pexels-photo-12826332.jpeg'];
  }

  const galleryImages = imageUrls.map(img => 
    img.startsWith('http') ? img : `${getApiBaseUrl()}${img}`
  );

  const safeIndex = Math.min(activeIndex, galleryImages.length - 1);

  return (
    <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-4">
      {/* Main hero image */}
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-container-low shadow-premium relative">
        <img
          key={safeIndex}
          alt="Main auction item"
          className="w-full h-full object-cover transition-opacity duration-300"
          src={galleryImages[safeIndex]}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
          {category}
        </div>
      </div>
    </div>
    </div>
  );
}
