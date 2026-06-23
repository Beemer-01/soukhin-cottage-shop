const { getSupabase, checkAdminPassword, ok, fail, setCors, mapProduct } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return ok(res, { data: (data || []).map(mapProduct) });
  } catch (e) {
    console.error('admin-products error:', e.message);
    return fail(res, 500, e.message);
  }
};
