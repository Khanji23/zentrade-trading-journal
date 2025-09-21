const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    strategyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strategy',
        default: null
    },
    instrument: {
        type: String,
        required: true,
        trim: true
    },
    side: {
        type: String,
        enum: ['long', 'short'],
        required: true
    },
    entryPrice: {
        type: Number,
        required: true,
        min: 0
    },
    exitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    entryDate: {
        type: Date,
        required: true
    },
    exitDate: {
        type: Date,
        required: true
    },
    pnl: {
        type: Number,
        required: true
    },
    pnlPercentage: {
        type: Number,
        required: true
    },
    fees: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    tags: [{
        type: String,
        trim: true
    }],
    riskRewardRatio: {
        type: Number,
        default: null
    },
    maxDrawdown: {
        type: Number,
        default: null
    },
    screenshot: {
        type: String, // URL to uploaded screenshot
        default: null
    },
    isClosed: {
        type: Boolean,
        default: true
    },
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
tradeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate P&L before saving
tradeSchema.pre('save', function(next) {
    if (this.isModified('entryPrice') || this.isModified('exitPrice') || this.isModified('quantity')) {
        const priceDiff = this.side === 'long' 
            ? this.exitPrice - this.entryPrice 
            : this.entryPrice - this.exitPrice;
        
        this.pnl = priceDiff * this.quantity - (this.fees || 0);
        this.pnlPercentage = (this.pnl / (this.entryPrice * this.quantity)) * 100;
    }
    next();
});

// Index for efficient queries
tradeSchema.index({ userId: 1, entryDate: -1 });
tradeSchema.index({ userId: 1, strategyId: 1 });
tradeSchema.index({ userId: 1, instrument: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
