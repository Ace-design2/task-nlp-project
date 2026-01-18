# 🚀 Switched to Vercel Architecture

Since we moved from Firebase Functions (Blaze required) to Vercel (Free), here is the new setup.

## 1. Get your Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Project Settings** (Gear icon).
3. Go to **Service accounts** tab.
4. Click **Generate new private key**.
5. Open the downloaded JSON file and copy the **entire content**.

## 2. Deploy to Vercel

1. Go to your Vercel Dashboard and Import this project.
2. In **Environment Variables**:
   - Add `FIREBASE_SERVICE_ACCOUNT` -> Paste the entire JSON you copied.
   - Add `REACT_APP_FIREBASE_API_KEY`, etc. (Copy them from your local .env).
   - Add `REACT_APP_FIREBASE_VAPID_KEY` (From Firebase Console > Cloud Messaging > Web Push certs).

## 3. Set up the "Heartbeat" (Cron)

Since Vercel's free cron is limited to 1/day, we use a free external trigger.

1. Go to [cron-job.org](https://cron-job.org/en/) (Free, no account needed for basic).
2. Create a specific Cron Job:
   - **URL**: `https://YOUR-APP-NAME.vercel.app/api/cron`
   - **Schedule**: Every 1 minute.
3. Save.

## How it works now

1. **User** creates a reminder -> Saved to Firestore with `sent: false`.
2. **Cron-job.org** hits your Vercel API every minute.
3. **Vercel API** checks Firestore for tasks due now.
4. **Vercel API** sends Push Notification via FCM.
5. **Service Worker** on phone receives and shows it.

✅ **Robust, Server-Side, and Completely Free.**
