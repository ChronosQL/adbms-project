import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, Ticket, Droplets, MapPinned, CalendarDays, 
  UserCheck, Fuel, ShieldCheck, Bed, Umbrella 
} from 'lucide-react';

export default function LuxuryServiceSlider() {
  const brandColor = "#EF8354";
  
  
  const allServices = [
    { title: "Connected", subtitle: "Free Wi-Fi", icon: Wifi },
    { title: "Convenience", subtitle: "Tolls & Parking", icon: Ticket },
    { title: "Refreshment", subtitle: "Free Water", icon: Droplets },
    { title: "Security", subtitle: "GPS Tracking", icon: MapPinned },
    { title: "Planning", subtitle: "Itinerary Support", icon: CalendarDays },
    { title: "Professional", subtitle: "Expert Driver", icon: UserCheck },
    { title: "Transparent", subtitle: "Fuel Included", icon: Fuel },
    { title: "Protected", subtitle: "Passenger Insurance", icon: ShieldCheck },
    { title: "Hospitality", subtitle: "Driver Housing", icon: Bed },
    { title: "Prepared", subtitle: "Umbrella", icon: Umbrella },
  ];

  // Tripling the array ensures that even on very wide screens (4K), there's no "gap"
  const duplicatedServices = [...allServices, ...allServices, ...allServices];

  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-20 border-l-2 border-[#EF8354] pl-8">
        <h2 className="text-xs uppercase tracking-[0.5em] text-[#EF8354] mb-2 font-bold">
          {"The Gold Standard"}
        </h2>
        <p className="text-3xl md:text-5xl font-extralight tracking-tight">
          {"Our"} <span className="font-semibold italic">{"Signature"}</span> {"Amenities."}
        </p>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative flex w-full group">
        <motion.div 
          className="flex flex-nowrap"
          animate={{ x: ["0%", "-33.33%"] }} // Adjusted for tripled array
          transition={{ 
            duration: 60, // Slower duration for a luxury feel
            ease: "linear", 
            repeat: Infinity 
          }}
          // This line allows the slider to pause when the user hovers over a service
          whileHover={{ transition: { duration: 0 } }} 
        >
          {duplicatedServices.map((service, idx) => (
            <div 
              key={idx}
              className="flex-none w-[320px] px-10 border-r border-white/5 transition-all duration-500 hover:bg-white/[0.02]"
            >
              <div className="mb-8 text-gray-600 group-hover/item:text-[#EF8354] transition-colors duration-500">
                <service.icon size={26} strokeWidth={1} />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {service.title}
                </p>
                <h3 className="text-base font-bold tracking-wide">
                  {service.subtitle}
                </h3>
              </div>
              
              {/* Subtle underline that grows on hover */}
              <div className="mt-8 w-8 group-hover:w-full h-[1px] bg-[#EF8354]/30 group-hover:bg-[#EF8354] transition-all duration-1000" />
            </div>
          ))}
        </motion.div>

        {/* Gradient Overlays (The "Fade" effect) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10" />
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-6 mt-20 flex justify-between items-center opacity-40">
         
         <div className="h-[1px] flex-1 mx-12 bg-white/5" />
         <span className="text-[9px] uppercase tracking-[0.4em] text-[#EF8354]">{"All-Inclusive Fleet"}</span>
      </div>
    </section>
  );
}