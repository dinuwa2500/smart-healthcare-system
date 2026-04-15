'use strict';

module.exports = function adminOnly(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: admin access required' });
  }
  next();
};
