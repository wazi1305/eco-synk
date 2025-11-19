import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Button,
  Avatar,
  Badge,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Divider,
  Card,
  CardBody,
  Image,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiCalendar,
  FiAward,
  FiTrendingUp,
  FiUsers,
  FiHeart,
  FiTarget,
  FiStar,
  FiClock,
  FiCamera,
  FiUserCheck,
  FiUserPlus,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';

const UserProfileModal = ({ isOpen, onClose, userData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { user, token } = useAuth();
  const toast = useToast();

  if (!userData) return null;

  // Check if already following
  React.useEffect(() => {
    if (user && userData.user_id) {
      setIsFollowing(userService.isFollowing(user, userData.user_id));
    }
  }, [user, userData.user_id]);

  const handleFollowToggle = async () => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to follow users',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsFollowLoading(true);

    if (isFollowing) {
      // Unfollow
      const result = await userService.unfollowUser(userData.user_id, token);
      if (result.success) {
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You unfollowed ${userData.name}`,
          status: 'info',
          duration: 2000,
          isClosable: true
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    } else {
      // Follow
      const result = await userService.followUser(userData.name, token);
      if (result.success) {
        setIsFollowing(true);
        toast({
          title: 'Success',
          description: result.message,
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      } else {
        toast({
          title: 'Error',
          description: result.error,
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }

    setIsFollowLoading(false);
  };

  const achievements = [
    { id: 1, title: 'Beach Guardian', icon: '🏖️', description: 'Completed 10 beach cleanups', date: '2024-11-15' },
    { id: 2, title: 'Eco Warrior', icon: '🌱', description: 'Collected 500+ items', date: '2024-10-28' },
    { id: 3, title: 'Team Leader', icon: '👥', description: 'Led 5 community campaigns', date: '2024-09-12' },
    { id: 4, title: 'Green Streak', icon: '⚡', description: '30-day activity streak', date: '2024-08-20' },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'cleanup',
      location: 'Jumeirah Beach',
      date: '2024-11-15',
      stats: { items: 23, points: 69, duration: '2h 15m' },
      image: '🏖️'
    },
    {
      id: 2,
      type: 'campaign',
      location: 'Business Bay',
      date: '2024-11-12',
      stats: { volunteers: 8, points: 120, duration: '3h 30m' },
      image: '🏢'
    },
    {
      id: 3,
      type: 'report',
      location: 'Al Salam Park',
      date: '2024-11-10',
      stats: { reports: 3, points: 15, duration: '1h' },
      image: '🌳'
    }
  ];

  const monthlyStats = [
    { month: 'Nov', points: 450, activities: 8 },
    { month: 'Oct', points: 380, activities: 12 },
    { month: 'Sep', points: 520, activities: 15 },
    { month: 'Aug', points: 290, activities: 9 },
    { month: 'Jul', points: 340, activities: 11 },
    { month: 'Jun', points: 410, activities: 13 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent maxH="90vh" bg="neutral.800" borderColor="neutral.700" border="1px solid">
        <ModalHeader pb={0} bg="neutral.900" borderTopRadius="md">
          <VStack spacing={4} align="center" py={4}>
            {/* Profile Header */}
            <Avatar 
              size="2xl" 
              name={userData.name} 
              src={userData.avatar}
              bg="rgba(47, 212, 99, 0.1)"
              border="3px solid"
              borderColor="brand.500"
              color="brand.500"
            />
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="neutral.50" fontWeight="700">{userData.name}</Heading>
              <Text color="neutral.400" fontSize="md">@{userData.username}</Text>
              <HStack spacing={4} color="neutral.400">
                <HStack spacing={1}>
                  <Icon as={FiMapPin} boxSize={4} />
                  <Text fontSize="sm">{userData.location}</Text>
                </HStack>
                <HStack spacing={1}>
                  <Icon as={FiCalendar} boxSize={4} />
                  <Text fontSize="sm">Joined {userData.joinDate}</Text>
                </HStack>
              </HStack>
            </VStack>

            {/* Stats Row */}
            <Grid templateColumns="repeat(4, 1fr)" gap={6} w="full" maxW="500px">
              <Stat textAlign="center">
                <StatNumber fontSize="xl" color="brand.500" fontWeight="700">{userData.totalPoints}</StatNumber>
                <StatLabel fontSize="xs" color="neutral.400">Points</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="xl" color="green.400" fontWeight="700">{userData.totalActivities}</StatNumber>
                <StatLabel fontSize="xs" color="neutral.400">Activities</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="xl" color="purple.400" fontWeight="700">{userData.rank}</StatNumber>
                <StatLabel fontSize="xs" color="neutral.400">Global Rank</StatLabel>
              </Stat>
              <Stat textAlign="center">
                <StatNumber fontSize="xl" color="orange.400" fontWeight="700">{userData.streak}</StatNumber>
                <StatLabel fontSize="xs" color="neutral.400">Day Streak</StatLabel>
              </Stat>
            </Grid>

            {/* Action Buttons */}
            <HStack spacing={3}>
              <Button 
                bg={isFollowing ? "neutral.600" : "brand.500"}
                color={isFollowing ? "neutral.300" : "neutral.900"}
                size="sm"
                _hover={{ bg: isFollowing ? 'neutral.500' : 'brand.600' }}
                onClick={handleFollowToggle}
                isLoading={isFollowLoading}
                leftIcon={<Icon as={isFollowing ? FiUserCheck : FiUserPlus} />}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                borderColor="neutral.700"
                color="neutral.200"
                _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
              >
                <Icon as={FiHeart} mr={2} />
                Kudos
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                borderColor="neutral.700"
                color="neutral.200"
                _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
              >
                <Icon as={FiCamera} mr={2} />
                Share
              </Button>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="neutral.400" _hover={{ bg: 'neutral.700', color: 'neutral.50' }} />
        
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList borderBottomColor="neutral.700">
              <Tab 
                color="neutral.400" 
                _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
              >
                Recent Activity
              </Tab>
              <Tab 
                color="neutral.400" 
                _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
              >
                Achievements
              </Tab>
              <Tab 
                color="neutral.400" 
                _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
              >
                Statistics
              </Tab>
              <Tab 
                color="neutral.400" 
                _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
              >
                Following
              </Tab>
            </TabList>

            <TabPanels>
              {/* Recent Activity Tab */}
              <TabPanel p={0} pt={4}>
                <VStack spacing={4} align="stretch">
                  {recentActivities.map((activity) => (
                    <Card 
                      key={activity.id} 
                      bg="neutral.700" 
                      border="1px solid" 
                      borderColor="neutral.600"
                      borderRadius="12px"
                    >
                      <CardBody p={4}>
                        <HStack spacing={4}>
                          <Box 
                            fontSize="2xl" 
                            p={2} 
                            bg="neutral.600" 
                            borderRadius="8px"
                            border="1px solid"
                            borderColor="neutral.500"
                          >
                            {activity.image}
                          </Box>
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack spacing={2}>
                              <Text fontWeight="600" textTransform="capitalize" color="neutral.50">
                                {activity.type}
                              </Text>
                              <Text color="neutral.400">at</Text>
                              <Text color="brand.500" fontWeight="600">
                                {activity.location}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="neutral.400">
                              {activity.date}
                            </Text>
                            <HStack spacing={4} fontSize="sm">
                              {activity.stats.items && (
                                <Badge colorScheme="green" variant="subtle">
                                  {activity.stats.items} items
                                </Badge>
                              )}
                              {activity.stats.volunteers && (
                                <Badge colorScheme="blue" variant="subtle">
                                  {activity.stats.volunteers} volunteers
                                </Badge>
                              )}
                              {activity.stats.reports && (
                                <Badge colorScheme="orange" variant="subtle">
                                  {activity.stats.reports} reports
                                </Badge>
                              )}
                              <Badge colorScheme="purple" variant="subtle">
                                +{activity.stats.points} pts
                              </Badge>
                            </HStack>
                          </VStack>
                          <VStack spacing={0} align="end">
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                              {activity.stats.duration}
                            </Text>
                            <Text fontSize="xs" color="gray.500">Duration</Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Achievements Tab */}
              <TabPanel p={0} pt={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} variant="outline">
                      <CardBody p={4}>
                        <HStack spacing={3}>
                          <Box fontSize="2xl">{achievement.icon}</Box>
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="semibold">{achievement.title}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {achievement.description}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              Earned {achievement.date}
                            </Text>
                          </VStack>
                          <Icon as={FiAward} color="yellow.500" boxSize={5} />
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Statistics Tab */}
              <TabPanel p={0} pt={4}>
                <VStack spacing={6}>
                  {/* Monthly Progress Chart */}
                  <Card w="full" variant="outline">
                    <CardBody>
                      <Heading size="sm" mb={4}>Monthly Progress</Heading>
                      <VStack spacing={3}>
                        {monthlyStats.map((stat) => (
                          <Box key={stat.month} w="full">
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="sm" fontWeight="medium">{stat.month}</Text>
                              <HStack spacing={4}>
                                <Text fontSize="sm" color="brand.600">
                                  {stat.points} pts
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {stat.activities} activities
                                </Text>
                              </HStack>
                            </HStack>
                            <Progress 
                              value={(stat.points / 600) * 100} 
                              colorScheme="brand" 
                              size="sm" 
                              borderRadius="full"
                            />
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Impact Summary */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                    <Card variant="outline">
                      <CardBody textAlign="center">
                        <Icon as={FiTarget} color="green.500" boxSize={8} mb={2} />
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {userData.totalItems || '1,245'}
                        </Text>
                        <Text fontSize="sm" color="gray.600">Items Collected</Text>
                      </CardBody>
                    </Card>
                    
                    <Card variant="outline">
                      <CardBody textAlign="center">
                        <Icon as={FiTrendingUp} color="blue.500" boxSize={8} mb={2} />
                        <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                          {userData.co2Saved || '340'}kg
                        </Text>
                        <Text fontSize="sm" color="gray.600">CO₂ Saved</Text>
                      </CardBody>
                    </Card>
                    
                    <Card variant="outline">
                      <CardBody textAlign="center">
                        <Icon as={FiClock} color="purple.500" boxSize={8} mb={2} />
                        <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                          {userData.totalHours || '89'}h
                        </Text>
                        <Text fontSize="sm" color="gray.600">Time Contributed</Text>
                      </CardBody>
                    </Card>
                    
                    <Card variant="outline">
                      <CardBody textAlign="center">
                        <Icon as={FiStar} color="orange.500" boxSize={8} mb={2} />
                        <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                          {userData.level || '12'}
                        </Text>
                        <Text fontSize="sm" color="gray.600">Current Level</Text>
                      </CardBody>
                    </Card>
                  </Grid>
                </VStack>
              </TabPanel>

              {/* Following Tab */}
              <TabPanel p={0} pt={4}>
                <VStack spacing={4}>
                  <HStack justify="space-between" w="full">
                    <Heading size="sm">Following (24)</Heading>
                    <Button size="sm" variant="ghost">View All</Button>
                  </HStack>
                  
                  {/* Following List */}
                  {Array.from({length: 6}).map((_, index) => (
                    <HStack key={index} p={3} w="full" bg="gray.50" borderRadius="md">
                      <Avatar size="sm" name={`User ${index + 1}`} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {['Ahmed Al Rashid', 'Sara Al Zahra', 'Omar Al Mansoori', 'Layla Al Kaabi', 'Hassan Al Blooshi', 'Maryam Al Sharqi'][index]}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {['1,250 points', '980 points', '1,450 points', '2,100 points', '760 points', '1,890 points'][index]}
                        </Text>
                      </VStack>
                      <Button size="xs" variant="outline">Following</Button>
                    </HStack>
                  ))}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default UserProfileModal;