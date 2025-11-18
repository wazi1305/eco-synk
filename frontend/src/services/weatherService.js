// OpenWeatherMap API - Free tier allows 1000 calls/day
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo'; // User needs to add their key
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export const getCurrentWeather = async (lat, lon) => {
  const url = new URL(`${OPENWEATHER_BASE_URL}/weather`);
  url.searchParams.append('lat', lat);
  url.searchParams.append('lon', lon);
  url.searchParams.append('appid', OPENWEATHER_API_KEY);
  url.searchParams.append('units', 'metric'); // Celsius

  console.log('🌤️ Fetching weather for:', { lat, lon });
  console.log('🔑 API key:', OPENWEATHER_API_KEY ? `${OPENWEATHER_API_KEY.substring(0, 8)}...` : 'NOT SET');
  console.log('🌐 Request URL:', url.toString());

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ Weather API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    
    if (response.status === 401) {
      throw new Error('Invalid API key. Get your free key at https://openweathermap.org/api');
    }
    
    throw new Error(`Weather API error: ${response.status} - ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Weather data received:', data);
  
  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    precipitation: data.rain ? Math.round((data.rain['1h'] || 0) * 100) : 0,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
    windDirection: data.wind.deg,
    cloudiness: data.clouds.all,
    visibility: Math.round(data.visibility / 1000), // Convert m to km
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
    pressure: data.main.pressure
  }
};

/**
 * Get weather forecast for next 5 days
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array>} Forecast data
 */
export const getWeatherForecast = async (lat, lon) => {
  try {
    const url = new URL(`${OPENWEATHER_BASE_URL}/forecast`);
    url.searchParams.append('lat', lat);
    url.searchParams.append('lon', lon);
    url.searchParams.append('appid', OPENWEATHER_API_KEY);
    url.searchParams.append('units', 'metric');
    url.searchParams.append('cnt', '8'); // Next 24 hours (3-hour intervals)

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return data.list.map(item => ({
      time: item.dt,
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      precipitation: item.pop * 100, // Probability of precipitation
      windSpeed: Math.round(item.wind.speed * 3.6)
    }));
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return [];
  }
};

/**
 * Get weather icon component based on condition
 * @param {string} condition - Weather condition
 * @returns {string} Icon name for react-icons
 */
export const getWeatherIconName = (condition) => {
  const iconMap = {
    'Clear': 'FiSun',
    'Clouds': 'FiCloud',
    'Rain': 'FiCloudRain',
    'Drizzle': 'FiCloudDrizzle',
    'Thunderstorm': 'FiCloudLightning',
    'Snow': 'FiCloudSnow',
    'Mist': 'FiCloud',
    'Fog': 'FiCloud',
    'Haze': 'FiCloud'
  };
  
  return iconMap[condition] || 'FiCloud';
};

/**
 * Get weather recommendation based on conditions
 * @param {Object} weather - Weather data
 * @returns {string} Recommendation text
 */
export const getWeatherRecommendation = (weather) => {
  if (!weather) return 'Check weather conditions before heading out.';
  
  const { temperature, condition, precipitation, windSpeed } = weather;
  
  if (precipitation > 60) {
    return '☔ High chance of rain. Bring waterproof gear and rain protection!';
  }
  
  if (temperature > 35) {
    return '🔥 Very hot! Bring extra water, sunscreen, and take frequent breaks.';
  }
  
  if (temperature > 30) {
    return '☀️ Hot weather. Stay hydrated and use sun protection!';
  }
  
  if (temperature < 15) {
    return '🧥 Cool weather. Bring warm layers and dress appropriately.';
  }
  
  if (windSpeed > 30) {
    return '💨 Windy conditions. Secure loose items and be cautious.';
  }
  
  if (condition === 'Clear' && temperature >= 20 && temperature <= 30) {
    return '✨ Perfect weather for outdoor activities! Enjoy!';
  }
  
  return '🌤️ Good weather conditions. Have a great time!';
};

/**
 * Parse location coordinates from campaign location data
 * @param {Object} location - Campaign location object
 * @returns {Object} { lat, lon } coordinates
 */
export const parseLocationCoordinates = (location) => {
  if (!location) {
    // Default to Dubai
    return { lat: 25.2048, lon: 55.2708 };
  }
  
  // If coordinates are provided directly
  if (location.coordinates) {
    return {
      lat: location.coordinates.lat || location.coordinates.latitude,
      lon: location.coordinates.lon || location.coordinates.lng || location.coordinates.longitude
    };
  }
  
  // If lat/lon are direct properties
  if (location.lat || location.latitude) {
    return {
      lat: location.lat || location.latitude,
      lon: location.lon || location.lng || location.longitude
    };
  }
  
  // Default to Dubai
  return { lat: 25.2048, lon: 55.2708 };
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getWeatherIconName,
  getWeatherRecommendation,
  parseLocationCoordinates
};
