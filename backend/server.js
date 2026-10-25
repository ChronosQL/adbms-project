const express = require('express');
const cors = require('cors');
require('dotenv').config();

const reviewRoutes  = require('./routes/reviewRoutes');
const authRoutes    = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const cityRoutes = require('./routes/cityRoutes');
const packageRoutes = require('./routes/packageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes  = require('./routes/reportRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const { startCronScheduler, stopCronScheduler } = require('./cron/scheduler');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const ALLOWED_ORIGINS = [
  FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || DEV_ORIGIN_REGEX.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => res.send('TechNova backend is running.'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth',     authRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/cities', cityRoutes);
// ── Global error handler ──────────────────────────────────────────────────────


app.use('/api/packages', packageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  if (err.code === '23505')
    return res.status(409).json({ message: 'Duplicate entry.' });
  if (err.code === '23503')
    return res.status(409).json({ message: 'Record is referenced by other data.' });
  res.status(500).json({ message: 'Internal server error.' });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on ${FRONTEND_ORIGIN}:${PORT}`);
  startCronScheduler();
});

const handleShutdown = () => {
  console.log('Shutting down server gracefully...');
  stopCronScheduler();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);