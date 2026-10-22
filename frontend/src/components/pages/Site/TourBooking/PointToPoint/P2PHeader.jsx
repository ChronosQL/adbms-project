import { motion } from "framer-motion";
const P2PHeader = () => {
  
  return (
  <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
    <motion.img
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      src="https://images.unsplash.com/photo-1617451056259-09bc90873072?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600"
      className="absolute w-full h-full object-cover"
      alt="Point to Point Transfer Sri Lanka"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
    <div className="relative z-10 text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354] rounded-full">
          {"Reliable Transfers"}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
          {"Point to "} <span className="text-[#EF8354]">{"Point."}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-light">
          {"Professional drivers and premium vehicles for seamless transfers across Sri Lanka."}
        </p>
      </motion.div>
    </div>
  </section>
  );
};

export default P2PHeader;