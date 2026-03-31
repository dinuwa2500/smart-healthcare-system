'use strict';

/**
 * Injects req.userId / req.userRole from gateway-forwarded headers.
 * Call this before any protected route.
 */
module.exports.extractUser = function extractUser(req, res, next) {
  const userIdFromGateway = req.headers['x-user-id'];
  const roleFromGateway   = req.headers['x-user-role'];
  const internalSecret    = req.headers['x-internal-secret'];
  const FALLBACK_SECRET   = 'mediconnect_secret_2024';

  // Check if this is an internal call from another service
  if (internalSecret && (internalSecret === process.env.INTERNAL_SERVICE_SECRET || internalSecret === FALLBACK_SECRET)) {
    // If internal, we trust the authUserId from the request body
    req.userId = req.body.authUserId || 'system';
    req.userRole = req.body.role || 'admin';
    return next();
  }

  if (!userIdFromGateway) {
    return res.status(401).json({ success: false, error: 'Unauthorised: missing X-User-Id header' });
  }

  req.userId   = userIdFromGateway;
  req.userRole = roleFromGateway || 'patient';
  next();
};

/**
 * Middleware for /files/:patientId/:filename
 * Allows access if:
 *   - caller is the patient themselves (userId === patientId), or
 *   - caller has role doctor or admin
 */
module.exports.canAccessFile = function canAccessFile(req, res, next) {
  const { patientId } = req.params;
  const { userId, userRole } = req;

  if (userId === patientId || userRole === 'doctor' || userRole === 'admin') {
    return next();
  }

  return res.status(403).json({ success: false, error: 'Forbidden: insufficient access' });
};
