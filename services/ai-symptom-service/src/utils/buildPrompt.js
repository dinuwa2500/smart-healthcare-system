'use strict';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Gynecology', 'Psychiatry', 'General Practice',
  'ENT', 'Ophthalmology', 'Oncology', 'Urology',
];

// Zephyr ChatML role delimiters built from char-codes to avoid XML tool issues
const SYS  = '\x3c|system|\x3e';
const USER = '\x3c|user|\x3e';
const ASST = '\x3c|assistant|\x3e';

function buildPrompt({ symptoms, severity, duration, age, gender }) {
  return [
    SYS,
    'You are a medical triage assistant. Based on the patient symptoms,',
    'suggest ONE specialty from the approved list and brief advice.',
    'ALWAYS recommend the patient see a real doctor.',
    'Respond ONLY with a valid JSON object. No markdown. No extra text.',
    USER,
    `Patient: age ${age || 'unknown'}, gender ${gender || 'unknown'}.`,
    `Symptoms: ${symptoms}.`,
    `Duration: ${duration || 'not specified'}. Severity: ${severity || 'not specified'}.`,
    `Approved specialties: ${SPECIALTIES.join(', ')}.`,
    'Return this exact JSON shape:',
    '{',
    '  "suggestedSpecialty": "<one from list>",',
    '  "urgencyLevel": "<routine|soon|urgent|emergency>",',
    '  "generalAdvice": "<2-3 sentences>",',
    '  "redFlags": ["<symptom>"],',
    '  "disclaimer": "This is not a medical diagnosis. Consult a doctor."',
    '}',
    ASST,
  ].join('\n');
}

module.exports = { buildPrompt, SPECIALTIES };
