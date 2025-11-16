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

// Campaign list component
const CampaignList = ({ campaigns, isEmpty, activeTab, onViewDetails, onDonate }) => (
  <Box flex="1" overflowY="auto">
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
      <VStack spacing={4} p={4} pb={6}>
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onViewDetails={() => onViewDetails(campaign)}
            onDonate={() => onDonate(campaign)}
          />
        ))}
      </VStack>
    )}
  </Box>
);

// Mock campaign data
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    title: 'Beach Cleanup Drive',
    description: 'Join us for a massive beach cleanup at Coral Bay. Help us remove plastic waste and protect marine life.',
    organizer: { name: 'Sarah Chen', avatar: '👩' },
    location: { address: 'Coral Bay, CA', lat: 34.0195, lng: -118.4912 },
    date: '2024-12-15T09:00:00Z',
    status: 'active',
    image: '🏖️',
    volunteers: [
      { name: 'John Doe', avatar: '👨' },
      { name: 'Jane Smith', avatar: '👩' },
      { name: 'Mike Johnson', avatar: '👨' },
    ],
    volunteerGoal: 50,
    funding: {
      current: 2450,
      goal: 5000,
      donations: [],
    },
    materials: ['Plastic bags', 'Nets', 'Bottles', 'Cans'],
    esgImpact: {
      co2Saved: 120,
      itemsCollected: 340,
      areaCleaned: 2.5,
    },
  },
  {
    id: '2',
    title: 'Urban Park Restoration',
    description: 'Help restore Central Park to its natural beauty. Remove invasive species and plant native trees.',
    organizer: { name: 'Alex Rivera', avatar: '👨' },
    location: { address: 'Central Park, NY', lat: 40.7829, lng: -73.9654 },
    date: '2024-12-20T10:00:00Z',
    status: 'active',
    image: '🌲',
    volunteers: [
      { name: 'Emma Wilson', avatar: '👩' },
      { name: 'David Brown', avatar: '👨' },
    ],
    volunteerGoal: 100,
    funding: {
      current: 3800,
      goal: 8000,
      donations: [],
    },
    materials: ['Tools', 'Seeds', 'Mulch', 'Saplings'],
    esgImpact: {
      co2Saved: 450,
      itemsCollected: 520,
      areaCleaned: 5.0,
    },
  },
  {
    id: '3',
    title: 'River Cleanup Initiative',
    description: 'Remove trash from our local river. Kayak and boat donations welcome!',
    organizer: { name: 'Tom Martinez', avatar: '👨' },
    location: { address: 'Hudson River, NY', lat: 40.7489, lng: -74.0008 },
    date: '2024-11-30T08:00:00Z',
    status: 'completed',
    image: '🌊',
    volunteers: [
      { name: 'Lisa Chen', avatar: '👩' },
      { name: 'Mark Davis', avatar: '👨' },
      { name: 'Sarah Johnson', avatar: '👩' },
      { name: 'Kevin Lee', avatar: '👨' },
    ],
    volunteerGoal: 75,
    funding: {
      current: 5200,
      goal: 6000,
      donations: [],
    },
    materials: ['Nets', 'Gloves', 'Bags', 'Kayaks'],
    esgImpact: {
      co2Saved: 890,
      itemsCollected: 1240,
      areaCleaned: 8.5,
    },
  },
  {
    id: '4',
    title: 'Downtown Street Cleanup',
    description: 'Organize community members to clean downtown streets and improve neighborhood aesthetics.',
    organizer: { name: 'Maria Garcia', avatar: '👩' },
    location: { address: 'Downtown District, SF', lat: 37.7749, lng: -122.4194 },
    date: '2024-12-10T14:00:00Z',
    status: 'active',
    image: '🏙️',
    volunteers: [
      { name: 'James Wilson', avatar: '👨' },
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
    title: 'Forest Trail Maintenance',
    description: 'Help maintain local forest trails by clearing debris and planting native species.',
    organizer: { name: 'Chris Anderson', avatar: '👨' },
    location: { address: 'Redwood Forest, CA', lat: 41.2132, lng: -124.0046 },
    date: '2024-12-22T11:00:00Z',
    status: 'active',
    image: '🌲',
    volunteers: [
      { name: 'Rachel Green', avatar: '👩' },
      { name: 'Paul Harris', avatar: '👨' },
      { name: 'Nina Patel', avatar: '👩' },
      { name: 'Ryan Cooper', avatar: '👨' },
      { name: 'Julia White', avatar: '👩' },
    ],
    volunteerGoal: 30,
    funding: {
      current: 2100,
      goal: 4000,
      donations: [],
    },
    materials: ['Rakes', 'Shovels', 'Chainsaws', 'Seeds'],
    esgImpact: {
      co2Saved: 200,
      itemsCollected: 280,
      areaCleaned: 3.0,
    },
  },
];

const CampaignsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [windowHeight, setWindowHeight] = useState('100vh');
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);

  useEffect(() => {
    const setAppHeight = () => {
      setWindowHeight(`${window.innerHeight}px`);
    };
    
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    
    return () => window.removeEventListener('resize', setAppHeight);
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
    <Flex
      direction="column"
      bg="gray.50"
      h={windowHeight}
      className="safe-area-inset"
    >
      {/* Header */}
      <Box
        bgGradient="linear(to-r, brand.600, brand.500)"
        color="white"
        px={6}
        py={8}
        className="safe-area-inset-top"
        flexShrink={0}
        boxShadow="sm"
      >
        <VStack align="flex-start" spacing={2}>
          <Heading as="h1" size="2xl" fontWeight="bold">
            Campaigns
          </Heading>
          <Text fontSize="sm" opacity={0.9}>
            Join cleanup initiatives in your community
          </Text>
        </VStack>
      </Box>

      {/* Search Bar */}
      <Box bg="white" px={6} py={4} borderBottom="1px solid" borderColor="gray.200" flexShrink={0} boxShadow="sm">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search campaigns, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="lg"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            _focus={{ borderColor: 'brand.500', bg: 'white' }}
          />
        </InputGroup>
      </Box>

      {/* Tabs and Content */}
      <Box flex="1" overflow="hidden">
        <Tabs index={activeTab} onChange={setActiveTab} display="flex" flexDirection="column" h="full">
          <TabList bg="white" borderBottom="2px solid" borderColor="gray.200" px={4}>
            <Tab _selected={{ color: 'brand.600', borderColor: 'brand.600' }} fontWeight="600">
              Active ({activeCampaigns.length})
            </Tab>
            <Tab _selected={{ color: 'brand.600', borderColor: 'brand.600' }} fontWeight="600">
              Completed ({completedCampaigns.length})
            </Tab>
          </TabList>
          <TabPanels flex="1" overflow="hidden" display="flex" flexDirection="column">
            <TabPanel display="flex" flexDirection="column" h="full" p={0}>
              <CampaignList 
                campaigns={filteredActive} 
                isEmpty={filteredActive.length === 0 && searchTerm}
                activeTab={activeTab}
                onViewDetails={handleViewCampaign}
                onDonate={handleDonate}
              />
            </TabPanel>
            <TabPanel display="flex" flexDirection="column" h="full" p={0}>
              <CampaignList 
                campaigns={filteredCompleted} 
                isEmpty={filteredCompleted.length === 0 && searchTerm}
                activeTab={activeTab}
                onViewDetails={handleViewCampaign}
                onDonate={handleDonate}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

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