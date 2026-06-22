const { google } = require('googleapis');

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const password = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!password || !expected || password !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // ADD product
    if (req.method === 'POST') {
      const { name, nameBn, cat, img, price, badge, desc } = req.body;
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Products!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[id, name, nameBn || '', cat, img || '', price || 0, badge || '', desc || '', 'true']] }
      });
      return res.status(200).json({ success: true, id });
    }

    // UPDATE product
    if (req.method === 'PUT') {
      const { rowIndex, name, nameBn, cat, img, price, badge, desc, active } = req.body;
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!B${rowIndex}:I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[name, nameBn || '', cat, img || '', price || 0, badge || '', desc || '', active !== false ? 'true' : 'false']] }
      });
      return res.status(200).json({ success: true });
    }

    // DELETE product (set active = false)
    if (req.method === 'DELETE') {
      const { rowIndex } = req.body;
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Products!I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['false']] }
      });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin product error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
