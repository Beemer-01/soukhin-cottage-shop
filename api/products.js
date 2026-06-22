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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Products!A:I',
    });

    const rows = response.data.values || [];
    // Skip header row (row 1 contains column labels)
    const dataRows = rows.length > 1 ? rows.slice(1) : [];

    const products = dataRows
      .filter(row => row.some(cell => String(cell || '').trim() !== ''))
      .map((row, i) => {
        const rawPrice = parseFloat(row[5]);
        return {
          id:       'dyn_' + String(row[0] || i),
          name:     String(row[1] || '').trim(),
          nameBn:   String(row[2] || '').trim(),
          cat:      String(row[3] || '').trim(),
          img:      String(row[4] || '').trim(),
          price:    Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0,
          badge:    String(row[6] || '').trim(),
          desc:     String(row[7] || '').trim(),
          active:   String(row[8] || '').trim().toLowerCase() !== 'false',
          rowIndex: i + 2,
          dynamic:  true,
        };
      })
      .filter(p => p.active && p.name);

    return res.status(200).json({ success: true, products });
  } catch (err) {
    console.error('Products fetch error:', err.message);
    // Fail silently with empty array so shop still loads with hardcoded products
    return res.status(200).json({ success: false, products: [], error: err.message });
  }
};
