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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Orders!A:K',
    });

    const rows = response.data.values || [];
    // Skip header row if present
    const dataRows = rows[0]?.[0] === 'Timestamp' ? rows.slice(1) : rows;

    const orders = dataRows.map((row, index) => ({
      rowIndex: (rows[0]?.[0] === 'Timestamp' ? index + 2 : index + 1),
      timestamp: row[0] || '',
      orderId:   row[1] || '',
      name:      row[2] || '',
      phone:     row[3] || '',
      email:     row[4] || '',
      address:   row[5] || '',
      city:      row[6] || '',
      items:     row[7] || '',
      payment:   row[8] || '',
      note:      row[9] || '',
      status:    row[10] || 'Pending',
    }));

    res.status(200).json({ orders });
  } catch (err) {
    console.error('Admin fetch error:', err);
    res.status(500).json({ error: err.message });
  }
};
