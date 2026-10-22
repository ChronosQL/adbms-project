import { motion } from "framer-motion";
const ContactFaq = () => {
  

  const faqs = [
    {
      question: "Is insurance included in the quoted price?",
      answer: "Yes, all our tours have foreign passenger insurance included in the price.",
    },
    {
      question: "Can I pick up the car at the airport?",
      answer: "Absolutely yes! Just let us know your flight details.",
    },
    {
      question: "What happens if you face an accident while travelling?",
      answer: "After reporting the insurance, if the vehicle is suitable for the journey will continue the tour with the same vehicle. If necessary, the vehicle will be replaced with another same range of the vehicle as soon as possible.",
    },
    {
      question: "What are the excludes from the quoted price?",
      answer: "You'll need to pay for any services like entrance tickets, food and beverages, accommodation.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
    >
      <div className="mb-6">
        {/*<span className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-widest text-white uppercase rounded-full" style={{ backgroundColor: "#EF8354" }}>
          {"FAQ"}
        </span>*/}
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          {"Frequently Asked Questions"}
        </h2>
      </div>

    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <div className="rounded-t-xl px-5 py-3" style={{ backgroundColor: "#EF8354" }}>
            <p className="text-white font-semibold text-sm tracking-wide">{faq.question}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-b-xl px-5 py-3">
            <p className="text-slate-500 text-sm leading-relaxed">{faq.answer}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
  );
};

export default ContactFaq;
