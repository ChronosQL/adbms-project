import React from 'react';
import { Link } from 'react-router-dom';
import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Instagram,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { FaTripadvisor } from "react-icons/fa";
const Footer = () => {
    
    const currentYear = new Date().getFullYear();

    const discoverLinks = [
        { label: 'Home', path: '/' },
        { label: 'Vehicle Category', path: '/vehicle-category' },
        { label: 'Tour Packages', path: '/tour-booking/package' },
        { label: 'Reviews', path: '/reviews' }
    ];

    const supportLinks = [
        { label: 'About Us', path: '/about' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'FAQ', path: '/contact' }
    ];

    return (
        <footer className="bg-[#111111] text-gray-400 font-sans border-t border-white/5">
            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                {/* Brand Identity */}
                <div className="space-y-6">
                    <div className="flex flex-col">
                        <span className="text-3xl font-serif font-bold text-white tracking-wider uppercase">CEYLON</span>
                        {/* Updated to #EF8354 */}
                        <span className="text-[#EF8354] font-medium italic text-lg leading-tight -mt-1">Best Tours</span>
                    </div>
                    {/* Border updated to brand teal opacity */}
                    <p className="text-sm leading-relaxed text-gray-500 italic border-l border-[#EF8354]/30 pl-4">
                        Explore the paradise island with unmatched elegance. From luxury sedans to rugged SUVs, we move your dreams.
                    </p>
                    <div className="flex gap-4">
                        <a 
                            href="https://www.facebook.com/ceylonbesttours" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="!text-gray-500 hover:!text-[#EF8354] transition-colors duration-300"
                        >
                            <Facebook size={18} />
                        </a>
                        <a 
                            href="https://www.instagram.com/ceylon_best_tours?igsh=MXRiMW5iM3R4M3hvdQ==" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="!text-gray-500 hover:!text-[#EF8354] transition-colors duration-300"
                        >
                            <Instagram size={18} />
                        </a>
                        <a 
                            href="https://www.tripadvisor.com/Attraction_Review-g1102395-d16926335-Reviews-Ceylon_Best_Tours_Taxi_Service-Tissamaharama_Southern_Province.html" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="!text-gray-500 hover:!text-[#EF8354] transition-colors duration-300"
                        >
                            <FaTripadvisor size={18} />
                        </a>
                    </div>
                </div>

                {/* Explore Links */}
                <div>
                    <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.22em] border-b border-white/10 pb-3">
                        Discover
                    </h4>
                    <ul className="space-y-3">
                        {discoverLinks.map((item) => (
                            <li key={item.label}>
                                <Link
                                    to={item.path}
                                    className="!text-white hover:!text-white visited:!text-white flex items-center group text-sm transition-colors duration-300"
                                >
                                    {/* Icon color updated */}
                                    <ChevronRight
                                        size={14}
                                        className="mr-2 text-[#EF8354] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all"
                                    />
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Customer Care */}
                <div>
                    <h4 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.22em] border-b border-white/10 pb-3">Client Support</h4>
                    <ul className="space-y-3">
                        {supportLinks.map((item) => (
                            <li key={item.label}>
                                {item.path === '#' ? (
                                    <span className="!text-white flex items-center group text-sm transition-colors cursor-not-allowed opacity-50">
                                        <ChevronRight size={14} className="mr-2 text-[#EF8354] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link to={item.path} className="!text-white hover:!text-white visited:!text-white flex items-center group text-sm transition-colors">
                                        <ChevronRight size={14} className="mr-2 text-[#EF8354] opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-widest">Get In Touch</h4>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <MapPin className="text-[#EF8354] shrink-0" size={18} />
                            <p className="text-white">No.214, Kirinda Hospital Road, Kirinda, Tissamaharama, Sri Lanka.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="text-[#EF8354] shrink-0" size={18} />
                            <p className="text-white">+94 77 861 9582</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="text-[#EF8354] shrink-0" size={18} />
                            <p className="text-white">ceylonbesttours05@gmail.com</p>
                        </div>
                        {/* Bottom Shield updated */}
                        <div className="pt-4 flex items-center gap-2 text-[#EF8354]/80 font-semibold">
                            <ShieldCheck size={18} />
                            <span className="text-[10px] uppercase tracking-tighter text-gray-500">SLTDA Registered Agency</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-white/5 py-8 bg-black/20">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                        © {currentYear} Ceylon Best Tours. Created by TechNova Team.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;