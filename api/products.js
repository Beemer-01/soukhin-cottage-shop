const { getSupabase, ok, mapProduct } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return ok(res, { data: (data || []).map(mapProduct) });
  } catch (e) {
    console.error('products error:', e.message);
    // Fail gracefully — shop shows an error state rather than crashing
    return res.status(200).json({ success: false, data: [], error: e.message });
  }
};
