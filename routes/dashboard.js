const express = require('express');
const { query } = require('express-validator');
const Trade = require('../models/Trade');
const Strategy = require('../models/Strategy');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
    try {
        const trades = await Trade.find({ userId: req.user._id });
        const strategies = await Strategy.find({ userId: req.user._id, isActive: true });

        // Calculate basic metrics
        const totalTrades = trades.length;
        const winningTrades = trades.filter(trade => trade.pnl > 0);
        const losingTrades = trades.filter(trade => trade.pnl < 0);
        
        const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
        const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
        
        const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

        // Calculate daily P&L for calendar
        const dailyPnl = {};
        trades.forEach(trade => {
            const date = trade.exitDate.toISOString().split('T')[0];
            if (!dailyPnl[date]) {
                dailyPnl[date] = 0;
            }
            dailyPnl[date] += trade.pnl;
        });

        // Get recent trades
        const recentTrades = trades
            .sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate))
            .slice(0, 5);

        res.json({
            metrics: {
                totalPnl,
                totalTrades,
                winRate,
                profitFactor,
                averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
                averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
                bestTrade: trades.length > 0 ? Math.max(...trades.map(trade => trade.pnl)) : 0,
                worstTrade: trades.length > 0 ? Math.min(...trades.map(trade => trade.pnl)) : 0
            },
            dailyPnl,
            recentTrades: recentTrades.map(trade => ({
                id: trade._id,
                instrument: trade.instrument,
                side: trade.side,
                pnl: trade.pnl,
                exitDate: trade.exitDate
            })),
            strategies: strategies.map(strategy => ({
                id: strategy._id,
                name: strategy.name,
                category: strategy.category,
                performance: strategy.performance
            }))
        });
    } catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get equity curve data
router.get('/equity-curve', auth, [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('period').optional().isIn(['daily', 'weekly', 'monthly'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const period = req.query.period || 'daily';

        // Get trades in date range
        const trades = await Trade.find({
            userId: req.user._id,
            exitDate: { $gte: startDate, $lte: endDate }
        }).sort({ exitDate: 1 });

        // Group by period
        const equityData = {};
        let cumulativePnl = 0;

        trades.forEach(trade => {
            let dateKey;
            const tradeDate = new Date(trade.exitDate);
            
            switch (period) {
                case 'daily':
                    dateKey = tradeDate.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(tradeDate);
                    weekStart.setDate(tradeDate.getDate() - tradeDate.getDay());
                    dateKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    dateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
                    break;
            }

            if (!equityData[dateKey]) {
                equityData[dateKey] = 0;
            }
            equityData[dateKey] += trade.pnl;
        });

        // Convert to array and calculate cumulative P&L
        const equityCurve = Object.entries(equityData)
            .map(([date, pnl]) => {
                cumulativePnl += pnl;
                return {
                    date,
                    dailyPnl: pnl,
                    cumulativePnl
                };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            equityCurve,
            totalPnl: cumulativePnl,
            period,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Get equity curve error:', error);
        res.status(500).json({ error: 'Failed to fetch equity curve data' });
    }
});

// Get performance by strategy
router.get('/performance-by-strategy', auth, async (req, res) => {
    try {
        const strategies = await Strategy.find({ userId: req.user._id, isActive: true });
        
        const performanceData = await Promise.all(
            strategies.map(async (strategy) => {
                await strategy.calculatePerformance();
                return {
                    id: strategy._id,
                    name: strategy.name,
                    category: strategy.category,
                    performance: strategy.performance
                };
            })
        );

        res.json({ performanceData });
    } catch (error) {
        console.error('Get performance by strategy error:', error);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
});

// Get monthly performance
router.get('/monthly-performance', auth, [
    query('year').optional().isInt({ min: 2020, max: 2030 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const trades = await Trade.find({
            userId: req.user._id,
            exitDate: { $gte: startDate, $lte: endDate }
        });

        // Group by month
        const monthlyData = {};
        for (let month = 0; month < 12; month++) {
            const monthTrades = trades.filter(trade => 
                new Date(trade.exitDate).getMonth() === month
            );
            
            const monthPnl = monthTrades.reduce((sum, trade) => sum + trade.pnl, 0);
            const monthTradesCount = monthTrades.length;
            const monthWinningTrades = monthTrades.filter(trade => trade.pnl > 0).length;
            const monthWinRate = monthTradesCount > 0 ? (monthWinningTrades / monthTradesCount) * 100 : 0;

            monthlyData[month] = {
                month: month + 1,
                pnl: monthPnl,
                tradesCount: monthTradesCount,
                winRate: monthWinRate
            };
        }

        res.json({
            year,
            monthlyData: Object.values(monthlyData)
        });
    } catch (error) {
        console.error('Get monthly performance error:', error);
        res.status(500).json({ error: 'Failed to fetch monthly performance data' });
    }
});

module.exports = router;
