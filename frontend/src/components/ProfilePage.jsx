import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Avatar,
  Heading,
  Text,
  Card,
  CardBody,
  Grid,
  GridItem,
  Progress,
  Button,
  Badge,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  SimpleGrid,
  Circle,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiCalendar, FiTrendingUp, FiAward, FiTarget, FiMapPin, FiZap } from 'react-icons/fi';
import volunteerService from '../services/volunteerService';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [showHeader, setShowHeader] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const lastScrollYRef = React.useRef(0);

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const response = await volunteerService.getLeaderboard(10);
        if (response.success) {
          setLeaderboard(response.leaderboard);
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  // Scroll handler optimized for compact header
  const handleScroll = React.useCallback((e) => {
    const currentScrollY = e.target.scrollTop;
    
    if (currentScrollY < 20) {
      setShowHeader(true);
    } else if (currentScrollY > 80) {
      if (currentScrollY > lastScrollYRef.current + 3) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollYRef.current - 10) {
        setShowHeader(true);
      }
    }
    
    lastScrollYRef.current = currentScrollY;
  }, []);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="neutral.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="neutral.400">Loading profile...</Text>
        </VStack>
      </Flex>
    );
  }

  // Use real user data
  const userData = {
    name: user.name || 'User',
    username: user.email || '',
    location: user.city ? `${user.city}, ${user.country || ''}` : user.location || 'Unknown',
    joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
    level: user.level || 1,
    totalPoints: user.total_points || 0,
    weeklyGoal: 50,
    currentWeekPoints: 0, // TODO: Calculate from recent activities
    streakDays: 0, // TODO: Calculate streak
    totalCleanups: user.total_cleanups || user.past_cleanup_count || 0,
    totalItems: 0, // TODO: Calculate from cleanup history
    co2Saved: user.stats?.total_co2_saved_kg || 0,
    followersCount: userService.getFollowersCount(user),
    followingCount: userService.getFollowingCount(user),
    avatar: user.profile_picture_url || '🌱',
    bio: user.bio || 'Environmental enthusiast'
  };

  const progressPercent = Math.round((userData.currentWeekPoints / userData.weeklyGoal) * 100);

  const STATS_DATA = [
    { label: 'Cleanups', value: userData.totalCleanups.toString(), icon: FiTarget, color: 'blue' },
    { label: 'Points', value: userData.totalPoints.toLocaleString(), icon: FiZap, color: 'green' },
    { label: 'CO₂ Saved', value: `${Math.round(userData.co2Saved)}kg`, icon: FiTrendingUp, color: 'purple' },
    { label: 'Level', value: userData.level.toString(), icon: FiAward, color: 'orange' }
  ];

  // TODO: Fetch real activity history from backend
  const RECENT_ACTIVITIES = [];

  return (
    <Flex direction="column" h="full" bg="neutral.900" overflow="hidden" className="safe-area-inset">
      {/* Compact Header - Collapsible */}
      <Box 
        bg="rgba(2, 2, 2, 0.95)"
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor="neutral.800"
        color="white"
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={20}
        overflow="hidden"
      >
        <HStack spacing={4} p={4} pt={8} className="safe-area-inset-top">
          <Circle size="50px" bg="rgba(47, 212, 99, 0.1)" border="2px solid" borderColor="brand.500" fontSize="xl">
            {userData.avatar}
          </Circle>
          <VStack align="start" spacing={0} flex={1}>
            <Text fontWeight="600" fontSize="lg" color="neutral.50">{userData.name}</Text>
            <Text fontSize="xs" color="neutral.400">{userData.username}</Text>
          </VStack>
          <VStack align="end" spacing={0}>
            <Text fontSize="xl" fontWeight="700" color="brand.500">
              {userData.level}
            </Text>
            <Text fontSize="xs" color="neutral.400" fontWeight="600">LEVEL</Text>
          </VStack>
        </HStack>
      </Box>

      {/* Content Area */}
      <Box 
        flex="1" 
        overflowY="auto" 
        onScroll={handleScroll}
        pt={showHeader ? "120px" : "20px"} 
        pb="80px"
        transition="padding-top 0.3s ease"
      >
        {/* Tabs for Profile and Leaderboard */}
        <Tabs index={activeTab} onChange={setActiveTab} px={4} mb={4}>
          <TabList bg="neutral.800" borderRadius="12px" p={1} border="1px solid" borderColor="neutral.700">
            <Tab 
              flex={1} 
              fontWeight="600" 
              fontSize="sm"
              color="neutral.400"
              _selected={{ 
                color: 'brand.500', 
                bg: 'rgba(47, 212, 99, 0.1)', 
                borderRadius: '10px'
              }}
            >
              My Profile
            </Tab>
            <Tab 
              flex={1} 
              fontWeight="600"
              fontSize="sm"
              color="neutral.400"
              _selected={{ 
                color: 'brand.500', 
                bg: 'rgba(47, 212, 99, 0.1)', 
                borderRadius: '10px'
              }}
            >
              🏆 Leaderboard
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>
              {/* Original Profile Content */}
              <Card bg="neutral.800" mx={4} mb={4} borderRadius="16px" overflow="hidden" border="1px solid" borderColor="neutral.700">
          <CardBody p={6}>
            {/* Full Profile Info */}
            <VStack spacing={4}>
              <Circle size="80px" bg="rgba(47, 212, 99, 0.1)" border="3px solid" borderColor="brand.500" fontSize="2xl">
                {userData.avatar}
              </Circle>
              <VStack spacing={1} textAlign="center">
                <Heading size="lg" color="neutral.50" fontWeight="700">{userData.name}</Heading>
                <Text color="neutral.400" fontSize="sm">{userData.username}</Text>
                <HStack spacing={2} color="neutral.400" fontSize="xs">
                  <Icon as={FiMapPin} />
                  <Text>{userData.location}</Text>
                </HStack>
              </VStack>

              {/* Detailed Stats */}
              <HStack spacing={6} py={3}>
                <VStack spacing={0}>
                  <Text fontSize="2xl" fontWeight="700" color="brand.500">
                    {userData.level}
                  </Text>
                  <Text fontSize="xs" color="neutral.400" fontWeight="600" letterSpacing="0.05em">LEVEL</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="2xl" fontWeight="700" color="neutral.50">
                    {userData.totalPoints.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color="neutral.400" fontWeight="600" letterSpacing="0.05em">POINTS</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="700" color="neutral.50">
                    {userData.followersCount}
                  </Text>
                  <Text fontSize="xs" color="neutral.400" fontWeight="600" letterSpacing="0.05em">FOLLOWERS</Text>
                </VStack>
              </HStack>

              {/* Weekly Goal Progress */}
              <Box w="full">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="600" color="neutral.200">Weekly Goal</Text>
                  <Text fontSize="sm" color="brand.500" fontWeight="700">
                    {userData.currentWeekPoints}/{userData.weeklyGoal}
                  </Text>
                </HStack>
                <Progress 
                  value={progressPercent} 
                  size="md" 
                  borderRadius="full"
                  bg="neutral.700"
                  sx={{
                    '& > div': {
                      bg: 'brand.500',
                      boxShadow: '0 0 10px rgba(47, 212, 99, 0.5)'
                    }
                  }}
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <Box p={4}>
          <SimpleGrid columns={2} spacing={3} mb={4}>
            {STATS_DATA.map((stat, index) => (
              <Card key={index} bg="neutral.800" borderRadius="12px" overflow="hidden" border="1px solid" borderColor="neutral.700">
                <CardBody p={4}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="2xl" fontWeight="700" color="neutral.50">
                        {stat.value}
                      </Text>
                      <Text fontSize="xs" color="neutral.400" fontWeight="600" letterSpacing="0.05em">
                        {stat.label.toUpperCase()}
                      </Text>
                    </VStack>
                    <Circle size="40px" bg={`rgba(47, 212, 99, 0.1)`} border="1px solid" borderColor="brand.500">
                      <Icon as={stat.icon} color="brand.500" boxSize={5} />
                    </Circle>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Recent Activity */}
          <Card bg="neutral.800" borderRadius="12px" overflow="hidden" border="1px solid" borderColor="neutral.700">
            <CardBody p={0}>
              <Box p={4} borderBottomWidth={1} borderColor="neutral.700">
                <Heading size="md" color="neutral.50" fontWeight="700">Recent Activity</Heading>
              </Box>
              {RECENT_ACTIVITIES.length > 0 ? (
                <VStack spacing={0} divider={<Divider borderColor="neutral.700" />}>
                  {RECENT_ACTIVITIES.map((activity) => (
                    <Box key={activity.id} p={4} w="full">
                      <HStack spacing={3}>
                        <Circle size="40px" bg="neutral.700" fontSize="lg">
                          {activity.icon}
                        </Circle>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="600" color="neutral.50" fontSize="sm">
                            {activity.title}
                          </Text>
                          {activity.location && (
                            <Text color="neutral.300" fontSize="xs">
                              📍 {activity.location}
                            </Text>
                          )}
                          {activity.description && (
                            <Text color="neutral.300" fontSize="xs">
                              {activity.description}
                            </Text>
                          )}
                          <HStack spacing={3}>
                            <Text color="neutral.400" fontSize="xs">{activity.date}</Text>
                            {activity.points && (
                              <Badge bg="rgba(47, 212, 99, 0.1)" color="brand.500" fontSize="xs" border="1px solid" borderColor="brand.500">
                                +{activity.points} pts
                              </Badge>
                            )}
                            {activity.items && (
                              <Badge bg="rgba(66, 153, 225, 0.1)" color="blue.300" fontSize="xs" border="1px solid" borderColor="blue.400">
                                {activity.items} items
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box p={8} textAlign="center">
                  <Text color="neutral.400" fontSize="sm">
                    No recent activity yet. Start by joining a campaign or submitting a trash report!
                  </Text>
                </Box>
              )}
              
              {/* View More Button */}
              <Box p={4} borderTopWidth={1} borderColor="neutral.700">
                <Button 
                  w="full" 
                  variant="ghost" 
                  size="sm"
                  color="brand.500"
                  _hover={{ bg: 'rgba(47, 212, 99, 0.1)' }}
                >
                  View All Activity
                </Button>
              </Box>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <VStack spacing={3} mt={6} pb={6}>
            <Button 
              w="full" 
              bg="brand.500"
              color="neutral.900"
              size="lg" 
              borderRadius="12px"
              leftIcon={<Icon as={FiTarget} />}
              _hover={{
                bg: 'brand.600',
                transform: 'translateY(-2px)',
                boxShadow: '0 0 20px rgba(47, 212, 99, 0.4)'
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              Join Campaign
            </Button>
            <Button 
              w="full" 
              variant="outline" 
              borderColor="neutral.700"
              color="neutral.200"
              size="lg" 
              borderRadius="12px"
              leftIcon={<Icon as={FiAward} />}
              _hover={{
                bg: 'rgba(47, 212, 99, 0.1)',
                borderColor: 'brand.500',
                color: 'brand.500'
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              View Achievements
            </Button>
            </VStack>
          </Box>
            </TabPanel>            <TabPanel p={0} pt={4}>
              {/* Leaderboard Section */}
              <Card bg="neutral.800" borderRadius="12px" overflow="hidden" border="1px solid" borderColor="neutral.700" mx={4}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between" align="center">
                      <Heading size="md" color="neutral.50" fontWeight="700">🏆 Top Volunteers</Heading>
                      <Badge bg="rgba(47, 212, 99, 0.1)" color="brand.500" fontSize="xs" px={2} py={1} border="1px solid" borderColor="brand.500">
                        {leaderboard.length} Active
                      </Badge>
                    </HStack>
                    
                    {leaderboardLoading ? (
                      <VStack py={8}>
                        <Spinner size="lg" color="brand.500" />
                        <Text color="neutral.400">Loading leaderboard...</Text>
                      </VStack>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {leaderboard.map((volunteer, index) => (
                          <HStack 
                            key={volunteer.user_id ? `${volunteer.user_id}-${volunteer.rank || index}` : `vol-${index}`}
                            p={4} 
                            bg={index < 3 ? "rgba(47, 212, 99, 0.08)" : "neutral.700"} 
                            borderRadius="12px"
                            border={index < 3 ? "1px solid" : "1px solid"}
                            borderColor={index < 3 ? "brand.500" : "neutral.600"}
                          >
                            <VStack spacing={0} minW="40px">
                              <Text 
                                fontSize="lg" 
                                fontWeight="700" 
                                color={index === 0 ? "yellow.400" : index === 1 ? "gray.300" : index === 2 ? "orange.400" : "neutral.400"}
                              >
                                #{volunteer.rank}
                              </Text>
                              {index < 3 && (
                                <Text fontSize="xs">
                                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                                </Text>
                              )}
                            </VStack>
                            
                            <Avatar 
                              name={volunteer.name} 
                              size="md"
                              bg="rgba(47, 212, 99, 0.1)"
                              border="2px solid"
                              borderColor="brand.500"
                              color="brand.500"
                            />
                            
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="600" color="neutral.50">
                                {volunteer.name}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="sm" color="neutral.300">
                                  {volunteer.past_cleanup_count} cleanups
                                </Text>
                                <Text fontSize="sm" color="neutral.400">•</Text>
                                <Text fontSize="sm" color="neutral.300">
                                  {volunteer.experience_level}
                                </Text>
                              </HStack>
                            </VStack>
                            
                            <VStack align="end" spacing={1}>
                              <Badge 
                                bg={index < 3 ? "rgba(250, 204, 21, 0.1)" : "neutral.600"}
                                color={index < 3 ? "yellow.400" : "neutral.300"}
                                border="1px solid"
                                borderColor={index < 3 ? "yellow.500" : "neutral.500"}
                                fontSize="xs"
                              >
                                {volunteer.badge}
                              </Badge>
                              {volunteer.available && (
                                <Badge 
                                  bg="rgba(72, 187, 120, 0.1)"
                                  color="green.400"
                                  border="1px solid"
                                  borderColor="green.500"
                                  fontSize="xs"
                                >
                                  Available
                                </Badge>
                              )}
                            </VStack>
                          </HStack>
                        ))}
                        
                        {leaderboard.length === 0 && (
                          <Alert status="info" bg="rgba(66, 153, 225, 0.1)" borderRadius="12px" border="1px solid" borderColor="blue.500">
                            <AlertIcon color="blue.400" />
                            <Text color="neutral.200">No volunteers found in the leaderboard.</Text>
                          </Alert>
                        )}
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
};

export default ProfilePage;
