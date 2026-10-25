const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Using development fallback secret.');
}

const {
  buildUserPayload,
  extractLoginPayload,
  extractRegisterPayload,
} = require('../dto/authDto');

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

const login = async (req, res) => {
  const { email, password } = extractLoginPayload(req.body);

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];

    if (!user)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (user.status === 'BLOCKED')
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });

    const payload = buildUserPayload(user);
    const token = signToken(payload);
    res.json({ token, user: payload });

  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
};

const register = async (req, res) => {
  const { name, email, password, country } = extractRegisterPayload(req.body);

  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required.' });

  try {
    const { rows: existing } = await db.query(
      'SELECT user_id FROM "user" WHERE email = $1 LIMIT 1', [email]);
    if (existing.length)
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO "user" (name, email, password_hash, country, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
      [name, email, hash, country, 'CUSTOMER']);

    const payload = buildUserPayload({
      user_id: rows[0].user_id,
      email,
      name,
      role: 'CUSTOMER',
      country,
    });
    const token = signToken(payload);
    res.status(201).json({ token, user: payload });

  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Registration failed.' });
  }
};

const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, role, contact_number, street_address, country, zipcode,
              emergency_name, emergency_phone, emergency_relationship, status
       FROM "user" WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'User not found.' });

    const u = rows[0];
    if (u.status === 'BLOCKED')
      return res.status(403).json({ message: 'Account blocked.' });

    res.json({ user: buildUserPayload(u) });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Failed to load user.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Current and new password are required.' });

  try {
    const { rows } = await db.query('SELECT * FROM "user" WHERE user_id = $1 LIMIT 1', [userId]);
    const user = rows[0];

    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
      return res.status(401).json({ message: 'Incorrect current password.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE "user" SET password_hash = $1 WHERE user_id = $2', [hash, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    contactNumber,
    address,
    country,
    zipcode,
    emergencyName,
    emergencyPhone,
    emergencyRelationship,
  } = req.body;

  if (!name)
    return res.status(400).json({ message: 'Name is required.' });

  try {
    await db.query(
      `UPDATE "user"
       SET name = $1, contact_number = $2, street_address = $3, country = $4, zipcode = $5,
           emergency_name = $6, emergency_phone = $7, emergency_relationship = $8
       WHERE user_id = $9`,
      [
        name,
        contactNumber         || null,
        address               || null,
        country               || null,
        zipcode               || null,
        emergencyName         || null,
        emergencyPhone        || null,
        emergencyRelationship || null,
        userId,
      ]
    );

    const { rows } = await db.query(
      `SELECT user_id, name, email, role, contact_number, street_address, country, zipcode,
              emergency_name, emergency_phone, emergency_relationship
       FROM "user" WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    res.json({ message: 'Profile updated successfully.', user: buildUserPayload(rows[0]) });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

const googleAuth = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required.' });
  }

  try {
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.status(400).json({ message: 'No ID token found from Google.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    const { rows } = await db.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email]);
    let user = rows[0];

    if (user) {
      if (user.status === 'BLOCKED') {
        return res.status(403).json({ message: 'Your account has been blocked.' });
      }

      if (!user.provider_id) {
        await db.query('UPDATE "user" SET auth_provider = $1, provider_id = $2 WHERE user_id = $3',
          ['GOOGLE', sub, user.user_id]);
      }
    } else {
      const { rows: newRows } = await db.query(
        'INSERT INTO "user" (name, email, role, auth_provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, 'CUSTOMER', 'GOOGLE', sub]
      );
      user = newRows[0];
    }

    const userPayload = buildUserPayload(user);
    const token = signToken(userPayload);

    res.status(200).json({ token, user: userPayload });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Google authentication failed: ' + (err.message || JSON.stringify(err)) });
  }
};

module.exports = { login, register, getMe, changePassword, updateProfile, googleAuth };
