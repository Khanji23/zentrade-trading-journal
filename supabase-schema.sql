-- Enable Row Level Security
-- Note: JWT secret is managed by Supabase automatically

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'pro', 'lifetime')),
    subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    subscription_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    is_email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strategies table
CREATE TABLE public.strategies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'other' CHECK (category IN ('scalping', 'day-trading', 'swing-trading', 'position-trading', 'algorithmic', 'other')),
    instruments TEXT[] DEFAULT '{}',
    timeframes TEXT[] DEFAULT '{"1d"}',
    rules JSONB DEFAULT '{}',
    performance JSONB DEFAULT '{
        "totalTrades": 0,
        "winningTrades": 0,
        "losingTrades": 0,
        "winRate": 0,
        "totalPnl": 0,
        "averageWin": 0,
        "averageLoss": 0,
        "profitFactor": 0,
        "maxDrawdown": 0,
        "sharpeRatio": 0
    }',
    is_active BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
    instrument TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    entry_price DECIMAL(15,8) NOT NULL CHECK (entry_price > 0),
    exit_price DECIMAL(15,8) NOT NULL CHECK (exit_price > 0),
    quantity DECIMAL(15,8) NOT NULL CHECK (quantity > 0),
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    pnl DECIMAL(15,8) NOT NULL,
    pnl_percentage DECIMAL(10,4) NOT NULL,
    fees DECIMAL(15,8) DEFAULT 0 CHECK (fees >= 0),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    risk_reward_ratio DECIMAL(10,4),
    max_drawdown DECIMAL(15,8),
    screenshot TEXT,
    is_closed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_entry_date ON public.trades(entry_date DESC);
CREATE INDEX idx_trades_strategy_id ON public.trades(strategy_id);
CREATE INDEX idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX idx_strategies_active ON public.strategies(user_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Strategies policies
CREATE POLICY "Users can view own strategies" ON public.strategies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON public.strategies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON public.strategies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON public.strategies
    FOR DELETE USING (auth.uid() = user_id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate trade P&L
CREATE OR REPLACE FUNCTION calculate_trade_pnl()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate P&L based on side
    IF NEW.side = 'long' THEN
        NEW.pnl = (NEW.exit_price - NEW.entry_price) * NEW.quantity - COALESCE(NEW.fees, 0);
    ELSE
        NEW.pnl = (NEW.entry_price - NEW.exit_price) * NEW.quantity - COALESCE(NEW.fees, 0);
    END IF;
    
    -- Calculate P&L percentage
    NEW.pnl_percentage = (NEW.pnl / (NEW.entry_price * NEW.quantity)) * 100;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for P&L calculation
CREATE TRIGGER calculate_trade_pnl_trigger BEFORE INSERT OR UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION calculate_trade_pnl();
