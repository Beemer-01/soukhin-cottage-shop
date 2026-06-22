// Shared helpers for all Vercel serverless API routes.
// No external dependencies beyond what is already in package.json.

const { google } = require('googleapis');

// ── Google Sheets auth ────────────────────────────────────────
function getSheetsClient() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) throw new Error('GOOGLE_PRIVATE_KEY env var is missing');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL env var is missing');
  if (!process.env.GOOGLE_SHEET_ID) throw new Error('GOOGLE_SHEET_ID env var is missing');

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
}

// ── Admin password check ──────────────────────────────────────
function checkAdminPassword(req) {
  const incoming = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  return incoming.length > 0 && expected.length > 0 && incoming === expected;
}

// ── Standard JSON response helpers ───────────────────────────
function ok(res, data = {}) {
  return res.status(200).json({ success: true, ...data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

// ── CORS headers for all admin routes ────────────────────────
function setCors(res, methods = 'GET, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
}

// ── Text sanitisation (XSS prevention in HTML strings) ───────
// Replaces the five HTML-significant characters.
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Safe integer parse ────────────────────────────────────────
function safeInt(value, min = 1) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= min ? n : null;
}

// ── Safe price parse ─────────────────────────────────────────
function safePrice(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── Allowed sets ─────────────────────────────────────────────
const VALID_STATUSES   = new Set(['Pending','Confirmed','Processing','Shipped','Delivered','Cancelled']);
const VALID_BADGES     = new Set(['', 'hot', 'new']);
const VALID_CATEGORIES = new Set([
  'Pottery','Steel Products','Wood Craft','Jute Goods','Bamboo Craft',
  'Miscellaneous','Mini Aquarium','Copper Craft','Cane Craft',
  'Handmade Lamps','Fountain Craft','Ornaments','Gift Items','Ship Souvenirs',
]);

module.exports = { getSheetsClient, checkAdminPassword, ok, fail, setCors, esc, safeInt, safePrice, VALID_STATUSES, VALID_BADGES, VALID_CATEGORIES };
