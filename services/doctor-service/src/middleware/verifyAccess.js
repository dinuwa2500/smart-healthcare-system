'use strict';

/**
 * Injects req.userId / req.userRole from API-gateway-forwarded headers.
 */
exports.extractUser = function extractUser(req, res, next) {
  const userIdFromGateway = req.headers['x-user-id'];
  const roleFromGateway   = req.headers['x-user-role'];
  const internalSecret    = req.headers['x-internal-secret'];
  const FALLBACK_SECRET   = 'mediconnect_secret_2024';

  // Check if this is an internal call
  if (internalSecret && (internalSecret === process.env.INTERNAL_SERVICE_SECRET || internalSecret === FALLBACK_SECRET)) {
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
 * Factory: require a specific role (or array of roles).
 * Usage: roleGuard('admin')  or  roleGuard(['doctor','admin'])
 */
exports.roleGuard = function roleGuard(allowed) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: requires role ${roles.join(' or ')}`,
      });
    }
    next();
  };
};
