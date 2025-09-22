# Supabase Setup for ZenTrade Trading Journal

## 🚀 **Quick Setup Guide**

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up/Login with GitHub
4. Click **"New Project"**
5. Choose your organization
6. Enter project details:
   - **Name**: `zentrade-trading-journal`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
7. Click **"Create new project"**
8. Wait for project to be ready (2-3 minutes)

### **Step 2: Get Your Project Credentials**

1. Go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Update your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### **Step 3: Set Up Database Schema**

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click **"Run"** to execute the schema

### **Step 4: Configure Authentication**

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:8000`
3. Under **Redirect URLs**, add: `http://localhost:8000`
4. Enable **Email** provider
5. (Optional) Enable **Google** or **GitHub** providers

### **Step 5: Update Your App**

1. Open `js/auth.js`
2. Replace `YOUR_SUPABASE_URL` with your actual Supabase URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key

### **Step 6: Test Authentication**

1. Start your server: `npm run dev`
2. Open `http://localhost:8000`
3. Try signing up with a new account
4. Check your email for confirmation link
5. Sign in and test the trading journal features

## 🔧 **Features Included**

- ✅ **User Registration & Login**
- ✅ **Email Verification**
- ✅ **Password Reset**
- ✅ **User Profiles**
- ✅ **Trade Management**
- ✅ **Strategy Management**
- ✅ **Dashboard Analytics**
- ✅ **Row Level Security (RLS)**
- ✅ **Real-time Updates**

## 🛡️ **Security Features**

- **Row Level Security**: Users can only access their own data
- **Email Verification**: Required for new accounts
- **Secure Authentication**: JWT tokens with expiration
- **CORS Protection**: Configured for your domain
- **Rate Limiting**: Prevents abuse

## 📊 **Database Tables**

- **profiles**: User profile information
- **trades**: Individual trade records
- **strategies**: Trading strategies
- **auth.users**: Supabase managed user accounts

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Invalid API key"**
   - Check your `.env` file has correct credentials
   - Verify the anon key is correct

2. **"CORS error"**
   - Add your domain to Supabase CORS settings
   - Check your site URL configuration

3. **"User not found"**
   - Make sure email verification is completed
   - Check if user exists in Supabase dashboard

4. **"Permission denied"**
   - Verify RLS policies are set up correctly
   - Check if user is authenticated

### **Need Help?**

- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Join Discord: [discord.supabase.com](https://discord.supabase.com)
- GitHub Issues: Create an issue in your repo

---

**ZenTrade** - Professional Trading Journal with Supabase
