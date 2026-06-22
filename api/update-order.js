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

const VALID_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const password = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!password || !expected || password !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { rowIndex, status } = req.body || {};
  if (!rowIndex || !status) {
    return res.status(400).json({ success: false, error: 'Missing rowIndex or status' });
  }
  const row = parseInt(rowIndex, 10);
  if (!Number.isFinite(row) || row < 2) {
    return res.status(400).json({ success: false, error: 'Invalid rowIndex' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Orders!K${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update order error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
