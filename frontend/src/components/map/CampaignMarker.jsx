import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Box, VStack, HStack, Text, Button, Badge, Tooltip } from '@chakra-ui/react';
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
  const canJoin = typeof campaign.joinable === 'boolean' ? campaign.joinable : true;
  const joinTooltip = canJoin
    ? 'Join this cleanup campaign'
    : 'Join requests are limited to campaigns in your country or nearby radius';

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
        <Box p={2} minW="200px" bg="neutral.800" borderRadius="md">
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" fontSize="sm" color="neutral.50">
              {campaign.campaign_name || campaign.title}
            </Text>
            
            <HStack>
              <Badge colorScheme={getStatusColor(campaign.status)} size="sm">
                {campaign.status || 'active'}
              </Badge>
            </HStack>
            
            {campaign.goals && (
              <VStack align="start" spacing={1} fontSize="xs" color="neutral.300">
                <Text>Target: ${campaign.goals.target_funding_usd}</Text>
                <Text>Volunteers: {campaign.goals.current_volunteers}/{campaign.goals.volunteer_goal}</Text>
              </VStack>
            )}
            
            <HStack spacing={2} pt={2}>
              <Button size="xs" bg="blue.500" color="white" _hover={{ bg: 'blue.600' }} onClick={() => onView?.()}>
                View
              </Button>
              <Tooltip label={joinTooltip} placement="top" shouldWrapChildren>
                <Button
                  size="xs"
                  bg="brand.500"
                  color="neutral.900"
                  _hover={{ bg: 'brand.600' }}
                  onClick={() => onJoin?.()}
                  isDisabled={!canJoin}
                  _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
                >
                  Join
                </Button>
              </Tooltip>
            </HStack>
          </VStack>
        </Box>
      </Popup>
    </Marker>
  );
};

export default CampaignMarker;