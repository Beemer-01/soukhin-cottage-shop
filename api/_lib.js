const { createClient } = require('@supabase/supabase-js');

// ── Supabase client (server-side only, uses service role key) ─────────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL env var is missing');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY env var is missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Admin password check ──────────────────────────────────────────────────────
function checkAdminPassword(req) {
  const incoming = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  return incoming.length > 0 && expected.length > 0 && incoming === expected;
}

// ── Standard JSON response helpers ────────────────────────────────────────────
function ok(res, data = {})          { return res.status(200).json({ success: true,  ...data }); }
function fail(res, status, message)  { return res.status(status).json({ success: false, error: message }); }

// ── CORS headers ──────────────────────────────────────────────────────────────
function setCors(res, methods = 'GET, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
}

// ── HTML escape (for email templates) ────────────────────────────────────────
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Safe number helpers ───────────────────────────────────────────────────────
function safeInt(value, min = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= min ? n : null;
}
function safePrice(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── DB row → frontend product shape ──────────────────────────────────────────
function mapProduct(row) {
  return {
    id:        row.id,
    name:      row.name,
    nameBn:    row.name_bn      || '',
    cat:       row.category,
    img:       row.image_url    || '',
    price:     Number(row.price) || 0,
    badge:     row.badge        || '',
    desc:      row.description  || '',
    active:    row.active !== false,
    sortOrder: row.sort_order   || 0,
  };
}

// ── Allowed value sets ────────────────────────────────────────────────────────
const VALID_STATUSES = new Set([
  'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled',
]);
const VALID_BADGES = new Set(['', 'hot', 'new']);
const VALID_CATEGORIES = new Set([
  'Pottery', 'Steel Products', 'Wood Craft', 'Jute Goods', 'Bamboo Craft',
  'Miscellaneous', 'Mini Aquarium', 'Copper Craft', 'Cane Craft',
  'Handmade Lamps', 'Fountain Craft', 'Ornaments', 'Gift Items', 'Ship Souvenirs',
]);

module.exports = {
  getSupabase, checkAdminPassword,
  ok, fail, setCors,
  esc, safeInt, safePrice, mapProduct,
  VALID_STATUSES, VALID_BADGES, VALID_CATEGORIES,
};
