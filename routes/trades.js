const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Get all trades for a user
router.get('/', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Get trades error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new trade
router.post('/', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const tradeData = {
            ...req.body,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('trades')
            .insert([tradeData])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Create trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a trade
router.put('/:id', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('trades')
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
        console.error('Update trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a trade
router.delete('/:id', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('trades')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', user.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Trade deleted successfully' });
    } catch (error) {
        console.error('Delete trade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
