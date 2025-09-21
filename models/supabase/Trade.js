const supabase = require('../../supabase');

class Trade {
    static async create(tradeData) {
        const { data, error } = await supabase
            .from('trades')
            .insert([tradeData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('trades')
            .select(`
                *,
                strategies (
                    id,
                    name,
                    category
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findByUserId(userId, options = {}) {
        let query = supabase
            .from('trades')
            .select(`
                *,
                strategies (
                    id,
                    name,
                    category
                )
            `)
            .eq('user_id', userId)
            .order('entry_date', { ascending: false });

        // Apply filters
        if (options.strategyId) {
            query = query.eq('strategy_id', options.strategyId);
        }
        
        if (options.instrument) {
            query = query.ilike('instrument', `%${options.instrument}%`);
        }
        
        if (options.startDate) {
            query = query.gte('entry_date', options.startDate);
        }
        
        if (options.endDate) {
            query = query.lte('entry_date', options.endDate);
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
            .from('trades')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async delete(id) {
        const { error } = await supabase
            .from('trades')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    static async getStats(userId) {
        const { data, error } = await supabase
            .from('trades')
            .select('pnl, side')
            .eq('user_id', userId);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return {
                totalTrades: 0,
                totalPnl: 0,
                winRate: 0,
                profitFactor: 0,
                averageWin: 0,
                averageLoss: 0,
                bestTrade: 0,
                worstTrade: 0
            };
        }

        const winningTrades = data.filter(trade => trade.pnl > 0);
        const losingTrades = data.filter(trade => trade.pnl < 0);
        
        const totalPnl = data.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0);
        const totalWins = winningTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl), 0));
        
        const winRate = data.length > 0 ? (winningTrades.length / data.length) * 100 : 0;
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
        const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
        const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        const bestTrade = Math.max(...data.map(trade => parseFloat(trade.pnl)));
        const worstTrade = Math.min(...data.map(trade => parseFloat(trade.pnl)));

        return {
            totalTrades: data.length,
            totalPnl,
            winRate,
            profitFactor,
            averageWin,
            averageLoss,
            bestTrade,
            worstTrade
        };
    }

    static async getDailyPnl(userId, startDate, endDate) {
        const { data, error } = await supabase
            .from('trades')
            .select('exit_date, pnl')
            .eq('user_id', userId)
            .gte('exit_date', startDate)
            .lte('exit_date', endDate);
        
        if (error) throw error;
        
        // Group by date and sum P&L
        const dailyPnl = {};
        data.forEach(trade => {
            const date = new Date(trade.exit_date).toISOString().split('T')[0];
            if (!dailyPnl[date]) {
                dailyPnl[date] = 0;
            }
            dailyPnl[date] += parseFloat(trade.pnl);
        });
        
        return dailyPnl;
    }
}

module.exports = Trade;
