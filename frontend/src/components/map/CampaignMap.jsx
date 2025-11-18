import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CampaignMarker from './CampaignMarker';

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
  fitBounds = false
}) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current && fitBounds && campaigns.length > 0) {
      const bounds = L.latLngBounds(
        campaigns.map(campaign => [
          campaign.location?.lat || campaign.location?.latitude || 25.2048,
          campaign.location?.lng || campaign.location?.lon || campaign.location?.longitude || 55.2708
        ])
      );
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [campaigns, fitBounds]);

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
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
        
        {/* Campaign markers */}
        {campaigns.map((campaign) => {
          const lat = campaign.location?.lat || campaign.location?.latitude || 25.2048;
          const lng = campaign.location?.lng || campaign.location?.lon || campaign.location?.longitude || 55.2708;
          
          return (
            <CampaignMarker
              key={campaign.id || campaign.campaign_id}
              campaign={campaign}
              position={[lat, lng]}
              isSelected={selectedCampaign?.id === campaign.id}
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