import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { FiMaximize2, FiMinimize2, FiMapPin, FiRefreshCw, FiCalendar, FiUsers } from 'react-icons/fi';
import MapView from './map/MapView';

import campaignService from '../services/campaignService';
import { normalizeCampaignList } from '../utils/campaignFormatter';

const MapPage = () => {
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

  // Calculate stats
  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    volunteers: campaigns.reduce((sum, c) => sum + (c.volunteers?.length || 0), 0),
    funding: campaigns.reduce((sum, c) => sum + (c.funding?.current || 0), 0),
  }), [campaigns]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="center" justify="center" h="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <VStack spacing={2} textAlign="center">
            <Heading size="md" color="gray.700">
              Loading campaign map...
            </Heading>
            <Text color="gray.500">
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
      <Box position="fixed" top="0" left="0" right="0" bottom="0" zIndex="1400" bg="white">
        {/* Fullscreen close button */}
        <IconButton
          icon={<FiMinimize2 />}
          position="absolute"
          top={{ base: "10px", md: "20px" }}
          left={{ base: "10px", md: "20px" }}
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
      overflowX="hidden"
      pb="80px" // Account for bottom navigation
      px={{ base: 2, md: 4 }}
      py={{ base: 3, md: 6 }}
    >
      <VStack spacing={{ base: 4, md: 6 }} align="stretch" maxW="container.xl" mx="auto">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align={{ base: 'flex-start', md: 'center' }} spacing={{ base: 2, md: 4 }} flexWrap="wrap">
            <Box flex={1}>
              <Heading size={{ base: 'md', md: 'lg' }} mb={1}>
                Campaign Map
              </Heading>
              <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }} display={{ base: 'none', md: 'block' }}>
                Discover cleanup campaigns in your area and join the environmental movement
              </Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              Refresh
            </Button>
          </HStack>


        </Box>

        {(error || warning) && (
          <Box>
            {error && (
              <Alert status="error" borderRadius="lg" mb={warning ? 3 : 0}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            {warning && (
              <Alert status="warning" borderRadius="lg">
                <AlertIcon />
                {warning}
              </Alert>
            )}
          </Box>
        )}

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 4 }}>
          <Stat bg="white" p={{ base: 3, md: 4 }} borderRadius="lg" boxShadow="sm">
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Total Campaigns</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }} color="brand.600">{stats.total}</StatNumber>
          </Stat>
          <Stat bg="white" p={{ base: 3, md: 4 }} borderRadius="lg" boxShadow="sm">
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Active</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }} color="green.600">{stats.active}</StatNumber>
          </Stat>
          <Stat bg="white" p={{ base: 3, md: 4 }} borderRadius="lg" boxShadow="sm">
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Volunteers</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }} color="blue.600">{stats.volunteers}</StatNumber>
          </Stat>
          <Stat bg="white" p={{ base: 3, md: 4 }} borderRadius="lg" boxShadow="sm">
            <StatLabel fontSize={{ base: 'xs', md: 'sm' }}>Funding</StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: '2xl' }} color="purple.600">AED {Math.round(stats.funding / 1000)}K</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Map Section */}
        <Card>
          <CardBody p={0} position="relative">
            {/* Map header with fullscreen button */}
            <HStack justify="space-between" p={{ base: 2, md: 4 }} borderBottom="1px solid" borderColor="gray.200">
              <HStack spacing={2}>
                <FiMapPin />
                <Text fontWeight="semibold" fontSize={{ base: 'sm', md: 'md' }}>Campaign Locations</Text>
                <Badge colorScheme="brand" variant="subtle" fontSize={{ base: 'xs', md: 'sm' }}>
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
          <Card>
            <CardBody p={{ base: 3, md: 4 }}>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={{ base: 2, md: 3 }} flex={1}>
                    <Text fontSize={{ base: 'xl', md: '2xl' }}>{selectedCampaign.image}</Text>
                    <VStack align="start" spacing={1}>
                      <Heading size={{ base: 'sm', md: 'md' }}>{selectedCampaign.title}</Heading>
                      <Text color="gray.600" fontSize={{ base: 'xs', md: 'sm' }}>
                        {selectedCampaign.location.address}
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge colorScheme="brand" variant="solid" fontSize={{ base: 'xs', md: 'sm' }}>
                    {selectedCampaign.difficulty}
                  </Badge>
                </HStack>

                <Text color="gray.700" fontSize={{ base: 'sm', md: 'md' }}>
                  {selectedCampaign.description}
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 2, md: 4 }}>
                  <HStack spacing={2}>
                    <FiCalendar />
                    <Text fontSize="sm">
                      {new Date(selectedCampaign.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <FiUsers />
                    <Text fontSize="sm">
                      {selectedCampaign.volunteers.length}/{selectedCampaign.volunteerGoal} volunteers
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="sm">
                      💰 AED {selectedCampaign.funding.current.toLocaleString()}/{selectedCampaign.funding.goal.toLocaleString()}
                    </Text>
                  </HStack>
                </SimpleGrid>

                <HStack spacing={{ base: 2, md: 3 }} flexDirection={{ base: 'column', sm: 'row' }}>
                  <Button colorScheme="brand" size={{ base: 'md', md: 'sm' }} flex={1} w={{ base: 'full', sm: 'auto' }} minH="44px">
                    Join Campaign
                  </Button>
                  <Button variant="outline" size={{ base: 'md', md: 'sm' }} flex={1} w={{ base: 'full', sm: 'auto' }} minH="44px">
                    View Details
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" textAlign="center">
                Join the Movement
              </Heading>
              <Text textAlign="center" color="gray.600">
                Every cleanup makes a difference. Find a campaign near you and help create a cleaner, greener Dubai.
              </Text>
              <HStack spacing={3} justify="center">
                <Button colorScheme="brand" leftIcon={<FiMapPin />}>
                  Find Nearby
                </Button>
                <Button variant="outline" leftIcon={<FiUsers />}>
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