# Supabase Email Confirmation Configuration Guide

## Problem: Email Confirmation 404 Error

If you're getting a 404 error when clicking the email confirmation link, it's because the redirect URLs are not configured in Supabase.

## Solution: Configure Redirect URLs in Supabase

### Step 1: Access Supabase Dashboard

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Configure Site URL

The **Site URL** is the main URL of your application.

**For Development:**
- Web: `http://localhost:8081` (or your Expo dev server URL)
- You can find your exact URL by running `bun run start-web` and checking the console

**For Production:**
- Use your deployed web URL (e.g., `https://yourdomain.com`)
- Or use Rork's provided URL: `https://rork.com/`

**Setting:**
1. In the **Site URL** field, enter your main application URL
2. Click **Save**

### Step 3: Configure Redirect URLs

The **Redirect URLs** are the allowed URLs that Supabase can redirect to after email confirmation.

**You need to add ALL of these URLs:**

#### For Web Development:
```
http://localhost:8081/auth/confirm
http://localhost:19006/auth/confirm
http://localhost:3000/auth/confirm
```

#### For Production Web:
```
https://yourdomain.com/auth/confirm
https://rork.com/auth/confirm
```

#### For Native Mobile (Deep Links):
```
rork-app://auth/confirm
exp://192.168.*.*:*/--/auth/confirm
```

**Setting:**
1. In the **Redirect URLs** section, click **Add URL**
2. Add each URL one by one
3. Click **Save** after adding all URLs

### Step 4: Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm Signup** template
3. Ensure the confirmation link uses `{{ .ConfirmationURL }}`
4. The template should look like this:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

### Step 5: Verify Configuration

After configuration:

1. **Test Sign Up:**
   - Run your app: `bun run start-web`
   - Create a new account
   - Check your email
   - Click the confirmation link

2. **Check Console Logs:**
   - The app logs the redirect URL being used
   - Look for: `📧 Email redirect URL: ...`
   - Ensure this URL is in your Supabase allowed list

3. **Verify in Supabase:**
   - Go to **Authentication** → **Users**
   - Find your user
   - Check if `email_confirmed_at` is set

## Common Issues and Solutions

### Issue 1: "404 Not Found" when clicking email link

**Cause:** Redirect URL not in Supabase's allowed list

**Solution:**
1. Check the URL in the email confirmation link
2. Add that exact URL to Supabase Redirect URLs
3. Make sure there are no typos or trailing slashes

### Issue 2: "Invalid confirmation link - missing token"

**Cause:** The link doesn't contain the required parameters

**Solution:**
1. Check Supabase email templates are using `{{ .ConfirmationURL }}`
2. Don't modify the confirmation URL manually
3. Ensure email provider is properly configured

### Issue 3: Link works but still shows as unconfirmed

**Cause:** Token expired or already used

**Solution:**
1. Resend the confirmation email from the login screen
2. Click the new link within 1 hour
3. Don't click old confirmation links

### Issue 4: Different URL between environments

**Cause:** Development and production use different URLs

**Solution:**
1. Add both development and production URLs to Supabase
2. Supabase allows multiple redirect URLs
3. Use wildcards cautiously in production

## Platform-Specific Configuration

### Web (Development)
- Site URL: `http://localhost:8081`
- Redirect URLs: 
  - `http://localhost:8081/auth/confirm`
  - `http://localhost:19006/auth/confirm`

### Web (Production)
- Site URL: `https://yourdomain.com` or `https://rork.com/`
- Redirect URLs: 
  - `https://yourdomain.com/auth/confirm`
  - `https://rork.com/auth/confirm`

### Native Mobile (iOS/Android)
- Site URL: `https://rork.com/` (fallback for web)
- Redirect URLs:
  - `rork-app://auth/confirm`
  - `exp://*:*/--/auth/confirm` (for Expo Go)

### Testing with Rork App
If using Rork's hosted environment:
- Site URL: `https://rork.com/`
- Redirect URLs:
  - `https://rork.com/auth/confirm`
  - `rork-app://auth/confirm`

## Environment Variables

Ensure these are set correctly in your `.env` or Rork environment:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Testing Checklist

- [ ] Site URL configured in Supabase
- [ ] All relevant redirect URLs added to Supabase
- [ ] Email template uses `{{ .ConfirmationURL }}`
- [ ] Environment variables set correctly
- [ ] Test signup flow end-to-end
- [ ] Verify user shows as confirmed in Supabase dashboard
- [ ] Test on both web and mobile if applicable

## Additional Resources

- [Supabase Email Auth Docs](https://supabase.com/docs/guides/auth/auth-email)
- [Supabase Redirect URLs Docs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Expo Linking Docs](https://docs.expo.dev/guides/linking/)

## Still Having Issues?

If you're still experiencing problems:

1. Check the browser/app console for error messages
2. Verify the exact URL in the email link
3. Ensure the URL matches one in Supabase's redirect list
4. Try clearing your browser cache or app data
5. Test in an incognito/private window
