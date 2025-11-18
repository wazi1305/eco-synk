/**
 * AI Analysis Service - Real backend integration
 * Replaces mock Gemini service with actual AI-powered analysis
 */

import { API_BASE_URL } from './apiConfig';

class AIAnalysisService {
  /**
   * Analyze trash image using backend AI
   * @param {File} imageFile - The image file to analyze
   * @param {Object} location - Optional GPS coordinates {lat, lon}
   * @param {string} userNotes - Optional user notes about the image
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeTrashImage(imageFile, location = null, userNotes = null) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      if (location) {
        formData.append('location', JSON.stringify(location));
      }
      
      if (userNotes) {
        formData.append('user_notes', userNotes);
      }
      
      // Get user ID from local storage if available
      const userId = localStorage.getItem('userId');
      if (userId) {
        formData.append('user_id', userId);
      }

      const response = await fetch(`${API_BASE_URL}/analyze-trash`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      const responseLocation = result.location || result.analysis?.metadata?.location || location || null;
      if (result.analysis) {
        result.analysis.metadata = result.analysis.metadata || {};
        if (responseLocation) {
          const existingLocation = result.analysis.metadata.location || {};
          result.analysis.metadata.location = { ...existingLocation, ...responseLocation };
        }
        if (result.location?.name) {
          result.analysis.metadata.location_name = result.location.name;
        }
        if (result.location?.context) {
          result.analysis.metadata.location_context = result.location.context;
        }
      }

      // Store report ID for future reference
      if (result.report_id) {
        this.storeReportLocally(result.report_id, result.analysis, responseLocation);
      }

      return {
        success: true,
        data: result.analysis,
        reportId: result.report_id,
        message: result.message,
        location: responseLocation
      };

    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        // Fallback to mock data in case of failure
        data: this.getMockAnalysis()
      };
    }
  }

  /**
   * Detect waste using YOLOv8 + Gemini AI hybrid approach
   * @param {File} imageFile - The image file to analyze
   * @param {Object} location - Optional GPS coordinates {lat, lon}
   * @param {string} userNotes - Optional user notes about the image
   * @param {boolean} useYolo - Whether to use YOLO detection (default: true)
   * @returns {Promise<Object>} Detection results with annotations
   */
  async detectWaste(imageFile, location = null, userNotes = null, useYolo = true) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('use_yolo', useYolo);
      
      if (location) {
        formData.append('location', JSON.stringify(location));
      }
      
      if (userNotes) {
        formData.append('user_notes', userNotes);
      }
      
      const userId = localStorage.getItem('userId');
      if (userId) {
        formData.append('user_id', userId);
      }

      const response = await fetch(`${API_BASE_URL}/detect-waste`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const result = await response.json();

      const responseLocation = result.location || result.analysis?.metadata?.location || location || null;
      if (result.analysis) {
        result.analysis.metadata = result.analysis.metadata || {};
        if (responseLocation) {
          const existingLocation = result.analysis.metadata.location || {};
          result.analysis.metadata.location = { ...existingLocation, ...responseLocation };
        }
        if (result.location?.name) {
          result.analysis.metadata.location_name = result.location.name;
        }
        if (result.location?.context) {
          result.analysis.metadata.location_context = result.location.context;
        }
      }

      if (result.report_id) {
        this.storeReportLocally(result.report_id, result.analysis, responseLocation);
      }

      return {
        success: true,
        data: {
          analysis: result.analysis,
          detections: result.detections || [],
          detection_summary: result.detection_summary || {},
          annotated_image: result.annotated_image || null,
          location: responseLocation
        },
        reportId: result.report_id,
        message: result.message,
        location: responseLocation
      };

    } catch (error) {
      console.error('Waste Detection Error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          analysis: this.getMockAnalysis(),
          detections: [],
          detection_summary: {},
          annotated_image: null
        }
      };
    }
  }

  /**
   * Run lightweight YOLO detection on a live video frame
   * @param {Blob|File} frameBlob - Frame image to analyze (JPEG recommended)
   * @param {Object} location - Optional GPS coordinates {lat, lon}
   * @param {Object} options - Additional options { includeSummary, signal }
   * @returns {Promise<Object>} Live detection results
   */
  async detectLiveFrame(frameBlob, location = null, options = {}) {
    try {
      if (!frameBlob) {
        throw new Error('Missing frame data for live detection');
      }

      const formData = new FormData();
      const fileLike = frameBlob instanceof File
        ? frameBlob
        : new File([frameBlob], 'frame.jpg', { type: frameBlob.type || 'image/jpeg' });

      formData.append('file', fileLike);

      if (location) {
        formData.append('location', JSON.stringify(location));
      }

      if (options.includeSummary === false) {
        formData.append('include_summary', 'false');
      }

      const response = await fetch(`${API_BASE_URL}/detect-waste/live`, {
        method: 'POST',
        body: formData,
        signal: options.signal
      });

      if (!response.ok) {
        throw new Error(`Live detection failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        detections: result.detections || [],
        detectionSummary: result.detection_summary || null,
        frameDimensions: result.frame_dimensions || null,
        latencyMs: result.latency_ms ?? null
      };

    } catch (error) {
      console.error('Live Detection Error:', error);
      return {
        success: false,
        error: error.message,
        detections: [],
        detectionSummary: null,
        frameDimensions: null
      };
    }
  }

  /**
   * Batch analyze multiple images
   * @param {File[]} imageFiles - Array of image files
   * @returns {Promise<Object>} Batch analysis results
   */
  async analyzeBatchImages(imageFiles) {
    try {
      if (imageFiles.length > 10) {
        throw new Error('Maximum 10 images allowed per batch');
      }

      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/analyze-trash/batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Batch analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        summary: result.batch_summary
      };

    } catch (error) {
      console.error('Batch Analysis Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find volunteers for a cleanup based on analysis
   * @param {Object} analysisData - Results from image analysis
   * @param {Object} location - GPS coordinates {lat, lon}
   * @param {Object} options - Search options {radius, limit, minScore}
   * @returns {Promise<Object>} Volunteer matches
   */
  async findVolunteersForCleanup(analysisData, location, options = {}) {
    try {
      const requestBody = {
        report_data: analysisData,
        location: location,
        radius_km: options.radius || 5.0,
        limit: options.limit || 10,
        min_match_score: options.minScore || 0.3
      };

      const response = await fetch(`${API_BASE_URL}/find-volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Volunteer search failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        volunteers: result.volunteers,
        count: result.count,
        searchParams: result.search_params
      };

    } catch (error) {
      console.error('Volunteer Search Error:', error);
      return {
        success: false,
        error: error.message,
        volunteers: []
      };
    }
  }

  /**
   * Check if location is a trash hotspot
   * @param {Object} analysisData - Analysis results
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Hotspot detection results
   */
  async detectHotspot(analysisData, options = {}) {
    try {
      const requestBody = {
        report_data: analysisData,
        time_window_days: options.timeWindowDays || 30,
        min_similar_reports: options.threshold || 3
      };

      const response = await fetch(`${API_BASE_URL}/detect-hotspots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Hotspot detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        isHotspot: result.is_hotspot,
        severity: result.severity,
        similarReports: result.similar_reports_count,
        recommendation: result.recommendation,
        pastReports: result.past_reports
      };

    } catch (error) {
      console.error('Hotspot Detection Error:', error);
      return {
        success: false,
        error: error.message,
        isHotspot: false
      };
    }
  }

  /**
   * Get ESG impact metrics
   * @returns {Promise<Object>} Environmental impact data
   */
  async getESGMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/esg`);
      
      if (!response.ok) {
        throw new Error(`ESG metrics failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.esg_metrics,
        summary: result.summary
      };

    } catch (error) {
      console.error('ESG Metrics Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store report data locally for offline access
   * @private
   */
  storeReportLocally(reportId, analysisData, location = null) {
    try {
      const reports = JSON.parse(localStorage.getItem('userReports') || '[]');
      reports.push({
        id: reportId,
        analysis: analysisData,
        location: location || analysisData?.metadata?.location || null,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 reports to avoid storage bloat
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      localStorage.setItem('userReports', JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to store report locally:', error);
    }
  }

  /**
   * Get mock analysis data as fallback
   * @private
   */
  getMockAnalysis() {
    const mockResults = [
      {
        primary_material: "plastic",
        estimated_volume: "medium",
        specific_items: ["water bottles", "food packaging", "plastic bags"],
        cleanup_priority_score: 7,
        description: "Mixed plastic waste including bottles and food containers",
        environmental_risk_level: "medium",
        recyclable: true,
        estimated_cleanup_time_minutes: 45
      },
      {
        primary_material: "mixed",
        estimated_volume: "large", 
        specific_items: ["cardboard", "plastic containers", "metal cans"],
        cleanup_priority_score: 9,
        description: "Large mixed waste pile with recyclable materials",
        environmental_risk_level: "high",
        recyclable: true,
        estimated_cleanup_time_minutes: 90
      },
      {
        primary_material: "organic",
        estimated_volume: "small",
        specific_items: ["food waste", "organic matter"],
        cleanup_priority_score: 3,
        description: "Small amount of organic waste",
        environmental_risk_level: "low",
        recyclable: false,
        estimated_cleanup_time_minutes: 20
      }
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  }

  /**
   * Check backend health and AI service status
   * @returns {Promise<Object>} Service status
   */
  async checkHealthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      
      return {
        isHealthy: response.ok,
        services: result.services,
        timestamp: result.timestamp
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: error.message,
        services: {
          gemini: false,
          qdrant: false,
          embedder: false
        }
      };
    }
  }
}

export default new AIAnalysisService();