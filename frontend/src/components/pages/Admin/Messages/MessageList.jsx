import { MessageCircle, Bell } from "lucide-react";
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

const MessageList = ({ t, messages, selectedId, adminNotificationCount, onSelect }) => (
  <div className="lg:col-span-1 overflow-y-auto" style={{ borderRight: `1px solid ${t.divider}` }}>
    {/* Sidebar Header */}
    <div className="p-4 border-b" style={{ background: t.headerBg, borderColor: t.divider }}>
      <h3 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-bold flex items-center gap-2 text-[14px]">
        <MessageCircle className="w-4 h-4" />
        Customer Messages ({messages.length})
      </h3>
      {adminNotificationCount > 0 && (
        <p style={{ fontFamily: FONT.body, color: STATE.danger }} className="text-xs mt-1 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          {adminNotificationCount}{" "}
          {adminNotificationCount === 1 ? "message needs" : "messages need"} your attention
        </p>
      )}
    </div>

    {/* Customer List */}
    <div>
      {messages.map((message) => {
        const lastReply = message.replies?.[message.replies.length - 1];
        const needsAttention =
          (message.status === "new" && !message.readByAdmin) ||
          (lastReply?.from === "customer" && !lastReply?.readByAdmin);
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
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = t.hoverBg; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h4 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-bold text-[13.5px] truncate">{message.customerName}</h4>
                <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs truncate">{message.customerEmail}</p>
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
            <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-xs line-clamp-2">{message.message}</p>
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
      })}
    </div>
  </div>
);

export default MessageList;
