import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  IconButton,
  Spinner,
  useToast,
  Container,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
  Tooltip,
  Image,
} from '@chakra-ui/react';
import { FiMaximize2, FiMinimize2, FiMapPin, FiRefreshCw, FiCalendar, FiUsers } from 'react-icons/fi';
import MapView from './map/MapView';

import campaignService from '../services/campaignService';
import { normalizeCampaignList } from '../utils/campaignFormatter';
import { useAuth } from '../contexts/AuthContext';

const MapPage = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const toast = useToast();
  const mapViewRef = useRef(null);

  const loadCampaigns = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setError(null);
      setWarning(null);

      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await campaignService.getAllCampaigns({ limit: 200, forceRefresh });
        if (!response.success) {
          throw new Error(response.error || 'Unable to load campaigns');
        }

        const normalized = normalizeCampaignList(response.campaigns || []);
        const hydrated = normalized.filter(
          (campaign) => typeof campaign.location?.lat === 'number' && typeof campaign.location?.lng === 'number'
        );

        setCampaigns(hydrated);
        setDataSource(response.source);
        setLastUpdated(new Date());
        if (response.warning) {
          setWarning(response.warning);
        }
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError(err.message || 'Failed to load campaign data');
        toast({
          title: 'Error loading campaigns',
          description: err.message || 'Failed to load campaign data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleRefresh = () => {
    loadCampaigns({ forceRefresh: true });
  };

  // Handle campaign selection from map
  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
  };

  // Handle campaign join action
  const handleCampaignJoin = (campaign) => {
    if (!user) {
      toast({
        title: 'Session Starting',
        description: 'Hang tight—your demo account is still connecting.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!campaign?.joinable) {
      toast({
        title: 'Join not available',
        description: 'This campaign is outside your current region or distance range.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    toast({
      title: 'Campaign joined!',
      description: `You've successfully joined "${campaign.title}"`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle view campaign details
  const handleCampaignView = (campaign) => {
    setSelectedCampaign(campaign);
    toast({
      title: 'Campaign details',
      description: `Viewing details for "${campaign.title}"`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle view change (not needed for map-only page, but required by MapView)
  const handleViewChange = (view) => {
    // Map page only shows map view, no list toggle needed
    console.log('View change:', view);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleFindNearby = useCallback(() => {
    mapViewRef.current?.locateUser?.();
  }, []);

  // Calculate stats
  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    volunteers: campaigns.reduce((sum, c) => sum + (c.volunteers?.length || 0), 0),
    funding: campaigns.reduce((sum, c) => sum + (c.funding?.current || 0), 0),
  }), [campaigns]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8} bg="neutral.900" minH="100vh">
        <VStack spacing={6} align="center" justify="center" h="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <VStack spacing={2} textAlign="center">
            <Heading size="md" color="neutral.50" fontWeight="700">
              Loading campaign map...
            </Heading>
            <Text color="neutral.400">
              Fetching cleanup campaigns in your area
            </Text>
          </VStack>
        </VStack>
      </Container>
    );
  }

  // Fullscreen view
  if (isFullscreen) {
    return (
      <Box position="fixed" top="0" left="0" right="0" bottom="0" zIndex="1400" bg="neutral.900">
        {/* Fullscreen close button */}
        <IconButton
          icon={<FiMinimize2 />}
          position="absolute"
          bottom={{ base: "16px", md: "24px" }}
          left={{ base: "12px", md: "24px" }}
          zIndex="1500"
          colorScheme="red"
          variant="solid"
          size={{ base: "sm", md: "md" }}
          borderRadius="full"
          boxShadow="xl"
          onClick={toggleFullscreen}
          aria-label="Exit fullscreen"
          _hover={{
            transform: 'scale(1.05)',
            boxShadow: '2xl'
          }}
        />
        
        <Box height="100%" width="100%">
          <MapView
            ref={mapViewRef}
            campaigns={campaigns}
            onCampaignSelect={handleCampaignSelect}
            onCampaignJoin={handleCampaignJoin}
            onCampaignView={handleCampaignView}
            onViewChange={handleViewChange}
          />
        </Box>
      </Box>
    );
  }

  // Normal view with sidebar
  return (
    <Box 
      w="100%" 
      minH="calc(100vh - 80px)" // Minimum height to fill screen minus nav
      bg="neutral.900"
      overflowX="hidden"
      pb="80px" // Account for bottom navigation
      px={{ base: 2, md: 4 }}
      py={{ base: 3, md: 6 }}
    >
      <VStack spacing={{ base: 4, md: 6 }} align="stretch" maxW="container.xl" mx="auto">
        {/* Header */}
        <Box>
          <HStack justify="flex-end" align="center" spacing={{ base: 2, md: 4 }}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              borderColor="neutral.600"
              color="neutral.200"
              _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
            >
              Refresh
            </Button>
          </HStack>
        </Box>

        {(error || warning) && (
          <Box>
            {error && (
              <Alert status="error" borderRadius="12px" mb={warning ? 3 : 0} bg="rgba(245, 101, 101, 0.1)" border="1px solid" borderColor="red.500">
                <AlertIcon color="red.400" />
                <Text color="neutral.200">{error}</Text>
              </Alert>
            )}
            {warning && (
              <Alert status="warning" borderRadius="12px" bg="rgba(237, 137, 54, 0.1)" border="1px solid" borderColor="orange.500">
                <AlertIcon color="orange.400" />
                <Text color="neutral.200">{warning}</Text>
              </Alert>
            )}
          </Box>
        )}

        {/* Map Section */}
        <Card bg="neutral.800" border="1px solid" borderColor="neutral.700" borderRadius="12px">
          <CardBody p={0} position="relative">
            {/* Map header with fullscreen button */}
            <HStack justify="space-between" p={{ base: 2, md: 4 }} borderBottom="1px solid" borderColor="neutral.700">
              <HStack spacing={2} color="neutral.200">
                <FiMapPin />
                <Text fontWeight="600" fontSize={{ base: 'sm', md: 'md' }}>Campaign Locations</Text>
                <Badge bg="rgba(47, 212, 99, 0.1)" color="brand.500" border="1px solid" borderColor="brand.500" fontSize={{ base: 'xs', md: 'sm' }}>
                  {campaigns.length} locations
                </Badge>
                {isRefreshing && <Spinner size="sm" color="brand.500" ml={2} />}
              </HStack>
              <Button
                leftIcon={<FiMaximize2 />}
                size={{ base: 'xs', md: 'sm' }}
                variant="outline"
                colorScheme="brand"
                onClick={toggleFullscreen}
              >
                <Text display={{ base: 'none', md: 'inline' }}>Fullscreen</Text>
                <Text display={{ base: 'inline', md: 'none' }}>Full</Text>
              </Button>
            </HStack>
            
            {/* Map container - smaller height for normal view */}
            <Box 
              height={{ base: '250px', md: '350px', lg: '400px' }} 
              position="relative"
              overflow="hidden"
              borderBottomRadius="md"
              isolation="isolate"
            >
              <MapView
                ref={mapViewRef}
                campaigns={campaigns}
                onCampaignSelect={handleCampaignSelect}
                onCampaignJoin={handleCampaignJoin}
                onCampaignView={handleCampaignView}
                onViewChange={handleViewChange}
                isConstrained={true}
              />
            </Box>
          </CardBody>
        </Card>

        {/* Selected Campaign Details */}
        {selectedCampaign && (
          <Card bg="neutral.800" border="1px solid" borderColor="neutral.700" borderRadius="12px">
            <CardBody p={{ base: 3, md: 4 }}>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={{ base: 2, md: 3 }} flex={1}>
                    {selectedCampaign.heroImage ? (
                      <Image
                        src={selectedCampaign.heroImage}
                        alt={`${selectedCampaign.title} banner`}
                        boxSize={{ base: '48px', md: '64px' }}
                        objectFit="cover"
                        borderRadius="8px"
                        border="1px solid"
                        borderColor="neutral.700"
                      />
                    ) : (
                      <Text fontSize={{ base: 'xl', md: '2xl' }}>{selectedCampaign.image}</Text>
                    )}
                    <VStack align="start" spacing={1}>
                      <Heading size={{ base: 'sm', md: 'md' }} color="neutral.50" fontWeight="700">{selectedCampaign.title}</Heading>
                      <Text color="neutral.400" fontSize={{ base: 'xs', md: 'sm' }}>
                        {selectedCampaign.location.address}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge bg="brand.500" color="neutral.900" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600">
                    {selectedCampaign.difficulty}
                  </Badge>
                </HStack>

                <Text color="neutral.300" fontSize={{ base: 'sm', md: 'md' }}>
                  {selectedCampaign.description}
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 2, md: 4 }}>
                  <HStack spacing={2} color="neutral.300">
                    <FiCalendar color="var(--chakra-colors-neutral-400)" />
                    <Text fontSize="sm">
                      {new Date(selectedCampaign.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </HStack>
                  <HStack spacing={2} color="neutral.300">
                    <FiUsers color="var(--chakra-colors-neutral-400)" />
                    <Text fontSize="sm">
                      {selectedCampaign.volunteers.length}/{selectedCampaign.volunteerGoal} volunteers
                    </Text>
                  </HStack>
                  <HStack spacing={2} color="neutral.300">
                    <Text fontSize="sm">
                      💰 AED {selectedCampaign.funding.current.toLocaleString()}/{selectedCampaign.funding.goal.toLocaleString()}
                    </Text>
                  </HStack>
                </SimpleGrid>

                {!selectedCampaign.joinable && (
                  <Alert status="info" borderRadius="12px" fontSize="sm" bg="rgba(66, 153, 225, 0.1)" border="1px solid" borderColor="blue.500">
                    <AlertIcon color="blue.400" />
                    <Text color="neutral.200">
                      This campaign sits outside your eligible region. You can join campaigns in your country or nearby your current location.
                      {typeof selectedCampaign.joinCriteria?.distanceKm === 'number' && (
                        <>
                          {' '}It is approximately {selectedCampaign.joinCriteria.distanceKm.toFixed(1)} km from you.
                        </>
                      )}
                    </Text>
                  </Alert>
                )}

                <HStack spacing={{ base: 2, md: 3 }} flexDirection={{ base: 'column', sm: 'row' }}>
                  <Tooltip
                    label={selectedCampaign.joinable ? 'Join this cleanup effort' : 'Join requests are restricted to nearby or in-country campaigns'}
                    placement="top"
                    shouldWrapChildren
                  >
                    <Button
                      colorScheme="brand"
                      size={{ base: 'md', md: 'sm' }}
                      flex={1}
                      w={{ base: 'full', sm: 'auto' }}
                      minH="44px"
                      onClick={() => handleCampaignJoin(selectedCampaign)}
                      isDisabled={!selectedCampaign.joinable}
                    >
                      Join Campaign
                    </Button>
                  </Tooltip>
                  <Button
                    variant="outline"
                    size={{ base: 'md', md: 'sm' }}
                    flex={1}
                    w={{ base: 'full', sm: 'auto' }}
                    minH="44px"
                    onClick={() => handleCampaignView(selectedCampaign)}
                  >
                    View Details
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card bg="neutral.800" border="1px solid" borderColor="neutral.700" borderRadius="12px">
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" textAlign="center" color="neutral.50" fontWeight="700">
                Join the Movement
              </Heading>
              <Text textAlign="center" color="neutral.300">
                Every cleanup makes a difference. Find a campaign near you and help create a cleaner, greener Dubai.
              </Text>
              <HStack spacing={3} justify="center">
                <Button 
                  bg="brand.500" 
                  color="neutral.900" 
                  leftIcon={<FiMapPin />} 
                  onClick={handleFindNearby}
                  _hover={{ bg: 'brand.600' }}
                >
                  Find Nearby
                </Button>
                <Button 
                  variant="outline" 
                  leftIcon={<FiUsers />}
                  borderColor="neutral.700"
                  color="neutral.200"
                  _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
                >
                  Create Campaign
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default MapPage;