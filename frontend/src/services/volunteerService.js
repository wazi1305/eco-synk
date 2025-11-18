/**
 * Volunteer Management Service
 * Handles volunteer profiles, matching, and leaderboards
 */

import aiAnalysisService from './aiAnalysis';
import {
  getMemoryCache,
  setMemoryCache,
  getStorageCache,
  setStorageCache,
  createCacheKey
} from '../utils/cache';
import { transformQdrantVolunteer } from '../utils/dataTransformers';
import { API_BASE_URL } from './apiConfig';
const VOLUNTEER_MEMORY_KEY = 'volunteers::all';
const VOLUNTEER_STORAGE_KEY = 'volunteers::offline';
const LEADERBOARD_MEMORY_KEY = 'volunteers::leaderboard';
const VOLUNTEER_CACHE_TTL = 60 * 1000;
const VOLUNTEER_STORAGE_TTL = 10 * 60 * 1000;
const MAX_VOLUNTEER_FETCH = 256;
const DEFAULT_RADIUS_KM = 25;

class VolunteerService {
  constructor() {
    this.cacheTtlMs = VOLUNTEER_CACHE_TTL;
  }

  normalizeLocationInput(location) {
    if (!location) {
      return null;
    }

    const lat = Number(location.lat ?? location.latitude);
    const lng = Number(location.lng ?? location.lon ?? location.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }

  cacheVolunteers(volunteers) {
    setMemoryCache(VOLUNTEER_MEMORY_KEY, volunteers, this.cacheTtlMs);
    setStorageCache(VOLUNTEER_STORAGE_KEY, volunteers, VOLUNTEER_STORAGE_TTL);
  }

  getVolunteersFromCache(maxAge = VOLUNTEER_STORAGE_TTL) {
    const inMemory = getMemoryCache(VOLUNTEER_MEMORY_KEY);
    if (inMemory?.length) {
      return inMemory;
    }
    return getStorageCache(VOLUNTEER_STORAGE_KEY, maxAge) || [];
  }

  buildLeaderboardFromVolunteers(volunteers, limit) {
    return volunteers.slice(0, limit).map((volunteer, index) => ({
      ...volunteer,
      rank: index + 1
    }));
  }

  async fetchVolunteersFromApi({
    limit = MAX_VOLUNTEER_FETCH,
    locationFilter = null,
    radiusKm = DEFAULT_RADIUS_KM,
    availableOnly = false
  } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });

    if (locationFilter) {
      const lat = Number(locationFilter.lat ?? locationFilter.latitude);
      const lon = Number(locationFilter.lng ?? locationFilter.lon ?? locationFilter.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        params.set('lat', String(lat));
        params.set('lon', String(lon));
        params.set('radius_km', String(radiusKm));
      }
    }

    if (availableOnly) {
      params.set('available_only', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/volunteers?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch volunteers: ${response.statusText}`);
    }

    const result = await response.json();
    const volunteers = (result.volunteers || [])
      .map((payload) =>
        transformQdrantVolunteer(payload, {
          referenceLocation: locationFilter
        })
      )
      .filter(Boolean)
      .sort((a, b) => (b.pastCleanupCount || 0) - (a.pastCleanupCount || 0));

    if (volunteers.length) {
      this.cacheVolunteers(volunteers);
    }

    return volunteers;
  }

  /**
   * Create or update volunteer profile
   * @param {Object} profileData - Volunteer profile information
   * @returns {Promise<Object>} Profile creation result
   */
  async createVolunteerProfile(profileData) {
    try {
      const requestBody = {
        user_id: profileData.userId || localStorage.getItem('userId'),
        name: profileData.name,
        skills: profileData.skills || [],
        experience_level: profileData.experienceLevel || 'beginner',
        materials_expertise: profileData.materialsExpertise || [],
        specializations: profileData.specializations || [],
        equipment_owned: profileData.equipmentOwned || [],
        location: {
          lat: profileData.location.lat,
          lon: profileData.location.lon
        },
        available: profileData.available !== false,
        past_cleanup_count: profileData.pastCleanupCount || 0
      };

      const response = await fetch(`${API_BASE_URL}/volunteer-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Profile creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Store user ID locally
      if (result.user_id) {
        localStorage.setItem('userId', result.user_id);
        localStorage.setItem('volunteerProfile', JSON.stringify(profileData));
      }

      return {
        success: true,
        userId: result.user_id,
        message: result.message
      };

    } catch (error) {
      console.error('Profile Creation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update volunteer availability status
   * @param {string} userId - Volunteer user ID
   * @param {boolean} available - Availability status
   * @returns {Promise<Object>} Update result
   */
  async updateAvailability(userId, available) {
    try {
      const response = await fetch(`${API_BASE_URL}/volunteer/${userId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available }),
      });

      if (!response.ok) {
        throw new Error(`Availability update failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update local storage
      const profile = JSON.parse(localStorage.getItem('volunteerProfile') || '{}');
      profile.available = available;
      localStorage.setItem('volunteerProfile', JSON.stringify(profile));

      return {
        success: true,
        available: result.available,
        message: result.message
      };

    } catch (error) {
      console.error('Availability Update Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get volunteer leaderboard
   * @param {number} limit - Number of top volunteers to fetch
   * @returns {Promise<Object>} Leaderboard data
   */
  async getLeaderboard(limit = 10, options = {}) {
    const cacheKey = createCacheKey(LEADERBOARD_MEMORY_KEY, { limit });

    if (!options.forceRefresh) {
      const cached = getMemoryCache(cacheKey);
      if (cached?.length) {
        return {
          success: true,
          leaderboard: cached,
          totalVolunteers: cached.length,
          generatedAt: new Date().toISOString(),
          source: 'memory'
        };
      }
    }

    try {
      const volunteers = await this.fetchVolunteersFromApi({
        limit: Math.max(limit * 2, 50)
      });

      const leaderboard = this.buildLeaderboardFromVolunteers(volunteers, limit);
      setMemoryCache(cacheKey, leaderboard, this.cacheTtlMs);

      return {
        success: true,
        leaderboard,
        totalVolunteers: volunteers.length,
        generatedAt: new Date().toISOString(),
        source: 'api'
      };

    } catch (error) {
      console.error('Leaderboard Error:', error);
      const fallbackVolunteers = this.getVolunteersFromCache();
      if (fallbackVolunteers.length) {
        return {
          success: true,
          leaderboard: this.buildLeaderboardFromVolunteers(fallbackVolunteers, limit),
          totalVolunteers: fallbackVolunteers.length,
          generatedAt: new Date().toISOString(),
          source: 'local-cache',
          warning: error.message
        };
      }

      try {
        const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
        if (!response.ok) {
          throw new Error(`Leaderboard fetch failed: ${response.statusText}`);
        }
        const result = await response.json();
        return {
          success: true,
          leaderboard: result.leaderboard,
          totalVolunteers: result.total_volunteers,
          generatedAt: result.generated_at,
          source: 'api-fallback',
          warning: 'Volunteer API unavailable, using leaderboard endpoint'
        };
      } catch (apiError) {
        return {
          success: false,
          error: apiError.message || error.message,
          leaderboard: []
        };
      }
    }
  }

  /**
   * Find cleanup opportunities based on volunteer profile
   * @param {Object} location - Volunteer location {lat, lon}
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Cleanup opportunities
   */
  async findCleanupOpportunities(location, options = {}) {
    const normalizedLocation = this.normalizeLocationInput(location);

    // Get volunteer profile to match skills
    const profile = JSON.parse(localStorage.getItem('volunteerProfile') || '{}');
    const volunteerQuery = {
      primary_material: options.primaryMaterial || 'mixed',
      estimated_volume: options.estimatedVolume || 'medium',
      description: options.description || `Volunteer with skills: ${profile.skills?.join(', ') || 'general cleanup'}`,
      materials_expertise: profile.materialsExpertise || [],
      specializations: profile.specializations || []
    };

    if (!normalizedLocation) {
      return {
        success: false,
        error: 'Valid location coordinates are required to locate opportunities',
        opportunities: []
      };
    }

    try {
      const volunteers = await this.fetchVolunteersFromApi({
        limit: Math.max((options.limit || 20) * 2, 40),
        locationFilter: normalizedLocation,
        radiusKm: options.radius || DEFAULT_RADIUS_KM,
        availableOnly: true
      });

      const scored = volunteers
        .map((volunteer) => ({
          ...volunteer,
          matchScore: this.calculateMatchScore(volunteerQuery, volunteer)
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      const limited = scored.slice(0, options.limit || 20);

      return {
        success: true,
        opportunities: limited,
        count: scored.length,
        source: 'api'
      };

    } catch (error) {
      console.error('Cleanup Opportunities Error:', error);

      try {
        const fallback = await aiAnalysisService.findVolunteersForCleanup(
          volunteerQuery,
          location,
          {
            radius: options.radius || 10,
            limit: options.limit || 20,
            minScore: options.minScore || 0.2
          }
        );

        return {
          success: true,
          opportunities: fallback.volunteers,
          count: fallback.count,
          source: 'api-fallback',
          warning: error.message
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message || error.message,
          opportunities: []
        };
      }
    }
  }

  /**
   * Get volunteer statistics and achievements
   * @returns {Promise<Object>} Volunteer stats
   */
  async getVolunteerStats() {
    try {
      // Get ESG metrics which include volunteer data
      const esgData = await aiAnalysisService.getESGMetrics();
      
      if (!esgData.success) {
        throw new Error('Failed to fetch volunteer statistics');
      }

      // Get profile from local storage for personal stats
      const profile = JSON.parse(localStorage.getItem('volunteerProfile') || '{}');
      const reports = JSON.parse(localStorage.getItem('userReports') || '[]');

      return {
        success: true,
        stats: {
          personal: {
            reportsSubmitted: reports.length,
            cleanupCount: profile.pastCleanupCount || 0,
            experienceLevel: profile.experienceLevel || 'beginner',
            skills: profile.skills || [],
            joinDate: profile.createdAt || new Date().toISOString()
          },
          community: {
            totalVolunteers: esgData.data.social.active_volunteers,
            totalCleanups: esgData.data.social.total_cleanups,
            totalWasteRemoved: esgData.data.environmental.total_waste_removed_kg,
            co2Reduction: esgData.data.environmental.co2_reduction_kg
          }
        }
      };

    } catch (error) {
      console.error('Volunteer Stats Error:', error);
      return {
        success: false,
        error: error.message,
        stats: {
          personal: {},
          community: {}
        }
      };
    }
  }

  /**
   * Get recommended equipment based on common cleanup needs
   * @param {Array} pastReports - User's past reports
   * @returns {Object} Equipment recommendations
   */
  getEquipmentRecommendations(pastReports = []) {
    const equipmentMap = {
      plastic: ['plastic picker tools', 'sorting bins', 'gloves'],
      metal: ['metal detector', 'heavy-duty gloves', 'magnet tool'],
      hazardous: ['chemical-resistant gloves', 'face mask', 'protective suit'],
      organic: ['composting tools', 'organic waste bags', 'pitchfork'],
      electronic: ['ESD gloves', 'component sorter', 'battery tester'],
      mixed: ['multi-tool picker', 'various gloves', 'sorting containers']
    };

    const basicEquipment = ['gloves', 'trash bags', 'picker tools', 'safety vest'];
    
    if (pastReports.length === 0) {
      return {
        basic: basicEquipment,
        specialized: [],
        recommendations: [
          'Start with basic equipment for general cleanup',
          'Add specialized tools as you gain experience'
        ]
      };
    }

    // Analyze past reports to suggest equipment
    const materialCounts = {};
    pastReports.forEach(report => {
      const material = report.analysis?.primary_material || 'mixed';
      materialCounts[material] = (materialCounts[material] || 0) + 1;
    });

    const mostCommonMaterial = Object.keys(materialCounts)
      .reduce((a, b) => materialCounts[a] > materialCounts[b] ? a : b);

    const specialized = equipmentMap[mostCommonMaterial] || equipmentMap.mixed;

    return {
      basic: basicEquipment,
      specialized: specialized,
      recommendations: [
        `Based on your history, you often encounter ${mostCommonMaterial} waste`,
        `Consider investing in: ${specialized.join(', ')}`,
        `You've completed ${pastReports.length} reports - great work!`
      ]
    };
  }

  /**
   * Calculate volunteer match score for a cleanup task
   * @param {Object} taskData - Cleanup task information
   * @param {Object} volunteerProfile - Volunteer profile
   * @returns {number} Match score (0-1)
   */
  calculateMatchScore(taskData, volunteerProfile) {
    let score = 0;

    // Material expertise match
    if (volunteerProfile.materialsExpertise?.includes(taskData.primary_material)) {
      score += 0.3;
    }

    // Experience level match
    const experienceMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const taskComplexity = taskData.cleanup_priority_score || 5;
    const volunteerExp = experienceMap[volunteerProfile.experienceLevel] || 1;
    
    if (taskComplexity <= volunteerExp * 2.5) {
      score += 0.2;
    }

    // Equipment ownership match
    const requiredEquipment = taskData.recommended_equipment || [];
    const ownedEquipment = volunteerProfile.equipmentOwned || [];
    const equipmentMatch = requiredEquipment.filter(item => 
      ownedEquipment.some(owned => owned.toLowerCase().includes(item.toLowerCase()))
    ).length;
    
    if (requiredEquipment.length > 0) {
      score += (equipmentMatch / requiredEquipment.length) * 0.2;
    }

    // Specialization match
    const taskLocation = taskData.description?.toLowerCase() || '';
    const volunteerSpecs = volunteerProfile.specializations || [];
    const specMatch = volunteerSpecs.some(spec => 
      taskLocation.includes(spec.toLowerCase())
    );
    
    if (specMatch) {
      score += 0.15;
    }

    // Availability
    if (volunteerProfile.available !== false) {
      score += 0.15;
    }

    return Math.min(1, score);
  }
}

export default new VolunteerService();