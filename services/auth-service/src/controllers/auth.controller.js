'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const ServiceClient = require('../utils/serviceClient');


const SALT_ROUNDS = 12;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth/refresh';

// ── Token helpers ────────────────────────────────────────────
const signAccess = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });

const signRefresh = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

// ── POST /auth/register ──────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const { email, password, role, adminCode } = req.body;

    // Verify admin invitation code if role is admin
    if (role === 'admin') {
      const validAdminCode = process.env.ADMIN_INVITATION_CODE || 'mediconnect-admin-2024';
      if (adminCode !== validAdminCode) {
        return fail(res, 'Invalid admin invitation code', 403);
      }
    }

    const existing = await User.findOne({ email });
    if (existing) return fail(res, 'Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      role,
      isVerified: role !== 'doctor',
    });

    // ── Orchestrate profile creation in external services ──────────
    try {
      if (role === 'doctor' || role === 'patient') {
        const profileData = {
          email: user.email,
          firstName: req.body.firstName || (role === 'doctor' ? 'Dr.' : 'Patient'),
          lastName: req.body.lastName || 'Profile',
          // Add other common fields if they exist in req.body
          ...(role === 'doctor' ? { specialization: req.body.specialization || 'General Practice' } : {}),
          ...req.body
        };
        
        await ServiceClient.createProfile(role, user._id.toString(), profileData);
      }
    } catch (err) {
      console.error(`[auth-service] Profile creation failed during registration: ${err.message}`);
      // In a production app, we would potentially delete the created user here (rollback)
      // or at least return a more specific message about partial success.
      // For now, let's proceed with an error to the user.
      await User.findByIdAndDelete(user._id);
      return fail(res, `Registration failed significantly: ${err.message}`, 502);
    }

    return ok(res, { userId: user._id, email: user.email, role: user.role }, 201);

  } catch (err) {
    console.error('[auth] register:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /auth/login ─────────────────────────────────────────
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return fail(res, 'Invalid credentials', 401);

    if (!user.isActive) return fail(res, 'Account is deactivated', 403);
    if (user.role === 'doctor' && !user.isVerified)
      return fail(res, 'Doctor account awaiting admin verification', 403);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return fail(res, 'Invalid credentials', 401);

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);

    setRefreshCookie(res, refreshToken);

    return ok(res, {
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[auth] login:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /auth/refresh ───────────────────────────────────────
exports.refresh = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return fail(res, 'Refresh token missing', 401);

  try {
    const payload = jwt.verify(token, process.env.REFRESH_SECRET);

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return fail(res, 'User not found or inactive', 401);

    const accessToken = signAccess(user);
    const newRefresh = signRefresh(user);

    setRefreshCookie(res, newRefresh);

    return ok(res, { accessToken });
  } catch (err) {
    console.error('[auth] refresh:', err.message);
    return fail(res, 'Invalid or expired refresh token', 401);
  }
};

// ── POST /auth/logout ────────────────────────────────────────
exports.logout = (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  return ok(res, { message: 'Logged out successfully' });
};

// ── PATCH /auth/users/:id/status  (admin only) ───────────────
exports.updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return fail(res, 'User not found', 404);

    return ok(res, { id: user._id, email: user.email, role: user.role, isActive: user.isActive });
  } catch (err) {
    console.error('[auth] updateStatus:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /auth/users/:id  (Internal or Admin) ─────────────────
exports.getById = async (req, res) => {
  const internalSecret = req.headers['x-internal-secret'];
  const FALLBACK_SECRET = 'mediconnect_secret_2024';

  const isInternal = internalSecret && (internalSecret === process.env.INTERNAL_SERVICE_SECRET || internalSecret === FALLBACK_SECRET);
  const isAdmin = req.headers['x-user-role'] === 'admin';

  if (!isInternal && !isAdmin) {
    return res.status(401).json({ success: false, error: 'Unauthorised' });
  }

  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    return res.json({ success: true, data: { id: user._id, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) {
    console.error('[auth] getById:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── GET /auth/users (Admin Only) ──────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments()
    ]);

    // Format for frontend
    const formatted = users.map(u => ({
      id: u._id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }));

    return ok(res, { users: formatted, total });
  } catch (err) {
    console.error('[auth] getAll:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};
