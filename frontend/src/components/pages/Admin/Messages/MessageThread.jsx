import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { BRAND, STATE, FONT } from "../AdminDashboard/adminTheme";

function statusStyle(status) {
  switch (status) {
    case "replied": return { bg: `${STATE.success}18`, color: STATE.success };
    case "read":    return { bg: `${BRAND.payneGray}18`, color: BRAND.payneGray };
    case "new":     return { bg: `${STATE.warning}20`, color: "#9A6A1E" };
    default:        return { bg: `${BRAND.silver}30`, color: BRAND.payneGray };
  }
}

const EmptyThread = ({ t }) => (
  <div className="lg:col-span-2 flex-1 flex items-center justify-center text-center p-8">
    <div>
      <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: t.dark ? "rgba(255,255,255,0.15)" : "#E8E8EA" }} />
      <h3 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="text-xl font-bold mb-2">Select a Customer</h3>
      <p style={{ fontFamily: FONT.body, color: t.textSecondary }}>Choose a customer from the list to view and reply to their messages</p>
    </div>
  </div>
);

const MessageThread = ({ t, message, onReply }) => {
  const [replyText, setReplyText] = useState("");

  if (!message) return <EmptyThread t={t} />;

  const handleSend = () => {
    if (!replyText.trim()) return;
    onReply(message.id, { message: replyText });
    setReplyText("");
  };

  const status = statusStyle(message.status);

  return (
    <div className="lg:col-span-2 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b" style={{ background: t.headerBg, borderColor: t.divider }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-bold text-lg">{message.customerName}</h3>
            <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-sm">{message.customerEmail}</p>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold capitalize"
            style={{ background: status.bg, color: status.color, fontFamily: FONT.body }}
          >
            {message.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: t.headerBg }}>
        {/* Original message first */}
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl shadow-sm p-4 border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: BRAND.payneGray, fontFamily: FONT.heading }}
              >
                {message.customerName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="text-sm font-bold">{message.customerName}</p>
                <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs">{new Date(message.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <p style={{ fontFamily: FONT.body, color: t.textPrimary }} className="text-sm">{message.message}</p>
          </div>
        </div>

        {/* Replies */}
        {(message.replies || []).map((reply) => {
          const isAdmin = reply.from === "admin";
          return (
            <div key={reply.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <div
                  className="rounded-2xl shadow-sm p-4 border"
                  style={{
                    background: isAdmin ? BRAND.coral : t.cardBg,
                    borderColor: isAdmin ? BRAND.coral : t.cardBorder,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: isAdmin ? "rgba(255,255,255,0.25)" : BRAND.payneGray,
                        color: "#fff",
                        fontFamily: FONT.heading,
                      }}
                    >
                      {reply.fromName?.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontFamily: FONT.heading, color: isAdmin ? "#fff" : t.textPrimary }} className="text-sm font-bold">{reply.fromName}</p>
                      <p style={{ fontFamily: FONT.body, color: isAdmin ? "rgba(255,255,255,0.75)" : t.textSecondary }} className="text-xs">
                        {new Date(reply.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontFamily: FONT.body, color: isAdmin ? "#fff" : t.textPrimary }} className="text-sm">{reply.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <div className="p-4 border-t" style={{ background: t.cardBg, borderColor: t.divider }}>
        <label style={{ fontFamily: FONT.body, color: t.textPrimary }} className="text-sm font-semibold mb-2 block">Send Reply:</label>
        <div className="flex gap-2">
          <textarea
            placeholder="Type your reply here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            style={{
              fontFamily: FONT.body,
              background: t.headerBg,
              borderColor: t.cardBorder,
              color: t.textPrimary,
            }}
            className="flex-1 p-3 rounded-lg border outline-none text-sm resize-none"
            onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND.coral}55`}
            onBlur={e => e.currentTarget.style.boxShadow = "none"}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim()}
            className="self-end flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-40"
            style={{ fontFamily: FONT.body, background: BRAND.coral, color: "#fff" }}
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
