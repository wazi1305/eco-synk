import { calculateDistance } from './distanceCalculator';
import { API_BASE_URL } from '../services/apiConfig';

const AED_CONVERSION = 3.67;
const DEFAULT_ORGANIZER = { name: 'EcoSynk Operations', avatar: '🌱' };
const PRIORITY_EMOJI = {
  critical: '🚨',
  high: '🔥',
  medium: '🌿',
  low: '🧹',
  completed: '✅'
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const convertUsdToAed = (usdValue = 0) => {
  const usd = toNumber(usdValue, 0);
  return Math.round(usd * AED_CONVERSION);
};

const inferPriority = (score) => {
  if (score >= 8.5) return 'critical';
  if (score >= 6.5) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
};

const buildParticipants = (payload, fallbackCount = 0) => {
  if (Array.isArray(payload?.participants) && payload.participants.length) {
    return payload.participants.map((participant, idx) => ({
      name: participant.name || participant,
      avatar: participant.avatar || '🧑',
      id: participant.id || `${payload.campaign_id || 'participant'}_${idx}`
    }));
  }

  const count = Math.max(fallbackCount, payload?.goals?.current_volunteers || 0);
  return Array.from({ length: Math.min(count, 8) }, (_, idx) => ({
    name: `Volunteer ${idx + 1}`,
    avatar: ['🧑‍🤝‍🧑', '🧑🏻', '🧑🏽', '🧑🏾'][idx % 4],
    id: `${payload?.campaign_id || 'vol'}_${idx}`
  }));
};

const computeDaysRemaining = (endDate) => {
  if (!endDate) {
    return 0;
  }
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) {
    return 0;
  }
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const reverseGeocodeCache = new Map();

// Request queue to prevent network congestion
const geocodeQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 5;

const processGeocodeQueue = () => {
  while (activeRequests < MAX_CONCURRENT_REQUESTS && geocodeQueue.length > 0) {
    const { lat, lng, resolve, reject } = geocodeQueue.shift();
    activeRequests++;
    
    performReverseGeocode(lat, lng)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeRequests--;
        processGeocodeQueue();
      });
  }
};

const buildAddressLabel = (address, displayName, fallback) => {
  if (!address || typeof address !== 'object') {
    return displayName || fallback;
  }

  const parts = [];

  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`);
  } else if (address.road) {
    parts.push(address.road);
  }

  if (address.neighbourhood) {
    parts.push(address.neighbourhood);
  } else if (address.suburb) {
    parts.push(address.suburb);
  }

  if (address.city) {
    parts.push(address.city);
  } else if (address.town) {
    parts.push(address.town);
  }

  if (address.state && !parts.includes(address.state)) {
    parts.push(address.state);
  }

  if (address.country && !parts.includes(address.country)) {
    parts.push(address.country);
  }

  if (parts.length === 0) {
    return displayName || fallback;
  }

  return parts.join(', ');
};

// Core geocoding function (internal use only)
const performReverseGeocode = async (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const fallbackLabel = 'Unknown location';
  const languageKey = 'en';

  try {
    const params = new URLSearchParams({
      lat: latNum.toString(),
      lon: lngNum.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/geocode/reverse?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': languageKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    const payload = await response.json();
    const address = payload?.address || payload?.context?.address;
    const displayName = payload?.label || payload?.display_name || payload?.context?.display_name;
    const label = buildAddressLabel(address, displayName, fallbackLabel);

    return label;
  } catch (error) {
    console.warn('reverseGeocode error', error);
    return fallbackLabel;
  }
};

// Public API with queue throttling
export const reverseGeocode = async (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return 'Unknown location';
  }

  const languageKey = 'en';
  const cacheKey = `${latNum.toFixed(5)},${lngNum.toFixed(5)}|${languageKey}`;
  
  // Return cached result immediately
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  // Queue the request to avoid network congestion
  return new Promise((resolve, reject) => {
    geocodeQueue.push({ lat: latNum, lng: lngNum, resolve: (result) => {
      reverseGeocodeCache.set(cacheKey, result);
      resolve(result);
    }, reject });
    processGeocodeQueue();
  });
};

const toCoordinate = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const normalizeLocation = (locationPayload) => {
  if (!locationPayload) {
    return { lat: null, lng: null, lon: null, address: 'Unknown location' };
  }

  const candidate =
    locationPayload.geo ||
    locationPayload.coordinates ||
    locationPayload.position ||
    locationPayload;

  let lat =
    candidate.lat ??
    candidate.latitude ??
    candidate.y ??
    null;
  let lng =
    candidate.lng ??
    candidate.lon ??
    candidate.longitude ??
    candidate.x ??
    null;

  if (Array.isArray(candidate)) {
    // Assume [lon, lat] GeoJSON ordering
    lng = candidate[0];
    lat = candidate[1];
  } else if (Array.isArray(candidate.coordinates)) {
    lng = candidate.coordinates[0];
    lat = candidate.coordinates[1];
  } else {
    const geojsonCoords =
      locationPayload.coordinates ||
      locationPayload.geojson?.coordinates ||
      locationPayload.geometry?.coordinates ||
      locationPayload.position?.coordinates;
    if (Array.isArray(geojsonCoords)) {
      lng = geojsonCoords[0];
      lat = geojsonCoords[1];
    }
  }

  const parsedLat = toCoordinate(lat);
  const parsedLng = toCoordinate(lng);

  const context = locationPayload.context || locationPayload.metadata?.context || null;
  const contextAddress = context?.address;
  const contextName = context?.name || context?.display_name;

  const directAddress = locationPayload.address;
  const label =
    locationPayload.label ||
    locationPayload.name ||
    locationPayload.display_name ||
    contextName ||
    null;

  let structuredAddress = null;
  if (directAddress && typeof directAddress === 'string') {
    structuredAddress = directAddress;
  } else if (directAddress && typeof directAddress === 'object') {
    structuredAddress = buildAddressLabel(directAddress, contextName || label, null);
  }

  if (!structuredAddress && contextAddress) {
    if (typeof contextAddress === 'string') {
      structuredAddress = contextAddress;
    } else if (typeof contextAddress === 'object') {
      structuredAddress = buildAddressLabel(contextAddress, contextName || label, null);
    }
  }

  const rawCountry =
    contextAddress?.country ||
    locationPayload.country ||
    locationPayload.countryName ||
    locationPayload.country_name ||
    null;

  const rawCountryCode =
    contextAddress?.country_code ||
    locationPayload.countryCode ||
    locationPayload.country_code ||
    null;

  const normalizedCountryCode =
    typeof rawCountryCode === 'string'
      ? rawCountryCode.toUpperCase()
      : rawCountryCode != null
        ? String(rawCountryCode).toUpperCase()
        : null;

  const fallback =
    structuredAddress ||
    label ||
    contextName ||
    locationPayload.display_name ||
    (contextAddress?.country ? contextAddress.country : null) ||
    'Unknown location';

  return {
    lat: parsedLat,
    lng: parsedLng,
    lon: parsedLng,
    name: label || null,
    displayName: contextName || locationPayload.display_name || null,
    address: structuredAddress || fallback,
    context: context || null,
    country: rawCountry || null,
    countryCode: normalizedCountryCode,
  };
};

const deriveCampaignImage = (priority, materials = []) => {
  if (priority === 'critical') return '🚨';
  if (priority === 'high') return '🔥';
  const primaryMaterial = materials[0];
  switch (primaryMaterial) {
    case 'plastic':
      return '🧴';
    case 'metal':
      return '⚙️';
    case 'organic':
      return '🌿';
    case 'hazardous':
      return '☢️';
    default:
      return PRIORITY_EMOJI[priority] || '♻️';
  }
};

const determineBadge = (cleanupCount = 0) => {
  if (cleanupCount >= 50) return 'Legend';
  if (cleanupCount >= 35) return 'Champion';
  if (cleanupCount >= 20) return 'Expert';
  if (cleanupCount >= 10) return 'Advocate';
  return 'Rookie';
};

export const getBadgeForCleanupCount = determineBadge;

export const transformQdrantCampaign = async (payload, options = {}) => {
  if (!payload) {
    return null;
  }

  let location = normalizeLocation(payload.location);
  const banner = payload.banner || payload.media?.banner || null;
  const heroImage = banner?.data_url || banner?.image_url || null;
  
  // If no address but has coordinates, try reverse geocoding
  if (location.lat && location.lng && (!payload.location?.address && !payload.location?.label)) {
    try {
      const geocodedAddress = await reverseGeocode(location.lat, location.lng);
      location.address = geocodedAddress;
    } catch (error) {
      // Keep the default address if geocoding fails
    }
  }
  const priorityScore = payload.hotspot?.average_priority ?? payload.priority_score ?? 5;
  const priority = payload.status === 'completed' ? 'completed' : inferPriority(priorityScore);
  const organizer = payload.organizer || DEFAULT_ORGANIZER;
  const timeline = payload.timeline || {};
  const startDate = timeline.start_date || payload.created_at || null;
  const endDate = timeline.end_date || null;
  const durationDays = timeline.duration_days || 30;
  const daysRemaining = computeDaysRemaining(endDate);
  const volunteerGoal = payload.goals?.volunteer_goal || payload.volunteer_goal || 25;
  const volunteerCount = payload.goals?.current_volunteers || 0;
  const volunteers = buildParticipants(payload, volunteerCount);

  const fundingUsdCurrent = payload.goals?.current_funding_usd ?? payload.funding?.current ?? 0;
  const fundingUsdGoal = payload.goals?.target_funding_usd ?? payload.funding?.goal ?? 0;
  const impactEstimates = payload.impact_estimates || {};
  const areaCleanedEstimate = impactEstimates.estimated_area_cleaned_km2 ?? (impactEstimates.estimated_volunteer_hours || 0) / 10;

  return {
    id: payload.campaign_id || options.pointId || payload.id,
    title: payload.campaign_name || payload.title || 'EcoSynk Campaign',
    description: payload.description || payload.hotspot?.summary || 'Community cleanup campaign managed via EcoSynk.',
    status: payload.status || 'active',
    location,
    priority,
    image: deriveCampaignImage(priority, payload.hotspot?.materials),
    heroImage,
    banner,
    date: startDate,
    organizer,
    funding: {
      current: convertUsdToAed(fundingUsdCurrent),
      goal: convertUsdToAed(fundingUsdGoal),
      currency: 'AED'
    },
    volunteers,
    volunteerSummary: {
      participants: volunteers,
      current: volunteerCount || volunteers.length,
      goal: volunteerGoal
    },
    volunteerGoal,
    esgImpact: {
      itemsCollected: Math.round(impactEstimates.estimated_waste_kg ?? 0),
      areaCleaned: Number(areaCleanedEstimate || 0),
      co2Saved: Math.round(impactEstimates.estimated_co2_reduction_kg ?? 0)
    },
    hotspot: payload.hotspot,
    goals: payload.goals,
    timeline: {
      startDate,
      endDate,
      durationDays,
      daysRemaining
    },
    metadata: {
      pointId: options.pointId,
      raw: payload
    }
  };
};

export const transformQdrantVolunteer = async (payload, options = {}) => {
  if (!payload) {
    return null;
  }

  let location = normalizeLocation(payload.location || payload.metadata?.location || null);
  
  // If no address but has coordinates, try reverse geocoding
  const locationData = payload.location || payload.metadata?.location;
  if (location.lat && location.lng && (!locationData?.address && !locationData?.label)) {
    try {
      const geocodedAddress = await reverseGeocode(location.lat, location.lng);
      location.address = geocodedAddress;
    } catch (error) {
      // Keep the default address if geocoding fails
    }
  }
  const pastCleanupCount = payload.past_cleanup_count ?? payload.stats?.cleanups ?? 0;
  const volunteer = {
    id: payload.user_id || payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    skills: payload.skills || [],
    experienceLevel: payload.experience_level || 'beginner',
    materialsExpertise: payload.materials_expertise || [],
    specializations: payload.specializations || [],
    equipmentOwned: payload.equipment_owned || [],
    location,
    available: payload.available !== false,
    pastCleanupCount,
    hoursContributed: payload.hours_contributed || 0,
    badge: payload.badge || determineBadge(pastCleanupCount),
    rank: payload.rank,
    bio: payload.bio,
    profilePictureUrl: payload.profile_picture_url,
    metadata: payload,
    distanceKm: null,
    matchScore: options.matchScore || null
  };

  if (options.referenceLocation && volunteer.location.lat && volunteer.location.lng) {
    volunteer.distanceKm = Number(
      calculateDistance(
        options.referenceLocation.lat,
        options.referenceLocation.lng,
        volunteer.location.lat,
        volunteer.location.lng
      ).toFixed(1)
    );
  }

  if (typeof options.matchScore === 'number') {
    volunteer.matchScore = Number(options.matchScore.toFixed(3));
  }

  return volunteer;
};

export const transformQdrantTrashReport = async (payload, options = {}) => {
  if (!payload) {
    return null;
  }
  const metadata = payload.metadata || {};
  let location = normalizeLocation(metadata.location || payload.location || null);
  
  // If no address but has coordinates, try reverse geocoding
  const locationData = metadata.location || payload.location;
  if (location.lat && location.lng && (!locationData?.address && !locationData?.label)) {
    try {
      const geocodedAddress = await reverseGeocode(location.lat, location.lng);
      location.address = geocodedAddress;
    } catch (error) {
      // Keep the default address if geocoding fails
    }
  }
  const timestamp = payload.timestamp || metadata.analyzed_at || metadata.timestamp || null;

  const report = {
    id: payload.report_id || payload.id,
    primaryMaterial: payload.primary_material || metadata.primary_material || 'mixed',
    estimatedVolume: payload.estimated_volume || metadata.estimated_volume || 'medium',
    description: payload.description || metadata.description || 'Cleanup report generated by EcoSynk AI',
    cleanupPriority: payload.cleanup_priority_score || metadata.cleanup_priority_score || 5,
    recyclable: payload.recyclable ?? metadata.recyclable ?? false,
    riskLevel: payload.environmental_risk_level || metadata.environmental_risk_level || 'medium',
    recommendedEquipment: payload.recommended_equipment || metadata.recommended_equipment || [],
    location,
    timestamp,
    confidenceScore: payload.confidence_score || metadata.confidence_score,
    metadata: payload
  };

  if (options.referenceLocation && report.location.lat && report.location.lng) {
    report.distanceKm = Number(
      calculateDistance(
        options.referenceLocation.lat,
        options.referenceLocation.lng,
        report.location.lat,
        report.location.lng
      ).toFixed(1)
    );
  }

  return report;
};
