const { getSupabase, checkAdminPassword, ok, fail, setCors, safePrice, safeInt, VALID_BADGES, VALID_CATEGORIES } = require('./_lib');

function parseProductBody(b) {
  const name = String(b.name || '').trim();
  const cat  = String(b.cat  || '').trim();
  if (!name) return { err: 'Product name is required' };
  if (!VALID_CATEGORIES.has(cat)) return { err: cat ? `Invalid category: "${cat}"` : 'Category is required' };
  const badge = VALID_BADGES.has(b.badge) ? b.badge : '';
  return {
    name,
    name_bn:     String(b.nameBn || '').trim(),
    category:    cat,
    image_url:   String(b.img   || '').trim(),
    price:       safePrice(b.price),
    badge,
    description: String(b.desc  || '').trim(),
    active:      b.active !== false && b.active !== 'false',
    sort_order:  safeInt(b.sortOrder, 0) ?? 0,
  };
}

module.exports = async function handler(req, res) {
  setCors(res, 'POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAdminPassword(req))  return fail(res, 401, 'Unauthorized');

  const supabase = getSupabase();
  const body = req.body || {};
  const now  = new Date().toISOString();

  // ── POST — create ──────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { err, ...fields } = parseProductBody(body);
    if (err) return fail(res, 400, err);

    const id = body.id ? String(body.id).trim() : Date.now().toString();

    // Reject duplicate IDs
    const { data: existing } = await supabase.from('products').select('id').eq('id', id).maybeSingle();
    if (existing) return fail(res, 409, `Product ID "${id}" already exists`);

    const { error } = await supabase.from('products').insert({ id, ...fields, created_at: now, updated_at: now });
    if (error) { console.error('create-product error:', error); return fail(res, 500, error.message); }
    return ok(res, { id });
  }

  // ── PUT — update (full or partial active-only toggle) ─────────────────────
  if (req.method === 'PUT') {
    const id = String(body.id || '').trim();
    if (!id) return fail(res, 400, 'Product id is required');

    // Partial update: only active field (used by restore)
    const keys = Object.keys(body).filter(k => k !== 'id');
    if (keys.length === 1 && keys[0] === 'active') {
      const { error } = await supabase.from('products').update({ active: body.active !== false && body.active !== 'false', updated_at: now }).eq('id', id);
      if (error) { console.error('restore-product error:', error); return fail(res, 500, error.message); }
      return ok(res);
    }

    const { err, ...fields } = parseProductBody(body);
    if (err) return fail(res, 400, err);
    const { error } = await supabase.from('products').update({ ...fields, updated_at: now }).eq('id', id);
    if (error) { console.error('update-product error:', error); return fail(res, 500, error.message); }
    return ok(res);
  }

  // ── DELETE — soft delete (set active = false) ──────────────────────────────
  if (req.method === 'DELETE') {
    const id = String(body.id || '').trim();
    if (!id) return fail(res, 400, 'Product id is required');
    const { error } = await supabase.from('products').update({ active: false, updated_at: now }).eq('id', id);
    if (error) { console.error('delete-product error:', error); return fail(res, 500, error.message); }
    return ok(res);
  }

  return fail(res, 405, 'Method not allowed');
};
