const db = require('../db/connection');
const { parsePagination } = require('../utils/paginate');

const mapInquiry = (row) => ({
  id:            row.inquiry_id,
  customerName:  row.sender_name,
  customerEmail: row.sender_email,
  customerPhone: row.sender_phone  || null,
  subject:       row.subject       || null,
  message:       row.message,
  isRead:        !!row.is_read,
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

const submitInquiry = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ message: 'Name, email and message are required.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO contact_inquiry (sender_name, sender_email, sender_phone, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'new') RETURNING inquiry_id`,
      [name, email, phone || null, subject || null, message]
    );
    res.status(201).json({ message: 'Inquiry submitted successfully.', inquiryId: rows[0].inquiry_id });
  } catch (err) {
    console.error('submitInquiry error:', err);
    res.status(500).json({ message: 'Failed to submit inquiry.' });
  }
};

const getAllInquiries = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 100);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let sql = `SELECT *, COUNT(*) OVER()::integer AS total_count FROM contact_inquiry ORDER BY submitted_at DESC`;
    const params = [];
    if (isPaginated) {
      sql += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const { rows: inquiries } = await db.query(sql, params);
    const totalCount = inquiries.length > 0 ? inquiries[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    if (inquiries.length === 0) return res.json({ inquiries: [], pagination });

    const ids = inquiries.map(i => i.inquiry_id);
    const { rows: replies } = await db.query(
      `SELECT * FROM contact_reply WHERE inquiry_id = ANY($1) ORDER BY sent_at ASC`, [ids]
    );

    const repliesByInquiry = replies.reduce((acc, r) => {
      if (!acc[r.inquiry_id]) acc[r.inquiry_id] = [];
      acc[r.inquiry_id].push(mapReply(r));
      return acc;
    }, {});

    const result = inquiries.map(i => ({
      ...mapInquiry(i),
      replies: repliesByInquiry[i.inquiry_id] || [],
    }));
    result.pagination = pagination;

    res.json({ inquiries: result, pagination });
  } catch (err) {
    console.error('getAllInquiries error:', err);
    res.status(500).json({ message: 'Failed to load inquiries.' });
  }
};

const getMyInquiries = async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Not authenticated.' });

  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 50);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let sql = `SELECT *, COUNT(*) OVER()::integer AS total_count FROM contact_inquiry WHERE LOWER(sender_email) = LOWER($1) ORDER BY submitted_at DESC`;
    const params = [email];
    if (isPaginated) {
      sql += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const { rows: inquiries } = await db.query(sql, params);
    const totalCount = inquiries.length > 0 ? inquiries[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    if (inquiries.length === 0) return res.json({ inquiries: [], pagination });

    const ids = inquiries.map(i => i.inquiry_id);
    const { rows: replies } = await db.query(
      `SELECT * FROM contact_reply WHERE inquiry_id = ANY($1) ORDER BY sent_at ASC`, [ids]
    );
    const repliesByInquiry = replies.reduce((acc, r) => {
      if (!acc[r.inquiry_id]) acc[r.inquiry_id] = [];
      acc[r.inquiry_id].push(mapReply(r));
      return acc;
    }, {});

    const result = inquiries.map(i => ({
      ...mapInquiry(i),
      replies: repliesByInquiry[i.inquiry_id] || [],
    }));
    result.pagination = pagination;

    res.json({ inquiries: result, pagination });
  } catch (err) {
    console.error('getMyInquiries error:', err);
    res.status(500).json({ message: 'Failed to load your inquiries.' });
  }
};

const addReply = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
  const senderRole = isAdmin ? 'admin' : 'customer';
  const senderName = req.user?.name || (isAdmin ? 'Ceylon Best Tours' : 'Customer');

  if (!message?.trim())
    return res.status(400).json({ message: 'Reply message is required.' });

  try {
    const { rows } = await db.query(
      `INSERT INTO contact_reply (inquiry_id, sender_role, sender_name, message) VALUES ($1, $2, $3, $4) RETURNING reply_id`,
      [id, senderRole, senderName, message.trim()]
    );

    const newStatus = isAdmin ? 'replied' : 'new';
    await db.query(
      `UPDATE contact_inquiry SET status = $1, is_read = $2 WHERE inquiry_id = $3`,
      [newStatus, isAdmin ? true : false, id]
    );

    res.status(201).json({
      message: 'Reply sent.',
      reply: {
        id:        rows[0].reply_id,
        inquiryId: Number(id),
        from:      senderRole,
        fromName:  senderName,
        message:   message.trim(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('addReply error:', err);
    res.status(500).json({ message: 'Failed to send reply.' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE contact_inquiry SET is_read = true, status = CASE WHEN status = 'new' THEN 'read' ELSE status END WHERE inquiry_id = $1`,
      [id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Failed to mark as read.' });
  }
};

module.exports = { submitInquiry, getAllInquiries, getMyInquiries, addReply, markAsRead };
