const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Trade = require('../models/Trade');
const Strategy = require('../models/Strategy');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all trades for user
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('strategyId').optional().isMongoId(),
    query('instrument').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
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
        if (req.query.strategyId) filter.strategyId = req.query.strategyId;
        if (req.query.instrument) filter.instrument = new RegExp(req.query.instrument, 'i');
        if (req.query.startDate || req.query.endDate) {
            filter.entryDate = {};
            if (req.query.startDate) filter.entryDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) filter.entryDate.$lte = new Date(req.query.endDate);
        }

        const trades = await Trade.find(filter)
            .populate('strategyId', 'name category')
            .sort({ entryDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Trade.countDocuments(filter);

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
        console.error('Get trades error:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});

// Get single trade
router.get('/:id', auth, async (req, res) => {
    try {
        const trade = await Trade.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        }).populate('strategyId', 'name category');

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        res.json({ trade });
    } catch (error) {
        console.error('Get trade error:', error);
        res.status(500).json({ error: 'Failed to fetch trade' });
    }
});

// Create new trade
router.post('/', auth, [
    body('instrument').trim().notEmpty().withMessage('Instrument is required'),
    body('side').isIn(['long', 'short']).withMessage('Side must be long or short'),
    body('entryPrice').isFloat({ min: 0 }).withMessage('Entry price must be a positive number'),
    body('exitPrice').isFloat({ min: 0 }).withMessage('Exit price must be a positive number'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('entryDate').isISO8601().withMessage('Entry date must be a valid date'),
    body('exitDate').isISO8601().withMessage('Exit date must be a valid date'),
    body('fees').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('strategyId').optional().isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const tradeData = {
            ...req.body,
            userId: req.user._id
        };

        // Validate strategy belongs to user
        if (req.body.strategyId) {
            const strategy = await Strategy.findOne({ 
                _id: req.body.strategyId, 
                userId: req.user._id 
            });
            if (!strategy) {
                return res.status(400).json({ error: 'Strategy not found' });
            }
        }

        const trade = new Trade(tradeData);
        await trade.save();

        // Update strategy performance if applicable
        if (trade.strategyId) {
            const strategy = await Strategy.findById(trade.strategyId);
            await strategy.calculatePerformance();
        }

        res.status(201).json({
            message: 'Trade created successfully',
            trade
        });
    } catch (error) {
        console.error('Create trade error:', error);
        res.status(500).json({ error: 'Failed to create trade' });
    }
});

// Update trade
router.put('/:id', auth, [
    body('instrument').optional().trim().notEmpty(),
    body('side').optional().isIn(['long', 'short']),
    body('entryPrice').optional().isFloat({ min: 0 }),
    body('exitPrice').optional().isFloat({ min: 0 }),
    body('quantity').optional().isFloat({ min: 0 }),
    body('entryDate').optional().isISO8601(),
    body('exitDate').optional().isISO8601(),
    body('fees').optional().isFloat({ min: 0 }),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('strategyId').optional().isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const trade = await Trade.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        // Validate strategy belongs to user
        if (req.body.strategyId) {
            const strategy = await Strategy.findOne({ 
                _id: req.body.strategyId, 
                userId: req.user._id 
            });
            if (!strategy) {
                return res.status(400).json({ error: 'Strategy not found' });
            }
        }

        const updatedTrade = await Trade.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Update strategy performance if applicable
        if (updatedTrade.strategyId) {
            const strategy = await Strategy.findById(updatedTrade.strategyId);
            await strategy.calculatePerformance();
        }

        res.json({
            message: 'Trade updated successfully',
            trade: updatedTrade
        });
    } catch (error) {
        console.error('Update trade error:', error);
        res.status(500).json({ error: 'Failed to update trade' });
    }
});

// Delete trade
router.delete('/:id', auth, async (req, res) => {
    try {
        const trade = await Trade.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!trade) {
            return res.status(404).json({ error: 'Trade not found' });
        }

        const strategyId = trade.strategyId;
        await Trade.findByIdAndDelete(req.params.id);

        // Update strategy performance if applicable
        if (strategyId) {
            const strategy = await Strategy.findById(strategyId);
            await strategy.calculatePerformance();
        }

        res.json({ message: 'Trade deleted successfully' });
    } catch (error) {
        console.error('Delete trade error:', error);
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});

// Get trade statistics
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const trades = await Trade.find({ userId: req.user._id });
        
        if (trades.length === 0) {
            return res.json({
                totalTrades: 0,
                totalPnl: 0,
                winRate: 0,
                profitFactor: 0,
                averageWin: 0,
                averageLoss: 0,
                bestTrade: 0,
                worstTrade: 0
            });
        }

        const winningTrades = trades.filter(trade => trade.pnl > 0);
        const losingTrades = trades.filter(trade => trade.pnl < 0);
        
        const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
        const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
        
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
        const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
        const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        const bestTrade = trades.length > 0 ? Math.max(...trades.map(trade => trade.pnl)) : 0;
        const worstTrade = trades.length > 0 ? Math.min(...trades.map(trade => trade.pnl)) : 0;

        res.json({
            totalTrades: trades.length,
            totalPnl,
            winRate,
            profitFactor,
            averageWin,
            averageLoss,
            bestTrade,
            worstTrade
        });
    } catch (error) {
        console.error('Get trade stats error:', error);
        res.status(500).json({ error: 'Failed to fetch trade statistics' });
    }
});

module.exports = router;
