/**
 * Campaign Management Service
 * Handles campaign creation, hotspot detection, and ESG reporting
 */

import {
  getMemoryCache,
  setMemoryCache,
  getStorageCache,
  setStorageCache,
  createCacheKey
} from '../utils/cache';
import { transformQdrantCampaign } from '../utils/dataTransformers';
import { API_BASE_URL } from './apiConfig';
const CAMPAIGN_MEMORY_KEY = 'campaigns::all';
const CAMPAIGN_STORAGE_KEY = 'campaigns::offline';
const CAMPAIGN_CACHE_TTL = 60 * 1000; // 1 minute in-memory cache
const CAMPAIGN_STORAGE_TTL = 15 * 60 * 1000; // 15 minutes persistent cache
const USD_TO_AED = 3.67;

const convertUsdToAed = (amount = 0) => {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * USD_TO_AED);
};

class CampaignService {
  constructor() {
    this.cacheTtlMs = CAMPAIGN_CACHE_TTL;
  }

  async fetchCampaignsFromApi(limit = 120) {
    const response = await fetch(`${API_BASE_URL}/campaigns`);

    if (!response.ok) {
      throw new Error(`Failed to load campaigns: ${response.statusText}`);
    }

    const result = await response.json();
    const campaigns = (result.campaigns || [])
      .map((payload) => transformQdrantCampaign(payload))
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = new Date(a.timeline?.startDate || a.date || 0).getTime();
        const dateB = new Date(b.timeline?.startDate || b.date || 0).getTime();
        return dateB - dateA;
      });

    return limit ? campaigns.slice(0, limit) : campaigns;
  }

  persistCampaigns(cacheKey, campaigns) {
    setMemoryCache(cacheKey, campaigns, this.cacheTtlMs);
    setStorageCache(CAMPAIGN_STORAGE_KEY, campaigns, CAMPAIGN_STORAGE_TTL);
  }

  loadCampaignsFromStorage(maxAge = CAMPAIGN_STORAGE_TTL) {
    return getStorageCache(CAMPAIGN_STORAGE_KEY, maxAge);
  }

  /**
   * Create a cleanup campaign from hotspot data
   * @param {Object} hotspotData - Hotspot detection results
   * @param {Object} campaignDetails - Additional campaign information
   * @returns {Promise<Object>} Campaign creation result
   */
  async createCampaign(hotspotData, campaignDetails = {}) {
    try {
      const requestBody = {
        hotspot_report_ids: hotspotData.reportIds || [],
        location: campaignDetails.location || hotspotData.location,
        campaign_name: campaignDetails.name,
        target_funding_usd: campaignDetails.targetFunding || 500,
        volunteer_goal: campaignDetails.volunteerGoal || 10,
        duration_days: campaignDetails.durationDays || 30
      };

      const response = await fetch(`${API_BASE_URL}/campaign/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Campaign creation failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Store campaign locally for quick access
      this.storeCampaignLocally(result.campaign);

      return {
        success: true,
        campaign: result.campaign,
        message: result.message,
        nextSteps: result.next_steps
      };

    } catch (error) {
      console.error('Campaign Creation Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all campaigns (active and completed)
   * @param {Object} options
    * @param {boolean} options.forceRefresh - Skip cache and hit the backend directly
   * @param {number} options.limit - Maximum number of campaigns to load
   */
  async getAllCampaigns(options = {}) {
    const { forceRefresh = false, limit = 120 } = options;
    const cacheKey = createCacheKey(CAMPAIGN_MEMORY_KEY, { limit });

    if (!forceRefresh) {
      const cached = getMemoryCache(cacheKey);
      if (cached) {
        return {
          success: true,
          campaigns: cached,
          count: cached.length,
          source: 'memory'
        };
      }
    }

    try {
      const campaigns = await this.fetchCampaignsFromApi(limit);
      this.persistCampaigns(cacheKey, campaigns);

      return {
        success: true,
        campaigns,
        count: campaigns.length,
        source: 'api'
      };

    } catch (error) {
      console.error('Get All Campaigns Error:', error);

      const fallback = this.loadCampaignsFromStorage(60 * 60 * 1000);
      if (fallback) {
        return {
          success: true,
          campaigns: fallback,
          count: fallback.length,
          source: 'local-cache',
          warning: error.message
        };
      }

      // Return mock data when API is unavailable
      const mockCampaigns = this.getMockCampaigns();
      return {
        success: true,
        campaigns: mockCampaigns,
        count: mockCampaigns.length,
        source: 'mock-data',
        warning: 'Using demo data - API unavailable'
      };
    }
  }

  /**
   * Get only active campaigns
   * @returns {Promise<Object>} Active campaigns
   */
  async getActiveCampaigns(options = {}) {
    const response = await this.getAllCampaigns(options);
    if (!response.success) {
      return response;
    }

    const active = response.campaigns.filter((campaign) => {
      if (campaign.status === 'completed') {
        return false;
      }
      if (campaign.timeline?.daysRemaining === 0) {
        return false;
      }
      return true;
    });

    return {
      ...response,
      campaigns: active,
      count: active.length,
      message: 'Active campaigns loaded from API'
    };
  }

  /**
   * Get specific campaign by ID
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Campaign details
   */
  async getCampaignById(campaignId, { forceRefresh = false } = {}) {
    if (!campaignId) {
      return {
        success: false,
        error: 'Campaign ID is required',
        campaign: null
      };
    }

    const cacheKey = createCacheKey([CAMPAIGN_MEMORY_KEY, 'byId', campaignId]);

    if (!forceRefresh) {
      const cached = getMemoryCache(cacheKey);
      if (cached) {
        return {
          success: true,
          campaign: cached,
          source: 'memory'
        };
      }
    }

    if (!forceRefresh) {
      const stored = this.loadCampaignsFromStorage();
      if (stored?.length) {
        const existing = stored.find((campaign) => campaign.id === campaignId);
        if (existing) {
          setMemoryCache(cacheKey, existing, this.cacheTtlMs);
          return {
            success: true,
            campaign: existing,
            source: 'storage'
          };
        }
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      const result = await response.json();
      const campaign = transformQdrantCampaign(result.campaign);

      if (!campaign) {
        throw new Error('Campaign response was empty');
      }

      setMemoryCache(cacheKey, campaign, this.cacheTtlMs);
      return {
        success: true,
        campaign,
        source: 'api'
      };
    } catch (error) {
      console.error('Get Campaign Error:', error);
      return {
        success: false,
        error: error.message,
        campaign: null
      };
    }
  }

  /**
   * Get ESG impact metrics for reporting
   * @returns {Promise<Object>} Environmental, Social, Governance metrics
   */
  async getESGImpact() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/esg`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ESG metrics: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        metrics: result.esg_metrics,
        summary: result.summary,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('ESG Metrics Error:', error);
      return {
        success: false,
        error: error.message,
        metrics: null
      };
    }
  }

  /**
   * Create audit trail for compliance
   * @param {Object} auditData - Audit trail information
   * @returns {Promise<Object>} Audit trail result
   */
  async createAuditTrail(auditData) {
    try {
      const requestBody = {
        workflow_id: auditData.workflowId || 'frontend_' + Date.now(),
        report_id: auditData.reportId,
        action_taken: auditData.actionTaken,
        volunteers_matched: auditData.volunteersMatched || null,
        additional_metadata: {
          ...auditData.metadata,
          source: 'frontend',
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(`${API_BASE_URL}/audit/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Audit trail creation failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        auditTrail: result.audit_trail,
        message: result.message
      };

    } catch (error) {
      console.error('Audit Trail Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database stats
   */
  async getStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        statistics: result.statistics,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('Statistics Error:', error);
      return {
        success: false,
        error: error.message,
        statistics: null
      };
    }
  }

  /**
   * Process and format campaign data for frontend display
   * @param {Array} campaigns - Raw campaign data
   * @returns {Array} Formatted campaigns with additional UI data
   */
  formatCampaignsForUI(campaigns) {
    return campaigns.map(campaign => {
      // Calculate progress percentages
      const fundingProgress = campaign.goals?.current_funding_usd && campaign.goals?.target_funding_usd 
        ? Math.round((campaign.goals.current_funding_usd / campaign.goals.target_funding_usd) * 100)
        : 0;

      const volunteerProgress = campaign.goals?.current_volunteers && campaign.goals?.volunteer_goal
        ? Math.round((campaign.goals.current_volunteers / campaign.goals.volunteer_goal) * 100)
        : 0;

      // Calculate days remaining
      const endDate = new Date(campaign.timeline?.end_date);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

      // Determine status badge
      let statusBadge = 'active';
      if (daysRemaining === 0) {
        statusBadge = 'expired';
      } else if (daysRemaining <= 7) {
        statusBadge = 'urgent';
      } else if (fundingProgress >= 100) {
        statusBadge = 'funded';
      }

      // Format impact estimates
      const impact = campaign.impact_estimates || {};
      
      return {
        ...campaign,
        ui: {
          fundingProgress,
          volunteerProgress,
          daysRemaining,
          statusBadge,
          formattedFunding: this.formatCurrency(campaign.goals?.current_funding_usd || 0),
          targetFunding: this.formatCurrency(campaign.goals?.target_funding_usd || 0),
          estimatedImpact: {
            waste: `${impact.estimated_waste_kg || 0} kg`,
            hours: `${impact.estimated_volunteer_hours || 0} hours`,
            co2: `${Math.round(impact.estimated_co2_reduction_kg || 0)} kg CO₂`
          },
          materials: (campaign.hotspot?.materials || []).join(', ') || 'Mixed waste',
          priority: this.getPriorityLabel(campaign.hotspot?.average_priority || 5)
        }
      };
    });
  }

  /**
   * Format currency values
   * @private
   */
  formatCurrency(amount) {
    const convertedAmount = convertUsdToAed(amount);
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedAmount);
  }

  /**
   * Get priority label from numeric score
   * @private
   */
  getPriorityLabel(score) {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  /**
   * Store campaign locally for offline access
   * @private
   */
  storeCampaignLocally(campaign) {
    try {
      const campaigns = JSON.parse(localStorage.getItem('userCampaigns') || '[]');
      
      // Check if campaign already exists
      const existingIndex = campaigns.findIndex(c => c.campaign_id === campaign.campaign_id);
      
      if (existingIndex >= 0) {
        campaigns[existingIndex] = campaign;
      } else {
        campaigns.push(campaign);
      }
      
      // Keep only last 20 campaigns
      if (campaigns.length > 20) {
        campaigns.splice(0, campaigns.length - 20);
      }
      
      localStorage.setItem('userCampaigns', JSON.stringify(campaigns));
    } catch (error) {
      console.warn('Failed to store campaign locally:', error);
    }
  }

  /**
   * Get cached campaigns from local storage
   * @returns {Array} Cached campaigns
   */
  getCachedCampaigns() {
    try {
      return JSON.parse(localStorage.getItem('userCampaigns') || '[]');
    } catch (error) {
      console.warn('Failed to load cached campaigns:', error);
      return [];
    }
  }

  /**
   * Get mock campaigns for demo purposes
   * @returns {Array} Mock campaign data
   */
  getMockCampaigns() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'demo-campaign-1',
        title: 'Dubai Marina Beach Cleanup',
        description: 'Join us for a comprehensive beach cleanup at Dubai Marina',
        status: 'active',
        location: {
          address: 'Dubai Marina Beach, Dubai, UAE',
          lat: 25.0657,
          lng: 55.1413
        },
        date: tomorrow.toISOString(),
        organizer: {
          name: 'EcoSynk Community',
          avatar: '🌊'
        },
        volunteers: [
          { name: 'Ahmed Al-Rashid', avatar: '👨' },
          { name: 'Sarah Johnson', avatar: '👩' },
          { name: 'Omar Hassan', avatar: '👨' }
        ],
        volunteerGoal: 15,
        funding: {
          current: 750,
          goal: 1200
        },
        esgImpact: {
          itemsCollected: 0,
          wasteKg: 25,
          co2Reduced: 12.5
        },
        difficulty: 'Medium',
        image: '🏖️'
      },
      {
        id: 'demo-campaign-2',
        title: 'Al Barsha Park Plastic Drive',
        description: 'Focus on plastic waste removal and recycling education',
        status: 'active',
        location: {
          address: 'Al Barsha Park, Dubai, UAE',
          lat: 25.1048,
          lng: 55.1952
        },
        date: nextWeek.toISOString(),
        organizer: {
          name: 'Green Dubai Initiative',
          avatar: '🌱'
        },
        volunteers: [
          { name: 'Fatima Al-Zahra', avatar: '👩' },
          { name: 'John Smith', avatar: '👨' }
        ],
        volunteerGoal: 10,
        funding: {
          current: 400,
          goal: 800
        },
        esgImpact: {
          itemsCollected: 0,
          wasteKg: 15,
          co2Reduced: 7.5
        },
        difficulty: 'Easy',
        image: '♻️'
      },
      {
        id: 'demo-campaign-3',
        title: 'Downtown Dubai Street Cleanup',
        description: 'Urban cleanup focusing on high-traffic areas',
        status: 'active',
        location: {
          address: 'Downtown Dubai, UAE',
          lat: 25.1972,
          lng: 55.2744
        },
        date: nextMonth.toISOString(),
        organizer: {
          name: 'Dubai Municipality',
          avatar: '🏢'
        },
        volunteers: [],
        volunteerGoal: 20,
        funding: {
          current: 200,
          goal: 1500
        },
        esgImpact: {
          itemsCollected: 0,
          wasteKg: 40,
          co2Reduced: 20
        },
        difficulty: 'Hard',
        image: '🏙️'
      }
    ];
  }

  /**
   * Generate campaign creation suggestions based on user data
   * @param {Object} userData - User reports and activity data
   * @returns {Object} Campaign suggestions
   */
  generateCampaignSuggestions(userData = {}) {
    const userReports = userData.reports || JSON.parse(localStorage.getItem('userReports') || '[]');

    if (userReports.length === 0) {
      return {
        suggestions: [
          {
            type: 'location_based',
            title: 'Local Neighborhood Cleanup',
            description: 'Start a cleanup campaign in your immediate area',
            estimatedVolunteers: 5,
            estimatedFunding: 300,
            priority: 'medium'
          }
        ]
      };
    }

    // Analyze user's past reports
    const materialCounts = {};
    
    userReports.forEach(report => {
      const material = report.analysis?.primary_material || 'mixed';
      materialCounts[material] = (materialCounts[material] || 0) + 1;
    });

    const mostCommonMaterial = Object.keys(materialCounts)
      .reduce((a, b) => materialCounts[a] > materialCounts[b] ? a : b);

    return {
      suggestions: [
        {
          type: 'material_focused',
          title: `${mostCommonMaterial.charAt(0).toUpperCase() + mostCommonMaterial.slice(1)} Waste Campaign`,
          description: `Based on your reports, you often encounter ${mostCommonMaterial} waste. Consider starting a specialized cleanup.`,
          estimatedVolunteers: Math.min(15, userReports.length * 2),
          estimatedFunding: Math.min(1000, userReports.length * 50),
          priority: materialCounts[mostCommonMaterial] > 3 ? 'high' : 'medium',
          materials: [mostCommonMaterial]
        },
        {
          type: 'experience_based',
          title: 'Community Impact Campaign',
          description: `With ${userReports.length} reports submitted, you're experienced enough to lead a community campaign.`,
          estimatedVolunteers: 20,
          estimatedFunding: 750,
          priority: 'high',
          materials: Object.keys(materialCounts)
        }
      ]
    };
  }
}

export default new CampaignService();