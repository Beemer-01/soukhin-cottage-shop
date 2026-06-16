const { google } = require('googleapis');
const nodemailer = require('nodemailer');

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function saveToSheet(orderData) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const { orderId, name, phone, email, address, city, note, payment, items, timestamp } = orderData;
  const itemsList = items.map(i => `${i.name} ×${i.qty}`).join(' | ');

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        timestamp,
        orderId,
        name,
        phone,
        email || '-',
        address,
        city,
        itemsList,
        payment,
        note || '-',
        'Pending'
      ]]
    }
  });
}

async function sendConfirmationEmail(orderData) {
  if (!orderData.email || orderData.email === '-') return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    }
  });

  const { orderId, name, items, payment, address, city, note } = orderData;
  const itemRows = items.map(i =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0e8dc">${i.name}</td><td style="padding:8px 12px;border-bottom:1px solid #f0e8dc;text-align:center">${i.qty}</td></tr>`
  ).join('');

  const paymentInstructions = payment === 'bkash_personal'
    ? '<p style="background:#fff3cd;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>bKash Personal:</strong> Send payment to <strong>01921962964</strong></p>'
    : payment === 'bkash_payment'
    ? '<p style="background:#fff3cd;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>bKash Payment:</strong> Send payment to <strong>01677459360</strong></p>'
    : '<p style="background:#e8f5e9;padding:12px 16px;border-radius:8px;margin:16px 0"><strong>Cash on Delivery</strong> — Pay when you receive your order.</p>';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#FAF7F2;color:#2C1810">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#8B4513;padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:1.4rem">সৌখিন কুটিরশিল্প</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:0.85rem">Soukhin Cottage Crafts</p>
    </div>
    <div style="padding:28px 32px">
      <h2 style="color:#8B4513;margin:0 0 8px">Order Confirmed! ✅</h2>
      <p style="color:#7A5C4A;margin:0 0 24px">Hi ${name}, thank you for your order. We'll confirm the price and delivery details via phone/SMS within 24 hours.</p>

      <div style="background:#FAF7F2;border-radius:10px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:0.8rem;color:#7A5C4A;text-transform:uppercase;letter-spacing:0.5px">Order ID</p>
        <p style="margin:0;font-size:1.1rem;font-weight:700;color:#8B4513">#${orderId}</p>
      </div>

      <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 12px">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;background:#FAF7F2;border-radius:10px;overflow:hidden;margin-bottom:20px">
        <thead>
          <tr style="background:#E8D5C0">
            <th style="padding:10px 12px;text-align:left;font-size:0.82rem">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:0.82rem">Qty</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Delivery Address</h3>
      <p style="color:#7A5C4A;margin:0 0 20px">${address}, ${city}</p>

      ${note && note !== '-' ? `<h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Special Note</h3><p style="color:#7A5C4A;margin:0 0 20px">${note}</p>` : ''}

      <h3 style="color:#2C1810;font-size:0.95rem;margin:0 0 8px">Payment</h3>
      ${paymentInstructions}

      <p style="color:#7A5C4A;font-size:0.85rem;margin:24px 0 0;padding-top:20px;border-top:1px solid #E8D5C0">
        Questions? Call or WhatsApp us at <strong>01921962964</strong>
      </p>
    </div>
    <div style="background:#6B3410;padding:16px 32px;text-align:center">
      <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.8rem">সৌখিন কুটিরশিল্প — Authentic Handmade Crafts from Bangladesh</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"সৌখিন কুটিরশিল্প" <${process.env.GMAIL_USER}>`,
    to: orderData.email,
    subject: `✅ Order Confirmed #${orderId} — Soukhin Cottage Crafts`,
    html
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const orderData = req.body;
    await saveToSheet(orderData);
    await sendConfirmationEmail(orderData);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
};
