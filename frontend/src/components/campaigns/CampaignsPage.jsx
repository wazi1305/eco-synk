import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import CampaignCard from './CampaignCard';
import DonationModal from './DonationModal';
import CampaignDetail from './CampaignDetail';
import JoinCampaignModal from './JoinCampaignModal';

// Campaign list component
const CampaignList = ({ campaigns, isEmpty, activeTab, onViewDetails, onJoin, onDonate }) => (
  <Box flex="1">
    {campaigns.length === 0 ? (
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

// Mock campaign data
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    title: 'Jumeirah Beach Cleanup Drive',
    description: 'Join us for a massive beach cleanup at Jumeirah Beach. Help us remove plastic waste and protect marine life in the Arabian Gulf.',
    organizer: { name: 'Fatima Al Zahra', avatar: '👩' },
    location: { address: 'Jumeirah Beach, Dubai', lat: 25.2318, lng: 55.2592 },
    date: '2024-12-15T07:00:00Z',
    status: 'active',
    image: '🏖️',
    difficulty: 'easy',
    duration: 'Half Day',
    category: 'cleanup',
    volunteers: [
      { name: 'Ahmed Al Mansouri', avatar: '👨' },
      { name: 'Sara Ibrahim', avatar: '👩' },
      { name: 'Omar Al Hashemi', avatar: '👨' },
    ],
    volunteerGoal: 50,
    funding: {
      current: 8500,
      goal: 15000,
      donations: [],
    },
    materials: ['Biodegradable bags', 'Reusable gloves', 'Collection nets', 'Water bottles'],
    esgImpact: {
      co2Saved: 120,
      itemsCollected: 340,
      areaCleaned: 2.5,
    },
  },
  {
    id: '2',
    title: 'Al Salam Park Green Initiative',
    description: 'Help expand green spaces in Al Salam Park. Plant native UAE species and create sustainable landscaping for our community.',
    organizer: { name: 'Mohammed Al Rashid', avatar: '👨' },
    location: { address: 'Al Salam Park, Sharjah', lat: 25.3463, lng: 55.4208 },
    date: '2024-12-20T08:00:00Z',
    status: 'active',
    image: '🌳',
    difficulty: 'moderate',
    duration: 'Full Day',
    category: 'restoration',
    volunteers: [
      { name: 'Aisha Al Mansoori', avatar: '👩' },
      { name: 'Khalid Rahman', avatar: '👨' },
    ],
    volunteerGoal: 75,
    funding: {
      current: 12000,
      goal: 25000,
      donations: [],
    },
    materials: ['Native saplings', 'Irrigation tools', 'Mulch', 'Desert-adapted plants'],
    esgImpact: {
      co2Saved: 450,
      itemsCollected: 520,
      areaCleaned: 5.0,
    },
  },
  {
    id: '3',
    title: 'Dubai Creek Heritage Cleanup',
    description: 'Restore the historic Dubai Creek waterway. Remove debris and preserve this important cultural landmark for future generations.',
    organizer: { name: 'Layla Al Maktoum', avatar: '👩' },
    location: { address: 'Dubai Creek, Deira', lat: 25.2677, lng: 55.3103 },
    date: '2024-11-30T06:00:00Z',
    status: 'completed',
    image: '🚤',
    difficulty: 'difficult',
    duration: 'Full Day',
    category: 'cleanup',
    volunteers: [
      { name: 'Hassan Al Zaabi', avatar: '👨' },
      { name: 'Mariam Khalil', avatar: '👩' },
      { name: 'Yousef Al Amiri', avatar: '👨' },
      { name: 'Noor Al Sharqi', avatar: '👩' },
    ],
    volunteerGoal: 60,
    funding: {
      current: 18500,
      goal: 20000,
      donations: [],
    },
    materials: ['Waterproof gloves', 'Collection boats', 'Fishing nets', 'Safety equipment'],
    esgImpact: {
      co2Saved: 890,
      itemsCollected: 1240,
      areaCleaned: 8.5,
    },
  },
  {
    id: '4',
    title: 'Business Bay District Cleanup',
    description: 'Organize community members to clean Business Bay streets and enhance the urban environment in this bustling district.',
    organizer: { name: 'Amna Al Suwaidi', avatar: '👩' },
    location: { address: 'Business Bay, Dubai', lat: 25.1918, lng: 55.2683 },
    date: '2024-12-10T16:00:00Z',
    status: 'active',
    image: '🏢',
    difficulty: 'easy',
    duration: 'Half Day',
    category: 'cleanup',
    volunteers: [
      { name: 'Rashid Al Nuaimi', avatar: '👨' },
    ],
    volunteerGoal: 40,
    funding: {
      current: 1200,
      goal: 3000,
      donations: [],
    },
    materials: ['Brooms', 'Dustpans', 'Bags', 'Gloves'],
    esgImpact: {
      co2Saved: 60,
      itemsCollected: 180,
      areaCleaned: 1.2,
    },
  },
  {
    id: '5',
    title: 'Hajar Mountains Conservation',
    description: 'Help preserve the natural beauty of Hajar Mountains. Clear hiking trails and protect native desert wildlife habitats.',
    organizer: { name: 'Salem Al Kaabi', avatar: '👨' },
    location: { address: 'Hajar Mountains, RAK', lat: 25.9738, lng: 56.1333 },
    date: '2024-12-22T06:30:00Z',
    status: 'active',
    image: '🏜️',
    difficulty: 'moderate',
    duration: 'Full Day',
    category: 'conservation',
    volunteers: [
      { name: 'Hala Al Qasimi', avatar: '👩' },
      { name: 'Tariq Al Blooshi', avatar: '👨' },
      { name: 'Maryam Al Dhaheri', avatar: '👩' },
      { name: 'Saeed Al Marri', avatar: '👨' },
      { name: 'Latifa Al Shamsi', avatar: '👩' },
    ],
    volunteerGoal: 40,
    funding: {
      current: 9500,
      goal: 16000,
      donations: [],
    },
    materials: ['Trail markers', 'Native seeds', 'Water conservation tools', 'Wildlife cameras'],
    esgImpact: {
      co2Saved: 200,
      itemsCollected: 280,
      areaCleaned: 12.0,
    },
  },
];

const CampaignsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = React.useRef(0);

  // Simplified scroll handler
  const handleScroll = React.useCallback((e) => {
    const currentScrollY = e.target.scrollTop;
    
    if (currentScrollY < 30) {
      setShowHeader(true);
    } else if (currentScrollY > 100) {
      if (currentScrollY > lastScrollYRef.current) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
    }
    
    lastScrollYRef.current = currentScrollY;
  }, []);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  const getFilteredCampaigns = (list) =>
    list.filter(campaign =>
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredActive = getFilteredCampaigns(activeCampaigns);
  const filteredCompleted = getFilteredCampaigns(completedCampaigns);

  const handleDonate = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDonationModal(true);
  };

  const handleViewCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignDetail(true);
  };

  const handleJoinCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowJoinModal(true);
  };

  const handleDonationSubmit = (amount) => {
    if (selectedCampaign) {
      const updatedCampaigns = campaigns.map(c =>
        c.id === selectedCampaign.id
          ? {
              ...c,
              funding: {
                ...c.funding,
                current: c.funding.current + amount,
              },
            }
          : c
      );
      setCampaigns(updatedCampaigns);
    }
    setShowDonationModal(false);
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
        </VStack>
      </Box>

      {/* Main Content Container */}
      <Box 
        flex="1" 
        overflowY="auto"
        onScroll={handleScroll}
        pt={showHeader ? "220px" : "20px"}
        pb="80px"
        transition="padding-top 0.3s ease"
      >
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabPanels>
            <TabPanel p={0}>
              <CampaignList 
                campaigns={filteredActive} 
                isEmpty={filteredActive.length === 0 && searchTerm}
                activeTab={activeTab}
                onViewDetails={handleViewCampaign}
                onJoin={handleJoinCampaign}
                onDonate={handleDonate}
              />
            </TabPanel>
            <TabPanel p={0}>
              <CampaignList 
                campaigns={filteredCompleted} 
                isEmpty={filteredCompleted.length === 0 && searchTerm}
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
    </Flex>
  );
};

export default CampaignsPage;