const { google } = require('googleapis');

function getAuth() {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) throw new Error('GOOGLE_PRIVATE_KEY env var is not set');
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

const VALID_CATEGORIES = ['Pottery', 'Steel Products', 'Wood Craft', 'Jute Goods', 'Bamboo Craft', 'Miscellaneous', 'Mini Aquarium'];
const VALID_BADGES = ['', 'hot', 'new'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const password = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!password || !expected || password !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const body = req.body || {};

  // ADD product
  if (req.method === 'POST') {
    const name = String(body.name || '').trim();
    const cat  = String(body.cat  || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'Product name is required' });
    if (!cat)  return res.status(400).json({ success: false, error: 'Category is required' });
    if (!VALID_CATEGORIES.includes(cat)) return res.status(400).json({ success: false, error: 'Invalid category' });

    const badge = VALID_BADGES.includes(body.badge) ? body.badge : '';
    const price = parseFloat(body.price);
    const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
    const id = Date.now().toString();

    try {
      const auth = getAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Products!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            id,
            name,
            String(body.nameBn || '').trim(),
            cat,
            String(body.img || '').trim(),
            safePrice,
            badge,
            String(body.desc || '').trim(),
            'true'
          ]]
        }
      });
      return res.status(200).json({ success: true, id });
    } catch (err) {
      console.error('Add product error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // UPDATE product
  if (req.method === 'PUT') {
    const rowIndex = parseInt(body.rowIndex, 10);
    if (!Number.isFinite(rowIndex) || rowIndex < 2) {
      return res.status(400).json({ success: false, error: 'Invalid rowIndex' });
    }
    const name = String(body.name || '').trim();
    const cat  = String(body.cat  || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'Product name is required' });
    if (!cat)  return res.status(400).json({ success: false, error: 'Category is required' });
    if (!VALID_CATEGORIES.includes(cat)) return res.status(400).json({ success: false, error: 'Invalid category' });

    const badge = VALID_BADGES.includes(body.badge) ? body.badge : '';
    const price = parseFloat(body.price);
    const safePrice = Number.isFinite(price) && price >= 0 ? price : 0;
    const active = body.active !== false && body.active !== 'false' ? 'true' : 'false';

    try {
      const auth = getAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!B${rowIndex}:I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            name,
            String(body.nameBn || '').trim(),
            cat,
            String(body.img || '').trim(),
            safePrice,
            badge,
            String(body.desc || '').trim(),
            active
          ]]
        }
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Update product error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // SOFT DELETE product (set Active = false)
  if (req.method === 'DELETE') {
    const rowIndex = parseInt(body.rowIndex, 10);
    if (!Number.isFinite(rowIndex) || rowIndex < 2) {
      return res.status(400).json({ success: false, error: 'Invalid rowIndex' });
    }
    try {
      const auth = getAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['false']] }
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Delete product error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
