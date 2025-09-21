const express = require('express');
const { body, validationResult } = require('express-validator');
const Trade = require('../../models/supabase/Trade');
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

// Get all trades for user
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, strategyId, instrument, startDate, endDate } = req.query;
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            strategyId,
            instrument,
            startDate,
            endDate
        };

        const trades = await Trade.findByUserId(req.user.id, options);
        res.json(trades);
    } catch (error) {
        console.error('Get trades error:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});

// Get single trade
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);
        
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check if trade belongs to user
        if (trade.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(trade);
    } catch (error) {
        console.error('Get trade error:', error);
        res.status(500).json({ error: 'Failed to fetch trade' });
    }
});

// Create new trade
router.post('/', verifyToken, [
    body('instrument').trim().notEmpty().withMessage('Instrument is required'),
    body('side').isIn(['long', 'short']).withMessage('Side must be long or short'),
    body('entryPrice').isDecimal().withMessage('Entry price must be a valid number'),
    body('exitPrice').isDecimal().withMessage('Exit price must be a valid number'),
    body('quantity').isDecimal().withMessage('Quantity must be a valid number'),
    body('entryDate').isISO8601().withMessage('Entry date must be valid'),
    body('exitDate').isISO8601().withMessage('Exit date must be valid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const tradeData = {
            ...req.body,
            user_id: req.user.id
        };

        const trade = await Trade.create(tradeData);
        res.status(201).json(trade);
    } catch (error) {
        console.error('Create trade error:', error);
        res.status(500).json({ error: 'Failed to create trade' });
    }
});

// Update trade
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);
        
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check if trade belongs to user
        if (trade.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedTrade = await Trade.update(req.params.id, req.body);
        res.json(updatedTrade);
    } catch (error) {
        console.error('Update trade error:', error);
        res.status(500).json({ error: 'Failed to update trade' });
    }
});

// Delete trade
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);
        
        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Check if trade belongs to user
        if (trade.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Trade.delete(req.params.id);
        res.json({ message: 'Trade deleted successfully' });
    } catch (error) {
        console.error('Delete trade error:', error);
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});

// Get trade statistics
router.get('/stats/overview', verifyToken, async (req, res) => {
    try {
        const stats = await Trade.getStats(req.user.id);
        res.json(stats);
    } catch (error) {
        console.error('Get trade stats error:', error);
        res.status(500).json({ error: 'Failed to fetch trade statistics' });
    }
});

module.exports = router;
