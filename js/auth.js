// Authentication and API management
class AuthManager {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.isServerReady = false;
        this.checkServerHealth();
    }

    // Check if server is ready
    async checkServerHealth() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                this.isServerReady = true;
                console.log('✅ Server is ready');
            } else {
                console.warn('Server responded with status:', response.status);
                setTimeout(() => this.checkServerHealth(), 2000);
            }
        } catch (error) {
            console.warn('Server not ready yet:', error.message);
            // Retry after 2 seconds
            setTimeout(() => this.checkServerHealth(), 2000);
        }
    }

    // API request helper
    async apiRequest(endpoint, options = {}) {
        // Wait for server to be ready (max 10 seconds)
        let attempts = 0;
        while (!this.isServerReady && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }

        if (!this.isServerReady) {
            throw new Error('Server is not responding. Please check if the server is running.');
        }

        const url = `${this.baseURL}/api${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response, got ${contentType || 'unknown content type'}`);
            }
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            if (error.message.includes('JSON')) {
                throw new Error('Server returned invalid response. Please check if the server is running correctly.');
            }
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        try {
            const response = await this.apiRequest('/auth/register', {
                method: 'POST',
                body: userData
            });

            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            this.token = response.token;
            this.user = response.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            return response;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await this.apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.apiRequest('/auth/me');
            this.user = response.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            return response.user;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Trade management
    async getTrades(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.apiRequest(`/trades?${queryString}`);
    }

    async getTrade(id) {
        return await this.apiRequest(`/trades/${id}`);
    }

    async createTrade(tradeData) {
        return await this.apiRequest('/trades', {
            method: 'POST',
            body: tradeData
        });
    }

    async updateTrade(id, tradeData) {
        return await this.apiRequest(`/trades/${id}`, {
            method: 'PUT',
            body: tradeData
        });
    }

    async deleteTrade(id) {
        return await this.apiRequest(`/trades/${id}`, {
            method: 'DELETE'
        });
    }

    async getTradeStats() {
        return await this.apiRequest('/trades/stats/overview');
    }

    // Strategy management
    async getStrategies(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.apiRequest(`/strategies?${queryString}`);
    }

    async getStrategy(id) {
        return await this.apiRequest(`/strategies/${id}`);
    }

    async createStrategy(strategyData) {
        return await this.apiRequest('/strategies', {
            method: 'POST',
            body: strategyData
        });
    }

    async updateStrategy(id, strategyData) {
        return await this.apiRequest(`/strategies/${id}`, {
            method: 'PUT',
            body: strategyData
        });
    }

    async deleteStrategy(id) {
        return await this.apiRequest(`/strategies/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard data
    async getDashboardOverview() {
        return await this.apiRequest('/dashboard/overview');
    }

    async getEquityCurve(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.apiRequest(`/dashboard/equity-curve?${queryString}`);
    }

    async getPerformanceByStrategy() {
        return await this.apiRequest('/dashboard/performance-by-strategy');
    }

    async getMonthlyPerformance(year) {
        return await this.apiRequest(`/dashboard/monthly-performance?year=${year}`);
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

    static showUserMenu() {
        const userMenu = document.getElementById('userMenu');
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (window.authManager.isAuthenticated()) {
            if (userMenu) userMenu.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) {
                userInfo.textContent = `${window.authManager.user.firstName} ${window.authManager.user.lastName}`;
            }
        } else {
            if (userMenu) userMenu.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
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
    AuthUI.showUserMenu();
    
    // Check if user is authenticated
    if (window.authManager.isAuthenticated()) {
        // Load user data
        window.authManager.getCurrentUser().catch(() => {
            // Token might be expired, logout
            window.authManager.logout();
            AuthUI.showUserMenu();
        });
    }
});
