const express = require('express');
const { body, validationResult } = require('express-validator');
const Strategy = require('../../models/supabase/Strategy');
const supabase = require('../../supabase');

const router = express.Router();

// Middleware to verify Supabase JWT
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token verification failed' });
    }
};

// Get all strategies for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, category, isActive } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
        };

        const strategies = await Strategy.findByUserId(req.user.id, options);
        res.json(strategies);
    } catch (error) {
        console.error('Get strategies error:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Get single strategy
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy belongs to user
        if (strategy.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(strategy);
    } catch (error) {
        console.error('Get strategy error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy' });
    }
});

// Create new strategy
router.post('/', verifyToken, [
    body('name').trim().notEmpty().withMessage('Strategy name is required'),
    body('description').optional().trim(),
    body('category').optional().isIn(['scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other']),
    body('instruments').optional().isArray(),
    body('timeframes').optional().isArray(),
    body('rules').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const strategyData = {
            ...req.body,
            user_id: req.user.id
        };

        const strategy = await Strategy.create(strategyData);
        res.status(201).json(strategy);
    } catch (error) {
        console.error('Create strategy error:', error);
        res.status(500).json({ error: 'Failed to create strategy' });
    }
});

// Update strategy
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy belongs to user
        if (strategy.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedStrategy = await Strategy.update(req.params.id, req.body);
        res.json(updatedStrategy);
    } catch (error) {
        console.error('Update strategy error:', error);
        res.status(500).json({ error: 'Failed to update strategy' });
    }
});

// Delete strategy
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy belongs to user
        if (strategy.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Strategy.delete(req.params.id);
        res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
        console.error('Delete strategy error:', error);
        res.status(500).json({ error: 'Failed to delete strategy' });
    }
});

// Get strategy performance
router.get('/:id/performance', verifyToken, async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy belongs to user
        if (strategy.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const performance = await Strategy.calculatePerformance(req.params.id);
        res.json(performance);
    } catch (error) {
        console.error('Get strategy performance error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy performance' });
    }
});

// Get strategy trades
router.get('/:id/trades', verifyToken, async (req, res) => {
    try {
        const strategy = await Strategy.findById(req.params.id);
        
        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy belongs to user
        if (strategy.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { page = 1, limit = 50 } = req.query;
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const trades = await Strategy.getTrades(req.params.id, options);
        res.json(trades);
    } catch (error) {
        console.error('Get strategy trades error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy trades' });
    }
});

module.exports = router;
