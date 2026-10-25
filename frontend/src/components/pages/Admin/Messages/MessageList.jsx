import { useState, useMemo } from "react";
import { MessageCircle, Bell, Search, X } from "lucide-react";
import { BRAND, STATE, FONT } from "../AdminDashboard/adminTheme";

// Status pill colors — semantic, tuned to sit on top of the brand palette
function statusStyle(status) {
  switch (status) {
    case "replied": return { bg: `${STATE.success}18`, color: STATE.success };
    case "read":    return { bg: `${BRAND.payneGray}18`, color: BRAND.payneGray };
    case "new":     return { bg: `${STATE.warning}20`, color: "#9A6A1E" };
    default:        return { bg: `${BRAND.silver}30`, color: BRAND.payneGray };
  }
}

const MessageList = ({ t, messages, selectedId, adminNotificationCount, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      // Status filter
      if (statusFilter === "unread") {
        const lastReply = m.replies?.[m.replies.length - 1];
        const needsAttention =
          (m.status === "new" && !m.readByAdmin) ||
          (lastReply?.from === "customer" && !lastReply?.readByAdmin) ||
          m.isRead === false;
        if (!needsAttention) return false;
      } else if (statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (m.customerName || "").toLowerCase();
        const email = (m.customerEmail || "").toLowerCase();
        const msg = (m.message || "").toLowerCase();
        const subject = (m.subject || "").toLowerCase();
        return name.includes(q) || email.includes(q) || msg.includes(q) || subject.includes(q);
      }

      return true;
    });
  }, [messages, searchTerm, statusFilter]);

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: adminNotificationCount },
    { key: "replied", label: "Replied" },
    { key: "read", label: "Read" },
  ];

  return (
    <div className="lg:col-span-1 flex flex-col h-full overflow-hidden" style={{ borderRight: `1px solid ${t.divider}` }}>
      {/* Sidebar Header */}
      <div className="p-4 border-b shrink-0" style={{ background: t.headerBg, borderColor: t.divider }}>
        <h3 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-bold flex items-center gap-2 text-[14px]">
          <MessageCircle className="w-4 h-4" />
          Customer Messages ({messages.length})
        </h3>
        {adminNotificationCount > 0 && (
          <p style={{ fontFamily: FONT.body, color: STATE.danger }} className="text-xs mt-1 flex items-center gap-1">
            <Bell className="w-3 h-3" />
            {adminNotificationCount} {adminNotificationCount === 1 ? "message needs" : "messages need"} your attention
          </p>
        )}

        {/* Search bar */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sender, email, inquiry..."
            style={{ fontFamily: FONT.body, color: t.textPrimary, background: t.inputBg, borderColor: t.divider }}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border outline-none transition-all focus:border-[#EF8354]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                  isActive
                    ? "bg-[#EF8354] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                style={{ fontFamily: FONT.body }}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white text-[#EF8354] font-bold" : "bg-red-500 text-white"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs">
              {searchTerm || statusFilter !== "all"
                ? "No messages match your search or filter."
                : "No customer messages found."}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => {
            const lastReply = message.replies?.[message.replies.length - 1];
            const needsAttention =
              (message.status === "new" && !message.readByAdmin) ||
              (lastReply?.from === "customer" && !lastReply?.readByAdmin) ||
              message.isRead === false;
            const isSelected = selectedId === message.id;
            const status = statusStyle(message.status);

            return (
              <button
                key={message.id}
                onClick={() => onSelect(message.id)}
                className="w-full text-left p-4 transition-colors"
                style={{
                  borderBottom: `1px solid ${t.divider}`,
                  borderLeft: isSelected ? `4px solid ${BRAND.coral}` : "4px solid transparent",
                  background: isSelected ? `${BRAND.coral}12` : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = t.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      style={{ fontFamily: FONT.heading, color: t.textPrimary }}
                      className="font-bold text-[13.5px] truncate"
                    >
                      {message.customerName}
                    </h4>
                    <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs truncate">
                      {message.customerEmail}
                    </p>
                  </div>
                  {needsAttention && (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ background: STATE.danger, color: "#fff", fontFamily: FONT.body }}
                    >
                      <Bell className="w-3 h-3" />
                      New
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs line-clamp-2">
                  {message.message}
                </p>
                <div className="flex items-center justify-start mt-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                    style={{ background: status.bg, color: status.color, fontFamily: FONT.body }}
                  >
                    {message.status}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessageList;
