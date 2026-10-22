import { motion } from "framer-motion";
const ReviewHero = ({ onAddReview, isLoggedIn }) => {
  
  return (
  <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
    <motion.img
      initial={{ scale: 1.1 }}
      animate={{ scale: 1 }}
      transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      src="https://images.unsplash.com/photo-1572720350370-8080412fc75b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      className="absolute w-full h-full object-cover"
      alt="Sri Lanka reviews background"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/50" />

    <div className="relative z-10 text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354] rounded-full">
          {"Amazing Traveller Experiences"}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
          {"Guest"} <span className="text-[#EF8354]">{"Reviews."}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-light mb-3">
          {"Real stories from real travellers who explored Sri Lanka with us."}
        </p>
        <p className="text-sm text-white/60 font-light mb-8 tracking-wide">
          {"✦ Reviews are available only after your tour is marked complete by our team."}
        </p>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onClick={onAddReview}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-xs tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,176,165,0.75)';
            e.currentTarget.style.borderColor = 'rgba(0,220,205,0.6)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,176,165,0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          {/* Glowing dot */}
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#EF8354',
            boxShadow: '0 0 8px #EF8354',
            flexShrink: 0,
          }} />
          {isLoggedIn ? "Write a Review" : "Log In to Write a Review"}
          {/* Arrow */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.8 }}>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </motion.div>
    </div>
  </section>
  );
};

export default ReviewHero;





