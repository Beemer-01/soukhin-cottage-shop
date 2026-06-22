const { getSheetsClient, checkAdminPassword, ok, fail, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  try {
    const sheets   = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Orders!A:K',
    });

    const rows      = response.data.values || [];
    const hasHeader = rows.length > 0 && String(rows[0][0] || '').trim() === 'Timestamp';
    const dataRows  = hasHeader ? rows.slice(1) : rows;

    const orders = dataRows
      .filter(row => row.some(c => String(c || '').trim()))
      .map((row, i) => ({
        rowIndex:  hasHeader ? i + 2 : i + 1,
        timestamp: String(row[0]  || ''),
        orderId:   String(row[1]  || ''),
        name:      String(row[2]  || ''),
        phone:     String(row[3]  || ''),
        email:     String(row[4]  || ''),
        address:   String(row[5]  || ''),
        city:      String(row[6]  || ''),
        items:     String(row[7]  || ''),
        payment:   String(row[8]  || ''),
        note:      String(row[9]  || ''),
        status:    String(row[10] || 'Pending'),
      }));

    return ok(res, { orders });
  } catch (e) {
    console.error('admin-orders error:', e);
    return fail(res, 500, e.message);
  }
};
