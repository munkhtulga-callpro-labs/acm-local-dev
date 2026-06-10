# Google OAuth Fix Guide

## Current Issue
**Error**: `redirect_uri_mismatch`
**Problem**: The redirect URI in Google Cloud Console has an extra `@` symbol

## Fix Steps

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Navigate to "APIs & Services" > "Credentials"

### 2. Edit OAuth 2.0 Client ID
- Find your OAuth 2.0 Client ID: `417306030459-sffeq1ge5f1po233lgs9btu47kbq0cc6.apps.googleusercontent.com`
- Click the edit (pencil) icon

### 3. Fix Authorized Redirect URIs
**Current (WRONG):**
```
@https://acm.callpro.mn/api/auth/callback/google
```

**Should be (CORRECT):**
```
https://acm.callpro.mn/api/auth/callback/google
```

### 4. Save Changes
- Click "Save" to apply the changes
- Wait a few minutes for changes to propagate

### 5. Test Login
- Go to https://acm.callpro.mn/login
- Click "Sign in with Google"
- Complete the OAuth flow

## Additional Authorized URIs (Optional)
For development, you can also add:
```
http://localhost:3000/api/auth/callback/google
```

## Troubleshooting
If you still get errors:
1. Check that the domain `acm.callpro.mn` is verified in Google Console
2. Ensure the OAuth consent screen is properly configured
3. Verify that the Google+ API is enabled
4. Check that the client ID and secret match your .env file

## Environment Variables
Make sure your `.env` file has:
```env
GOOGLE_CLIENT_ID="417306030459-sffeq1ge5f1po233lgs9btu47kbq0cc6.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<GOOGLE_CLIENT_SECRET>"
NEXTAUTH_URL=https://acm.callpro.mn
NEXTAUTH_SECRET=your_nextauth_secret_here
```
