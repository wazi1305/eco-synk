import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Avatar,
  Card,
  CardBody,
  Badge,
  Icon,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Image,
  Textarea,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMapPin,
  FiClock,
  FiMoreVertical,
  FiCamera,
  FiAward,
  FiTrendingUp,
  FiUsers,
  FiTarget,
  FiFlag,
  FiBell,
  FiSearch,
  FiPlus,
  FiFilter,
} from 'react-icons/fi';
import UserProfileModal from './UserProfileModal';

const FeedPage = () => {
  const scrollRef = useRef(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Enhanced mock data with more Strava-like structure
  const MOCK_USERS = {
    'ahmed_rashid': {
      id: 'ahmed_rashid',
      name: 'Ahmed Al Rashid',
      username: 'ahmed_rashid',
      avatar: '',
      location: 'Dubai, UAE',
      joinDate: 'Oct 2023',
      totalPoints: 2850,
      totalActivities: 47,
      rank: '#12',
      streak: 15,
      totalItems: 1245,
      co2Saved: 340,
      totalHours: 89,
      level: 12,
      verified: true,
      title: 'Beach Guardian'
    },
    'sara_zahra': {
      id: 'sara_zahra',
      name: 'Sara Al Zahra',
      username: 'sara_zahra',
      avatar: '',
      location: 'Abu Dhabi, UAE',
      joinDate: 'Sep 2023',
      totalPoints: 3420,
      totalActivities: 52,
      rank: '#8',
      streak: 23,
      totalItems: 1567,
      co2Saved: 425,
      totalHours: 103,
      level: 14,
      verified: true,
      title: 'Eco Champion'
    },
    'omar_mansoori': {
      id: 'omar_mansoori',
      name: 'Omar Al Mansoori',
      username: 'omar_mansoori',
      avatar: '',
      location: 'Sharjah, UAE',
      joinDate: 'Aug 2023',
      totalPoints: 4150,
      totalActivities: 63,
      rank: '#3',
      streak: 31,
      totalItems: 2134,
      co2Saved: 580,
      totalHours: 145,
      level: 18,
      verified: true,
      title: 'Sustainability Hero'
    }
  };

  const MOCK_ACTIVITIES = [
    {
      id: 1,
      user: MOCK_USERS.ahmed_rashid,
      type: 'cleanup',
      title: 'Beach Cleanup at Jumeirah',
      description: 'Amazing morning cleaning up Jumeirah Beach with the community! Found some interesting items and met incredible people passionate about our environment. 🏖️ #DubaiCleanup #BeachGuardian',
      location: 'Jumeirah Beach, Dubai',
      timestamp: '2 hours ago',
      duration: '2h 30m',
      stats: {
        items: 67,
        points: 201,
        co2Saved: '45kg',
        volunteers: 12
      },
      images: ['🏖️', '♻️'],
      tags: ['beach-cleanup', 'community', 'dubai'],
      likes: 24,
      comments: 8,
      weather: { temp: '28°C', condition: 'Sunny' },
      achievements: ['Beach Guardian', 'Team Player']
    },
    {
      id: 2,
      user: MOCK_USERS.sara_zahra,
      type: 'campaign',
      title: 'Leading Green Business Bay Initiative',
      description: 'Proud to lead today\'s corporate cleanup campaign in Business Bay! Our team collected over 200 items and educated 50+ office workers about waste reduction. Small steps, big impact! 🏢',
      location: 'Business Bay, Dubai',
      timestamp: '4 hours ago',
      duration: '3h 45m',
      stats: {
        items: 234,
        points: 702,
        co2Saved: '89kg',
        volunteers: 28
      },
      images: ['🏢', '📊'],
      tags: ['campaign', 'business', 'leadership'],
      likes: 42,
      comments: 15,
      weather: { temp: '26°C', condition: 'Partly Cloudy' },
      achievements: ['Campaign Leader', 'Corporate Impact']
    },
    {
      id: 3,
      user: MOCK_USERS.omar_mansoori,
      type: 'report',
      title: 'Documented Waste Hotspot in Al Salam Park',
      description: 'Identified and reported a concerning waste accumulation area in Al Salam Park. Working with local authorities to organize a targeted cleanup next weekend. Every report matters! 📍',
      location: 'Al Salam Park, Sharjah',
      timestamp: '6 hours ago',
      duration: '1h 15m',
      stats: {
        reports: 5,
        points: 25,
        impact: 'High Priority',
        followUps: 3
      },
      images: ['🌳', '📋'],
      tags: ['reporting', 'park', 'community-action'],
      likes: 18,
      comments: 6,
      weather: { temp: '29°C', condition: 'Clear' },
      achievements: ['Eagle Eye', 'Community Guardian']
    },
    {
      id: 4,
      user: MOCK_USERS.ahmed_rashid,
      type: 'milestone',
      title: 'Reached Level 12 - Beach Guardian! 🏆',
      description: 'Incredible milestone achieved! Thanks to everyone who supported my journey. 1000+ items collected, 15-day streak, and countless memories with amazing eco-warriors. Next stop: Level 15! 🌊',
      location: 'Dubai, UAE',
      timestamp: '1 day ago',
      duration: 'Achievement',
      stats: {
        level: 12,
        points: 2850,
        streak: 15,
        rank: '#12'
      },
      images: ['🏆', '⭐'],
      tags: ['milestone', 'achievement', 'level-up'],
      likes: 89,
      comments: 23,
      achievements: ['Beach Guardian', 'Consistency Champion']
    },
    {
      id: 5,
      user: MOCK_USERS.sara_zahra,
      type: 'challenge',
      title: 'UAE National Day Cleanup Challenge',
      description: 'Join me in the UAE National Day special challenge! Let\'s clean up 71 locations across the Emirates in honor of our nation. Who\'s in? 🇦🇪 #UAE51 #NationalDay',
      location: 'Nationwide, UAE',
      timestamp: '1 day ago',
      duration: 'Challenge',
      stats: {
        participants: 156,
        locations: 23,
        goal: 71,
        timeLeft: '6 days'
      },
      images: ['🇦🇪', '🎯'],
      tags: ['challenge', 'national-day', 'uae'],
      likes: 67,
      comments: 34,
      achievements: ['Challenge Creator', 'National Pride']
    }
  ];

  const TODAY_IMPACT = {
    activities: 23,
    participants: 156,
    itemsCollected: 1247,
    co2Saved: 342,
    locationsCleared: 8
  };

  const handleScroll = useCallback(() => {
    const currentScrollY = scrollRef.current?.scrollTop || 0;
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  const toggleLike = (activityId) => {
    setLikedPosts(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(activityId)) {
        newLiked.delete(activityId);
      } else {
        newLiked.add(activityId);
      }
      return newLiked;
    });
  };

  const openProfile = (user) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const getActivityIcon = (type) => {
    const icons = {
      cleanup: FiTarget,
      campaign: FiUsers,
      report: FiFlag,
      milestone: FiAward,
      challenge: FiTrendingUp
    };
    return icons[type] || FiTarget;
  };

  const getActivityColor = (type) => {
    const colors = {
      cleanup: 'green',
      campaign: 'blue',
      report: 'orange',
      milestone: 'purple',
      challenge: 'pink'
    };
    return colors[type] || 'green';
  };

  const ActivityCard = ({ activity }) => (
    <Card variant="outline" _hover={{ shadow: 'md' }} transition="all 0.2s">
      <CardBody p={0}>
        {/* Activity Header */}
        <HStack spacing={3} p={4} pb={3}>
          <Avatar 
            size="md" 
            name={activity.user.name}
            cursor="pointer"
            _hover={{ ring: 2, ringColor: 'brand.500' }}
            onClick={() => openProfile(activity.user)}
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack spacing={2}>
              <Text 
                fontWeight="semibold" 
                cursor="pointer"
                _hover={{ color: 'brand.600' }}
                onClick={() => openProfile(activity.user)}
              >
                {activity.user.name}
              </Text>
              {activity.user.verified && (
                <Icon as={FiAward} color="blue.500" boxSize={4} />
              )}
              <Badge colorScheme={getActivityColor(activity.type)} variant="subtle" size="sm">
                {activity.user.title}
              </Badge>
            </HStack>
            <HStack spacing={2} fontSize="sm" color="gray.600">
              <Icon as={getActivityIcon(activity.type)} boxSize={4} />
              <Text>{activity.timestamp}</Text>
              <Text>•</Text>
              <HStack spacing={1}>
                <Icon as={FiMapPin} boxSize={3} />
                <Text>{activity.location}</Text>
              </HStack>
            </HStack>
          </VStack>
          <Menu>
            <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" size="sm" />
            <MenuList>
              <MenuItem icon={<FiBell />}>Get notifications</MenuItem>
              <MenuItem icon={<FiFlag />}>Report post</MenuItem>
              <MenuItem icon={<FiShare2 />}>Share activity</MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Activity Content */}
        <Box px={4} pb={3}>
          <Heading size="md" mb={2}>{activity.title}</Heading>
          <Text color="gray.700" mb={3}>{activity.description}</Text>
          
          {/* Activity Images */}
          {activity.images && (
            <HStack spacing={2} mb={3}>
              {activity.images.map((image, index) => (
                <Box
                  key={index}
                  fontSize="2xl"
                  p={2}
                  bg="gray.100"
                  borderRadius="lg"
                  w="60px"
                  h="60px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {image}
                </Box>
              ))}
            </HStack>
          )}

          {/* Stats Grid */}
          <Grid templateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={3} mb={3}>
            {activity.stats.items && (
              <Stat textAlign="center" p={2} bg="green.50" borderRadius="md">
                <StatNumber fontSize="lg" color="green.600">{activity.stats.items}</StatNumber>
                <StatLabel fontSize="xs" color="green.600">Items</StatLabel>
              </Stat>
            )}
            {activity.stats.points && (
              <Stat textAlign="center" p={2} bg="purple.50" borderRadius="md">
                <StatNumber fontSize="lg" color="purple.600">+{activity.stats.points}</StatNumber>
                <StatLabel fontSize="xs" color="purple.600">Points</StatLabel>
              </Stat>
            )}
            {activity.stats.co2Saved && (
              <Stat textAlign="center" p={2} bg="blue.50" borderRadius="md">
                <StatNumber fontSize="lg" color="blue.600">{activity.stats.co2Saved}</StatNumber>
                <StatLabel fontSize="xs" color="blue.600">CO₂ Saved</StatLabel>
              </Stat>
            )}
            {activity.stats.volunteers && (
              <Stat textAlign="center" p={2} bg="orange.50" borderRadius="md">
                <StatNumber fontSize="lg" color="orange.600">{activity.stats.volunteers}</StatNumber>
                <StatLabel fontSize="xs" color="orange.600">Volunteers</StatLabel>
              </Stat>
            )}
            {activity.stats.level && (
              <Stat textAlign="center" p={2} bg="yellow.50" borderRadius="md">
                <StatNumber fontSize="lg" color="yellow.600">Level {activity.stats.level}</StatNumber>
                <StatLabel fontSize="xs" color="yellow.600">Achieved</StatLabel>
              </Stat>
            )}
          </Grid>

          {/* Weather & Duration */}
          <HStack justify="space-between" fontSize="sm" color="gray.600" mb={3}>
            <HStack spacing={4}>
              {activity.weather && (
                <HStack spacing={1}>
                  <Text>☀️</Text>
                  <Text>{activity.weather.temp}</Text>
                </HStack>
              )}
              <HStack spacing={1}>
                <Icon as={FiClock} boxSize={3} />
                <Text>{activity.duration}</Text>
              </HStack>
            </HStack>
            {activity.achievements && (
              <HStack spacing={1}>
                <Icon as={FiAward} boxSize={3} color="yellow.500" />
                <Text fontSize="xs">+{activity.achievements.length} achievements</Text>
              </HStack>
            )}
          </HStack>

          {/* Tags */}
          {activity.tags && (
            <HStack spacing={2} mb={3} flexWrap="wrap">
              {activity.tags.map((tag) => (
                <Badge key={tag} variant="outline" colorScheme="gray" size="sm">
                  #{tag}
                </Badge>
              ))}
            </HStack>
          )}
        </Box>

        <Divider />

        {/* Action Buttons */}
        <HStack spacing={0} p={3}>
          <Button
            leftIcon={<FiHeart />}
            variant="ghost"
            size="sm"
            flex={1}
            color={likedPosts.has(activity.id) ? 'red.500' : 'gray.600'}
            onClick={() => toggleLike(activity.id)}
          >
            {activity.likes + (likedPosts.has(activity.id) ? 1 : 0)}
          </Button>
          <Button leftIcon={<FiMessageCircle />} variant="ghost" size="sm" flex={1} color="gray.600">
            {activity.comments}
          </Button>
          <Button leftIcon={<FiShare2 />} variant="ghost" size="sm" flex={1} color="gray.600">
            Share
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );

  return (
    <Box bg="gray.50" minH="100vh" position="relative">
      {/* Enhanced Header with Transform */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        bg="white"
        borderBottomWidth={1}
        borderColor="gray.200"
        transform={showHeader ? 'translateY(0)' : 'translateY(-100%)'}
        transition="transform 0.3s ease-in-out"
      >
        <VStack spacing={0}>
          {/* Main Header */}
          <HStack justify="space-between" p={4} w="full" maxW="600px" mx="auto">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="brand.600">Feed</Heading>
              <Text fontSize="sm" color="gray.600">
                {TODAY_IMPACT.activities} activities today
              </Text>
            </VStack>
            <HStack spacing={2}>
              <IconButton icon={<FiSearch />} variant="ghost" size="sm" />
              <IconButton icon={<FiFilter />} variant="ghost" size="sm" />
              <IconButton icon={<FiPlus />} variant="ghost" size="sm" colorScheme="brand" />
            </HStack>
          </HStack>

          {/* Today's Impact Bar */}
          <Box w="full" bg="gradient.primary" px={4} py={3}>
            <Box maxW="600px" mx="auto">
              <HStack justify="space-between" color="white" fontSize="xs">
                <VStack spacing={0}>
                  <Text fontWeight="bold">{TODAY_IMPACT.participants}</Text>
                  <Text opacity={0.9}>Active</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{TODAY_IMPACT.itemsCollected}</Text>
                  <Text opacity={0.9}>Items</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{TODAY_IMPACT.co2Saved}kg</Text>
                  <Text opacity={0.9}>CO₂ Saved</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{TODAY_IMPACT.locationsCleared}</Text>
                  <Text opacity={0.9}>Locations</Text>
                </VStack>
              </HStack>
            </Box>
          </Box>

          {/* Feed Tabs */}
          <Box w="full" maxW="600px" mx="auto">
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed-colored">
              <TabList>
                <Tab flex={1}>Following</Tab>
                <Tab flex={1}>Local</Tab>
                <Tab flex={1}>Trending</Tab>
                <Tab flex={1}>Challenges</Tab>
              </TabList>
            </Tabs>
          </Box>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        pt="200px"
        px={4}
        maxW="600px"
        mx="auto"
        overflowY="auto"
        h="100vh"
      >
        <VStack spacing={4} pb={6}>
          {/* Create Post Section */}
          <Card w="full" variant="outline">
            <CardBody>
              <HStack spacing={3} mb={3}>
                <Avatar size="sm" name="Current User" />
                <Textarea
                  placeholder="Share your eco-impact..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  resize="none"
                  minH="unset"
                  rows={2}
                />
              </HStack>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <IconButton icon={<FiCamera />} variant="ghost" size="sm" />
                  <IconButton icon={<FiMapPin />} variant="ghost" size="sm" />
                  <IconButton icon={<FiUsers />} variant="ghost" size="sm" />
                </HStack>
                <Button size="sm" colorScheme="brand" isDisabled={!newPost.trim()}>
                  Post
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Activities Feed */}
          {MOCK_ACTIVITIES.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {/* Load More */}
          <Button variant="outline" size="lg" w="full" mt={4}>
            Load More Activities
          </Button>
        </VStack>
      </Box>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userData={selectedUser}
      />
    </Box>
  );
};

export default FeedPage;