/**
 * Trash report service - proxies reads/writes through the backend API so the
 * frontend never talks to Qdrant directly.
 */

import aiAnalysisService from './aiAnalysis';
import {
  getMemoryCache,
  setMemoryCache,
  getStorageCache,
  setStorageCache,
  createCacheKey
} from '../utils/cache';
import { transformQdrantTrashReport } from '../utils/dataTransformers';
import { API_BASE_URL } from './apiConfig';

/** @typedef {import('../types').TrashReport} TrashReport */
/** @typedef {import('../types').GeoPoint} GeoPoint */

const MEMORY_KEY = 'trashReports::recent';
const STORAGE_KEY = 'trashReports::offline';
const DEFAULT_LIMIT = 25;

class TrashReportService {
  async getRecentTrashReports({ limit = DEFAULT_LIMIT, location = null } = {}) {
    const cacheKey = createCacheKey(MEMORY_KEY, { limit });

    if (!location) {
      const cached = getMemoryCache(cacheKey);
      if (cached) {
        return {
          success: true,
          reports: cached,
          source: 'memory'
        };
      }
    }

    try {
      const fetchLimit = Math.max(limit, 200);
      const params = new URLSearchParams({ limit: String(fetchLimit) });

      if (location) {
        const lat = Number(location.lat ?? location.latitude);
        const lon = Number(location.lng ?? location.lon ?? location.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          params.set('lat', String(lat));
          params.set('lon', String(lon));
        }
      }

      const response = await fetch(`${API_BASE_URL}/trash-reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Trash report fetch failed: ${response.statusText}`);
      }

      const result = await response.json();

      let reports = (result.reports || [])
        .map((payload) => transformQdrantTrashReport(payload, { referenceLocation: location }))
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || 0).getTime();
          const dateB = new Date(b.timestamp || 0).getTime();
          return dateB - dateA;
        });

      if (limit) {
        reports = reports.slice(0, limit);
      }

      setMemoryCache(cacheKey, reports, 60000);
      setStorageCache(STORAGE_KEY, reports, 10 * 60 * 1000);

      return {
        success: true,
        reports,
        source: 'api'
      };
    } catch (error) {
      console.error('Trash report fetch failed:', error);
      const fallback = getStorageCache(STORAGE_KEY, 12 * 60 * 60 * 1000);
      if (fallback) {
        return {
          success: true,
          reports: fallback,
          source: 'local-cache',
          warning: error.message
        };
      }

      return {
        success: false,
        error: error.message,
        reports: []
      };
    }
  }

  async createTrashReport(reportData) {
    if (!reportData?.file) {
      return {
        success: false,
        error: 'Image file is required to create a trash report'
      };
    }

    try {
      const response = await aiAnalysisService.analyzeTrashImage(
        reportData.file,
        reportData.location || null,
        reportData.userNotes || null
      );

      if (!response.success) {
        throw new Error(response.error || 'Analysis failed');
      }

      return {
        success: true,
        reportId: response.reportId,
        analysis: response.data
      };
    } catch (error) {
      console.error('Trash report creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TrashReportService();
