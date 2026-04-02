// Middleware: require authentication
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

// Middleware: optionally attach userId (don't block if not auth'd)
function optionalAuth(req, res, next) {
  // userId is available via req.session.userId if logged in
  next();
}

module.exports = { requireAuth, optionalAuth };
