const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    category: {
        type: String,
        enum: ['scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other'],
        default: 'other'
    },
    instruments: [{
        type: String,
        trim: true
    }],
    timeframes: [{
        type: String,
        enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'],
        default: ['1d']
    }],
    rules: {
        entry: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        exit: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        riskManagement: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    performance: {
        totalTrades: {
            type: Number,
            default: 0
        },
        winningTrades: {
            type: Number,
            default: 0
        },
        losingTrades: {
            type: Number,
            default: 0
        },
        winRate: {
            type: Number,
            default: 0
        },
        totalPnl: {
            type: Number,
            default: 0
        },
        averageWin: {
            type: Number,
            default: 0
        },
        averageLoss: {
            type: Number,
            default: 0
        },
        profitFactor: {
            type: Number,
            default: 0
        },
        maxDrawdown: {
            type: Number,
            default: 0
        },
        sharpeRatio: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt field
strategySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate performance metrics
strategySchema.methods.calculatePerformance = async function() {
    const Trade = mongoose.model('Trade');
    
    const trades = await Trade.find({ 
        userId: this.userId, 
        strategyId: this._id 
    });
    
    if (trades.length === 0) {
        return;
    }
    
    const winningTrades = trades.filter(trade => trade.pnl > 0);
    const losingTrades = trades.filter(trade => trade.pnl < 0);
    
    this.performance.totalTrades = trades.length;
    this.performance.winningTrades = winningTrades.length;
    this.performance.losingTrades = losingTrades.length;
    this.performance.winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    this.performance.totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    this.performance.averageWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length 
        : 0;
    this.performance.averageLoss = losingTrades.length > 0 
        ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length 
        : 0;
    
    const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
    this.performance.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let currentValue = 0;
    
    trades.sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
    
    for (const trade of trades) {
        currentValue += trade.pnl;
        if (currentValue > peak) {
            peak = currentValue;
        }
        const drawdown = peak - currentValue;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    
    this.performance.maxDrawdown = maxDrawdown;
    
    await this.save();
};

// Index for efficient queries
strategySchema.index({ userId: 1, isActive: 1 });
strategySchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Strategy', strategySchema);
