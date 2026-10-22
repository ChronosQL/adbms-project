import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { api } from "../../../../config/api.js";
import MyMessageList from "./MyMessageList";
import MyMessageThread from "./MyMessageThread";
import MyMessageEmpty from "./MyMessageEmpty";

const buildMergedConversation = (inquiries) => {
  if (!inquiries?.length) return null;
  const sorted = [...inquiries].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const events = [];
  sorted.forEach((inquiry, index) => {
    if (index > 0) {
      events.push({
        id: `inquiry-${inquiry.id}`,
        from: "customer",
        fromName: inquiry.customerName,
        message: inquiry.message,
        timestamp: inquiry.createdAt,
      });
    }
    (inquiry.replies || []).forEach((reply) => {
      events.push({ ...reply, inquiryId: inquiry.id });
    });
  });

  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    id: latest.id,
    customerName: latest.customerName,
    customerEmail: latest.customerEmail,
    subject: "Support Chat",
    message: first.message,
    createdAt: first.createdAt,
    status: latest.status || "new",
    replies: events,
    latestInquiryId: latest.id,
  };
};

function MyMessages() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selectedId,  setSelectedId]  = useState(null);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get("/contact/my");
      const merged = buildMergedConversation(data.inquiries || []);
      setMessages(merged ? [merged] : []);
      setSelectedId((prev) => prev || (merged ? merged.id : null));
    } catch (err) {
      console.error("fetchMessages error:", err);
      setMessages([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user?.email]);

  const handleReply = async (inquiryId, message) => {
    try {
      const data = await api.post(`/contact/${inquiryId}/reply`, { message });
      setMessages((prev) => prev.map((m) =>
        m.id === inquiryId
          ? { ...m, status: "new", replies: [...(m.replies || []), data.reply] }
          : m
      ));
    } catch (err) {
      console.error("reply error:", err);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Please log in</h3>
        <p className="text-slate-500 text-sm mb-6">You need to be logged in to view your messages.</p>
        <button onClick={() => navigate("/login")}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
          Go to Login
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
    </div>
  );

  const selectedMessage = messages.find(m => m.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="text-center py-10 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Messages</h1>
        <p className="text-slate-500 text-sm">View your conversations with Ceylon Best Tours support</p>
      </div>
      <div className="max-w-5xl mx-auto px-4">
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <MyMessageEmpty navigate={navigate} />
          </div>
        ) : messages.length === 1 ? (
          <div className="grid grid-cols-1 gap-6">
            <MyMessageThread
              message={selectedMessage}
              onSendFollowUp={(inquiryId, message) => handleReply(inquiryId, message)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MyMessageList
              messages={messages}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <MyMessageThread
              message={selectedMessage}
              onSendFollowUp={(inquiryId, message) => handleReply(inquiryId, message)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MyMessages;
