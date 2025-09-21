const supabase = require('../../supabase');

class User {
    static async create(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    static async findByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) throw error;
        return data;
    }

    static async update(id, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    static async delete(id) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    static async isSubscriptionActive(userId) {
        const user = await this.findById(userId);
        
        if (user.subscription_plan === 'lifetime') {
            return true;
        }
        
        if (!user.subscription_active) {
            return false;
        }
        
        if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) {
            return false;
        }
        
        return true;
    }
}

module.exports = User;
