const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// Get dashboard overview data
router.get('/overview', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all trades for the user
        const { data: trades, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Calculate metrics
        const totalPnl = trades.reduce((sum, trade) => sum + (trade.net_pnl || 0), 0);
        const winningTrades = trades.filter(trade => (trade.net_pnl || 0) > 0);
        const losingTrades = trades.filter(trade => (trade.net_pnl || 0) < 0);
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        
        const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.net_pnl || 0), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.net_pnl || 0), 0));
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

        res.json({
            totalPnl,
            totalTrades: trades.length,
            winRate: Math.round(winRate * 100) / 100,
            profitFactor: Math.round(profitFactor * 100) / 100,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length
        });
    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get equity curve data
router.get('/equity-curve', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get trades grouped by date
        const { data: trades, error } = await supabase
            .from('trades')
            .select('entry_date, net_pnl')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Group by date and calculate daily P&L
        const dailyPnl = {};
        trades.forEach(trade => {
            const date = trade.entry_date.split('T')[0];
            dailyPnl[date] = (dailyPnl[date] || 0) + (trade.net_pnl || 0);
        });

        // Convert to cumulative equity curve
        const equityCurve = [];
        let cumulativePnl = 0;
        
        Object.keys(dailyPnl).sort().forEach(date => {
            cumulativePnl += dailyPnl[date];
            equityCurve.push({
                date,
                pnl: dailyPnl[date],
                cumulative: cumulativePnl
            });
        });

        res.json(equityCurve);
    } catch (error) {
        console.error('Equity curve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
