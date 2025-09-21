const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Strategy = require('../models/Strategy');
const Trade = require('../models/Trade');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all strategies for user
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isIn(['scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other']),
    query('isActive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { userId: req.user._id };
        if (req.query.category) filter.category = req.query.category;
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

        const strategies = await Strategy.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Strategy.countDocuments(filter);

        res.json({
            strategies,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get strategies error:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});

// Get single strategy
router.get('/:id', auth, async (req, res) => {
    try {
        const strategy = await Strategy.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        res.json({ strategy });
    } catch (error) {
        console.error('Get strategy error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy' });
    }
});

// Create new strategy
router.post('/', auth, [
    body('name').trim().notEmpty().withMessage('Strategy name is required'),
    body('description').optional().isString().isLength({ max: 500 }),
    body('category').optional().isIn(['scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other']),
    body('instruments').optional().isArray(),
    body('timeframes').optional().isArray(),
    body('rules.entry').optional().isString().isLength({ max: 1000 }),
    body('rules.exit').optional().isString().isLength({ max: 1000 }),
    body('rules.riskManagement').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const strategyData = {
            ...req.body,
            userId: req.user._id
        };

        const strategy = new Strategy(strategyData);
        await strategy.save();

        res.status(201).json({
            message: 'Strategy created successfully',
            strategy
        });
    } catch (error) {
        console.error('Create strategy error:', error);
        res.status(500).json({ error: 'Failed to create strategy' });
    }
});

// Update strategy
router.put('/:id', auth, [
    body('name').optional().trim().notEmpty(),
    body('description').optional().isString().isLength({ max: 500 }),
    body('category').optional().isIn(['scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other']),
    body('instruments').optional().isArray(),
    body('timeframes').optional().isArray(),
    body('rules.entry').optional().isString().isLength({ max: 1000 }),
    body('rules.exit').optional().isString().isLength({ max: 1000 }),
    body('rules.riskManagement').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isActive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const strategy = await Strategy.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const updatedStrategy = await Strategy.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Strategy updated successfully',
            strategy: updatedStrategy
        });
    } catch (error) {
        console.error('Update strategy error:', error);
        res.status(500).json({ error: 'Failed to update strategy' });
    }
});

// Delete strategy
router.delete('/:id', auth, async (req, res) => {
    try {
        const strategy = await Strategy.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Check if strategy has associated trades
        const tradeCount = await Trade.countDocuments({ strategyId: req.params.id });
        if (tradeCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete strategy with associated trades. Please reassign or delete trades first.' 
            });
        }

        await Strategy.findByIdAndDelete(req.params.id);

        res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
        console.error('Delete strategy error:', error);
        res.status(500).json({ error: 'Failed to delete strategy' });
    }
});

// Get strategy performance
router.get('/:id/performance', auth, async (req, res) => {
    try {
        const strategy = await Strategy.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        // Recalculate performance
        await strategy.calculatePerformance();

        res.json({
            strategy: {
                id: strategy._id,
                name: strategy.name,
                performance: strategy.performance
            }
        });
    } catch (error) {
        console.error('Get strategy performance error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy performance' });
    }
});

// Get strategy trades
router.get('/:id/trades', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Verify strategy belongs to user
        const strategy = await Strategy.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!strategy) {
            return res.status(404).json({ error: 'Strategy not found' });
        }

        const trades = await Trade.find({ 
            userId: req.user._id,
            strategyId: req.params.id 
        })
        .sort({ entryDate: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Trade.countDocuments({ 
            userId: req.user._id,
            strategyId: req.params.id 
        });

        res.json({
            trades,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get strategy trades error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy trades' });
    }
});

module.exports = router;
