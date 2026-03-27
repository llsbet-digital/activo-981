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

## 4. Configure Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. **Email** provider should be enabled by default
3. Optional: Configure email templates under **Authentication** > **Email Templates**
4. Optional: For production, disable email confirmation under **Authentication** > **Settings** > **Email Auth**

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
- For development, check **Authentication** > **Users** to see if user was created
- For production, configure email provider in Supabase settings
