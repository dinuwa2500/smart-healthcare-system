'use strict';

const fs   = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Load an HTML template and replace {placeholder} tokens with values.
 * @param {string} templateName  e.g. 'appointment.booked'
 * @param {object} vars          key/value pairs for substitution
 * @returns {string}             rendered HTML string
 */
exports.render = function render(templateName, vars = {}) {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);

  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`[template] Template not found: ${templateName}.html – using plain text fallback`);
    html = Object.entries(vars).map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`).join('');
  }

  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, val ?? ''),
    html
  );
};
