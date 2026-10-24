/**
 * Auth Data Transfer Object (DTO)
 * Normalizes user session payloads, registration, profile extraction, and sanitization.
 */

const buildUserPayload = (u = {}) => ({
  id:                     u.user_id,
  email:                  u.email,
  name:                   u.name,
  role:                   u.role,
  contact_number:         u.contact_number         || null,
  street_address:         u.street_address         || null,
  country:                u.country                || null,
  zipcode:                u.zipcode                || null,
  emergency_name:         u.emergency_name         || null,
  emergency_phone:        u.emergency_phone        || null,
  emergency_relationship: u.emergency_relationship || null,
});

const extractLoginPayload = (body = {}) => ({
  email: body.email ? String(body.email).trim().toLowerCase() : null,
  password: body.password ? String(body.password) : null,
});

const extractRegisterPayload = (body = {}) => ({
  name: body.name ? String(body.name).trim() : null,
  email: body.email ? String(body.email).trim().toLowerCase() : null,
  password: body.password ? String(body.password) : null,
  country: body.country ? String(body.country).trim() : 'Sri Lanka',
});

module.exports = {
  buildUserPayload,
  extractLoginPayload,
  extractRegisterPayload,
};
