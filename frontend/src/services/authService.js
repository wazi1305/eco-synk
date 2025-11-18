const API_BASE_URL = 'https://eco-synk-production.up.railway.app';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  async getCurrentUser(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to get user profile');
      }

      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get user profile'
      };
    }
  }

  async updateProfile(token, updates) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Profile update failed');
      }

      return {
        success: true,
        user: data.user,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  }

  async findSimilarUsers(token, limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/users/similar?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to find similar users');
      }

      return {
        success: true,
        similar_users: data.similar_users
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to find similar users'
      };
    }
  }
}

export default new AuthService();