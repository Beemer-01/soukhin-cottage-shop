const { getSheetsClient, checkAdminPassword, ok, fail, setCors, safeInt, VALID_STATUSES } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  const { rowIndex, status } = req.body || {};
  const row = safeInt(rowIndex, 2);
  if (!row)                        return fail(res, 400, 'Invalid rowIndex (must be integer ≥ 2)');
  if (!VALID_STATUSES.has(status)) return fail(res, 400, `Invalid status. Allowed: ${[...VALID_STATUSES].join(', ')}`);

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Orders!K${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status]] },
    });
    return ok(res);
  } catch (e) {
    console.error('update-order error:', e);
    return fail(res, 500, e.message);
  }
};
