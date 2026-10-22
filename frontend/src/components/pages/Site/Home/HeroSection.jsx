import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
const HeroSection = () => {
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800",
    "https://images.unsplash.com/photo-1586611292717-f828b1ad740b?q=80&w=800",
    "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?q=80&w=800",
    "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=800",
    "https://images.unsplash.com/photo-1620619767323-b95a89183081?q=80&w=800",
  ];

  const handleMouseMove = (e) => {
    setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 30,
      y: (e.clientY / window.innerHeight - 0.5) * 30
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-[#020d08] overflow-hidden flex items-center"
    >
      {/* 1. Background Image Layer */}
      <div className="absolute inset-0 z-0">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out ${index === currentImage ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <img
              src={img}
              alt={`Ceylon ${index}`}
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${index === currentImage ? 'scale-110' : 'scale-100'
                }`}
            />

            {/* Seamless Left-to-Right Fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#020d08] via-[#020d08] via-35% to-transparent"></div>

            {/* Subtle bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020d08] via-transparent to-transparent opacity-50"></div>
          </div>
        ))}
      </div>

      {/* 2. Content Layer */}
      <div className="relative z-20 w-full px-6 md:px-20">
        <div className="max-w-2xl">

          <h1 className="mb-8 leading-tight tracking-tighter">
            <span className="block text-6xl md:text-9xl font-black text-white uppercase font-['Inter'] drop-shadow-2xl">
              {"Ceylon"}
            </span>
            {/* GRADIENT UPDATED TO #EF8354 */}
            <span className="block text-5xl md:text-8xl font-['Playfair_Display'] italic text-transparent bg-clip-text bg-gradient-to-r from-[#40e0d6] via-[#EF8354] to-[#4F5D75] ml-2 md:ml-4 -mt-2 md:-mt-4">
              {"Best Tours"}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-md border-l-2 border-[#EF8354]/40 pl-6">
            {"Explore the paradise island with unmatched elegance. From luxury sedans to rugged SUVs, we move your dreams."}
          </p>

          <div className="flex flex-wrap gap-5">
            {/* Button updated to match your new teal */}


            <Link to="/tour-booking">
            <button
              // onClick={() => navigate("/tourbooking")}
              className="relative group px-10 py-4 bg-[#EF8354] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-[#EF8354]/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative text-white font-extrabold tracking-wider">
                {"BOOK YOUR RIDE"}
              </span>
            </button>
            </Link>

            <Link to="/vehicle-category">
              <button className="px-10 py-4 border border-white/10 text-white rounded-full font-bold hover:bg-[#EF8354]/5 backdrop-blur-sm transition-all">
                {"EXPLORE FLEET"}
              </button>
            </Link>
          </div>

          {/* Stats Badges */}
          <div className="mt-16 flex gap-8 items-center border-t border-white/5 pt-10">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{"Luxury Vehicles"}</p>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{"Island Support"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Availability Badge */}
      <div className="absolute bottom-10 right-10 backdrop-blur-xl bg-white/5 border border-[#EF8354]/20 p-4 rounded-2xl z-30 animate-bounce-slow hidden md:block">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF8354] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF8354]"></span>
          </span>
          <p className="text-white text-sm font-medium uppercase tracking-tighter">{"Live Availability"}</p>
        </div>
      </div>

      {/* Parallax Glow Effect - Updated to match Teal */}
      <div
        className="absolute w-[600px] h-[600px] bg-[#EF8354]/10 rounded-full blur-[150px] pointer-events-none transition-transform duration-1000 z-10"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)`, left: '10%', top: '10%' }}
      ></div>
    </section>
  );
};

export default HeroSection;