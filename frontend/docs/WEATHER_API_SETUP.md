# Weather API Integration Guide

## Overview
The campaign modals now display real-time weather data using the OpenWeatherMap API.

## Setup Instructions

### 1. Get Your Free API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" (or "Get API Key")
3. Create a free account
4. Go to your API keys section
5. Copy your API key

**Free Tier Limits:**
- 1,000 API calls per day
- 60 calls per minute
- Current weather data
- 5-day / 3-hour forecast
- More than enough for development and moderate production use

### 2. Configure Environment Variables

1. Navigate to the `frontend` directory
2. Create a `.env` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Add your API key to `.env`:
   ```env
   VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
   ```

4. Restart your dev server to apply changes:
   ```bash
   npm run dev
   ```

### 3. How It Works

**Weather Service (`frontend/src/services/weatherService.js`):**
- Fetches current weather conditions based on campaign location coordinates
- Provides temperature, humidity, wind speed, precipitation chance
- Generates weather-based recommendations
- Falls back to mock data if API key is missing or request fails

**Integration Points:**
- `JoinCampaignModal`: Location & Weather tab displays real-time conditions
- Automatically uses campaign location coordinates
- Shows humidity, wind speed, rain probability
- Dynamic weather recommendations (e.g., "Bring extra water" for hot weather)

**Location Parsing:**
The service automatically extracts coordinates from campaign location data:
```javascript
// Supports various formats:
campaign.location.coordinates // { lat, lon }
campaign.location.lat         // Direct properties
campaign.location.latitude    // Alternative naming
// Falls back to Dubai (25.2048, 55.2708) if not found
```

### 4. Testing Without API Key

The app will work without an API key by using fallback mock data:
- Temperature: 28°C
- Condition: Clear
- Recommendation: Generic message

To test with real data:
1. Add your API key to `.env`
2. Ensure campaign has location coordinates
3. Open a campaign modal and navigate to "Location & Weather" tab
4. Weather data loads automatically

### 5. API Response Details

**Current Weather Includes:**
- Temperature (°C) and "feels like"
- Weather condition (Clear, Clouds, Rain, etc.)
- Description (e.g., "partly cloudy")
- Precipitation probability
- Humidity percentage
- Wind speed (km/h) and direction
- Cloudiness percentage
- Visibility (km)

**Smart Recommendations:**
- 🔥 Hot weather (>35°C): "Bring extra water and sunscreen"
- ☀️ Warm (>30°C): "Stay hydrated"
- 🧥 Cool (<15°C): "Bring warm layers"
- ☔ High rain (>60%): "Bring waterproof gear"
- 💨 Windy (>30km/h): "Secure loose items"
- ✨ Perfect conditions: "Enjoy the great weather!"

### 6. Troubleshooting

**Weather not loading?**
- Check console for errors
- Verify API key is correct in `.env`
- Ensure dev server was restarted after adding key
- Check you haven't exceeded free tier limits (1000/day)

**Coordinates not working?**
- Verify campaign location has coordinates
- Check browser console for coordinate parsing errors
- Service defaults to Dubai if coordinates missing

**API Key Not Working?**
- New keys can take 10 minutes to activate
- Verify you copied the entire key correctly
- Check no extra spaces in `.env` file

### 7. Production Deployment

**Environment Variables:**
- Add `VITE_OPENWEATHER_API_KEY` to your hosting platform
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Railway/Render: Add to environment configuration

**Rate Limiting:**
- Free tier: 1000 calls/day is ~41 calls/hour
- Cache weather data on backend if needed
- Consider upgrading if usage exceeds limits

### 8. Alternative Free Weather APIs

If you prefer a different service:

**Weather API (weatherapi.com):**
- 1 million calls/month free
- More generous limits
- Update `weatherService.js` accordingly

**Open-Meteo (open-meteo.com):**
- Completely free, no API key required
- European-based, good global coverage
- Update service to use their endpoint

## Example Usage

```javascript
import { getCurrentWeather, parseLocationCoordinates } from './services/weatherService';

// In your component
const coords = parseLocationCoordinates(campaign.location);
const weather = await getCurrentWeather(coords.lat, coords.lon);

console.log(weather);
// {
//   temperature: 28,
//   condition: 'Clear',
//   humidity: 45,
//   windSpeed: 12,
//   recommendation: '✨ Perfect weather for outdoor activities!'
// }
```

## Resources

- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [Current Weather API](https://openweathermap.org/current)
- [Weather Icons](https://react-icons.github.io/react-icons/icons?name=wi)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
