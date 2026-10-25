import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { buildApiUrl } from '../../../../config/api';

const DEFAULT_DESTINATIONS = [
  { title: "Nuwara Eliya", location: "Hill Country", image: "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800", badge: "Misty Hills" },
  { title: "Mirissa", location: "South Coast", image: "https://images.unsplash.com/photo-1586611292717-f828b1ad740b?q=80&w=800", badge: "Coastal & Surfing" },
  { title: "Sigiriya", location: "Cultural Triangle", image: "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?q=80&w=800", badge: "Ancient Heritage" },
  { title: "Ella", location: "Badulla", image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=800", badge: "Scenic Hiking" },
  { title: "Galle Fort", location: "Galle", image: "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800", badge: "Colonial Charm" },
  { title: "Trincomalee", location: "East Coast", image: "https://images.unsplash.com/photo-1589982840456-a228bb29550e?q=80&w=800", badge: "Beaches & Diving" },
];

export default function AutoSlidingDestinations() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [destinations, setDestinations] = useState(DEFAULT_DESTINATIONS);
  const [loading, setLoading] = useState(false);

  // Fetch package tours from the database
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(buildApiUrl('/packages?limit=12'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const list = Array.isArray(data) ? data : data.packages || [];
        if (list.length > 0) {
          const mapped = list.map((pkg) => {
            const firstPlace = pkg.destinations?.[0]?.name;
            return {
              id: pkg.id,
              title: pkg.title, // Package tour title as destination name
              location: pkg.type || (firstPlace ? `Via ${firstPlace}` : "Sri Lanka"),
              image: pkg.image || pkg.image_url || "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800", // Cover image as photo
              badge: pkg.days ? `${pkg.days} Days` : (pkg.type || "Tour Package"),
            };
          });
          setDestinations(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not load package destinations from DB, using fallback:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Auto-slide logic: updates every 4 seconds
  useEffect(() => {
    if (destinations.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % destinations.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [destinations.length]);

  if (destinations.length === 0) return null;

  // Calculate visible cards (shows 3 at a time on desktop)
  const visibleCards = [
    destinations[index % destinations.length],
    destinations[(index + 1) % destinations.length],
    destinations[(index + 2) % destinations.length],
  ].filter(Boolean);

  return (
    <section className="py-20 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex flex-col items-center gap-4">
          <div className="text-center">
            <h4 className="text-[#EF8354] font-bold tracking-widest uppercase text-xs mb-2">
              {"Explore Sri Lanka"}
            </h4>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#2D3142] tracking-tight">
              {"Popular Destinations & Tours"}
            </h2>
            <p className="text-[#4F5D75] text-sm mt-2 max-w-xl mx-auto">
              {"Handcrafted travel itineraries featuring iconic sights, lush landscapes, and authentic Sri Lankan hospitality."}
            </p>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex gap-2 items-center mt-2">
            {destinations.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                  index === i ? 'w-8 bg-[#EF8354]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="relative h-[460px]">
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
            >
              {visibleCards.map((dest, i) => (
                <div 
                  key={`${dest.id || dest.title}-${i}`} 
                  onClick={() => navigate('/tour-booking/package')}
                  className="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl overflow-hidden h-[420px] cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image Background */}
                  <img 
                    src={dest.image} 
                    alt={dest.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" 
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  {/* Content */}
                  <div className="absolute bottom-0 p-7 w-full">
                    <span className="px-3.5 py-1 bg-[#EF8354] text-white text-[11px] font-bold uppercase tracking-wider rounded-full mb-3 inline-block shadow-sm">
                      {dest.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-[#EF8354] transition-colors">
                      {dest.title}
                    </h3>
                    <div className="flex items-center justify-between text-slate-300 text-sm mt-3 pt-3 border-t border-white/15">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-[#EF8354]" />
                        <span>{dest.location}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-white group-hover:text-[#EF8354] transition-colors">
                        Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* View all packages button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/tour-booking/package')}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#EF8354] hover:bg-[#4F5D75] text-white font-bold text-sm tracking-wide shadow-md shadow-[#EF8354]/20 transition-all cursor-pointer"
          >
            <span>View All Tour Packages</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}