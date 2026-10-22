import { useState, useContext } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { AuthContext } from "../../../../context/AuthContext";
import { api } from "../../../../config/api";
import { useNavigate } from "react-router";

const SuccessScreen = ({ user, navigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center"
  >
    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#EF8354]/10">
      <CheckCircle className="w-10 h-10 text-[#EF8354]" />
    </div>
    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-3">
      Message Sent Successfully!
    </h2>
    <p className="text-slate-500 text-sm mb-8">
      Thank you for contacting Ceylon Best Tours. We've received your message and
      will respond within 6 hours.{" "}
      {user ? "You can check replies in your messages inbox." : "We'll send our response to your email."}
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <button
        onClick={() => navigate("/")}
        className="bg-[#EF8354] hover:bg-[#4F5D75] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        Return to Home
      </button>
      {user && (
        <button
          onClick={() => navigate("/user/profile")}
          className="border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
        >
          View Inbox
        </button>
      )}
    </div>
  </motion.div>
);

const inputStyle = "w-full p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm text-slate-800 transition-all focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20";

const ContactForm = () => {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name:    user?.name  || "",
    email:   user?.email || "",
    message: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/contact", {
        name:    formData.name,
        email:   user?.email || formData.email,  // always use auth email when logged in
        message: formData.message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <SuccessScreen user={user} navigate={navigate} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
    >
      <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
        <Send className="w-5 h-5 text-[#EF8354]" />
        Send Us a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Name *</label>
            <input name="name" value={formData.name} onChange={handleChange}
              required className={inputStyle} placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email *</label>
            <input name="email" type="email"
              value={user?.email || formData.email}
              onChange={user ? undefined : handleChange}
              readOnly={!!user}
              required className={`${inputStyle} ${user ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
              placeholder="your@email.com" />
            {user && <p className="text-xs text-slate-400 mt-1 ml-1">Email from your account</p>}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Message *</label>
          <textarea name="message" value={formData.message} onChange={handleChange}
            rows={6} required placeholder="Tell us how we can help you..."
            className={`${inputStyle} resize-none`} />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#EF8354] hover:bg-[#4F5D75] disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            : <><Send className="w-4 h-4" /> Send Message</>
          }
        </button>
      </form>
    </motion.div>
  );
};

export default ContactForm;
