const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    subscription: {
        plan: {
            type: String,
            enum: ['starter', 'pro', 'lifetime'],
            default: 'starter'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        isActive: {
            type: Boolean,
            default: true
        }
    },
    preferences: {
        currency: {
            type: String,
            default: 'USD'
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'dark'
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: Date.now
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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update updatedAt field
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get user's full name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Check if subscription is active
userSchema.methods.isSubscriptionActive = function() {
    if (this.subscription.plan === 'lifetime') {
        return true;
    }
    
    if (!this.subscription.isActive) {
        return false;
    }
    
    if (this.subscription.endDate && this.subscription.endDate < new Date()) {
        return false;
    }
    
    return true;
};

module.exports = mongoose.model('User', userSchema);
