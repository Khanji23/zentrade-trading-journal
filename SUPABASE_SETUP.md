# Supabase Setup Guide

## 🚀 **Quick Setup Steps**

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Choose organization and enter project details:
   - **Name**: `zentrade-journal`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### **2. Get Your Credentials**
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

### **3. Update Environment Variables**
Edit your `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **4. Set Up Database Schema**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables and policies

### **5. Configure Authentication**
1. Go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Configure **Site URL**: `http://localhost:8000`
4. Add **Redirect URLs**: `http://localhost:8000/auth-modal.html`

### **6. Test Your Setup**
1. Restart your server: `npm run dev`
2. Go to `http://localhost:8000`
3. Try registering a new account
4. Check Supabase dashboard to see the data

## 🔧 **Features You Get with Supabase**

### **✅ Built-in Authentication**
- Email/password login
- JWT tokens
- User management
- Password reset

### **✅ Real-time Database**
- PostgreSQL database
- Real-time subscriptions
- Row Level Security (RLS)
- Automatic API generation

### **✅ Dashboard & Analytics**
- Built-in dashboard
- Database browser
- Query editor
- Performance monitoring

### **✅ Security**
- Row Level Security policies
- API rate limiting
- Secure by default
- GDPR compliant

## 📊 **Database Schema**

### **Users Table**
- User profiles and preferences
- Subscription management
- Authentication data

### **Trades Table**
- Trade entries and exits
- P&L calculations
- Strategy associations
- Performance metrics

### **Strategies Table**
- Trading strategies
- Performance tracking
- Rules and parameters
- Category management

## 🚀 **Deployment Ready**

Supabase makes deployment easy:
1. **Frontend**: Deploy to Vercel/Netlify
2. **Database**: Already hosted on Supabase
3. **Authentication**: Built-in and secure
4. **API**: Auto-generated and documented

## 🔍 **Troubleshooting**

### **Common Issues:**
1. **"Invalid API key"** → Check your `.env` file
2. **"User not found"** → Run the database schema
3. **"Permission denied"** → Check RLS policies
4. **"Connection failed"** → Verify Supabase URL

### **Need Help?**
- Check Supabase docs: [docs.supabase.com](https://docs.supabase.com)
- Join Discord: [discord.supabase.com](https://discord.supabase.com)
- GitHub Issues: [github.com/supabase/supabase](https://github.com/supabase/supabase)

## 🎉 **You're All Set!**

Your trading journal now has:
- ✅ Professional database
- ✅ Secure authentication
- ✅ Real-time capabilities
- ✅ Easy deployment
- ✅ Built-in dashboard

Happy trading! 📈
