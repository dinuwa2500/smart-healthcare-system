'use strict';

exports.extractUser = function extractUser(req, res, next) {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorised: missing X-User-Id header' });
  }

  req.userId   = userId;
  req.userRole = role || 'patient';
  next();
};

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
