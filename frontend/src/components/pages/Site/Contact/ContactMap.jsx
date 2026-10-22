import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";

const MAPS_URL = "https://www.google.com/maps/place/Ceylon+Best+Tours+Taxi+Service/@6.2129128,81.3317322,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae69bddb46dbf41:0x2e6bf396d66f87b!8m2!3d6.2129128!4d81.3317322!16s%2Fg%2F11g_zlc7p2?entry=tts";
const MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3949.3443702359334!2d81.32954391528251!3d6.212912799999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae69bddb46dbf41%3A0x2e6bf396d66f87b!2sCeylon%20Best%20Tours%20Taxi%20Service!5e0!3m2!1sen!2slk!4v1700000000000";

const ContactMap = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-8 overflow-hidden"
  >
    {/* Header */}
    <div className="px-6 py-4 flex items-center gap-2 border-b border-slate-100">
      <MapPin className="w-5 h-5" style={{ color: "#EF8354" }} />
      <h2 className="font-extrabold text-slate-800 tracking-tight">Our Location</h2>
    </div>

    {/* Google Maps embed */}
    <div className="h-80 w-full bg-slate-100">
      <iframe
        title="Ceylon Best Tours Location"
        src={MAPS_EMBED_URL}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>

    {/* Footer */}
    <div className="px-6 py-4 bg-slate-50 flex items-start justify-between">
      <div>
        <p className="font-extrabold text-slate-800 text-sm tracking-tight">Ceylon Best Tours</p>
        <p className="text-sm text-slate-500 mt-0.5">
          No.214, Kirinda Hospital Road, Kirinda, Tissamaharama, Sri Lanka.
        </p>
      </div>
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm font-semibold flex-shrink-0 transition-colors"
        style={{ color: "#EF8354" }}
        onMouseEnter={e => e.currentTarget.style.color = "#4F5D75"}
        onMouseLeave={e => e.currentTarget.style.color = "#EF8354"}
      >
        <MapPin className="w-4 h-4" />
        Open in Google Maps
      </a>
    </div>
  </motion.div>
);

export default ContactMap;
