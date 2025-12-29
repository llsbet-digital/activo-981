# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: fitness-app (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (takes ~2 minutes)

## 2. Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** section
3. Copy these values:
   - **Project URL**: This is your `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key**: This is your `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (in sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` file in this project
4. Paste it into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

This will create:
- **profiles** table: User profile information and fitness goals
- **activities** table: User activities with details
- **training_plans** table: Personalized training plans
- **progress_metrics** table: Historical data and achievements
- Row Level Security (RLS) policies for data protection
- Indexes for optimal query performance
- Auto-update triggers for timestamp fields

## 4. Configure Authentication (CRITICAL)

### Email Provider Settings

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Click on **Email** provider
3. Make sure these settings are configured:
   - ✅ **Enable Email provider** is ON
   - ✅ **Confirm email** - Choose your preference:
     - **Development**: Turn OFF to skip email confirmation (faster testing)
     - **Production**: Turn ON for security
   - ✅ **Secure email change** - ON (recommended)

### Site URL Configuration (IMPORTANT)

1. Go to **Authentication** > **URL Configuration**
2. Set your **Site URL**:
   - For development: `exp://localhost:8081` or your Expo dev URL
   - For production: Your actual app URL
3. Add **Redirect URLs** (one per line):
   ```
   rork-app://auth/confirm
   rork-app://auth/reset
   exp://localhost:8081
   http://localhost:8081
   ```

### Email Templates

1. Go to **Authentication** > **Email Templates**
2. Review the **Confirm signup** template
3. The confirmation link should use: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

### Rate Limits (Development)

Supabase's default email service has rate limits:
- Max 4 emails per hour to the same address
- Max 30 emails per hour total

**For testing, you can:**
- Disable email confirmation temporarily (see above)
- Use different email addresses
- Wait between tests
- Configure custom SMTP (see below)

### Custom SMTP (Production)

For production or heavy testing:

1. Go to **Project Settings** > **Auth**
2. Scroll to **SMTP Settings**
3. Enable custom SMTP and configure with your email provider:
   - Gmail, SendGrid, Mailgun, AWS SES, etc.
   - This removes rate limits and improves deliverability

## 5. Add Environment Variables

Create a `.env` file in your project root with your credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Schema Overview

### Tables

#### **profiles**
- Stores user profile information
- Fields: name, goal, weekly_target, preferred_activities, level
- One-to-one relationship with auth.users

#### **activities**
- Stores all user activities
- Fields: type, title, date, duration, distance, calories, notes, workout_link, completed
- One-to-many relationship with users

#### **training_plans**
- Stores personalized training plans
- Fields: name, description, goal, duration_weeks, difficulty, activities_per_week, is_active
- One-to-many relationship with users
- Only one active plan per user at a time

#### **progress_metrics**
- Stores daily aggregated metrics
- Fields: date, total_activities, total_duration, total_distance, total_calories, activities_completed, streak_days
- Used for analytics and progress tracking

## CRUD Operations Available

### Profile Service
- `getProfile(userId)`: Fetch user profile
- `createProfile(userId, profile)`: Create new profile
- `updateProfile(userId, updates)`: Update profile

### Activity Service
- `getActivities(userId)`: Fetch all activities
- `createActivity(userId, activity)`: Add new activity
- `updateActivity(userId, activityId, updates)`: Update activity
- `deleteActivity(userId, activityId)`: Delete activity

### Training Plan Service
- `getTrainingPlans(userId)`: Fetch all training plans
- `getActiveTrainingPlan(userId)`: Fetch active plan
- `createTrainingPlan(userId, plan)`: Create new plan
- `updateTrainingPlan(userId, planId, updates)`: Update plan
- `deleteTrainingPlan(userId, planId)`: Delete plan

### Progress Metric Service
- `getProgressMetrics(userId, startDate?, endDate?)`: Fetch metrics
- `upsertProgressMetric(userId, metric)`: Create/update metric

## User Journey

1. **Registration**: User signs up with email/password → Creates auth.users entry
2. **Onboarding**: User completes profile → Creates profiles entry
3. **Add Activities**: User adds workouts → Creates activities entries
4. **View Progress**: App aggregates data → Reads from activities and progress_metrics
5. **Training Plans**: User creates/follows plans → Creates/updates training_plans entries

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- Policies ensure data isolation between users
- Authentication required for all operations
- Supabase handles password hashing and session management

## Testing the Setup

1. Start your app: `npm start`
2. Register a new account
3. Complete onboarding
4. Add an activity
5. Check Supabase dashboard → **Table Editor** to see your data

## Troubleshooting

### "Failed to fetch"
- Verify your Supabase URL and anon key are correct
- Check if your Supabase project is active

### "Row level security policy violation"
- Ensure you're authenticated before accessing data
- Check if RLS policies were created correctly

### "Relation does not exist"
- Make sure you ran the SQL schema in Supabase
- Verify all tables were created in the public schema

### Email not sending

**Quick fix for development:**
1. Go to **Authentication** > **Providers** > **Email**
2. Turn OFF "Confirm email" setting
3. This allows immediate login without email confirmation
4. User will be created and can sign in right away

**Check if user was created:**
1. Go to **Authentication** > **Users** in Supabase
2. If user exists but emails aren't sending:
   - Check your spam folder
   - You may have hit rate limits (max 4 emails/hour per address)
   - Try a different email address
   - Configure custom SMTP

**Verify email manually (development workaround):**
1. Go to **Authentication** > **Users**
2. Find your user
3. Click the user
4. Manually confirm the email by clicking the "Confirm email" button

**For production:**
- Configure custom SMTP in **Project Settings** > **Auth**
- Use SendGrid, Mailgun, or AWS SES for reliable email delivery
- Set proper Site URL and Redirect URLs
