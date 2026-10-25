/**
 * Inquiry Data Transfer Object (DTO)
 * Normalizes contact inquiry row mappings, reply formatting, and request payload extraction.
 */

const mapInquiry = (row) => ({
  id:            row.inquiry_id,
  customerName:  row.sender_name,
  customerEmail: row.sender_email,
  customerPhone: row.sender_phone  || null,
  subject:       row.subject       || null,
  message:       row.message,
  isRead:        Boolean(row.is_read),
  status:        row.status,
  createdAt:     row.submitted_at,
  replies:       [],
});

const mapReply = (row) => ({
  id:        row.reply_id,
  inquiryId: row.inquiry_id,
  from:      row.sender_role,
  fromName:  row.sender_name,
  message:   row.message,
  timestamp: row.sent_at,
});

const extractInquiryPayload = (body = {}) => ({
  name: body.name ? String(body.name).trim() : null,
  email: body.email ? String(body.email).trim() : null,
  phone: body.phone ? String(body.phone).trim() : null,
  subject: body.subject ? String(body.subject).trim() : null,
  message: body.message ? String(body.message).trim() : null,
});

const validateInquiryPayload = (payload) => {
  if (!payload.name || !payload.email || !payload.message) {
    return { valid: false, message: 'Name, email and message are required.' };
  }
  return { valid: true };
};

const extractReplyPayload = (body = {}, user = {}) => {
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user?.role);
  const senderRole = isAdmin ? 'admin' : 'customer';
  const senderName = user?.name || (isAdmin ? 'Ceylon Best Tours' : 'Customer');

  return {
    message: body.message ? String(body.message).trim() : null,
    isAdmin,
    senderRole,
    senderName,
  };
};

const validateReplyPayload = (payload) => {
  if (!payload.message) {
    return { valid: false, message: 'Reply message is required.' };
  }
  return { valid: true };
};

module.exports = {
  mapInquiry,
  mapReply,
  extractInquiryPayload,
  validateInquiryPayload,
  extractReplyPayload,
  validateReplyPayload,
};
