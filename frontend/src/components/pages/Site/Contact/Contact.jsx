import { motion } from "framer-motion";
import ContactHeader from "./ContactHeader";
import ContactForm from "./ContactForm";
import ContactFaq from "./ContactFaq";
import ContactInfo from "./ContactInfo";
import ContactMap from "./ContactMap";

const Contact = () => (
  <div className="min-h-screen bg-slate-50 pb-16">
    {/* Hero Header */}
    <ContactHeader />

    <div className="max-w-6xl mx-auto px-4 mt-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left: Form + FAQ */}
        <div className="lg:col-span-2 space-y-6">
          <ContactForm />
          <ContactFaq />
        </div>

        {/* Right: Sidebar */}
        <div>
          <ContactInfo />
        </div>
      </motion.div>

      {/* Full-width Map */}
      <ContactMap />
    </div>
  </div>
);

export default Contact;
