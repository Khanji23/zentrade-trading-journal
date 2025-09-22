const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                },
            },
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ 
            message: 'User created successfully. Please check your email for verification.',
            user: data.user 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign in
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ 
            message: 'Sign in successful',
            user: data.user,
            session: data.session 
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign out
router.post('/signout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Sign out successful' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/user', async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
