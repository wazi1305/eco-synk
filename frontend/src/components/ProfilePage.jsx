import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FiCalendar, FiTrendingUp, FiAward, FiTarget, FiMapPin, FiZap } from 'react-icons/fi';

// User data and recent activities
const USER_DATA = {
  name: 'Alex Green',
  username: '@alexgreen',
  location: 'San Francisco, CA',
  joinDate: 'March 2024',
  level: 18,
  totalPoints: 2847,
  weeklyGoal: 50,
  currentWeekPoints: 32,
  streakDays: 7,
  totalCleanups: 47,
  totalItems: 1284,
  co2Saved: 420,
  followersCount: 245,
  followingCount: 189,
  avatar: '🌱'
};

const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'cleanup',
    title: 'Beach Cleanup',
    location: 'Ocean Beach, SF',
    points: 25,
    items: 47,
    date: '2 hours ago',
    icon: '🏖️'
  },
  {
    id: 2,
    type: 'achievement',
    title: 'Eco Champion',
    description: 'Completed 5 cleanups this week',
    points: 50,
    date: 'Yesterday',
    icon: '🏆'
  },
  {
    id: 3,
    type: 'campaign',
    title: 'Joined River Cleanup Initiative',
    location: 'Hudson River, NY',
    date: '2 days ago',
    icon: '🌊'
  }
];

const STATS_DATA = [
  { label: 'Cleanups', value: '47', icon: FiTarget, color: 'blue' },
  { label: 'Items', value: '1,284', icon: FiZap, color: 'green' },
  { label: 'CO₂ Saved', value: '420kg', icon: FiTrendingUp, color: 'purple' },
  { label: 'Streak', value: '7 days', icon: FiCalendar, color: 'orange' }
];

const ProfilePage = () => {
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = React.useRef(0);
  const progressPercent = Math.round((USER_DATA.currentWeekPoints / USER_DATA.weeklyGoal) * 100);

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

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden" className="safe-area-inset">
      {/* Compact Header - Collapsible */}
      <Box 
        bgGradient="linear(to-r, brand.600, brand.500)"
        color="white"
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={20}
        overflow="hidden"
        boxShadow="sm"
      >
        <HStack spacing={4} p={4} pt={8} className="safe-area-inset-top">
          <Circle size="50px" bg="whiteAlpha.20" fontSize="xl">
            {USER_DATA.avatar}
          </Circle>
          <VStack align="start" spacing={0} flex={1}>
            <Text fontWeight="bold" fontSize="lg">{USER_DATA.name}</Text>
            <Text fontSize="xs" opacity={0.8}>{USER_DATA.username}</Text>
          </VStack>
          <VStack align="end" spacing={0}>
            <Text fontSize="xl" fontWeight="bold">
              {USER_DATA.level}
            </Text>
            <Text fontSize="xs" opacity={0.8}>LEVEL</Text>
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
        {/* Detailed Profile Section */}
        <Card bg="white" mx={4} mb={4} borderRadius="xl" overflow="hidden">
          <CardBody p={6}>
            {/* Full Profile Info */}
            <VStack spacing={4}>
              <Circle size="80px" bg="brand.500" fontSize="2xl">
                {USER_DATA.avatar}
              </Circle>
              <VStack spacing={1} textAlign="center">
                <Heading size="lg" color="gray.900">{USER_DATA.name}</Heading>
                <Text color="gray.600" fontSize="sm">{USER_DATA.username}</Text>
                <HStack spacing={2} color="gray.500" fontSize="xs">
                  <Icon as={FiMapPin} />
                  <Text>{USER_DATA.location}</Text>
                </HStack>
              </VStack>

              {/* Detailed Stats */}
              <HStack spacing={6} py={3}>
                <VStack spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.600">
                    {USER_DATA.level}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="600">LEVEL</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                    {USER_DATA.totalPoints.toLocaleString()}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="600">POINTS</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.900">
                    {USER_DATA.followersCount}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontWeight="600">FOLLOWERS</Text>
                </VStack>
              </HStack>

              {/* Weekly Goal Progress */}
              <Box w="full">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700">Weekly Goal</Text>
                  <Text fontSize="sm" color="brand.600" fontWeight="600">
                    {USER_DATA.currentWeekPoints}/{USER_DATA.weeklyGoal}
                  </Text>
                </HStack>
                <Progress 
                  value={progressPercent} 
                  colorScheme="brand" 
                  size="md" 
                  borderRadius="full"
                  bg="gray.200"
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <Box p={4}>
          <SimpleGrid columns={2} spacing={3} mb={4}>
            {STATS_DATA.map((stat, index) => (
              <Card key={index} bg="white" borderRadius="xl" overflow="hidden">
                <CardBody p={4}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="gray.900">
                        {stat.value}
                      </Text>
                      <Text fontSize="xs" color="gray.600" fontWeight="600">
                        {stat.label.toUpperCase()}
                      </Text>
                    </VStack>
                    <Circle size="40px" bg={`${stat.color}.100`}>
                      <Icon as={stat.icon} color={`${stat.color}.600`} boxSize={5} />
                    </Circle>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Recent Activity */}
          <Card bg="white" borderRadius="xl" overflow="hidden">
            <CardBody p={0}>
              <Box p={4} borderBottomWidth={1} borderColor="gray.100">
                <Heading size="md" color="gray.900">Recent Activity</Heading>
              </Box>
              <VStack spacing={0} divider={<Divider />}>
                {RECENT_ACTIVITIES.map((activity) => (
                  <Box key={activity.id} p={4} w="full">
                    <HStack spacing={3}>
                      <Circle size="40px" bg="gray.100" fontSize="lg">
                        {activity.icon}
                      </Circle>
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="600" color="gray.900" fontSize="sm">
                          {activity.title}
                        </Text>
                        {activity.location && (
                          <Text color="gray.600" fontSize="xs">
                            📍 {activity.location}
                          </Text>
                        )}
                        {activity.description && (
                          <Text color="gray.600" fontSize="xs">
                            {activity.description}
                          </Text>
                        )}
                        <HStack spacing={3}>
                          <Text color="gray.500" fontSize="xs">{activity.date}</Text>
                          {activity.points && (
                            <Badge colorScheme="brand" fontSize="xs">
                              +{activity.points} pts
                            </Badge>
                          )}
                          {activity.items && (
                            <Badge colorScheme="blue" fontSize="xs">
                              {activity.items} items
                            </Badge>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
              
              {/* View More Button */}
              <Box p={4} borderTopWidth={1} borderColor="gray.100">
                <Button w="full" variant="ghost" colorScheme="brand" size="sm">
                  View All Activity
                </Button>
              </Box>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <VStack spacing={3} mt={6} pb={6}>
            <Button 
              w="full" 
              colorScheme="brand" 
              size="lg" 
              borderRadius="xl"
              leftIcon={<Icon as={FiTarget} />}
            >
              Join Campaign
            </Button>
            <Button 
              w="full" 
              variant="outline" 
              colorScheme="brand" 
              size="lg" 
              borderRadius="xl"
              leftIcon={<Icon as={FiAward} />}
            >
              View Achievements
            </Button>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};

export default ProfilePage;