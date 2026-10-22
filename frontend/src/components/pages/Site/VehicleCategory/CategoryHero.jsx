import React from 'react';
import { motion } from 'framer-motion';
const CategoryHero = () => {
	
	return (
		<section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
			{/* Background Image with slow zoom effect */}
			<motion.img
				initial={{ scale: 1.1 }}
				animate={{ scale: 1 }}
				transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
				src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920"
				className="absolute w-full h-full object-cover"
				alt="Vehicle category background"
			/>

			{/* Dark Gradient Overlay to match ContactHeader */}
			<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />

			<div className="relative z-10 text-center px-4">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					{/* Badge styled to match your contact page */}
					<span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-widest text-white uppercase bg-[#EF8354] rounded-full">
						{"Our Fleet"}
					</span>

					<h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight">
						{"Vehicle "} <span className="text-[#EF8354]">{"Categories."}</span>
					</h1>

					<p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-light">
						{"Discover the perfect class of vehicle for your lifestyle, from executive luxury to rugged utility."}
					</p>
				</motion.div>
			</div>
		</section>
	);
};

export default CategoryHero;