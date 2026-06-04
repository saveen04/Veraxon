# Firebase Admin SDK Setup Guide

## Overview

The application uses Firebase Admin SDK on the server side (for API routes) to access Firestore. If you see this error:

```
firebase-admin: No explicit service-account credentials found. Falling back to Application Default Credentials.
[/api/student/stats] Error: Could not load the default credentials.
```

This means the Firebase Admin credentials are not configured locally.

## Solutions

### Option 1: Using FIREBASE_ADMIN_SDK_KEY (Recommended for Local Development)

1. **Get your Firebase service account JSON:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to: **Project Settings** → **Service Accounts** → **Firebase Admin SDK**
   - Click **Generate New Private Key**
   - Download the JSON file

2. **Add to your `.env.local` file:**
   - Open `veraxon/.env.local`
   - Copy the entire JSON content from the downloaded file
   - Add it as a single-line environment variable:

```env
FIREBASE_ADMIN_SDK_KEY={"type":"service_account","project_id":"veraxon-04","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@veraxon-04.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}
```

### Option 2: Using Individual Environment Variables

If your hosting platform doesn't allow multi-line secrets, use individual variables:

```env
FIREBASE_ADMIN_PROJECT_ID=veraxon-04
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@veraxon-04.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=veraxon-04.firebasestorage.app
```

### Option 3: Application Default Credentials (For Google Cloud Deployment)

If deploying to Google Cloud Platform services (Cloud Run, Compute Engine, etc.):
- No configuration needed
- The system will automatically use ADC
- Ensure the service account has Firestore access permissions

## Verification

After setting up credentials, restart your development server:

```bash
npm run dev
```

The error should no longer appear. You should see successful API responses from `/api/student/stats` and related endpoints.

## Troubleshooting

**Issue**: Still getting credentials error
- Verify `.env.local` is in the correct location: `veraxon/.env.local`
- Check that the JSON is properly formatted (no line breaks in the middle)
- Restart the Next.js dev server
- Clear Next.js cache: `rm -rf .next`

**Issue**: "private key" contains invalid characters
- Ensure escape sequences like `\n` are preserved in the JSON string
- Don't manually add extra quotes around the key value

## Security Notes

⚠️ **Never commit `.env.local` to version control** - it contains sensitive credentials

- Add `veraxon/.env.local` to `.gitignore` (already done)
- Use environment secrets in production (Vercel, Railway, etc.)
- Rotate keys if accidentally exposed

## Related Files

- Configuration: [`veraxon/.env.example`](veraxon/.env.example)
- Admin SDK init: [`veraxon/src/lib/firebase-admin.js`](veraxon/src/lib/firebase-admin.js)
- Student stats route: [`veraxon/src/app/api/student/stats/route.js`](veraxon/src/app/api/student/stats/route.js)
