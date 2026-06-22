const { getSheetsClient, checkAdminPassword, ok, fail, setCors, safeInt, safePrice, VALID_BADGES, VALID_CATEGORIES } = require('./_lib');

function parseProductBody(b) {
  const name  = String(b.name  || '').trim();
  const cat   = String(b.cat   || '').trim();
  const badge = VALID_BADGES.has(b.badge) ? b.badge : '';
  if (!name) return { err: 'Product name is required' };
  if (!VALID_CATEGORIES.has(cat)) return { err: cat ? `Invalid category: "${cat}"` : 'Category is required' };
  return {
    name,
    nameBn: String(b.nameBn || '').trim(),
    cat,
    img:    String(b.img    || '').trim(),
    price:  safePrice(b.price),
    badge,
    desc:   String(b.desc   || '').trim(),
  };
}

module.exports = async function handler(req, res) {
  setCors(res, 'POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  const body = req.body || {};

  // ── ADD ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { err, ...fields } = parseProductBody(body);
    if (err) return fail(res, 400, err);
    try {
      const id     = Date.now().toString();
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Products!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[id, fields.name, fields.nameBn, fields.cat, fields.img, fields.price, fields.badge, fields.desc, 'true']] },
      });
      return ok(res, { id });
    } catch (e) { console.error('add-product error:', e); return fail(res, 500, e.message); }
  }

  // ── UPDATE ───────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const row = safeInt(body.rowIndex, 2);
    if (!row) return fail(res, 400, 'Invalid rowIndex');
    const { err, ...fields } = parseProductBody(body);
    if (err) return fail(res, 400, err);
    const active = body.active !== false && body.active !== 'false' ? 'true' : 'false';
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!B${row}:I${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[fields.name, fields.nameBn, fields.cat, fields.img, fields.price, fields.badge, fields.desc, active]] },
      });
      return ok(res);
    } catch (e) { console.error('update-product error:', e); return fail(res, 500, e.message); }
  }

  // ── SOFT DELETE ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const row = safeInt(body.rowIndex, 2);
    if (!row) return fail(res, 400, 'Invalid rowIndex');
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!I${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['false']] },
      });
      return ok(res);
    } catch (e) { console.error('delete-product error:', e); return fail(res, 500, e.message); }
  }

  return fail(res, 405, 'Method not allowed');
};
