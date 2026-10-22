import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export default function AutoSlidingDestinations() {
  
  const [index, setIndex] = useState(0);

  const destinations = [
    { title: "Nuwara Eliya", location: "Hill Country", image: "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800", badge: "Misty" },
    { title: "Mirissa", location: "South Coast", image: "https://images.unsplash.com/photo-1586611292717-f828b1ad740b?q=80&w=800", badge: "Surfing" },
    { title: "Sigiriya", location: "Cultural Triangle", image: "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?q=80&w=800", badge: "Ancient" },
    { title: "Ella", location: "Badulla", image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=800", badge: "Hiking" },
    { title: "Galle Fort", location: "Galle", image: "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800", badge: "Heritage" },
    { title: "Trincomalee", location: "East Coast", image: "https://images.unsplash.com/photo-1589982840456-a228bb29550e?q=80&w=800", badge: "Diving" },
  ];

  // Auto-slide logic: updates every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % destinations.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Calculate visible cards (shows 3 at a time on desktop)
  const visibleCards = [
    destinations[index % destinations.length],
    destinations[(index + 1) % destinations.length],
    destinations[(index + 2) % destinations.length],
  ];

  return (
    <section className="py-13 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="center mb-12 flex flex-col items-center gap-4">
          <div className="text-center">
            <h4 className="text-[#EF8354] font-bold tracking-widest uppercase text-sm mb-2">{"Explore Sri Lanka"}</h4>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{"Popular Destinations"}</h2>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex gap-2">
            {destinations.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? 'w-8 bg-[#EF8354]' : 'w-2 bg-gray-300'}`} 
              />
            ))}
          </div>
        </div>

        <div className="relative h-[450px]">
          <AnimatePresence mode="popLayout">
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
            >
              {visibleCards.map((dest, i) => (
                <div key={`${dest.title}-${i}`} className="group relative bg-white rounded-3xl shadow-lg overflow-hidden h-[400px]">
                  {/* Image Background */}
                  <img src={dest.image} alt={dest.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 p-8 w-full">
                    <span className="px-3 py-1 bg-[#EF8354] text-white text-[10px] font-bold uppercase rounded-full mb-3 inline-block">
                      {dest.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-1">{dest.title}</h3>
                    <div className="flex items-center gap-1 text-gray-300 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" /></svg>
                      {dest.location}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}