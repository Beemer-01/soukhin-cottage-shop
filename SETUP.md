# Setup Guide — সৌখিন কুটিরশিল্প Shop

## Step 1 — Google Sheets Setup

1. Go to https://sheets.google.com and create a new spreadsheet
2. Rename the first sheet tab to **Orders**
3. Add these headers in row 1:
   `Timestamp | Order ID | Name | Phone | Email | Address | City | Items | Payment | Note | Status`
4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

## Step 2 — Google Service Account

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. "Soukhin Shop")
3. Go to **APIs & Services → Enable APIs** → search "Google Sheets API" → Enable
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Give it any name (e.g. "soukhin-sheets"), click Done
6. Click the service account email → **Keys → Add Key → JSON** → Download the file
7. Open the JSON file — copy the `client_email` and `private_key` values
8. In your Google Sheet, click **Share** and share with that `client_email` (Editor access)

## Step 3 — Gmail App Password (for sending emails)

1. Use a Gmail account for sending order confirmations
2. Go to https://myaccount.google.com/security
3. Enable 2-Step Verification (required)
4. Go to https://myaccount.google.com/apppasswords
5. Create an app password for "Mail" → copy the 16-character password

## Step 4 — Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In the `shop/` folder, run: `vercel`
3. Follow the prompts (link to your account, create new project)

## Step 5 — Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Value |
|----------|-------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` from the JSON key file |
| `GOOGLE_PRIVATE_KEY` | The `private_key` from the JSON key file (include the full -----BEGIN... block) |
| `GOOGLE_SHEET_ID` | The spreadsheet ID from Step 1 |
| `GMAIL_USER` | Your Gmail address (e.g. yourshop@gmail.com) |
| `GMAIL_APP_PASSWORD` | The 16-char app password from Step 3 |
| `ADMIN_PASSWORD` | Any strong password you choose for the admin dashboard |

After adding all variables, redeploy: `vercel --prod`

## Step 6 — Access Admin Dashboard

Visit: `https://your-site.vercel.app/admin.html`
Enter your `ADMIN_PASSWORD` to log in.

## Order Flow Summary

1. Customer adds items → fills checkout form → places order
2. Order saved to Google Sheet automatically
3. Confirmation email sent to customer (if they provided email)
4. You log into admin dashboard to see all orders
5. Update order status (Pending → Confirmed → Shipped → Delivered)
