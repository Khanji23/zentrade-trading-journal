const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const supabase = require('./supabase');
const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');
const strategyRoutes = require('./routes/strategies');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware with relaxed CSP for development
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com/@supabase/supabase-js@2"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Supabase connection check
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('❌ Supabase connection error:', error.message);
    } else {
        console.log('✅ Connected to Supabase');
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve the main application - Landing page as default
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(__dirname + '/index.html');
});

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/dashboard.html');
});

// Serve static files (after routes to avoid conflicts)
app.use(express.static('.'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 ZenTrade Journal server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/index.html`);
    console.log(`🌐 Landing: http://localhost:${PORT}/landing.html`);
});