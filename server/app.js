require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const mongoose = require('mongoose');
const path = require('path');

const vehicleRoutes = require('./routes/vehicles');
const garageRoutes = require('./routes/garage');
const diagnosisRoutes = require('./routes/diagnoses');
const ragRoutes = require('./routes/rag');
const userRoutes = require('./routes/users');
const { requireAuth, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autoadvisor';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

if (IS_PROD && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

// Respect Cloudflare/Nginx proxy headers in production for secure cookies.
if (IS_PROD || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  // Allow non-browser and same-origin requests without Origin header.
  if (!origin) return callback(null, true);

  // Keep local development friction-free.
  if (!IS_PROD) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

const sessionCookieSameSite = process.env.SESSION_COOKIE_SAMESITE || 'lax';
const sessionCookieSecure = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === 'true'
  : IS_PROD;
const sessionCookieDomain = process.env.SESSION_COOKIE_DOMAIN;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

function normalizeBasePath(basePath = '/') {
  if (!basePath || basePath === '/') return '';
  return `/${String(basePath).replace(/^\/+|\/+$/g, '')}`;
}

const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH || '/');
const API_BASES = APP_BASE_PATH ? ['/api', `${APP_BASE_PATH}/api`] : ['/api'];

// Middleware
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: IS_PROD,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: sessionCookieSameSite,
    secure: sessionCookieSecure,
    ...(sessionCookieDomain ? { domain: sessionCookieDomain } : {}),
  },
}));

function mountApiRoutes(apiBase) {
  app.get(`${apiBase}/health`, (_req, res) => {
    res.json({ ok: true, env: NODE_ENV, basePath: APP_BASE_PATH || '/' });
  });

  // Public API routes (no auth required)
  app.use(`${apiBase}/users`, userRoutes);
  app.use(`${apiBase}/vehicles`, vehicleRoutes);

  // Protected API routes (require login)
  app.use(`${apiBase}/garage`, requireAuth, garageRoutes);
  app.use(`${apiBase}/diagnoses`, optionalAuth, diagnosisRoutes);
  app.use(`${apiBase}/rag`, ragRoutes);
}

API_BASES.forEach(mountApiRoutes);

// Serve static frontend files from both root and optional subpath.
app.use(express.static(CLIENT_DIR));

if (APP_BASE_PATH) {
  app.get(APP_BASE_PATH, (req, res, next) => {
    if (req.path !== APP_BASE_PATH) return next();
    res.redirect(`${APP_BASE_PATH}/`);
  });
  app.use(APP_BASE_PATH, express.static(CLIENT_DIR));

  app.get(`${APP_BASE_PATH}/*`, (req, res, next) => {
    if (req.path.startsWith(`${APP_BASE_PATH}/api`)) return next();
    res.sendFile(path.join(CLIENT_DIR, 'index.html'));
  });
}

// SPA fallback — serve index.html for any non-API route
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`AutoAdvisor server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
