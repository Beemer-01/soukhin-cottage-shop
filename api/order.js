const nodemailer = require('nodemailer');
const { getSheetsClient, ok, fail, setCors, esc } = require('./_lib');

function validateBody(b) {
  if (!b || typeof b !== 'object')            return 'Request body missing';
  if (!String(b.name    || '').trim())        return 'Name is required';
  if (!String(b.phone   || '').trim())        return 'Phone is required';
  if (!String(b.address || '').trim())        return 'Address is required';
  if (!String(b.city    || '').trim())        return 'City is required';
  if (!Array.isArray(b.items) || !b.items.length) return 'Cart is empty';
  if (!/^01[3-9]\d{8}$/.test(String(b.phone).trim())) return 'Invalid BD phone number';
  return null;
}

async function saveToSheet(d) {
  const sheets    = getSheetsClient();
  const itemsList = d.items.map(i => `${esc(i.name)} ×${Math.max(1, parseInt(i.qty) || 1)}`).join(' | ');
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Orders!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[
      d.timestamp || new Date().toISOString(),
      d.orderId,
      String(d.name).trim(),
      String(d.phone).trim(),
      String(d.email || '-').trim() || '-',
      String(d.address).trim(),
      String(d.city).trim(),
      itemsList,
      d.payment || 'cod',
      String(d.note || '-').trim() || '-',
      'Pending',
    ]] },
  });
}

async function sendEmail(d) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  if (!d.email || d.email === '-') return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const itemRows = d.items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8dc">${esc(i.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8dc;text-align:center">${Math.max(1, parseInt(i.qty) || 1)}</td>
    </tr>`
  ).join('');

  const payNote = d.payment === 'bkash_personal'
    ? '<p style="background:#fff3cd;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>bKash Personal:</strong> Send payment to <strong>01921962964</strong></p>'
    : d.payment === 'bkash_payment'
    ? '<p style="background:#fff3cd;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>bKash Payment:</strong> Send payment to <strong>01677459360</strong></p>'
    : '<p style="background:#e8f5e9;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>Cash on Delivery</strong> — Pay when you receive your order.</p>';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#FAF7F2;color:#2C1810">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:#8B4513;padding:28px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:1.4rem">সৌখিন কুটিরশিল্প</h1>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:0.85rem">Soukhin Cottage Crafts</p>
  </div>
  <div style="padding:28px 32px">
    <h2 style="color:#8B4513;margin:0 0 8px">Order Confirmed! ✅</h2>
    <p style="color:#7A5C4A;margin:0 0 24px">Hi ${esc(d.name)}, thank you for your order. We'll confirm the price and delivery details via phone/SMS within 24 hours.</p>
    <div style="background:#FAF7F2;border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:0.8rem;color:#7A5C4A;text-transform:uppercase;letter-spacing:0.5px">Order ID</p>
      <p style="margin:0;font-size:1.1rem;font-weight:700;color:#8B4513">#${esc(d.orderId)}</p>
    </div>
    <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 12px">Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse;background:#FAF7F2;border-radius:10px;overflow:hidden;margin-bottom:20px">
      <thead><tr style="background:#E8D5C0">
        <th style="padding:10px 12px;text-align:left;font-size:0.82rem">Product</th>
        <th style="padding:10px 12px;text-align:center;font-size:0.82rem">Qty</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Delivery Address</h3>
    <p style="color:#7A5C4A;margin:0 0 20px">${esc(d.address)}, ${esc(d.city)}</p>
    ${d.note && d.note !== '-' ? `<h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Special Note</h3><p style="color:#7A5C4A;margin:0 0 20px">${esc(d.note)}</p>` : ''}
    <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Payment</h3>
    ${payNote}
    <p style="color:#7A5C4A;font-size:0.85rem;margin:24px 0 0;padding-top:20px;border-top:1px solid #E8D5C0">
      Questions? Call or WhatsApp us at <strong>01921962964</strong>
    </p>
  </div>
  <div style="background:#6B3410;padding:16px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.8rem">সৌখিন কুটিরশিল্প — Authentic Handmade Crafts from Bangladesh</p>
  </div>
</div>
</body></html>`;

  await transporter.sendMail({
    from: `"সৌখিন কুটিরশিল্প" <${process.env.GMAIL_USER}>`,
    to: d.email,
    subject: `✅ Order Confirmed #${d.orderId} — Soukhin Cottage Crafts`,
    html,
  });
}

module.exports = async function handler(req, res) {
  setCors(res, 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  const err = validateBody(req.body);
  if (err) return fail(res, 400, err);

  try {
    await saveToSheet(req.body);
  } catch (e) {
    console.error('Sheet save error:', e);
    return fail(res, 500, 'Failed to save order. Please try again.');
  }

  // Email is best-effort — never fail the order over it
  try { await sendEmail(req.body); } catch (e) { console.error('Email error (non-fatal):', e.message); }

  return ok(res);
};
