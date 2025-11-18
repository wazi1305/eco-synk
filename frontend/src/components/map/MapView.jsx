import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Button,
  useToast,
} from '@chakra-ui/react';
import CampaignMap from './CampaignMap';
import LocationButton from './LocationButton';
import MapControls from './MapControls';
import {
  sortByDistance,
  filterByDistance,
  getDefaultLocation,
  calculateDistance,
  getUserLocation,
} from '../../utils/distanceCalculator';

const REACH_DISTANCE_KM = 50;
const DEFAULT_DISTANCE_FILTER_KM = 25;

const MapView = forwardRef(({
  campaigns = [],
  onCampaignSelect,
  onCampaignJoin,
  onCampaignView,
  onViewChange,
  isConstrained = false,
}, ref) => {
  const [userLocation, setUserLocation] = useState(() => {
    // Initialize with default location
    return getDefaultLocation();
  });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: DEFAULT_DISTANCE_FILTER_KM,
    enableDistanceFilter: false,
    showCompleted: false,
    priority: null
  });
  const [userRegion, setUserRegion] = useState({ country: null, countryCode: null });
  const regionLookupRef = useRef(null);
  // Keeps track of whether the map should stay locked on the user's location.
  const [mapFocusMode, setMapFocusMode] = useState('default');
  // Switches between the interactive map and the campaign list mode.
  const [viewMode, setViewMode] = useState('map');

  const toast = useToast();

  const lookupUserRegion = useCallback(async (location) => {
    if (!location) {
      return;
    }

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (regionLookupRef.current === key) {
      return;
    }
    regionLookupRef.current = key;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=8&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EcoSynkMap/1.0 (+ecosynk.app)',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocode failed: ${response.status}`);
      }

      const data = await response.json();
      const address = data.address || {};

      setUserRegion({
        country: address.country || null,
        countryCode: address.country_code ? address.country_code.toUpperCase() : null,
      });
    } catch (error) {
      console.warn('Failed to determine user region', error);
      regionLookupRef.current = null;
    }
  }, []);

  useEffect(() => {
    lookupUserRegion(userLocation);
  }, [userLocation, lookupUserRegion]);

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

      if (filters.enableDistanceFilter && typeof filters.maxDistance === 'number') {
        filtered = filterByDistance(filtered, filters.maxDistance);
      }
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
  const preparedCampaigns = useMemo(() => {
    const normalizeCountryCode = (value) => {
      if (!value) {
        return null;
      }
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      if (typeof value === 'number') {
        return String(value).toUpperCase();
      }
      return String(value).toUpperCase();
    };

    return filteredCampaigns.map((campaign) => {
      const location = campaign.location || {};
      const toNumeric = (value) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      const latCandidate = location.lat ?? location.latitude ?? location.geo?.lat;
      const lngCandidate = location.lng ?? location.lon ?? location.longitude ?? location.geo?.lon;
      const lat = toNumeric(latCandidate);
      const lng = toNumeric(lngCandidate);

      const userLat = toNumeric(userLocation?.lat);
      const userLng = toNumeric(userLocation?.lng);

      let distance = Number.isFinite(campaign.distance) ? campaign.distance : null;
      if (distance === null && userLat !== null && userLng !== null && lat !== null && lng !== null) {
        distance = calculateDistance(userLat, userLng, lat, lng);
      }
      if (distance !== null) {
        distance = Number(distance.toFixed(2));
      }

      const normalizedLocation = {
        ...location,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        country: location.country || location?.context?.address?.country || null,
        countryCode: normalizeCountryCode(location.countryCode || location?.context?.address?.country_code || location.country_code),
      };

      const campaignCountryCode = normalizedLocation.countryCode;
      const userCountryCode = normalizeCountryCode(userRegion.countryCode);
      const campaignCountryName =
        typeof normalizedLocation.country === 'string' ? normalizedLocation.country.toLowerCase() : null;
      const userCountryName = typeof userRegion.country === 'string' ? userRegion.country.toLowerCase() : null;

      const sameCountry = Boolean(campaignCountryCode && userCountryCode)
        ? campaignCountryCode === userCountryCode
        : Boolean(campaignCountryName && userCountryName) && campaignCountryName === userCountryName;
      const withinReach = distance !== null && distance <= REACH_DISTANCE_KM;

      return {
        ...campaign,
        location: normalizedLocation,
        distance,
        joinable: sameCountry || withinReach,
        joinCriteria: {
          sameCountry,
          withinReach,
          distanceKm: distance,
          campaignCountry: normalizedLocation.country,
          userCountry: userRegion.country,
        },
      };
    });
  }, [filteredCampaigns, userLocation, userRegion]);
  const campaignCounts = getCampaignCounts();

  const resolveCampaignReference = useCallback(
    (candidate) => {
      if (!candidate) {
        return null;
      }

      if (typeof candidate.joinable === 'boolean' && typeof candidate.distance !== 'undefined') {
        return candidate;
      }

      const candidateId =
        candidate.id ||
        candidate.campaign_id ||
        candidate.metadata?.pointId ||
        null;

      if (!candidateId) {
        return candidate;
      }

      const match = preparedCampaigns.find((campaign) => {
        const campaignId = campaign.id || campaign.campaign_id || campaign.metadata?.pointId;
        return campaignId === candidateId;
      });

      return match || candidate;
    },
    [preparedCampaigns]
  );

  const handleCampaignSelect = useCallback(
    (campaign) => {
      const target = resolveCampaignReference(campaign);
      setSelectedCampaign(target);
      setMapFocusMode('default');
      onCampaignSelect && target && onCampaignSelect(target);
    },
    [onCampaignSelect, resolveCampaignReference]
  );

  useEffect(() => {
    if (!selectedCampaign) {
      return;
    }

    const selectedId =
      selectedCampaign.id ||
      selectedCampaign.campaign_id ||
      selectedCampaign.metadata?.pointId ||
      null;

    if (!selectedId) {
      return;
    }

    const updated = preparedCampaigns.find((campaign) => {
      const candidateId = campaign.id || campaign.campaign_id || campaign.metadata?.pointId;
      return candidateId === selectedId;
    });

    if (!updated) {
      return;
    }

    const prevDistance = Number.isFinite(selectedCampaign.distance) ? selectedCampaign.distance : null;
    const nextDistance = Number.isFinite(updated.distance) ? updated.distance : null;

    const joinChanged = selectedCampaign.joinable !== updated.joinable;
    const distanceChanged = prevDistance !== nextDistance;

    if (joinChanged || distanceChanged) {
      setSelectedCampaign(updated);
    }
  }, [preparedCampaigns, selectedCampaign]);

  // Handle location update
  const handleLocationUpdate = (location) => {
    setUserLocation(location);
    setIsLoadingLocation(false);

    setMapFocusMode('user');
    
    if (typeof location.accuracy === 'number' && location.accuracy > 1000) {
      toast({
        title: 'Location accuracy is low',
        description: 'Distance calculations may be approximate',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleJoinRequest = useCallback(
    (campaign) => {
      if (!campaign?.joinable) {
        toast({
          title: 'Join unavailable',
          description: 'This campaign is outside your current region or reach. Try expanding your filters or pick another nearby event.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      onCampaignJoin && onCampaignJoin(campaign);
    },
    [onCampaignJoin, toast]
  );

  const requestUserLocation = useCallback(async () => {
    setViewMode('map');
    setIsLoadingLocation(true);

    try {
      const location = await getUserLocation();
      handleLocationUpdate(location);

      toast({
        title: 'Location found!',
        description: `Accuracy: ±${Math.round(location.accuracy)}m`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Location request failed', error);

      const fallbackLocation = getDefaultLocation();
      handleLocationUpdate(fallbackLocation);

      toast({
        title: 'Location unavailable',
        description: `${error.message}. Using Dubai city center.`,
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [handleLocationUpdate, toast]);

  useImperativeHandle(
    ref,
    () => ({
      locateUser: requestUserLocation,
    }),
    [requestUserLocation]
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      if (mode !== 'map' && mode !== 'list') {
        return;
      }

      setViewMode(mode);

      if (mode === 'list') {
        setMapFocusMode('default');
      }

      onViewChange?.(mode);
    },
    [onViewChange]
  );

  const handleViewDetails = useCallback(
    (campaign) => {
      if (!campaign) {
        return;
      }

      handleCampaignSelect(campaign);
      onCampaignView?.(campaign);
    },
    [handleCampaignSelect, onCampaignView]
  );

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
      {/* Map or list container */}
      {viewMode === 'map' ? (
        <CampaignMap
          campaigns={preparedCampaigns}
          selectedCampaign={selectedCampaign}
          userLocation={userLocation}
          onCampaignSelect={handleCampaignSelect}
          onCampaignJoin={handleJoinRequest}
          onCampaignView={onCampaignView}
          center={mapCenter}
          zoom={mapZoom}
          height="100%"
          fitBounds={!selectedCampaign && preparedCampaigns.length > 0 && mapFocusMode !== 'user'}
          lockOnUser={mapFocusMode === 'user'}
        />
      ) : (
        <Box
          height="100%"
          overflowY="auto"
          bg="white"
          px={{ base: 3, md: 6 }}
          py={{ base: 3, md: 6 }}
        >
          {preparedCampaigns.length === 0 ? (
            <VStack spacing={4} py={10} color="gray.600">
              <Text fontWeight="semibold">No campaigns match your filters</Text>
              <Text fontSize="sm" textAlign="center">
                Try widening your distance filters or clearing the search terms to see more results.
              </Text>
            </VStack>
          ) : (
            <VStack spacing={4} align="stretch">
              {preparedCampaigns.map((campaign) => {
                const campaignId =
                  campaign.id ||
                  campaign.campaign_id ||
                  campaign.metadata?.pointId ||
                  campaign.title;
                const distanceLabel =
                  typeof campaign.distance === 'number'
                    ? `${campaign.distance.toFixed(1)} km away`
                    : null;

                return (
                  <Box
                    key={campaignId}
                    bg="gray.50"
                    borderRadius="lg"
                    boxShadow="sm"
                    p={{ base: 3, md: 4 }}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between" align="start" spacing={4}>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="semibold" fontSize="md" color="gray.800">
                            {campaign.title}
                          </Text>
                          {campaign.location?.address && (
                            <Text fontSize="sm" color="gray.600">
                              {campaign.location.address}
                            </Text>
                          )}
                          {distanceLabel && (
                            <Badge colorScheme="brand" width="fit-content">
                              {distanceLabel}
                            </Badge>
                          )}
                        </VStack>
                        <Badge colorScheme={campaign.joinable ? 'green' : 'red'}>
                          {campaign.joinable ? 'Joinable' : 'Out of reach'}
                        </Badge>
                      </HStack>

                      <HStack spacing={3} justify="flex-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(campaign)}
                        >
                          View details
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="brand"
                          onClick={() => handleJoinRequest(campaign)}
                          isDisabled={!campaign.joinable}
                        >
                          Join campaign
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      )}

      {/* Location Button - only show in fullscreen map mode */}
      {!isConstrained && viewMode === 'map' && (
        <LocationButton
          onLocationUpdate={handleLocationUpdate}
          onLocationStart={() => setIsLoadingLocation(true)}
          onRequestLocation={requestUserLocation}
          userLocation={userLocation}
          loading={isLoadingLocation}
        />
      )}

      {/* Map Controls - only show in fullscreen mode */}
      {!isConstrained && (
        <MapControls
          onViewChange={handleViewModeChange}
          currentView={viewMode}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          onFilterChange={handleFilterChange}
          filters={filters}
          campaignCounts={campaignCounts}
        />
      )}

      {/* Results Summary - only show in fullscreen mode */}
      {!isConstrained && viewMode === 'map' && (searchTerm || Object.entries(filters).some(([key, value]) => {
        if (key === 'maxDistance') {
          return filters.enableDistanceFilter && value !== DEFAULT_DISTANCE_FILTER_KM;
        }
        if (key === 'enableDistanceFilter') {
          return value === true;
        }
        return value !== null && value !== false;
      })) ? (
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
              {preparedCampaigns.length}
            </Badge>
            <Text fontSize="sm" fontWeight="medium">
              {preparedCampaigns.length === 1 ? 'campaign' : 'campaigns'} found
            </Text>
          </HStack>
        </Box>
      ) : null}

      {/* No Results Message - only show in fullscreen mode */}
      {!isConstrained && viewMode === 'map' && preparedCampaigns.length === 0 && campaigns.length > 0 && (
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
      {!isConstrained && viewMode === 'map' && isLoadingLocation && (
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
});

export default MapView;