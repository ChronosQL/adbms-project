import { ChevronRight, MessageCircle } from "lucide-react";

const StatusBadge = ({ status }) => {
  const styles = {
    new:     "bg-yellow-100 text-yellow-800",
    read:    "bg-slate-100 text-slate-600",
    replied: "bg-emerald-100 text-emerald-700",
  };
  const labels = {
    new:     "Pending",
    read:    "Read",
    replied: "Replied",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.read}`}>
      {labels[status] || "Read"}
    </span>
  );
};

const MessageItem = ({ message, isSelected, onClick }) => {
  const hasUnreadReply = message.status === "replied" && message.replies?.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors rounded-xl border mb-2 ${
        isSelected ? "border-slate-900 bg-slate-50" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="font-semibold text-slate-800 text-sm truncate flex-1">
          {message.subject || "General Inquiry"}
        </p>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {hasUnreadReply && (
            <span className="w-2 h-2 rounded-full bg-[#EF8354]" title="New reply" />
          )}
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{message.message}</p>
      <div className="flex items-center justify-between">
        <StatusBadge status={message.status} />
        <span className="text-xs text-slate-400">
          {new Date(message.createdAt).toLocaleDateString()}
        </span>
      </div>
      {message.replies?.length > 0 && (
        <p className="text-xs text-[#EF8354] mt-1.5 font-medium">
          {message.replies.length} repl{message.replies.length > 1 ? "ies" : "y"}
        </p>
      )}
    </button>
  );
};

const MyMessageList = ({ messages, selectedId, onSelect }) => (
  <div className="lg:col-span-1">
    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
      Your Conversations ({messages.length})
    </h2>
    {messages.length === 0 ? (
      <div className="text-center py-8">
        <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No conversations yet</p>
      </div>
    ) : (
      messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isSelected={selectedId === message.id}
          onClick={() => onSelect(message.id)}
        />
      ))
    )}
  </div>
);

export default MyMessageList;
