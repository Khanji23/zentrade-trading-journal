const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Get all strategies for a user
router.get('/', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Get strategies error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new strategy
router.post('/', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const strategyData = {
            ...req.body,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('strategies')
            .insert([strategyData])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Create strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a strategy
router.put('/:id', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('strategies')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Update strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a strategy
router.delete('/:id', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', user.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
        console.error('Delete strategy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
