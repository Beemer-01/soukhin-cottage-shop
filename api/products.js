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
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Products!A:I',
    });

    const rows = response.data.values || [];
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    const products = dataRows
      .map((row, i) => ({
        id: 'dyn_' + (row[0] || i),
        name:   row[1] || '',
        nameBn: row[2] || '',
        cat:    row[3] || '',
        img:    row[4] || '',
        price:  parseFloat(row[5]) || 0,
        badge:  row[6] || '',
        desc:   row[7] || '',
        active: row[8] !== 'false',
        rowIndex: i + 2,
        dynamic: true,
      }))
      .filter(p => p.active && p.name);

    res.status(200).json({ products });
  } catch (err) {
    console.error('Products fetch error:', err.message);
    res.status(200).json({ products: [] }); // fail silently so shop still loads
  }
};
