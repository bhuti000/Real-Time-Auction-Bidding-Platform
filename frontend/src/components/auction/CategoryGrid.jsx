import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { name: "Electronics", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop" },
  { name: "Vehicles", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800" },
  { name: "Collectibles", img: "https://images.unsplash.com/photo-1560439514-4e9645039924?q=80&w=800&auto=format&fit=crop" },
  { name: "Fine Art", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800" },
  { name: "Horology", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800" },
  { name: "Photography", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800" },
  { name: "Sculpture", img: "https://images.unsplash.com/photo-1554188248-986adbb73be4?q=80&w=800&auto=format&fit=crop" },
  { name: "Contemporary Art", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800" },
  { name: "Others", img: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=800&auto=format&fit=crop" }
];

export default function CategoryGrid() {
  return (
    <section className="py-16 px-8 max-w-screen-2xl mx-auto overflow-hidden">
      <h2 className="font-headline text-3xl font-bold mb-8 text-on-surface">Explore Categories</h2>
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide no-scrollbar snap-x">
        {categories.map((cat) => (
          <Link 
            key={cat.name} 
            to={`/live-auctions?category=${encodeURIComponent(cat.name)}`}
            className="group relative flex-shrink-0 w-64 h-44 rounded-2xl overflow-hidden bg-surface-container-low cursor-pointer transition-all hover:scale-[1.02] shadow-sm snap-start"
          >
            <img alt={cat.name} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" src={cat.img}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <h3 className="absolute bottom-5 left-5 font-headline text-lg font-bold text-white tracking-wide">{cat.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}