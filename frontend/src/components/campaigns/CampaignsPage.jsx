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
import DonationModal from './DonationModal';
import CampaignDetail from './CampaignDetail';
import JoinCampaignModal from './JoinCampaignModal';
import CreateCampaignForm from './CreateCampaignForm';
import campaignService from '../../services/campaignService';
import { normalizeCampaignForUI } from '../../utils/campaignFormatter';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

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
  <Box flex="1">
    {isLoading ? (
      <Center py={20}>
        <VStack spacing={4}>
          <Spinner size="lg" thickness="4px" color="brand.500" />
          <Text color="gray.500">Loading campaigns from Qdrant…</Text>
        </VStack>
      </Center>
    ) : campaigns.length === 0 ? (
      <VStack justify="center" align="center" h="full" spacing={4} py={12}>
        <Heading size="lg" textAlign="center" color="gray.600">
          {isEmpty ? 'No campaigns found' : 'No campaigns yet'}
        </Heading>
        <Text textAlign="center" color="gray.500" maxW="md">
          {isEmpty
            ? 'Try a different search term'
            : activeTab === 0
            ? 'Check back soon for new cleanup opportunities!'
            : 'Complete some campaigns to see them here'}
        </Text>
      </VStack>
    ) : (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} p={6} pb={6}>
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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
        setDataSource(response.source);
        setLastUpdated(new Date());
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
  const sourceLabel = useMemo(() => {
    if (!dataSource) {
      return null;
    }
    if (dataSource === 'network' || dataSource === 'qdrant') {
      return 'Live from Qdrant';
    }
    if (dataSource === 'memory') {
      return 'In-memory cache';
    }
    if (dataSource === 'local-cache' || dataSource === 'storage') {
      return 'Offline cache';
    }
    return dataSource;
  }, [dataSource]);

  const handleDonate = (campaign) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedCampaign(campaign);
    setShowDonationModal(true);
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleJoinCampaign = (campaign) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedCampaign(campaign);
    setShowJoinModal(true);
  };

  const handleCreateCampaign = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowCreateForm(true);
  };

  const handleDonationSubmit = (amount) => {
    if (selectedCampaign) {
      const updatedCampaigns = campaigns.map(c =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              funding: {
                ...(c.funding || {}),
                current: (c.funding?.current || 0) + amount,
              },
            }
          : c
      );
      setCampaigns(updatedCampaigns);
    }
    setShowDonationModal(false);
  };

  const handleCampaignCreated = (newCampaign) => {
    // Add new campaign to the list
    const normalizedCampaign = normalizeCampaignForUI(newCampaign);
    setCampaigns(prev => [normalizedCampaign, ...prev]);
    
    // Refresh campaigns to get latest data
    loadCampaigns({ forceRefresh: true });
  };

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden" className="safe-area-inset">
      {/* Header - Collapsible */}
      <Box
        bgGradient="linear(to-r, brand.600, brand.500)"
        color="white"
        px={4}
        pt={6}
        pb={4}
        className="safe-area-inset-top"
        flexShrink={0}
        boxShadow="sm"
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s ease"
        zIndex={20}
      >
        <VStack spacing={4} align="start">
          <Box>
            <Heading as="h1" size="lg" fontWeight="bold" letterSpacing="tight">
              Campaigns
            </Heading>
            <Text fontSize="sm" opacity={0.9} fontWeight="medium">
              Join cleanup initiatives in your community
            </Text>
          </Box>

          {/* Search Bar */}
          <Box w="full">
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search campaigns, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="lg"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                color="gray.900"
                _placeholder={{ color: 'gray.500' }}
                _focus={{ 
                  borderColor: 'brand.400', 
                  bg: 'white',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
                }}
                _hover={{ borderColor: 'gray.300' }}
              />
            </InputGroup>
          </Box>

          {/* Tabs in Header */}
          <Box w="full">
            <Tabs index={activeTab} onChange={setActiveTab}>
              <TabList border="none" gap={1}>
                <Tab 
                  fontWeight="600" 
                  fontSize="sm"
                  color="whiteAlpha.700"
                  _selected={{ 
                    color: 'white', 
                    bg: 'whiteAlpha.20', 
                    borderRadius: 'md'
                  }}
                  _hover={{ color: 'white', bg: 'whiteAlpha.10' }}
                  borderRadius="md"
                  px={4}
                  py={2}
                >
                  Active ({activeCampaigns.length})
                </Tab>
                <Tab 
                  fontWeight="600" 
                  fontSize="sm"
                  color="whiteAlpha.700"
                  _selected={{ 
                    color: 'white', 
                    bg: 'whiteAlpha.20', 
                    borderRadius: 'md'
                  }}
                  _hover={{ color: 'white', bg: 'whiteAlpha.10' }}
                  borderRadius="md"
                  px={4}
                  py={2}
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
                colorScheme="whiteAlpha"
                onClick={handleCreateCampaign}
                borderRadius="full"
              >
                + Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="whiteAlpha"
                leftIcon={<FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={isRefreshing}
                loadingText="Refreshing"
                borderRadius="full"
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

      {/* Donation Modal */}
      {showDonationModal && selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          onClose={() => setShowDonationModal(false)}
          onSubmit={handleDonationSubmit}
        />
      )}

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </Flex>
  );
};

export default CampaignsPage;