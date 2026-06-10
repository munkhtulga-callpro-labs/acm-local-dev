# Google SSO Setup Guide

## Prerequisites
1. Google Cloud Console account
2. Domain verification (callpro.mn)
3. OAuth 2.0 credentials

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (if needed)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "CallPro Access Control" or similar

### 1.2 Enable Google+ API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" API

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "CallPro Access Control"
5. Authorized JavaScript origins:
   - `https://acm.callpro.mn`
   - `http://localhost:3000` (for development)
6. Authorized redirect URIs:
   - `https://acm.callpro.mn/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### 1.4 Configure OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Choose "External" user type
3. Fill in application information:
   - App name: "CallPro Access Control Management"
   - User support email: `admin@callpro.mn`
   - Developer contact: `admin@callpro.mn`
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (optional for development):
   - `admin@callpro.mn`
   - `hr@callpro.mn`
   - `it@callpro.mn`

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=https://acm.callpro.mn
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Step 3: Update NextAuth Configuration

The system already has Google provider configured in `src/lib/auth.ts`. You just need to:

1. Add the environment variables
2. Restart the application

## Step 4: Database Schema Updates

The system already supports Google SSO with the existing schema. No changes needed.

## Step 5: Testing

### 5.1 Development Testing
1. Start the application: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Complete OAuth flow

### 5.2 Production Testing
1. Deploy to production
2. Go to `https://acm.callpro.mn/login`
3. Test Google SSO login
4. Verify user creation in database

## Step 6: User Management

### 6.1 First-Time Google Users
- System will automatically create user accounts
- Default role: `EMPLOYEE`
- Admin can change roles in the system

### 6.2 Existing Users
- Users with existing email/password can still login
- Google SSO users will be linked to existing accounts by email

## Step 7: Security Considerations

### 7.1 Domain Restrictions
- Configure Google OAuth to only allow `@callpro.mn` domains
- Add domain verification in Google Console

### 7.2 User Provisioning
- Set up automatic role assignment based on Google groups
- Configure user deprovisioning when Google account is disabled

## Step 8: Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Check that redirect URIs in Google Console match exactly
   - Ensure no trailing slashes

2. **"access_denied"**
   - Check OAuth consent screen configuration
   - Verify domain verification

3. **"invalid_client"**
   - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Check that credentials are for the correct project

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test with Google OAuth Playground
4. Check NextAuth debug logs

## Step 9: Production Deployment

### 9.1 SSL Certificate
- Ensure SSL is properly configured
- Google OAuth requires HTTPS in production

### 9.2 Domain Verification
- Verify `callpro.mn` domain in Google Console
- Add domain to authorized domains

### 9.3 Monitoring
- Set up logging for OAuth events
- Monitor failed login attempts
- Track user provisioning/deprovisioning

## Step 10: Advanced Configuration

### 10.1 Google Workspace Integration
- Configure Google Workspace for organization
- Set up group-based role assignment
- Enable automatic user provisioning

### 10.2 Multi-Domain Support
- Configure multiple domains if needed
- Set up domain-specific role assignments

## Support

For issues with this setup:
1. Check Google Cloud Console logs
2. Review NextAuth documentation
3. Contact system administrator

## Environment Variables Template

```env
# Database
DATABASE_URL="postgresql://access_control:password123@localhost:5433/access_control"

# NextAuth
NEXTAUTH_URL=https://acm.callpro.mn
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# SMTP Configuration
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=465
SMTP_USERNAME=<AWS_ACCESS_KEY_ID>
SMTP_PASSWORD=<AWS_SECRET_ACCESS_KEY>
SMTP_FROM=acm@callpro.mn
SMTP_FROM_NAME="Access Control Management"
```
