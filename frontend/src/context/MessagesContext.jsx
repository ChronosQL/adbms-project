import { createContext, useState, useEffect } from "react";
import { api } from "../config/api";
import { useAuth } from "./AuthContext";

export const MessagesContext = createContext();

export function MessagesProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const isAdmin  = user && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role);
  const userEmail = user?.email ?? null;

  async function fetchMessages() {
    if (!userEmail) { setMessages([]); return; }
    setLoading(true);
    try {
      const endpoint = isAdmin ? "/contact" : "/contact/my";
      const data = await api.get(endpoint);
      setMessages(data.inquiries || []);
    } catch (err) {
      console.error("fetchMessages error:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [userEmail]);

  async function addReply(inquiryId, { message }) {
    try {
      const data = await api.post(`/contact/${inquiryId}/reply`, { message });
      setMessages(prev => prev.map(m =>
        m.id === inquiryId
          ? { ...m, status: data.reply.from === 'admin' ? 'replied' : 'new', replies: [...(m.replies || []), data.reply] }
          : m
      ));
    } catch (err) {
      console.error("addReply error:", err);
    }
  }

  async function markMessageAsReadByAdmin(inquiryId) {
    try {
      await api.patch(`/contact/${inquiryId}/read`);
      setMessages(prev => prev.map(m =>
        m.id === inquiryId
          ? { ...m, isRead: true, status: m.status === 'new' ? 'read' : m.status }
          : m
      ));
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  }

  function getAdminNotificationCount() {
    return messages.filter(m => !m.isRead).length;
  }

  return (
    <MessagesContext.Provider value={{
      messages, loading, addReply,
      markMessageAsReadByAdmin,
      getAdminNotificationCount,
      refetch: fetchMessages,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}
