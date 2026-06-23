const { getSupabase, checkAdminPassword, ok, fail, setCors, VALID_STATUSES } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  const { id, status } = req.body || {};
  if (!id)                         return fail(res, 400, 'Order id is required');
  if (!VALID_STATUSES.has(status)) return fail(res, 400, `Invalid status. Allowed: ${[...VALID_STATUSES].join(', ')}`);

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return ok(res);
  } catch (e) {
    console.error('update-order error:', e);
    return fail(res, 500, e.message);
  }
};
