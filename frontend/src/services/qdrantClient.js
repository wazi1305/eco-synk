/**
 * Centralised Qdrant client for the frontend. All direct interaction with the
 * vector database should go through this module so we have one place to handle
 * authentication, error handling, and retries.
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import { setMemoryCache, getMemoryCache } from '../utils/cache';

const QDRANT_URL = import.meta.env.VITE_QDRANT_URL;
const QDRANT_API_KEY = import.meta.env.VITE_QDRANT_API_KEY;
export const hasQdrantCredentials = Boolean(QDRANT_URL && QDRANT_API_KEY);

export class MissingQdrantCredentialsError extends Error {
  constructor(message = 'Qdrant credentials are missing. Please configure VITE_QDRANT_URL and VITE_QDRANT_API_KEY.') {
    super(message);
    this.name = 'MissingQdrantCredentialsError';
  }
}

const DEFAULT_TIMEOUT = 15000;
const MAX_PAGE_SIZE = 64;
const HEALTH_CACHE_KEY = 'qdrant::health';
const HEALTH_CACHE_TTL = 60000;

if (!QDRANT_URL) {
  console.warn('Qdrant URL is not configured. Set VITE_QDRANT_URL in your env file.');
}

export const qdrantCollections = {
  campaigns: import.meta.env.VITE_QDRANT_COLLECTION_CAMPAIGNS || 'campaigns',
  volunteers: import.meta.env.VITE_QDRANT_COLLECTION_VOLUNTEERS || 'volunteer_profiles',
  trashReports: import.meta.env.VITE_QDRANT_COLLECTION_TRASH_REPORTS || 'trash_reports'
};

let clientInstance = null;

const getClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!hasQdrantCredentials) {
    throw new MissingQdrantCredentialsError();
  }

  clientInstance = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    timeout: DEFAULT_TIMEOUT
  });

  return clientInstance;
};

export const qdrantHealthCheck = async () => {
  const cached = getMemoryCache(HEALTH_CACHE_KEY);
  if (cached) {
    return cached;
  }

  if (!QDRANT_URL) {
    return { healthy: false, error: 'Missing Qdrant URL' };
  }

  try {
    const response = await axios.get(`${QDRANT_URL}/health`, {
      headers: {
        'api-key': QDRANT_API_KEY
      },
      timeout: 4000
    });

    const result = {
      healthy: response.data?.status === 'ok',
      timestamp: new Date().toISOString()
    };

    setMemoryCache(HEALTH_CACHE_KEY, result, HEALTH_CACHE_TTL);
    return result;
  } catch (error) {
    const failure = {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    setMemoryCache(HEALTH_CACHE_KEY, failure, HEALTH_CACHE_TTL);
    return failure;
  }
};

const normaliseScrollResponse = (response) => {
  if (!response) {
    return { points: [], nextPageOffset: null };
  }

  if (Array.isArray(response)) {
    const [points, nextPageOffset] = response;
    return {
      points: points || [],
      nextPageOffset: nextPageOffset || null
    };
  }

  return {
    points: response.points || [],
    nextPageOffset: response.next_page_offset || null
  };
};

export const scrollCollection = async (
  collectionName,
  {
    limit = 100,
    filter = undefined,
    withVectors = false,
    offset = undefined
  } = {}
) => {
  const client = getClient();
  const aggregated = [];
  let nextOffset = offset;

  while (aggregated.length < limit) {
    const pageSize = Math.min(MAX_PAGE_SIZE, limit - aggregated.length);
    const response = await client.scroll({
      collection_name: collectionName,
      with_payload: true,
      with_vectors: withVectors,
      limit: pageSize,
      filter,
      offset: nextOffset
    });

    const { points, nextPageOffset } = normaliseScrollResponse(response);
    aggregated.push(...points);

    if (!nextPageOffset) {
      break;
    }
    nextOffset = nextPageOffset;
  }

  return aggregated;
};

export const searchCollection = async (
  collectionName,
  {
    vector,
    limit = 10,
    scoreThreshold = 0.5,
    filter = undefined,
    offset = undefined
  }
) => {
  if (!vector || !Array.isArray(vector) || vector.length === 0) {
    throw new Error('A valid vector is required to perform a search.');
  }

  const client = getClient();
  return client.search({
    collection_name: collectionName,
    query_vector: vector,
    limit,
    score_threshold: scoreThreshold,
    with_payload: true,
    with_vectors: false,
    filter,
    offset
  });
};

export const buildMatchFilter = (field, value) => ({
  must: [
    {
      key: field,
      match: {
        value
      }
    }
  ]
});

export const buildGeoFilter = (field, coordinates = {}, radiusKm = 5) => {
  if (
    typeof coordinates.lat !== 'number' ||
    typeof coordinates.lng !== 'number'
  ) {
    return null;
  }

  return {
    must: [
      {
        key: field,
        geo_radius: {
          center: {
            lat: coordinates.lat,
            lon: coordinates.lng
          },
          radius: radiusKm * 1000
        }
      }
    ]
  };
};

export default {
  getClient,
  qdrantHealthCheck,
  scrollCollection,
  searchCollection,
  buildMatchFilter,
  buildGeoFilter,
  collections: qdrantCollections,
  hasQdrantCredentials,
  MissingQdrantCredentialsError
};
