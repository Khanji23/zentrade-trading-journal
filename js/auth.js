// Supabase Authentication Manager
class AuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.session = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Load Supabase client
            const { createClient } = await import('https://unpkg.com/@supabase/supabase-js@2/dist/module/index.js');
            
            const supabaseUrl = 'https://zbjzikbyueozzyhihnmy.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpianppa2J5dWVvenp5aGlobm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODA2MTcsImV4cCI6MjA3NDA1NjYxN30.nlqrga4Lv23kc_FZoTr60JXXf6Q_GveWhRrYcYsxGto';
            
            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.isInitialized = true;
            
            // Set up auth state listener
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.session = session;
                this.user = session?.user || null;
                this.updateUI();
            });

            // Get initial session
            const { data: { session } } = await this.supabase.auth.getSession();
            this.session = session;
            this.user = session?.user || null;
            
            console.log('✅ Supabase Auth initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
            this.isInitialized = false;
        }
    }

    // Authentication methods
    async signUp(email, password, userData = {}) {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: userData.firstName || '',
                        last_name: userData.lastName || ''
                    }
                }
            });

            if (error) throw error;

            // Update profile if user was created
            if (data.user && !data.user.email_confirmed_at) {
                await this.updateProfile({
                    first_name: userData.firstName || '',
                    last_name: userData.lastName || '',
                    email: email
                });
            }

            return { user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    async signIn(email, password) {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.user = data.user;
            this.session = data.session;
            this.updateUI();

            return { user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Supabase not initialized');
        }

        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.user = null;
            this.session = null;
            this.updateUI();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    async updateProfile(profileData) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .upsert({
                    id: this.user.id,
                    ...profileData,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    async getProfile() {
        if (!this.isInitialized || !this.user) {
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    isAuthenticated() {
        return !!this.user && !!this.session;
    }

    getCurrentUser() {
        return this.user;
    }

    getCurrentSession() {
        return this.session;
    }

    // Trade management with Supabase
    async getTrades(params = {}) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            let query = this.supabase
                .from('trades')
                .select('*')
                .eq('user_id', this.user.id)
                .order('entry_date', { ascending: false });

            if (params.limit) {
                query = query.limit(params.limit);
            }

            if (params.offset) {
                query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { trades: data || [], total: data?.length || 0 };
        } catch (error) {
            console.error('Get trades error:', error);
            throw error;
        }
    }

    async getTrade(id) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('trades')
                .select('*')
                .eq('id', id)
                .eq('user_id', this.user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get trade error:', error);
            throw error;
        }
    }

    async createTrade(tradeData) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('trades')
                .insert({
                    ...tradeData,
                    user_id: this.user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create trade error:', error);
            throw error;
        }
    }

    async updateTrade(id, tradeData) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('trades')
                .update({
                    ...tradeData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', this.user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update trade error:', error);
            throw error;
        }
    }

    async deleteTrade(id) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { error } = await this.supabase
                .from('trades')
                .delete()
                .eq('id', id)
                .eq('user_id', this.user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete trade error:', error);
            throw error;
        }
    }

    // Strategy management with Supabase
    async getStrategies(params = {}) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            let query = this.supabase
                .from('strategies')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });

            if (params.limit) {
                query = query.limit(params.limit);
            }

            const { data, error } = await query;
            if (error) throw error;

            return { strategies: data || [], total: data?.length || 0 };
        } catch (error) {
            console.error('Get strategies error:', error);
            throw error;
        }
    }

    async getStrategy(id) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('strategies')
                .select('*')
                .eq('id', id)
                .eq('user_id', this.user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get strategy error:', error);
            throw error;
        }
    }

    async createStrategy(strategyData) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('strategies')
                .insert({
                    ...strategyData,
                    user_id: this.user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create strategy error:', error);
            throw error;
        }
    }

    async updateStrategy(id, strategyData) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { data, error } = await this.supabase
                .from('strategies')
                .update({
                    ...strategyData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', this.user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update strategy error:', error);
            throw error;
        }
    }

    async deleteStrategy(id) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { error } = await this.supabase
                .from('strategies')
                .delete()
                .eq('id', id)
                .eq('user_id', this.user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete strategy error:', error);
            throw error;
        }
    }

    // Dashboard data
    async getDashboardOverview() {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const [tradesResult, strategiesResult] = await Promise.all([
                this.getTrades(),
                this.getStrategies()
            ]);

            const trades = tradesResult.trades;
            const strategies = strategiesResult.strategies;
            const stats = this.calculateStats(trades);

            return {
                totalTrades: trades.length,
                totalStrategies: strategies.length,
                ...stats,
                recentTrades: trades.slice(0, 5),
                strategies: strategies.slice(0, 5)
            };
        } catch (error) {
            console.error('Get dashboard overview error:', error);
            throw error;
        }
    }

    async getEquityCurve(params = {}) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { trades } = await this.getTrades();
            return this.calculateEquityCurve(trades);
        } catch (error) {
            console.error('Get equity curve error:', error);
            throw error;
        }
    }

    async getPerformanceByStrategy() {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { trades } = await this.getTrades();
            return this.calculatePerformanceByStrategy(trades);
        } catch (error) {
            console.error('Get performance by strategy error:', error);
            throw error;
        }
    }

    async getMonthlyPerformance(year) {
        if (!this.isInitialized || !this.user) {
            throw new Error('Not authenticated');
        }

        try {
            const { trades } = await this.getTrades();
            return this.calculateMonthlyPerformance(trades, year);
        } catch (error) {
            console.error('Get monthly performance error:', error);
            throw error;
        }
    }

    // Helper methods for calculations
    calculateStats(trades) {
        if (trades.length === 0) {
            return {
                totalPnL: 0,
                winRate: 0,
                profitFactor: 0,
                avgRR: 0,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0
            };
        }

        const totalPnL = trades.reduce((sum, trade) => sum + (parseFloat(trade.net_pnl) || 0), 0);
        const winningTrades = trades.filter(trade => (parseFloat(trade.net_pnl) || 0) > 0);
        const losingTrades = trades.filter(trade => (parseFloat(trade.net_pnl) || 0) < 0);
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        
        const totalWins = winningTrades.reduce((sum, trade) => sum + (parseFloat(trade.net_pnl) || 0), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (parseFloat(trade.net_pnl) || 0), 0));
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

        return {
            totalPnL,
            winRate,
            profitFactor,
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length
        };
    }

    calculateEquityCurve(trades) {
        if (trades.length === 0) return [];

        const sortedTrades = trades.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
        let cumulativePnL = 0;
        
        return sortedTrades.map(trade => {
            cumulativePnL += parseFloat(trade.net_pnl) || 0;
            return {
                date: trade.entry_date,
                cumulativePnL: cumulativePnL,
                tradePnL: parseFloat(trade.net_pnl) || 0
            };
        });
    }

    calculatePerformanceByStrategy(trades) {
        const strategyMap = {};
        
        trades.forEach(trade => {
            const strategy = trade.strategy || 'No Strategy';
            if (!strategyMap[strategy]) {
                strategyMap[strategy] = {
                    name: strategy,
                    trades: 0,
                    totalPnL: 0,
                    wins: 0,
                    losses: 0
                };
            }
            
            strategyMap[strategy].trades++;
            strategyMap[strategy].totalPnL += parseFloat(trade.net_pnl) || 0;
            
            if ((parseFloat(trade.net_pnl) || 0) > 0) {
                strategyMap[strategy].wins++;
            } else if ((parseFloat(trade.net_pnl) || 0) < 0) {
                strategyMap[strategy].losses++;
            }
        });

        return Object.values(strategyMap).map(strategy => ({
            ...strategy,
            winRate: strategy.trades > 0 ? (strategy.wins / strategy.trades) * 100 : 0
        }));
    }

    calculateMonthlyPerformance(trades, year) {
        const monthlyData = {};
        
        trades.forEach(trade => {
            const tradeDate = new Date(trade.entry_date);
            if (tradeDate.getFullYear() === year) {
                const month = tradeDate.getMonth();
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        month: month,
                        trades: 0,
                        totalPnL: 0,
                        wins: 0,
                        losses: 0
                    };
                }
                
                monthlyData[month].trades++;
                monthlyData[month].totalPnL += parseFloat(trade.net_pnl) || 0;
                
                if ((parseFloat(trade.net_pnl) || 0) > 0) {
                    monthlyData[month].wins++;
                } else if ((parseFloat(trade.net_pnl) || 0) < 0) {
                    monthlyData[month].losses++;
                }
            }
        });

        return Object.values(monthlyData).map(data => ({
            ...data,
            winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
        }));
    }

    // UI update method
    updateUI() {
        const userMenu = document.getElementById('userMenu');
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (this.isAuthenticated()) {
            if (userMenu) userMenu.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) {
                userInfo.textContent = `${this.user.user_metadata?.first_name || ''} ${this.user.user_metadata?.last_name || ''}`.trim() || this.user.email;
            }
        } else {
            if (userMenu) userMenu.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
        }
    }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Authentication UI helpers
class AuthUI {
    static showLoginForm() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'block';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        }
    }

    static showRegisterForm() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'block';
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }
    }

    static hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }

    static showError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    static hideError() {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth manager to initialize
    const checkAuth = () => {
        if (window.authManager.isInitialized) {
            AuthUI.updateUI();
        } else {
            setTimeout(checkAuth, 100);
        }
    };
    checkAuth();
});