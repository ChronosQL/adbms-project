import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Clock, Map, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import aboutusImg from '../../../../assets/aboutus_img.jpg';

const About = () => {
  

  const stats = [
    { label: "Years Experience", value: '10+' },
    { label: "Happy Travelers", value: '15k+' },
    { label: "Luxury Vehicles", value: '50+' },
    { label: "Expert Guides", value: '100+' },
  ];

  const features = [
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Quality",
      description: "We offer only the highest standard of vehicles and services to ensure your comfort."
    },
    {
      icon: <Map className="w-6 h-6" />,
      title: "Bespoke Itineraries",
      description: "Custom-tailored tours designed to match your unique interests and preferences."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe & Secure",
      description: "Your safety is our priority. All our vehicles are well-maintained and insured."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Round-the-clock customer service to assist you at any point during your journey."
    }
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: '#f7fffe' }}>
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={aboutusImg} 
            alt="Sri Lanka landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
          >
            {"Discover Sri Lanka"} <br />
            <span className="text-[#EF8354] mt-4 inline-block">
              {"In Ultimate Luxury"}
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto"
          >
            {"We are more than just a travel agency. We are your premium gateway to the wonders of Ceylon, dedicated to crafting unforgettable journeys."}
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-20 px-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#EF8354] mb-2">{stat.value}</div>
                <div className="text-sm md:text-base font-medium text-slate-600 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm font-bold text-[#EF8354] tracking-widest uppercase mb-3">{"Our Story"}</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              {"A Legacy of Excellence in Travel"}
            </h3>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              {"Founded over a decade ago, Ceylone Best Tours started with a simple vision: to showcase the breathtaking beauty of Sri Lanka while providing unparalleled comfort and luxury to every traveler."}
            </p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {"Today, we stand as a premier travel and transport provider. Our dedicated team of professionals, expert chauffeurs, and a fleet of top-tier vehicles ensure that your journey through our island is nothing short of perfection."}
            </p>
            <Link to="/vehicle-category">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#EF8354] text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-[#EF8354]/30 hover:bg-[#4F5D75] transition-colors"
              >
                {"Explore Our Fleet"}
              </motion.button>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1200" 
              alt="Nine Arch Bridge Sri Lanka" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
            />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-[#EF8354] tracking-widest uppercase mb-3">{"The Ceylone Best Tours Difference"}</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              {"Why Travel With Us?"}
            </h3>
            <p className="text-lg text-slate-600">
              {"We go above and beyond to deliver an extraordinary travel experience, combining authentic local knowledge with international standards of service."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100"
              >
                <div className="w-14 h-14 bg-[#EF8354]/10 rounded-xl flex items-center justify-center text-[#EF8354] mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
