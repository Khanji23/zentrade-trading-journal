const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://zbjzikbyueozzyhihnmy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpianppa2J5dWVvenp5aGlobm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODA2MTcsImV4cCI6MjA3NDA1NjYxN30.nlqrga4Lv23kc_FZoTr60JXXf6Q_GveWhRrYcYsxGto';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
