# Google Sheets Setup Guide for AQI Alerts

This guide walks you through setting up Google Sheets as a database for storing AQI alert subscriptions.

## Overview

We're using Google Sheets because:
- ✅ **Free** - No cost for storage or API calls at low volume
- ✅ **Visual** - See your subscribers directly in a spreadsheet
- ✅ **Easy to manage** - Edit, export, or analyze data without code
- ✅ **Simple migration** - Easy to export to a "real" database later

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a Project** → **New Project**
3. Name it something like `aqi-app` and click **Create**
4. Wait for it to be created, then select it

---

## Step 2: Enable Required APIs

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Google Sheets API"** and click **Enable**
3. Search for **"Google Drive API"** and click **Enable**

---

## Step 3: Create a Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **+ CREATE SERVICE ACCOUNT**
3. Fill in:
   - **Name**: `aqi-sheets-writer`
   - **ID**: Auto-fills (keep it)
4. Click **CREATE AND CONTINUE**
5. Skip the optional roles, click **CONTINUE**
6. Skip granting users access, click **DONE**

---

## Step 4: Create and Download Credentials

1. Click on your new service account (`aqi-sheets-writer@...`)
2. Go to the **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** and click **CREATE**
5. A JSON file will download - **keep this safe!**
6. Rename it to `credentials.json` and put it in your `backend/` folder

> ⚠️ **IMPORTANT**: Never commit `credentials.json` to git! It's already in `.gitignore`.

---

## Step 5: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it something like "AQI Alert Subscriptions"
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```

---

## Step 6: Share the Sheet with Your Service Account

1. In your Google Sheet, click **Share** (top right)
2. Open the `credentials.json` file you downloaded
3. Find the `"client_email"` field - it looks like:
   ```
   aqi-sheets-writer@your-project.iam.gserviceaccount.com
   ```
4. Paste this email in the "Share" dialog
5. Give it **Editor** access
6. Uncheck "Notify people" and click **Share**

---

## Step 7: Set Environment Variables

### For Local Development

Create/update your `backend/.env` file:

```env
# Existing variables
AQICN_API_KEY=your_aqicn_key

# New Google Sheets variables
GOOGLE_SHEET_ID=your_sheet_id_from_url
GOOGLE_SHEETS_CREDENTIALS_FILE=credentials.json
```

### For Cloud Run (Production)

In Google Cloud Console:
1. Go to **Cloud Run** → Select your service
2. Click **Edit & Deploy New Revision**
3. Go to **Variables & Secrets** tab
4. Add these environment variables:
   - `GOOGLE_SHEET_ID`: Your sheet ID
   - `GOOGLE_SHEETS_CREDENTIALS_JSON`: The entire content of credentials.json (paste the whole JSON)

---

## Step 8: Test Locally

1. Start your backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Test the endpoint:
   ```bash
   curl -X POST http://localhost:8000/subscribe \
     -H "Content-Type: application/json" \
     -d '{"method": "email", "contact": "test@example.com", "location": "Delhi, India"}'
   ```

3. Check your Google Sheet - you should see a new row!

---

## Data Structure

The spreadsheet will have two tabs:

### Tab 1: Subscriptions

| Column | Description |
|--------|-------------|
| ID | Unique subscription ID (SUB_20260125120000) |
| Method | `email` or `phone` |
| Contact | Email address or phone number |
| Location | City/location name |
| Latitude | GPS latitude (if available) |
| Longitude | GPS longitude (if available) |
| Created At | ISO timestamp |
| Status | `active` or `inactive` |

### Tab 2: Feedback

| Column | Description |
|--------|-------------|
| ID | Unique feedback ID (FB_20260125120000) |
| Rating | Star rating 1-5 |
| Feedback | User's text feedback |
| Location | City/location context |
| Latitude | GPS latitude (if available) |
| Longitude | GPS longitude (if available) |
| Created At | ISO timestamp |

> Both tabs are created automatically when the first data is submitted.

---

## Troubleshooting

### "Google Sheets libraries not installed"
Run: `pip install google-auth google-api-python-client`

### "No Google Sheets credentials found"
- Check that `credentials.json` exists in `backend/`
- Or set `GOOGLE_SHEETS_CREDENTIALS_JSON` environment variable

### "Permission denied" or "404"
- Make sure you shared the sheet with the service account email
- Verify the Sheet ID is correct

### "Unable to parse range: Subscriptions"
The code will automatically create the "Subscriptions" tab if it doesn't exist.

---

## Fallback Mode

If Google Sheets isn't configured, the system runs in **fallback mode**:
- Subscriptions are logged to the console
- The API still returns success (so users don't see errors)
- You can view subscription attempts in Cloud Run logs

This means you can deploy without Sheets configured and add it later!

---

## Next Steps

Once you have 500+ subscribers, consider migrating to:
- **Supabase** (PostgreSQL with nice UI)
- **Firestore** (if staying on GCP)
- **PlanetScale** (MySQL)

The migration is easy - just export the sheet as CSV and import to your new database.
