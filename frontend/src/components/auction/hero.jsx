import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="w-full bg-surface-container-low py-20 px-8">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-6">
          <span className="inline-block px-4 py-1.5 bg-tertiary-container text-on-tertiary-container text-sm font-medium rounded-full uppercase">Premier Auctions</span>
          <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface tracking-tighter leading-tight">
            Real-Time Auction & Bidding Platform
          </h1>
          <p className="text-lg text-on-surface-variant font-body max-w-xl">
            Join the most trusted platform for high-value collectibles, fine art, and premium vehicles.
          </p>
          <div className="pt-4 flex gap-4">
            <Link 
              to="/live-auctions"
              className="bg-gradient-to-br from-primary to-primary-dim text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 flex items-center justify-center transition-all"
            >
              Start Bidding
            </Link>
          </div>
        </div>
        {/* Featured Live Item */}
        <div className="md:w-1/2 w-full relative h-[400px] rounded-xl overflow-hidden shadow-xl">
          <img alt="Modernist Bronze Sculpture" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGKx_dVWn1mMkqLX0ey3A_1aoMV6diEr0rfBIP01iwXilI5X6GE0ancMUFFyUfqt4J8fkP_91Qjbcw4TP0Zp41Gpzlcy3oXmfBP6mI2WwH-wSn5HVHhHGlFBK56ytweE_SmM4a9Ea1VTWfEIr7QvpMgA8T7pMIFe0Dq4r_A1ihh_dKfVVCbHBafsaUoDQYm7ZFJFZXzhMaL7tAXopI0ckb8XgUG5JZCIikAUr_br2A3o3HjMu-_evSkVKsXs7iZ4GnTqnW8NV5ta0"/>
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/80 backdrop-blur-xl rounded-xl">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-sm font-semibold text-secondary mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> Live Now
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">Modernist Bronze Sculpture</h3>
              </div>
              <div className="text-right">
                <div className="text-sm text-on-surface-variant">Current Bid</div>
                <div className="font-headline font-bold text-2xl text-primary">$45,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}