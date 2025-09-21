const supabase = require('../../supabase');

class Strategy {
    static async create(strategyData) {
        const { data, error } = await supabase
            .from('strategies')
            .insert([strategyData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findByUserId(userId, options = {}) {
        let query = supabase
            .from('strategies')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (options.category) {
            query = query.eq('category', options.category);
        }
        
        if (options.isActive !== undefined) {
            query = query.eq('is_active', options.isActive);
        }

        // Apply pagination
        if (options.page && options.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    }

    static async update(id, updates) {
        const { data, error } = await supabase
            .from('strategies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async delete(id) {
        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    static async calculatePerformance(strategyId) {
        // Get all trades for this strategy
        const { data: trades, error } = await supabase
            .from('trades')
            .select('pnl')
            .eq('strategy_id', strategyId);
        
        if (error) throw error;
        
        if (!trades || trades.length === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                totalPnl: 0,
                averageWin: 0,
                averageLoss: 0,
                profitFactor: 0,
                maxDrawdown: 0,
                sharpeRatio: 0
            };
        }

        const winningTrades = trades.filter(trade => trade.pnl > 0);
        const losingTrades = trades.filter(trade => trade.pnl < 0);
        
        const totalPnl = trades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0);
        const totalWins = winningTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0));
        
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
        const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
        const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        // Calculate max drawdown
        let peak = 0;
        let maxDrawdown = 0;
        let currentValue = 0;
        
        trades.sort((a, b) => new Date(a.exit_date) - new Date(b.exit_date));
        
        for (const trade of trades) {
            currentValue += parseFloat(trade.pnl);
            if (currentValue > peak) {
                peak = currentValue;
            }
            const drawdown = peak - currentValue;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        const performance = {
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate,
            totalPnl,
            averageWin,
            averageLoss,
            profitFactor,
            maxDrawdown,
            sharpeRatio: 0 // Calculate Sharpe ratio if needed
        };

        // Update the strategy with new performance data
        await this.update(strategyId, { performance });
        
        return performance;
    }

    static async getTrades(strategyId, options = {}) {
        let query = supabase
            .from('trades')
            .select('*')
            .eq('strategy_id', strategyId)
            .order('entry_date', { ascending: false });

        // Apply pagination
        if (options.page && options.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    }
}

module.exports = Strategy;
