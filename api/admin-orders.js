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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const password = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!password || !expected || password !== expected) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Orders!A:K',
    });

    const rows = response.data.values || [];
    const hasHeader = rows.length > 0 && rows[0][0] === 'Timestamp';
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const orders = dataRows
      .filter(row => row.some(cell => String(cell || '').trim() !== ''))
      .map((row, index) => ({
        rowIndex: hasHeader ? index + 2 : index + 1,
        timestamp: row[0]  || '',
        orderId:   row[1]  || '',
        name:      row[2]  || '',
        phone:     row[3]  || '',
        email:     row[4]  || '',
        address:   row[5]  || '',
        city:      row[6]  || '',
        items:     row[7]  || '',
        payment:   row[8]  || '',
        note:      row[9]  || '',
        status:    row[10] || 'Pending',
      }));

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
