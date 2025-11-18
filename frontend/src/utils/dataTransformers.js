import { calculateDistance } from './distanceCalculator';

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

const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`);
    const data = await response.json();
    
    if (data.address) {
      const addr = data.address;
      const parts = [];
      
      if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        parts.push(addr.road);
      }
      
      if (addr.neighbourhood) {
        parts.push(addr.neighbourhood);
      } else if (addr.suburb) {
        parts.push(addr.suburb);
      }
      
      if (addr.city) {
        parts.push(addr.city);
      } else if (addr.town) {
        parts.push(addr.town);
      }
      
      if (addr.state && !parts.includes(addr.state)) {
        parts.push(addr.state);
      }
      
      if (addr.country && !parts.includes(addr.country)) {
        parts.push(addr.country);
      }
      
      return parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const normalizeLocation = (locationPayload) => {
  if (!locationPayload) {
    return { lat: null, lng: null, address: 'Unknown location' };
  }
  const lat = locationPayload.lat ?? locationPayload.latitude ?? null;
  const lng = locationPayload.lng ?? locationPayload.lon ?? locationPayload.longitude ?? null;
  const address = locationPayload.address || locationPayload.label || `Lat ${lat?.toFixed?.(3) ?? 'N/A'}, Lon ${lng?.toFixed?.(3) ?? 'N/A'}`;

  return {
    lat: typeof lat === 'number' ? lat : null,
    lng: typeof lng === 'number' ? lng : null,
    address
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
