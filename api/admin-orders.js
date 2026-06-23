const { getSupabase, checkAdminPassword, ok, fail, setCors } = require('./_lib');

module.exports = async function handler(req, res) {
  setCors(res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return fail(res, 405, 'Method not allowed');
  if (!checkAdminPassword(req)) return fail(res, 401, 'Unauthorized');

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const orders = (data || []).map(row => ({
      id:        row.id,
      timestamp: new Date(row.created_at).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
      name:      row.customer_name,
      phone:     row.phone,
      email:     row.email    || '-',
      address:   row.address,
      city:      row.city     || '',
      items:     Array.isArray(row.items)
                   ? row.items.map(i => `${i.name} ×${i.qty}`).join(' | ')
                   : String(row.items || ''),
      payment:   row.payment,
      note:      row.note     || '-',
      status:    row.status   || 'Pending',
    }));

    return ok(res, { orders });
  } catch (e) {
    console.error('admin-orders error:', e);
    return fail(res, 500, e.message);
  }
};
