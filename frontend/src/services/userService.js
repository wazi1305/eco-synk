import { API_BASE_URL } from './apiConfig';

class UserService {
  /**
   * Follow a user by their name
   */
  async followUser(followeeName, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ followee_name: followeeName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to follow user');
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message,
        followee: data.followee
      };
    } catch (error) {
      console.error('Follow user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unfollow a user by their ID
   */
  async unfollowUser(followeeId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ followee_id: followeeId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to unfollow user');
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Unfollow user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get personalized user recommendations
   */
  async getRecommendedUsers(limit = 10, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/recommended?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      return {
        success: true,
        recommendations: data.recommendations || [],
        totalCandidates: data.total_candidates || 0
      };
    } catch (error) {
      console.error('Get recommendations error:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  /**
   * Get the authenticated user's profile
   */
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Not authenticated'
          };
        }

        try {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to validate session');
        } catch {
          throw new Error('Failed to validate session');
        }
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query, limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return {
        success: true,
        users: data.users || []
      };
    } catch (error) {
      console.error('Search users error:', error);
      return {
        success: false,
        users: [],
        error: error.message
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`);

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if current user is following another user
   */
  isFollowing(currentUser, targetUserId) {
    if (!currentUser || !currentUser.following) {
      return false;
    }
    return currentUser.following.includes(targetUserId);
  }

  /**
   * Get followers count
   */
  getFollowersCount(user) {
    return user?.followers?.length || 0;
  }

  /**
   * Get following count
   */
  getFollowingCount(user) {
    return user?.following?.length || 0;
  }
}

export default new UserService();
