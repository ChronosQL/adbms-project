import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
const SLIDE_DURATION = 5000;

export default function Intro() {
  

  const slides = [
    {
      id: 0,
      tag: "Premium Travel Services",
      headlineWhite: "Discover",
      headlineTeal: "Sri Lanka.",
      sub: "Curated journeys across the pearl of the Indian Ocean.",
      image: "https://images.unsplash.com/photo-1646894232861-a0ad84f1ad5d?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      isIntro: true,
      labels: ["Package Tours", "Point to Point"]
    },
    {
      id: 1,
      tag: "Package Tours",
      headlineWhite: "Golden",
      headlineTeal: "Triangle.",
      sub: "Ancient temples, misty highlands & sun-drenched shores — curated journeys through Sri Lanka's most iconic destinations.",
      image: "https://plus.unsplash.com/premium_photo-1730145749791-28fc538d7203?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      tag: "Point to Point",
      headlineWhite: "Seamless",
      headlineTeal: "Transfers.",
      sub: "Premium air-conditioned vehicles and professional drivers ensure you arrive at every destination in comfort.",
      image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const animatingRef = useRef(false);

  const goTo = (idx) => {
    if (idx === current || animatingRef.current) return;
    animatingRef.current = true;
    setTimeout(() => {
      setCurrent(idx);
      setProgress(0);
      startTimeRef.current = Date.now();
      animatingRef.current = false;
    }, 600);
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (animatingRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(p);
      if (elapsed >= SLIDE_DURATION) {
        goTo((current + 1) % slides.length);
      }
    }, 30);
    return () => clearInterval(id);
  }, [current]);

  const slide = slides[current];

  return (
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black">

      {/* Single AnimatePresence — image + content fade together as one unit */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`slide-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background image with ken-burns */}
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            src={slide.image}
            className="absolute w-full h-full object-cover"
            alt=""
          />

          {/* Overlay — to-black/50 prevents white bleed-through */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/50" />

          {/* Content inside same wrapper — fades together with image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 text-center px-4">
              <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354] rounded-full">
                {slide.tag}
              </span>

              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
                {slide.headlineWhite}{" "}
                <span className="text-[#EF8354]">{slide.headlineTeal}</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-light mb-6">
                {slide.sub}
              </p>

              {/* Pills only on intro slide */}
              {slide.isIntro && slide.labels && (
                <div className="flex flex-wrap justify-center gap-2">
                  {slide.labels.map((label) => (
                    <span
                      key={label}
                      className="px-4 py-1 rounded-full text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354]/20 border border-[#EF8354]/50 cursor-pointer hover:bg-[#EF8354]/40 hover:border-[#EF8354] transition-all duration-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Counter — outside AnimatePresence so it stays fixed during transitions */}
      {/* <div className="absolute bottom-8 left-[7vw] z-10 text-white/60 text-sm tracking-wide font-light">
        <span className="text-white text-2xl font-extrabold">0{current + 1}</span>
        {" "}/ 0{slides.length}
      </div> */}

      {/* Nav: tracks + arrows — outside AnimatePresence so they stay fixed */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex items-center gap-5">
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="py-1.5 flex items-center focus:outline-none"
            >
              <div className={`h-0.5 rounded-full overflow-hidden bg-[#EF8354]/20 transition-all duration-300 ${i === current ? "w-12" : "w-8"}`}>
                <div
                  className="h-full bg-[#EF8354] rounded-full transition-[width] duration-[30ms] ease-linear"
                  style={{
                    width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* <div className="flex gap-2">
          {[
            { label: "Previous", icon: "←", fn: () => goTo((current - 1 + slides.length) % slides.length) },
            { label: "Next",     icon: "→", fn: () => goTo((current + 1) % slides.length) },
          ].map(({ label, icon, fn }) => (
            <button
              key={label}
              onClick={fn}
              aria-label={label}
              className="w-10 h-10 rounded-full border border-[#EF8354]/30 bg-[#EF8354]/10 backdrop-blur-sm text-white text-base flex items-center justify-center hover:bg-[#EF8354]/25 hover:border-[#EF8354]/60 transition-all duration-200"
            >
              {icon}
            </button>
          ))}
        </div> */}
      </div>

    </section>
  );
}
