
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react";
import {FaTripadvisor} from "react-icons/fa";
const InfoItem = ({ href, target, icon, title, lines, delay }) => (
  <motion.a
    href={href}
    target={target}
    rel={target === "_blank" ? "noopener noreferrer" : undefined}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    className="flex items-start gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
  >
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EF835420" }}>
      <span style={{ color: "#EF8354" }}>{icon}</span>
    </div>
    <div>
      <p className="font-bold text-slate-800 text-sm tracking-tight">{title}</p>
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-slate-500 mt-0.5">{line}</p>
      ))}
    </div>
  </motion.a>
);

const ContactInfo = () => {
  

  return (
  <div className="space-y-4">
    {/* ── Get In Touch Card ── */}
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-2"
    >
      <div className="mb-4">
        {/* <span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-widest text-white uppercase rounded-full" style={{ backgroundColor: "#EF8354" }}>
          {"Contact"}
        </span> */}
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{"Get in Touch"}</h2>
      </div>

      <InfoItem
        href="https://share.google/xOzAOaynrrGNRAfcD"
        target="_blank"
        icon={<MapPin className="w-5 h-5" />}
        title={"Our Location"}
        lines={["No.214, Kirinda Hospital Road,", "Kirinda, Tissamaharama, Sri Lanka."]}
        delay={0.1}
      />
      <InfoItem
        href="tel:+94778619582"
        icon={<Phone className="w-5 h-5" />}
        title={"Phone"}
        lines={["+94 77 861 9582"]}
        delay={0.2}
      />
      <InfoItem
        href="https://wa.me/94778619582?text=Hello%20Ceylon%20Best%20Tours%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
        target="_blank"
        icon={<MessageCircle className="w-5 h-5" />}
        title={"WhatsApp"}
        lines={["+94 77 861 9582"]}
        delay={0.3}
      />
      <InfoItem
        href="mailto:ceylonbesttours05@gmail.com"
        icon={<Mail className="w-5 h-5" />}
        title={"Email"}
        lines={["ceylonbesttours05@gmail.com"]}
        delay={0.4}
      />
      <InfoItem
        icon={<Clock className="w-5 h-5" />}
        title={"Business Hours"}
        lines={["24/7 Monday - Sunday"]}
        delay={0.5}
      />
    </motion.div>

    {/* ── Emergency Assistance Card ── */}
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border p-6"
      style={{ backgroundColor: "#EF835410", borderColor: "#EF835430" }}
    >
      <h3 className="font-extrabold text-slate-800 tracking-tight mb-1">{"Emergency Assistance"}</h3>
      <p className="text-sm text-slate-600 mb-3">{"24/7 roadside assistance for all our customers."}</p>
      <a
        href="tel:+94778619582"
        className="flex items-center gap-2 font-semibold transition-colors"
        style={{ color: "#EF8354" }}
        onMouseEnter={e => e.currentTarget.style.color = "#4F5D75"}
        onMouseLeave={e => e.currentTarget.style.color = "#EF8354"}
      >
        <Phone className="w-5 h-5" />
        +94 77 861 9582
      </a>
    </motion.div>

    {/* ── Follow Us Card ── */}
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h3 className="font-extrabold text-slate-800 tracking-tight mb-4">{"Follow Us"}</h3>
      <div className="flex gap-3">
        <a
          href="https://www.facebook.com/ceylonbesttours"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a
          href="https://www.instagram.com/ceylon_best_tours?igsh=MXRiMW5iM3R4M3hvdQ=="
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Instagram"
          className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
        >
          <Instagram className="w-5 h-5" />
        </a>
        <a
          href="https://www.tripadvisor.com/Attraction_Review-g1102395-d16926335-Reviews-Ceylon_Best_Tours_Taxi_Service-Tissamaharama_Southern_Province.html"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Find us on TripAdvisor"
          className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "#EF8354" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#4F5D75"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#EF8354"}
        >
          <FaTripadvisor size={20} />
          
        </a>
      </div>
    </motion.div>
  </div>
  );
};

export default ContactInfo;

