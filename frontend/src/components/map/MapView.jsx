import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import CampaignMap from './CampaignMap';
import LocationButton from './LocationButton';
import MapControls from './MapControls';
import { 
  sortByDistance, 
  filterByDistance,
  getDefaultLocation 
} from '../../utils/distanceCalculator';

const MapView = ({ 
  campaigns = [],
  onCampaignSelect,
  onCampaignJoin,
  onCampaignView,
  onViewChange,
  isConstrained = false // New prop to handle constrained layouts
}) => {
  const [userLocation, setUserLocation] = useState(() => {
    // Initialize with default location
    return getDefaultLocation();
  });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 25,
    showCompleted: false,
    priority: null
  });

  const toast = useToast();

  // Calculate campaign priority
  const getPriority = useCallback((campaign) => {
    if (campaign.status === 'completed') return 'completed';
    
    const volunteerRatio = campaign.volunteers.length / campaign.volunteerGoal;
    const daysUntilEvent = Math.ceil(
      (new Date(campaign.date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilEvent <= 3 || volunteerRatio < 0.3) return 'high';
    if (daysUntilEvent <= 7 || volunteerRatio < 0.6) return 'medium';
    return 'low';
  }, []);

  // Filter and process campaigns
  const getFilteredCampaigns = useCallback(() => {
    let filtered = [...campaigns];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.organizer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by completion status
    if (!filters.showCompleted) {
      filtered = filtered.filter(campaign => campaign.status !== 'completed');
    }

    // Calculate distances and sort
    if (userLocation) {
      filtered = sortByDistance(filtered, userLocation);
      
      // Filter by distance
      filtered = filterByDistance(filtered, filters.maxDistance);
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(campaign => {
        const priority = getPriority(campaign);
        return priority === filters.priority;
      });
    }

    return filtered;
  }, [campaigns, searchTerm, filters, userLocation, getPriority]);

  // Get campaign counts by priority
  const getCampaignCounts = useCallback(() => {
    const counts = { high: 0, medium: 0, low: 0, completed: 0 };
    
    campaigns.forEach(campaign => {
      const priority = getPriority(campaign);
      counts[priority]++;
    });
    
    return counts;
  }, [campaigns, getPriority]);

  const filteredCampaigns = getFilteredCampaigns();
  const campaignCounts = getCampaignCounts();

  // Handle location update
  const handleLocationUpdate = (location) => {
    setUserLocation(location);
    setIsLoadingLocation(false);
    
    if (location.accuracy > 1000) {
      toast({
        title: 'Location accuracy is low',
        description: 'Distance calculations may be approximate',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle campaign selection from map
  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
    onCampaignSelect && onCampaignSelect(campaign);
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Calculate map center and zoom
  const getMapCenter = () => {
    if (selectedCampaign) {
      return {
        lat: selectedCampaign.location.lat,
        lng: selectedCampaign.location.lng
      };
    }
    return userLocation || getDefaultLocation();
  };

  const mapCenter = getMapCenter();
  const mapZoom = selectedCampaign ? 15 : 11;

  return (
    <Box position="relative" height="100%" bg="gray.50">
      {/* Map Container */}
      <CampaignMap
        campaigns={filteredCampaigns}
        selectedCampaign={selectedCampaign}
        userLocation={userLocation}
        onCampaignSelect={handleCampaignSelect}
        onCampaignJoin={onCampaignJoin}
        onCampaignView={onCampaignView}
        center={mapCenter}
        zoom={mapZoom}
        height="100%"
        fitBounds={!selectedCampaign && filteredCampaigns.length > 0}
      />

      {/* Location Button - only show in fullscreen mode */}
      {!isConstrained && (
        <LocationButton
          onLocationUpdate={handleLocationUpdate}
          userLocation={userLocation}
          loading={isLoadingLocation}
        />
      )}

      {/* Map Controls - only show in fullscreen mode */}
      {!isConstrained && (
        <MapControls
          onViewChange={onViewChange}
          currentView="map"
          onSearch={handleSearch}
          searchTerm={searchTerm}
          onFilterChange={handleFilterChange}
          filters={filters}
          campaignCounts={campaignCounts}
        />
      )}

      {/* Results Summary - only show in fullscreen mode */}
      {!isConstrained && (searchTerm || Object.values(filters).some(f => f !== null && f !== false && f !== 25)) ? (
        <Box
          position="absolute"
          bottom="20px"
          left="50%"
          transform="translateX(-50%)"
          bg="white"
          px={4}
          py={2}
          borderRadius="full"
          boxShadow="lg"
          zIndex={1000}
        >
          <HStack spacing={2}>
            <Badge colorScheme="brand" variant="solid">
              {filteredCampaigns.length}
            </Badge>
            <Text fontSize="sm" fontWeight="medium">
              {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'} found
            </Text>
          </HStack>
        </Box>
      ) : null}

      {/* No Results Message - only show in fullscreen mode */}
      {!isConstrained && filteredCampaigns.length === 0 && campaigns.length > 0 && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="xl"
          textAlign="center"
          maxW="300px"
          zIndex={1000}
        >
          <VStack spacing={3}>
            <Text fontSize="4xl">🔍</Text>
            <Text fontWeight="semibold" color="gray.900">
              No campaigns found
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Try expanding your search radius or clearing filters
            </Text>
          </VStack>
        </Box>
      )}

      {/* Loading State - only show in fullscreen mode */}
      {!isConstrained && isLoadingLocation && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="xl"
          zIndex={1000}
        >
          <VStack spacing={3}>
            <Spinner size="lg" color="brand.500" />
            <Text fontWeight="medium">
              Finding your location...
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default MapView;