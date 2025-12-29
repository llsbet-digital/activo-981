# Debug Signup Issues - Step by Step

## Current Issue
- New signups aren't appearing in the database
- Confirmation emails not being received

## Step 1: Check if Users ARE Being Created

1. **Go to your Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Look for your test email addresses

### What you might see:

#### ✅ **User EXISTS but not confirmed**
- Email appears in the list
- Shows "Waiting for verification" or similar
- **Problem**: Email confirmation is blocking login
- **Solution**: See Step 2

#### ❌ **User DOESN'T EXIST**
- Email not in the list at all
- **Problem**: Signup is failing at Supabase level
- **Solution**: See Step 3

## Step 2: Fix Email Confirmation (RECOMMENDED FOR TESTING)

### Option A: Disable Email Confirmation (Quick Fix)

1. Go to **Authentication** → **Providers** → **Email**
2. **Turn OFF** "Confirm email" toggle
3. Click **Save**
4. Try signing up again with a NEW email

**This allows immediate login without email confirmation**

### Option B: Manually Confirm Email (For Existing Users)

1. Go to **Authentication** → **Users**
2. Find your test user
3. Click on the user
4. Click **"Confirm email"** button
5. Now try logging in

### Option C: Check Email Settings

If you want to keep email confirmation enabled:

1. **Check Spam Folder** - Supabase emails often go to spam
2. **Rate Limits** - Supabase's default email service limits:
   - Max 4 emails per hour to same address
   - Max 30 emails per hour total
3. **Try Different Email** - Use a fresh email address
4. **Configure Custom SMTP** (Production):
   - Go to **Project Settings** → **Auth**
   - Enable custom SMTP with Gmail/SendGrid/Mailgun

## Step 3: Verify Supabase Configuration

### Check Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Verify **Site URL** is set (any value works for testing, e.g., `http://localhost:8081`)
3. Add these **Redirect URLs**:
   ```
   rork-app://auth/confirm
   exp://localhost:8081
   http://localhost:8081
   ```

### Check Email Template

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Verify the template exists and contains `{{ .TokenHash }}`

## Step 4: Verify Database Schema

Check if tables exist:

1. Go to **Table Editor** in Supabase
2. Verify these tables exist:
   - `profiles`
   - `activities`
   - `training_plans`
   - `progress_metrics`

If tables are missing:
1. Go to **SQL Editor**
2. Run the contents of `supabase-schema.sql`
3. Then run `supabase-auto-profile.sql`

## Step 5: Test Signup Flow

Now try signing up with detailed logging:

1. Open your app
2. Open browser console (web) or React Native debugger
3. Try signing up with a NEW email
4. Look for these console messages:

```
📝 Attempting to sign up user: [email]
🔧 Using Supabase URL: [your-url]
✅ Sign up successful!
👤 User ID: [uuid]
📧 Email: [email]
✉️ Email confirmed: ✗ Needs confirmation OR ✓
👤 User identities: 1
🔐 Session: No session (email confirmation required) OR Created
```

### What the logs tell you:

**If you see "✅ Sign up successful!"**
- User WAS created in Supabase
- Check Authentication → Users to confirm
- Problem is likely with email confirmation

**If you see "❌ Sign up error"**
- Check the error message
- Common errors:
  - "User already registered" - Try different email
  - "Invalid email" - Check email format
  - Network error - Check Supabase URL/key

## Step 6: Check Auto-Profile Trigger

The app expects a profile to be auto-created when a user signs up.

1. Go to **SQL Editor**
2. Run this query:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

If nothing is returned, the trigger isn't installed:
1. Go to **SQL Editor**
2. Copy and paste contents of `supabase-auto-profile.sql`
3. Click **Run**

## Quick Test Checklist

- [ ] Supabase URL and Key are correct in console logs
- [ ] User appears in Authentication → Users (even if unconfirmed)
- [ ] Email confirmation is DISABLED for testing
- [ ] Tables exist in database
- [ ] Auto-profile trigger is installed
- [ ] Trying with a fresh email address

## Still Not Working?

If after all these steps signup still fails:

1. **Share the exact console logs** from signup attempt
2. **Check Supabase Logs**:
   - Go to **Logs** → **Auth Logs**
   - Look for signup attempts and any errors
3. **Verify environment variables are loaded**:
   - The console should show "✓ Set" for URL and Key
   - If "✗ Missing", your .env isn't loading

## Most Common Solutions

**90% of signup issues are solved by:**
1. Disabling email confirmation in Supabase (for testing)
2. Waiting 1 hour if you hit rate limits
3. Using a fresh email address
4. Manually confirming email in Supabase dashboard
