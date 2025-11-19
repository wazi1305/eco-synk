import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Flex,
  Badge,
  Icon,
  Button,
  Center,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import CampaignCard from './CampaignCard';
// import DonationModal from './DonationModal';
import CampaignDetail from './CampaignDetail';
import JoinCampaignModal from './JoinCampaignModal';
import CreateCampaignForm from './CreateCampaignForm';
import campaignService from '../../services/campaignService';
import { normalizeCampaignForUI } from '../../utils/campaignFormatter';
import { useAuth } from '../../contexts/AuthContext';

// Campaign list component
const CampaignList = ({
  campaigns,
  isEmpty,
  isLoading,
  activeTab,
  onViewDetails,
  onJoin,
  onDonate
}) => (
  <Box flex="1" minH="calc(100vh - 200px)">
    {isLoading ? (
      <Center py={20}>
        <VStack spacing={4}>
          <Spinner size="lg" thickness="3px" color="brand.500" />
          <Text color="neutral.400" fontSize="sm">Loading campaigns from Qdrant…</Text>
        </VStack>
      </Center>
    ) : campaigns.length === 0 ? (
      <VStack justify="center" align="center" h="full" spacing={4} py={12} px={6}>
        <Box
          w="80px"
          h="80px"
          borderRadius="full"
          bg="neutral.800"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="2px solid"
          borderColor="neutral.700"
        >
          <Text fontSize="3xl">🌍</Text>
        </Box>
        <Heading size="lg" textAlign="center" color="neutral.200" fontWeight="600">
          {isEmpty ? 'No campaigns found' : 'No campaigns yet'}
        </Heading>
        <Text textAlign="center" color="neutral.400" maxW="md" lineHeight="1.6">
          {isEmpty
            ? 'Try a different search term or check back soon'
            : activeTab === 0
            ? 'Check back soon for new cleanup opportunities!'
            : 'Complete some campaigns to see them here'}
        </Text>
      </VStack>
    ) : (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} p={6} pb={6}>
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onViewDetails={() => onViewDetails(campaign)}
            onJoin={() => onJoin(campaign)}
            onDonate={() => onDonate(campaign)}
          />
        ))}
      </SimpleGrid>
    )}
  </Box>
);

const CampaignsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  const lastScrollYRef = useRef(0);

  const loadCampaigns = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setError(null);
      setWarning(null);

      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await campaignService.getAllCampaigns({
          forceRefresh,
          limit: 200,
        });

        if (!response.success) {
          throw new Error(response.error || 'Unable to load campaigns from Qdrant');
        }

        const normalized = (response.campaigns || []).map(normalizeCampaignForUI);

        setCampaigns(normalized);
        if (response.warning) {
          setWarning(response.warning);
        }
      } catch (err) {
        console.error('Campaign load failed:', err);
        setError(err.message || 'Unable to load campaigns right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleRefresh = useCallback(() => {
    loadCampaigns({ forceRefresh: true });
  }, [loadCampaigns]);

  // Simplified scroll handler
  const handleScroll = useCallback((e) => {
    const currentScrollY = e.target.scrollTop;

    if (currentScrollY < 30) {
      setShowHeader(true);
    } else if (currentScrollY > 100) {
      setShowHeader(currentScrollY <= lastScrollYRef.current);
    }

    lastScrollYRef.current = currentScrollY;
  }, []);

  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => c.status !== 'completed'),
    [campaigns]
  );

  const completedCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'completed'),
    [campaigns]
  );

  const getFilteredCampaigns = useCallback(
    (list) => {
      if (!searchTerm.trim()) {
        return list;
      }

      const term = searchTerm.trim().toLowerCase();
      return list.filter((campaign) => {
        const haystack = [
          campaign.title,
          campaign.description,
          campaign.location?.address,
          campaign.organizer?.name,
          campaign.hotspot?.district,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    },
    [searchTerm]
  );

  const filteredActive = useMemo(
    () => getFilteredCampaigns(activeCampaigns),
    [activeCampaigns, getFilteredCampaigns]
  );
  const filteredCompleted = useMemo(
    () => getFilteredCampaigns(completedCampaigns),
    [completedCampaigns, getFilteredCampaigns]
  );

  const isSearching = Boolean(searchTerm.trim());
  const listLoading = isLoading && campaigns.length === 0;
  const handleDonate = (campaign) => {
    if (!user) {
      console.warn('Demo user not ready. Donation skipped.', campaign?.title);
      return;
    }
    // Donation modal disabled
    console.log('Donate button clicked for:', campaign.title);
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleJoinCampaign = (campaign) => {
    if (!user) {
      console.warn('Demo user not ready. Join skipped.', campaign?.title);
      return;
    }
    setSelectedCampaign(campaign);
    setShowJoinModal(true);
  };

  // const handleDonationSubmit = (amount) => {
  //   if (selectedCampaign) {
  //     const updatedCampaigns = campaigns.map(c =>
  //       c.id === selectedCampaign.id
  //         ? {
  //             ...c,
  //             funding: {
  //               ...(c.funding || {}),
  //               current: (c.funding?.current || 0) + amount,
  //             },
  //           }
  //         : c
  //     );
  //     setCampaigns(updatedCampaigns);
  //   }
  //   setShowDonationModal(false);
  // };

  const handleCampaignCreated = (newCampaign) => {
    // Add new campaign to the list
    const normalizedCampaign = normalizeCampaignForUI(newCampaign);
    setCampaigns(prev => [normalizedCampaign, ...prev]);
    
    // Refresh campaigns to get latest data
    loadCampaigns({ forceRefresh: true });
  };

  return (
    <Flex direction="column" h="full" bg="neutral.900" overflow="hidden" className="safe-area-inset">
      {/* Header - Collapsible with modern design */}
      <Box
        bg="rgba(2, 2, 2, 0.95)"
        borderBottom="1px solid"
        borderColor="neutral.800"
        color="white"
        px={4}
        pt={6}
        pb={4}
        className="safe-area-inset-top"
        flexShrink={0}
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s ease"
        zIndex={20}
        backdropFilter="blur(20px)"
      >
        <VStack spacing={4} align="start">
          <Box>
            <Heading 
              as="h1" 
              size="xl" 
              fontWeight="700" 
              letterSpacing="-0.02em"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
            >
              Campaigns
            </Heading>
            <Text fontSize="sm" color="neutral.400" fontWeight="400">
              Join cleanup initiatives in your community
            </Text>
          </Box>

          {/* Search Bar */}
          <Box w="full">
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="neutral.500" />
              </InputLeftElement>
              <Input
                placeholder="Search campaigns, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="12px"
                bg="neutral.800"
                border="1px solid"
                borderColor="neutral.700"
                color="neutral.50"
                _placeholder={{ color: 'neutral.500' }}
                _focus={{ 
                  borderColor: 'brand.500', 
                  boxShadow: '0 0 0 1px #2fd463'
                }}
                _hover={{ borderColor: 'neutral.600' }}
              />
            </InputGroup>
          </Box>

          {/* Tabs in Header */}
          <Box w="full">
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList border="none" gap={2}>
                <Tab 
                  fontWeight="600" 
                  fontSize="sm"
                  color="neutral.400"
                  _selected={{ 
                    color: 'brand.500', 
                    bg: 'rgba(47, 212, 99, 0.1)', 
                    borderRadius: '10px',
                    borderBottom: '2px solid',
                    borderBottomColor: 'brand.500'
                  }}
                  _hover={{ color: 'neutral.200', bg: 'neutral.800' }}
                  borderRadius="10px"
                  px={4}
                  py={2}
                  transition="all 0.2s"
                >
                  Active ({activeCampaigns.length})
                </Tab>
                <Tab 
                  fontWeight="600" 
                  fontSize="sm"
                  color="neutral.400"
                  _selected={{ 
                    color: 'brand.500', 
                    bg: 'rgba(47, 212, 99, 0.1)', 
                    borderRadius: '10px',
                    borderBottom: '2px solid',
                    borderBottomColor: 'brand.500'
                  }}
                  _hover={{ color: 'neutral.200', bg: 'neutral.800' }}
                  borderRadius="10px"
                  px={4}
                  py={2}
                  transition="all 0.2s"
                >
                  Completed ({completedCampaigns.length})
                </Tab>
              </TabList>
            </Tabs>
          </Box>

          <Flex
            w="full"
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={3}
          >
            <Box />

            <HStack spacing={2}>
              <Button
                size="sm"
                bg="brand.500"
                color="neutral.900"
                onClick={() => {
                  if (!user) {
                    console.warn('Demo user not ready. Cannot open create form yet.');
                    return;
                  }
                  setShowCreateForm(true);
                }}
                borderRadius="full"
                _hover={{ bg: 'brand.600' }}
              >
                + Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor="neutral.700"
                color="neutral.200"
                leftIcon={<FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
                loadingText="Refreshing"
                borderRadius="full"
                _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
              >
                Refresh
              </Button>
            </HStack>
          </Flex>
        </VStack>
      </Box>

      {/* Main Content Container */}
      <Box 
        flex="1" 
        overflowY="auto"
        onScroll={handleScroll}
        pt={showHeader ? "280px" : "20px"}
        pb="80px"
        transition="padding-top 0.3s ease"
        position="relative"
      >
        {(error || warning) && (
          <Box px={6} pb={4}>
            {error && (
              <Alert status="error" borderRadius="lg" mb={warning ? 4 : 0}>
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

        {/* Campaign List */}
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabPanels>
            <TabPanel p={0}>
              <CampaignList 
                campaigns={filteredActive} 
                isEmpty={filteredActive.length === 0 && isSearching}
                isLoading={listLoading}
                activeTab={activeTab}
                onViewDetails={handleViewCampaign}
                onJoin={handleJoinCampaign}
                onDonate={handleDonate}
              />
            </TabPanel>
            <TabPanel p={0}>
              <CampaignList 
                campaigns={filteredCompleted} 
                isEmpty={filteredCompleted.length === 0 && isSearching}
                isLoading={listLoading}
                activeTab={activeTab}
                onViewDetails={handleViewCampaign}
                onJoin={handleJoinCampaign}
                onDonate={handleDonate}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Join Campaign Modal */}
      {showJoinModal && selectedCampaign && (
        <JoinCampaignModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          campaign={selectedCampaign}
        />
      )}

      {/* Donation flow intentionally disabled for the demo build. */}

      {/* Campaign Detail Modal */}
      {showCampaignDetail && selectedCampaign && (
        <CampaignDetail
          campaign={selectedCampaign}
          onClose={() => setShowCampaignDetail(false)}
        />
      )}

      {/* Create Campaign Form */}
      <CreateCampaignForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCampaignCreated}
      />
    </Flex>
  );
};

export default CampaignsPage;