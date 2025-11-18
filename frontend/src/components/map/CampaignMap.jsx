import React from 'react';
import { Box, Text, VStack, Icon } from '@chakra-ui/react';
import { FiMap } from 'react-icons/fi';

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
  return (
    <Box 
      position="relative" 
      height={height}
      bg="gray.100"
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="md"
    >
      <VStack spacing={3} color="gray.500">
        <Icon as={FiMap} boxSize={12} />
        <Text fontSize="lg" fontWeight="medium">Map View</Text>
        <Text fontSize="sm" textAlign="center" maxW="200px">
          {campaigns.length} campaigns available
        </Text>
      </VStack>
    </Box>
  );
};

export default CampaignMap;