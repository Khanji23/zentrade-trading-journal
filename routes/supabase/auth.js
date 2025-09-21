const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../../supabase');
const User = require('../../models/supabase/User');

const router = express.Router();

// Register
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName } = req.body;

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        // Create user profile in our users table
        const userData = {
            id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            subscription_plan: 'starter',
            subscription_active: true
        };

        const user = await User.create(userData);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                subscription: {
                    plan: user.subscription_plan,
                    isActive: user.subscription_active
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user profile
        const user = await User.findById(authData.user.id);
        
        // Update last login
        await User.update(user.id, { last_login: new Date() });

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                subscription: {
                    plan: user.subscription_plan,
                    isActive: user.subscription_active
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get user profile
        const userProfile = await User.findById(user.id);

        res.json({
            user: {
                id: userProfile.id,
                email: userProfile.email,
                firstName: userProfile.first_name,
                lastName: userProfile.last_name,
                subscription: {
                    plan: userProfile.subscription_plan,
                    isActive: userProfile.subscription_active
                },
                preferences: userProfile.preferences,
                isEmailVerified: userProfile.is_email_verified,
                lastLogin: userProfile.last_login
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return res.status(500).json({ error: 'Logout failed' });
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;
