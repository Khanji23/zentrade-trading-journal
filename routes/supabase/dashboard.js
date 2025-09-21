const express = require('express');
const Trade = require('../../models/supabase/Trade');
const Strategy = require('../../models/supabase/Strategy');
const User = require('../../models/supabase/User');
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

// Get dashboard overview
router.get('/overview', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get trade statistics
        const tradeStats = await Trade.getStats(userId);
        
        // Get recent trades (last 10)
        const recentTrades = await Trade.findByUserId(userId, { page: 1, limit: 10 });
        
        // Get strategies
        const strategies = await Strategy.findByUserId(userId, { page: 1, limit: 10 });
        
        // Get daily P&L for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const dailyPnl = await Trade.getDailyPnl(
            userId, 
            startDate.toISOString(), 
            endDate.toISOString()
        );
        
        // Get user subscription info
        const user = await User.findById(userId);
        
        res.json({
            overview: {
                totalPnl: tradeStats.totalPnl,
                totalTrades: tradeStats.totalTrades,
                winRate: tradeStats.winRate,
                profitFactor: tradeStats.profitFactor,
                averageWin: tradeStats.averageWin,
                averageLoss: tradeStats.averageLoss,
                bestTrade: tradeStats.bestTrade,
                worstTrade: tradeStats.worstTrade
            },
            recentTrades: recentTrades.map(trade => ({
                id: trade.id,
                instrument: trade.instrument,
                side: trade.side,
                entryPrice: trade.entry_price,
                exitPrice: trade.exit_price,
                quantity: trade.quantity,
                pnl: trade.pnl,
                pnlPercentage: trade.pnl_percentage,
                entryDate: trade.entry_date,
                exitDate: trade.exit_date,
                strategy: trade.strategies ? {
                    id: trade.strategies.id,
                    name: trade.strategies.name,
                    category: trade.strategies.category
                } : null,
                notes: trade.notes,
                tags: trade.tags
            })),
            strategies: strategies.map(strategy => ({
                id: strategy.id,
                name: strategy.name,
                description: strategy.description,
                category: strategy.category,
                performance: strategy.performance,
                isActive: strategy.is_active,
                createdAt: strategy.created_at
            })),
            dailyPnl,
            subscription: {
                plan: user.subscription_plan,
                isActive: user.subscription_active,
                endDate: user.subscription_end_date
            }
        });
    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get performance metrics
router.get('/performance', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30d' } = req.query;
        
        let startDate, endDate;
        endDate = new Date();
        
        switch (period) {
            case '7d':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1y':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
        }
        
        const dailyPnl = await Trade.getDailyPnl(
            userId, 
            startDate.toISOString(), 
            endDate.toISOString()
        );
        
        // Calculate cumulative P&L
        const dates = Object.keys(dailyPnl).sort();
        let cumulativePnl = 0;
        const cumulativeData = dates.map(date => {
            cumulativePnl += dailyPnl[date];
            return {
                date,
                dailyPnl: dailyPnl[date],
                cumulativePnl
            };
        });
        
        res.json({
            period,
            dailyPnl,
            cumulativeData,
            totalPnl: cumulativePnl
        });
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
});

// Get strategy performance
router.get('/strategies/performance', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const strategies = await Strategy.findByUserId(userId, { isActive: true });
        
        const strategyPerformance = await Promise.all(
            strategies.map(async (strategy) => {
                const performance = await Strategy.calculatePerformance(strategy.id);
                return {
                    id: strategy.id,
                    name: strategy.name,
                    category: strategy.category,
                    ...performance
                };
            })
        );
        
        res.json(strategyPerformance);
    } catch (error) {
        console.error('Get strategy performance error:', error);
        res.status(500).json({ error: 'Failed to fetch strategy performance' });
    }
});

module.exports = router;
