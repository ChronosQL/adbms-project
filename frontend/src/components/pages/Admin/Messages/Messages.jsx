import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { MessageCircle, RefreshCw } from "lucide-react";
import { useMessages } from "../../../../context/useMessages.js";
import { BRAND, FONT, getTheme } from "../AdminDashboard/adminTheme";
import MessageList from "./MessageList";
import MessageThread from "./MessageThread";

const Messages = () => {
  const context = useOutletContext();
  const dark = context?.dark ?? false;
  const t = getTheme(dark);

  const { messages, loading, addReply, markMessageAsReadByAdmin, getAdminNotificationCount, refetch } = useMessages();
  const [selectedId, setSelectedId] = useState(null);

  const adminNotificationCount = getAdminNotificationCount();
  const selectedMessage = messages.find((m) => m.id === selectedId) || null;

  const handleSelect = (id) => {
    setSelectedId(id);
    markMessageAsReadByAdmin(id);
  };

  if (loading) return (
    <div className="max-w-[1320px] mx-auto px-6 py-8">
      <div className="rounded-2xl border flex items-center justify-center py-20" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: BRAND.coral }} />
      </div>
    </div>
  );

  if (messages.length === 0) return (
    <div className="max-w-[1320px] mx-auto px-6 py-8">
      <div className="rounded-2xl border text-center py-16" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
        <MessageCircle className="w-16 h-16 mx-auto mb-4" style={{ color: t.dark ? "rgba(255,255,255,0.15)" : "#E8E8EA" }} />
        <h3 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="text-xl font-bold mb-2">No Messages Yet</h3>
        <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-sm">Customer messages from the Contact Us form will appear here.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1320px] mx-auto px-6 py-8">
      <p style={{ fontFamily: FONT.body, color: t.textSecondary, fontSize: 13, margin: "0 0 20px" }}>
        {messages.length} conversation{messages.length !== 1 ? "s" : ""}
        {adminNotificationCount > 0 && ` · ${adminNotificationCount} need${adminNotificationCount === 1 ? "s" : ""} your attention`}
      </p>

      <div
        className="rounded-2xl border grid grid-cols-1 lg:grid-cols-3 h-[600px] overflow-hidden"
        style={{ background: t.cardBg, borderColor: t.cardBorder }}
      >
        <MessageList
          t={t}
          messages={messages}
          selectedId={selectedId}
          adminNotificationCount={adminNotificationCount}
          onSelect={handleSelect}
          onRefresh={refetch}
        />
        <MessageThread
          t={t}
          message={selectedMessage}
          onReply={addReply}
        />
      </div>
    </div>
  );
};

export default Messages;
