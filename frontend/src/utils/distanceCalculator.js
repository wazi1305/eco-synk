/**
 * Distance calculation utilities using Haversine formula
 * All calculations use free browser APIs and mathematical formulas
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude  
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} radians
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
};

/**
 * Sort campaigns by distance from user location
 * @param {Array} campaigns - Array of campaign objects
 * @param {Object} userLocation - User's current location {lat, lng}
 * @returns {Array} Campaigns sorted by distance
 */
export const sortByDistance = (campaigns, userLocation) => {
  if (!userLocation) return campaigns;
  
  return campaigns
    .map(campaign => ({
      ...campaign,
      distance: calculateDistance(
        userLocation.lat, 
        userLocation.lng,
        campaign.location.lat,
        campaign.location.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter campaigns by distance radius
 * @param {Array} campaigns - Array of campaign objects with distance
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Array} Filtered campaigns
 */
export const filterByDistance = (campaigns, maxDistance) => {
  return campaigns.filter(campaign => 
    campaign.distance <= maxDistance
  );
};

/**
 * Get user's current location using browser geolocation
 * @param {Object} options - Geolocation options
 * @returns {Promise} Promise resolving to user location or error
 */
export const getUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes cache
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to get your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      defaultOptions
    );
  });
};

/**
 * Get fallback location for Dubai (city center)
 * Used when user location is unavailable
 * @returns {Object} Default Dubai location
 */
export const getDefaultLocation = () => ({
  lat: 25.2048,
  lng: 55.2708,
  name: 'Dubai, UAE'
});

/**
 * Calculate map bounds to fit all campaigns
 * @param {Array} campaigns - Array of campaigns with location data
 * @param {Object} userLocation - Optional user location to include
 * @returns {Object} Map bounds {north, south, east, west}
 */
export const calculateMapBounds = (campaigns, userLocation = null) => {
  if (!campaigns.length) {
    const defaultLoc = getDefaultLocation();
    return {
      north: defaultLoc.lat + 0.01,
      south: defaultLoc.lat - 0.01,
      east: defaultLoc.lng + 0.01,
      west: defaultLoc.lng - 0.01
    };
  }

  const locations = [...campaigns.map(c => c.location)];
  if (userLocation) {
    locations.push(userLocation);
  }

  const lats = locations.map(loc => loc.lat);
  const lngs = locations.map(loc => loc.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
};