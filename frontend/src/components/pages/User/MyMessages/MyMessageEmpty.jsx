import { MessageCircle } from "lucide-react";

const MyMessageEmpty = ({ navigate }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <MessageCircle className="w-10 h-10 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">No Messages Yet</h3>
    <p className="text-slate-500 text-sm mb-6">
      You haven't sent any messages yet. Contact us and we'll get back to you!
    </p>
    <button
      onClick={() => navigate("/contact")}
      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
    >
      Contact Us
    </button>
  </div>
);

export default MyMessageEmpty;
