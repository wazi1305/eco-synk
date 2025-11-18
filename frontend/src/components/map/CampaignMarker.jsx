import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react';
import L from 'leaflet';

// Custom marker icon for campaigns
const campaignIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CampaignMarker = ({ 
  campaign, 
  position,
  onSelect, 
  onJoin, 
  onView, 
  isSelected = false
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'completed': return 'gray';
      case 'urgent': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Marker 
      position={position} 
      icon={campaignIcon}
      eventHandlers={{
        click: () => onSelect?.()
      }}
    >
      <Popup>
        <Box p={2} minW="200px">
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" fontSize="sm">
              {campaign.campaign_name || campaign.title}
            </Text>
            
            <HStack>
              <Badge colorScheme={getStatusColor(campaign.status)} size="sm">
                {campaign.status || 'active'}
              </Badge>
            </HStack>
            
            {campaign.goals && (
              <VStack align="start" spacing={1} fontSize="xs">
                <Text>Target: ${campaign.goals.target_funding_usd}</Text>
                <Text>Volunteers: {campaign.goals.current_volunteers}/{campaign.goals.volunteer_goal}</Text>
              </VStack>
            )}
            
            <HStack spacing={2} pt={2}>
              <Button size="xs" colorScheme="blue" onClick={() => onView?.()}>
                View
              </Button>
              <Button size="xs" colorScheme="green" onClick={() => onJoin?.()}>
                Join
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Popup>
    </Marker>
  );
};

export default CampaignMarker;