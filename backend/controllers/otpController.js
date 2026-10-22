const axios  = require('axios');
const twilio = require('twilio');

let twilioClient = null;
const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token)
    throw new Error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  twilioClient = twilio(sid, token);
  return twilioClient;
};

const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS  = 5;
const RESEND_WAIT   = 60 * 1000;

const generateOtp = () =>
  String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');

const toE164 = (raw) => raw.trim().replace(/[\s\-]/g, '');

const toNotifyLkFormat = (e164) => e164.replace(/^\+/, '');

const isSriLankan = (e164) => e164.startsWith('+94');

const sendViaNotifyLk = async (e164, otp) => {
  const userId   = process.env.NOTIFYLK_USER_ID;
  const apiKey   = process.env.NOTIFYLK_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID;

  if (!userId || !apiKey || !senderId)
    throw new Error('notify.lk credentials missing. Set NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID in .env');

  const message = `Your Ceylon Best Tours verification code is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`;

  const response = await axios.get('https://app.notify.lk/api/v1/send', {
    params: {
      user_id:   userId,
      api_key:   apiKey,
      sender_id: senderId,
      to:        toNotifyLkFormat(e164),
      message,
    },
    timeout: 10000,
  });

  if (response.data?.status !== 'success')
    throw new Error(`notify.lk error: ${JSON.stringify(response.data)}`);
};

const sendViaTwilio = async (e164, otp) => {
  const message = `Your Ceylon Best Tours verification code is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`;

  await getTwilioClient().messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to:   e164,
  });
};

const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.trim().length < 8)
    return res.status(400).json({ message: 'Valid phone number is required.' });

  const key  = phone.trim();
  const e164 = toE164(phone);

  const existing = otpStore.get(key);
  if (existing && Date.now() - existing.sentAt < RESEND_WAIT) {
    const wait = Math.ceil((RESEND_WAIT - (Date.now() - existing.sentAt)) / 1000);
    return res.status(429).json({ message: `Please wait ${wait}s before requesting another code.` });
  }

  const otp = generateOtp();
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts:  0,
    sentAt:    Date.now(),
  });

  try {
    if (isSriLankan(e164)) {
      console.log(`[OTP] Sending via notify.lk to ${e164}`);
      await sendViaNotifyLk(e164, otp);
    } else {
      console.log(`[OTP] Sending via Twilio to ${e164}`);
      await sendViaTwilio(e164, otp);
    }

    console.log(`[OTP] Successfully sent to ${e164}`);
    res.json({ message: 'OTP sent successfully.' });

  } catch (err) {
    otpStore.delete(key);

    console.error('[OTP] Send failed:');
    console.error('  message :', err.message);
    console.error('  code    :', err.code);
    console.error('  response:', err.response?.data || 'no response body');
    console.error('  phone   :', e164);
    console.error('  gateway :', isSriLankan(e164) ? 'notify.lk' : 'Twilio');

    if (err.message?.includes('credentials missing'))
      return res.status(500).json({ message: err.message });

    if (err.code === 'ECONNABORTED')
      return res.status(500).json({ message: 'SMS gateway timed out. Please try again.' });
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')
      return res.status(500).json({ message: 'SMS gateway unreachable. Check your internet connection.' });

    if (err.message?.includes('notify.lk error'))
      return res.status(500).json({ message: 'SMS delivery failed. Check your notify.lk credentials and Sender ID.' });

    const code = err.code;
    if (code === 21211 || code === 21614)
      return res.status(400).json({ message: 'Invalid phone number. Please check and try again.' });
    if (code === 21408)
      return res.status(400).json({ message: 'SMS is not supported for this number or region.' });
    if (code === 20003)
      return res.status(500).json({ message: 'SMS service configuration error. Please contact support.' });

    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

const verifyOtp = (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp)
    return res.status(400).json({ message: 'Phone and OTP are required.' });

  const key    = phone.trim();
  const record = otpStore.get(key);

  if (!record)
    return res.status(400).json({ message: 'No OTP was sent to this number. Please request a new code.' });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
  }

  record.attempts += 1;

  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return res.status(429).json({ message: 'Too many failed attempts. Please request a new code.' });
  }

  if (otp.trim() !== record.otp) {
    const left = MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({
      message: left > 0
        ? `Incorrect code. ${left} attempt${left !== 1 ? 's' : ''} remaining.`
        : 'Too many failed attempts. Please request a new code.',
    });
  }

  otpStore.delete(key);
  res.json({ message: 'Phone number verified successfully.' });
};

module.exports = { sendOtp, verifyOtp };
