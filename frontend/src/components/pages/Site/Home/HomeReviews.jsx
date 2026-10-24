import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Quote, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { fetchPublishedReviews } from '../Reviews/reviewsApi';

const ReviewSliderDark = () => {
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPublishedReviews({ limit: 12, sort: 'newest' });
        if (active) {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((r) => ({
              id: r.id || `real-${r.bookingId || Math.random()}`,
              name: r.user?.name || 'Traveler',
              country: r.user?.country || 'Sri Lanka',
              countryFlag: r.user?.countryFlag || '🇱🇰',
              date: r.datePublished
                ? new Date(r.datePublished).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recently',
              service: r.tourTitle || r.tourType || 'Tour Booking',
              rating: Math.max(1, Math.min(5, Number(r.stars) || 5)),
              title: r.title || 'Guest Review',
              text: r.comment || r.title || 'Exceptional experience with Ceylon Best Tours!',
            }));
            setReviewsList(mapped);
          } else {
            setReviewsList([]);
          }
        }
      } catch (err) {
        console.error('Failed to load real reviews for home:', err);
        if (active) setReviewsList([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [reviewsList.length]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setItemsToShow(1);
      else if (window.innerWidth < 1024) setItemsToShow(2);
      else setItemsToShow(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPaused || reviewsList.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1 >= reviewsList.length ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [index, isPaused, reviewsList.length]);

  const getVisibleReviews = () => {
    if (reviewsList.length === 0) return [];
    const count = Math.min(itemsToShow, reviewsList.length);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(reviewsList[(index + i) % reviewsList.length]);
    }
    return result;
  };

  return (
    <section className="py-20 px-6 bg-[#0B0D13] text-white overflow-hidden font-sans border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
          <div>
            <span className="text-[#EF8354] font-semibold text-xs tracking-widest uppercase block mb-2">
              REAL-TIME GUEST EXPERIENCES
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              {'What Our '}
              <span className="text-[#EF8354]">{'Travelers'}</span>
              {' Say'}
            </h2>
          </div>
          <div className="hidden md:block h-[1px] flex-grow mx-8 bg-gray-800"></div>
          <Link
            to="/reviews"
            className="text-sm font-semibold text-[#EF8354] hover:text-[#BFC0C0] transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            <span>Verified Customer Reviews</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Reviews Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-[2rem] bg-white/[0.03] border border-white/10 animate-pulse p-8 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-3 bg-white/10 rounded w-1/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                  <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="bg-[#13161F] border border-white/10 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#EF8354]/15 border border-[#EF8354]/30 text-[#EF8354] flex items-center justify-center mx-auto mb-4">
              <MessageSquareQuote size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Be Our First Real-Time Story</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We take pride in crafting unforgettable memories across Sri Lanka. Have you traveled with us recently?
            </p>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EF8354] hover:bg-[#4F5D75] text-white font-bold transition-all shadow-md shadow-[#EF8354]/20 text-sm"
            >
              Share Your Journey
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            {/* Slider Area */}
            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="flex gap-6 justify-center min-h-[320px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {getVisibleReviews().map((review, i) => (
                    <motion.div
                      key={`${review.id}-${index}-${i}`}
                      layout
                      initial={{ opacity: 0, x: 80 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                      className="w-full md:w-1/2 lg:w-1/3"
                    >
                      <div className="h-full bg-[#13161F] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative hover:border-[#EF8354]/60 transition-all duration-300 group flex flex-col justify-between">
                        <Quote
                          className="absolute top-6 right-6 text-white/5 group-hover:text-[#EF8354]/20 transition-colors pointer-events-none"
                          size={54}
                        />

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-5">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white group-hover:text-[#EF8354] transition-colors">
                                  {review.name}
                                </h3>
                                <span className="text-base" title={review.country}>
                                  {review.countryFlag}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex text-amber-400">
                                  {[...Array(5)].map((_, starIdx) => (
                                    <Star
                                      key={starIdx}
                                      size={14}
                                      fill={starIdx < review.rating ? 'currentColor' : 'none'}
                                      stroke={starIdx < review.rating ? 'currentColor' : 'rgba(255,255,255,0.2)'}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                            <div className="text-[#EF8354] px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#EF8354]/10 border border-[#EF8354]/30">
                              {review.rating}.0
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="inline-block text-[11px] font-bold tracking-wider text-[#EF8354] uppercase bg-[#EF8354]/10 px-2.5 py-1 rounded-md border border-[#EF8354]/20">
                              {review.service}
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm leading-relaxed italic flex-grow line-clamp-4">
                            "{review.text}"
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Pagination Indicators */}
            {reviewsList.length > 1 && (
              <div className="flex justify-center gap-2.5 mt-10">
                {reviewsList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to review ${i + 1}`}
                    className={`transition-all duration-300 rounded-full h-2 cursor-pointer ${
                      i === index
                        ? 'w-10 bg-[#EF8354] shadow-[0_0_12px_rgba(239,131,84,0.45)]'
                        : 'w-2 bg-gray-700 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View All Reviews Button */}
        <div className="flex justify-center mt-12">
          <Link
            to="/reviews"
            className="group flex items-center gap-2 px-8 py-3.5 bg-[#EF8354] hover:bg-[#4F5D75] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#EF8354]/25 tracking-wide text-sm cursor-pointer"
          >
            <span>EXPLORE ALL REVIEWS</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReviewSliderDark;