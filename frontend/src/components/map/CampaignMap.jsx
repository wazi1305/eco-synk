import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CampaignMarker from './CampaignMarker';

const userMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CampaignMap = ({
  campaigns = [],
  selectedCampaign = null,
  userLocation = null,
  onCampaignSelect,
  onCampaignJoin,
  onCampaignView,
  center = { lat: 25.2048, lng: 55.2708 },
  zoom = 11,
  height = '100%',
  fitBounds = false,
  lockOnUser = false,
}) => {
  const mapRef = useRef();

  const parseCoord = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  useEffect(() => {
    if (lockOnUser) {
      return;
    }

    if (mapRef.current && fitBounds && campaigns.length > 0) {
      const points = campaigns
        .map((campaign) => {
          const rawLat = campaign.location?.lat ?? campaign.location?.latitude ?? campaign.location?.geo?.lat;
          const rawLng = campaign.location?.lng ?? campaign.location?.lon ?? campaign.location?.longitude ?? campaign.location?.geo?.lon;
          const lat = parseCoord(rawLat);
          const lng = parseCoord(rawLng);
          return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
        })
        .filter(Boolean);

      if (points.length) {
        const bounds = L.latLngBounds(points);
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [campaigns, fitBounds, lockOnUser]);

  useEffect(() => {
    if (!lockOnUser || !mapRef.current || !userLocation) {
      return;
    }

    const lat = parseCoord(userLocation.lat);
    const lng = parseCoord(userLocation.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const mapInstance = mapRef.current;
    if (typeof mapInstance.flyTo !== 'function') {
      return;
    }

    const currentZoom = typeof mapInstance.getZoom === 'function' ? mapInstance.getZoom() : null;
    const targetZoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, 13) : Math.max(zoom, 13);

    mapInstance.flyTo([lat, lng], targetZoom, {
      animate: true,
      duration: 0.8,
    });
  }, [lockOnUser, userLocation, zoom]);

  return (
    <Box height={height} borderRadius="md" overflow="hidden">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* User location marker */}
        {(() => {
          const lat = parseCoord(userLocation?.lat);
          const lng = parseCoord(userLocation?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }
          return (
            <Marker position={[lat, lng]} icon={userMarkerIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          );
        })()}
        
        {/* Campaign markers */}
        {campaigns.map((campaign) => {
          const rawLat = campaign.location?.lat ?? campaign.location?.latitude ?? campaign.location?.geo?.lat;
          const rawLng = campaign.location?.lng ?? campaign.location?.lon ?? campaign.location?.longitude ?? campaign.location?.geo?.lon;
          const lat = parseCoord(rawLat);
          const lng = parseCoord(rawLng);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          const selectedId =
            selectedCampaign?.id ||
            selectedCampaign?.campaign_id ||
            selectedCampaign?.metadata?.pointId ||
            null;
          const campaignId = campaign.id || campaign.campaign_id || campaign.metadata?.pointId;
          const markerKey = campaignId || campaign.title || JSON.stringify(campaign.location);

          return (
            <CampaignMarker
              key={markerKey}
              campaign={campaign}
              position={[lat, lng]}
              isSelected={Boolean(selectedId && campaignId && selectedId === campaignId)}
              onSelect={() => onCampaignSelect?.(campaign)}
              onJoin={() => onCampaignJoin?.(campaign)}
              onView={() => onCampaignView?.(campaign)}
            />
          );
        })}
      </MapContainer>
    </Box>
  );
};

export default CampaignMap;