const { getSheetsClient, ok, safePrice } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const sheets   = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Products!A:I',
    });

    const rows     = response.data.values || [];
    const dataRows = rows.length > 1 ? rows.slice(1) : [];   // skip header row

    const products = dataRows
      .filter(row => row.some(c => String(c || '').trim()))
      .map((row, i) => ({
        id:       'dyn_' + String(row[0] || i),
        name:     String(row[1] || '').trim(),
        nameBn:   String(row[2] || '').trim(),
        cat:      String(row[3] || '').trim(),
        img:      String(row[4] || '').trim(),
        price:    safePrice(row[5]),
        badge:    String(row[6] || '').trim(),
        desc:     String(row[7] || '').trim(),
        active:   String(row[8] || '').trim().toLowerCase() !== 'false',
        rowIndex: i + 2,
        dynamic:  true,
      }))
      .filter(p => p.active && p.name);

    return ok(res, { products });
  } catch (e) {
    console.error('products fetch error:', e.message);
    // Fail silently — shop still works with hardcoded products
    return res.status(200).json({ success: false, products: [], error: e.message });
  }
};
