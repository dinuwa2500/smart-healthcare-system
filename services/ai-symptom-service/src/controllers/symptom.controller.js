'use strict';

const { validationResult } = require('express-validator');
const SymptomCheck    = require('../models/SymptomCheck.model');
const { buildPrompt, SPECIALTIES } = require('../utils/buildPrompt');
const { callZephyr }  = require('../utils/callZephyr');
const { extractJson } = require('../utils/extractJson');
const { ok, fail }    = require('../utils/response');

const FALLBACK = {
  suggestedSpecialty: 'General Practice',
  urgencyLevel:       'soon',
  generalAdvice:      'Please consult a General Practitioner for assessment.',
  redFlags:           ['If symptoms worsen seek emergency care immediately.'],
  disclaimer:         'This is not a medical diagnosis. Consult a doctor.',
};

// ── POST /symptoms/check  (role:patient) ─────────────────────
exports.check = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  const prompt = buildPrompt(req.body);
  let rawOutput = '';
  let parsed;

  try {
    rawOutput = await callZephyr(prompt);
    parsed    = extractJson(rawOutput);
  } catch (firstErr) {
    if (firstErr.code === 'HF_TIMEOUT') {
      console.warn('[ai-symptom] HF timeout – returning fallback');
      await _saveCheck(req, req.body, FALLBACK, rawOutput);
      return res.status(200).json({ success: true, data: FALLBACK, fallback: true });
    }

    if (firstErr.code === 'HF_RATE_LIMIT') {
      console.warn('[ai-symptom] HF rate limit');
      res.set('Retry-After', firstErr.retryAfter || '60');
      return res.status(429).json({ success: false, error: 'AI service rate limit – please retry later' });
    }

    if (['HF_MODEL_UNSUPPORTED', 'HF_PROVIDER_ERROR', 'HF_CONFIG', 'HF_EMPTY_RESPONSE'].includes(firstErr.code)) {
      console.warn('[ai-symptom] AI provider unavailable – returning fallback:', firstErr.message);
      await _saveCheck(req, req.body, FALLBACK, rawOutput);
      return res.status(200).json({ success: true, data: FALLBACK, fallback: true });
    }

    // JSON parse failure – retry once
    console.warn('[ai-symptom] JSON parse failed on first attempt – retrying:', firstErr.message);
    try {
      rawOutput = await callZephyr(prompt);
      parsed    = extractJson(rawOutput);
    } catch (retryErr) {
      console.error('[ai-symptom] Retry also failed – returning fallback:', retryErr.message);
      await _saveCheck(req, req.body, FALLBACK, rawOutput);
      return res.status(200).json({ success: true, data: FALLBACK, fallback: true });
    }
  }

  // Validate suggestedSpecialty is in approved list
  if (!SPECIALTIES.includes(parsed.suggestedSpecialty)) {
    console.warn(`[ai-symptom] Unknown specialty '${parsed.suggestedSpecialty}' – defaulting to General Practice`);
    parsed.suggestedSpecialty = 'General Practice';
  }

  await _saveCheck(req, req.body, parsed, rawOutput);
  return ok(res, parsed);
};

// ── GET /symptoms/history  (role:patient, paginated) ─────────
exports.history = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [checks, total] = await Promise.all([
      SymptomCheck.find({ patientId: req.userId })
        .select('-rawModelOutput -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SymptomCheck.countDocuments({ patientId: req.userId }),
    ]);

    return ok(res, { checks, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[ai-symptom] history:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── Internal helper ──────────────────────────────────────────
async function _saveCheck(req, body, parsed, rawOutput) {
  try {
    await SymptomCheck.create({
      patientId:          req.userId,
      symptoms:           body.symptoms,
      severity:           body.severity,
      duration:           body.duration,
      age:                body.age,
      gender:             body.gender,
      suggestedSpecialty: parsed.suggestedSpecialty,
      urgencyLevel:       parsed.urgencyLevel,
      generalAdvice:      parsed.generalAdvice,
      redFlags:           parsed.redFlags || [],
      disclaimer:         parsed.disclaimer,
      rawModelOutput:     rawOutput,
    });
  } catch (dbErr) {
    console.error('[ai-symptom] DB save failed:', dbErr.message);
  }
}
