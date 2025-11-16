import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Avatar,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Card,
  CardBody,
  Grid,
  GridItem,
  Progress,
  Button,
  Alert,
  AlertIcon,
  Badge,
  AlertTitle,
  AlertDescription,
  Icon,
} from '@chakra-ui/react';
import { FiZap, FiAward } from 'react-icons/fi';

// Mock user data
const USER_DATA = {
  name: 'Alex Green',
  rank: 'Eco Warrior',
  totalCleanups: 24,
  totalItems: 156,
  currentStreak: 7,
  totalPoints: 420,
  joinDate: 'March 2024',
};

// Mock achievements data
const ACHIEVEMENTS = [
  {
    id: 1,
    name: 'First Steps',
    description: 'Complete your first cleanup',
    icon: '👣',
    earned: true,
    earnedDate: 'Apr 5, 2024',
  },
  {
    id: 2,
    name: 'Trash Hunter',
    description: 'Report 10 trash locations',
    icon: '🔍',
    earned: true,
    earnedDate: 'Apr 12, 2024',
  },
  {
    id: 3,
    name: 'Community Leader',
    description: 'Organize 5 cleanups',
    icon: '👑',
    earned: true,
    earnedDate: 'May 1, 2024',
  },
  {
    id: 4,
    name: 'Eco Champion',
    description: 'Collect 500 items',
    icon: '🏆',
    earned: false,
    progress: '156/500',
  },
  {
    id: 5,
    name: 'Week Warrior',
    description: 'Maintain 30-day streak',
    icon: '🔥',
    earned: false,
    progress: '7/30 days',
  },
  {
    id: 6,
    name: 'Global Impact',
    description: 'Earn 1000 points',
    icon: '🌍',
    earned: false,
    progress: '420/1000',
  },
];

const ProfilePage = () => {
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length;
  const displayedAchievements = showAllAchievements ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 3);

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden" className="safe-area-inset">
      {/* Gradient Header */}
      <Box
        bgGradient="linear(to-b, brand.600, brand.500, teal.500)"
        color="white"
        px={6}
        pt={6}
        pb={8}
        className="safe-area-inset-top"
        flexShrink={0}
        boxShadow="sm"
      >
        {/* Profile Info */}
        <HStack spacing={4} mb={6}>
          <Avatar
            size="lg"
            name={USER_DATA.name}
            bg="whiteAlpha.30"
            border="2px solid"
            borderColor="whiteAlpha.40"
          />
          <VStack align="flex-start" spacing={1}>
            <Heading as="h1" size="lg" fontWeight="bold">
              {USER_DATA.name}
            </Heading>
            <Text fontSize="sm" opacity={0.9}>
              {USER_DATA.rank}
            </Text>
            <Text fontSize="xs" opacity={0.75}>
              Joined {USER_DATA.joinDate}
            </Text>
          </VStack>
        </HStack>

        {/* Key Stats Grid */}
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          <GridItem>
            <Box bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.20">
              <Text fontSize="3xl" fontWeight="bold">{USER_DATA.totalCleanups}</Text>
              <Text fontSize="xs" opacity={0.9}>Total Cleanups</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.20">
              <Text fontSize="3xl" fontWeight="bold">{USER_DATA.totalPoints}</Text>
              <Text fontSize="xs" opacity={0.9}>Points Earned</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.20">
              <Text fontSize="3xl" fontWeight="bold">{USER_DATA.totalItems}</Text>
              <Text fontSize="xs" opacity={0.9}>Items Collected</Text>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg" p={3} border="1px solid" borderColor="whiteAlpha.20">
              <HStack>
                <Text fontSize="3xl" fontWeight="bold">{USER_DATA.currentStreak}</Text>
              </HStack>
              <Text fontSize="xs" opacity={0.9}>Day Streak</Text>
            </Box>
          </GridItem>
        </Grid>
      </Box>

      {/* Content Area */}
      <Box flex="1" overflow="hidden">
        <Tabs display="flex" flexDirection="column" h="full">
          <TabList bg="white" borderBottom="2px solid" borderBottomColor="gray.200" px={4} py={0}>
            <Tab _selected={{ color: 'brand.600', borderColor: 'brand.600' }} fontWeight="600">
              Overview
            </Tab>
            <Tab _selected={{ color: 'brand.600', borderColor: 'brand.600' }} fontWeight="600">
              Achievements ({earnedCount}/{ACHIEVEMENTS.length})
            </Tab>
          </TabList>

          <TabPanels flex="1" overflow="hidden">
            {/* Overview Tab */}
            <TabPanel overflow="y-auto" pb={24}>
              <VStack spacing={6} align="stretch">
                {/* Stats Section */}
                <VStack spacing={3} align="stretch">
                  <Heading size="md" color="gray.900">
                    Your Stats
                  </Heading>

                  {/* Cleanup Progress */}
                  <Card bg="white" border="1px solid" borderColor="gray.100">
                    <CardBody spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="600" color="gray.900">Cleanup Goal</Text>
                        <Badge colorScheme="brand" fontSize="xs">
                          {USER_DATA.totalCleanups}/30
                        </Badge>
                      </Flex>
                      <Progress
                        value={(USER_DATA.totalCleanups / 30) * 100}
                        colorScheme="brand"
                        size="sm"
                        borderRadius="full"
                      />
                    </CardBody>
                  </Card>

                  {/* Items Goal */}
                  <Card bg="white" border="1px solid" borderColor="gray.100">
                    <CardBody spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="600" color="gray.900">Items Goal</Text>
                        <Badge colorScheme="brand" fontSize="xs">
                          {USER_DATA.totalItems}/500
                        </Badge>
                      </Flex>
                      <Progress
                        value={(USER_DATA.totalItems / 500) * 100}
                        colorScheme="brand"
                        size="sm"
                        borderRadius="full"
                      />
                    </CardBody>
                  </Card>

                  {/* Points Goal */}
                  <Card bg="white" border="1px solid" borderColor="gray.100">
                    <CardBody spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="600" color="gray.900">Points Goal</Text>
                        <Badge colorScheme="brand" fontSize="xs">
                          {USER_DATA.totalPoints}/1000
                        </Badge>
                      </Flex>
                      <Progress
                        value={(USER_DATA.totalPoints / 1000) * 100}
                        colorScheme="brand"
                        size="sm"
                        borderRadius="full"
                      />
                    </CardBody>
                  </Card>
                </VStack>

                {/* Quick Actions */}
                <VStack spacing={3} align="stretch">
                  <Heading size="md" color="gray.900">
                    Quick Actions
                  </Heading>
                  <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                    <Button
                      variant="outline"
                      colorScheme="brand"
                      h="24"
                      fontSize="sm"
                      fontWeight="600"
                      flexDirection="column"
                      whiteSpace="normal"
                    >
                      <Text fontSize="2xl" mb={1}>🧹</Text>
                      Start Cleanup
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="brand"
                      h="24"
                      fontSize="sm"
                      fontWeight="600"
                      flexDirection="column"
                      whiteSpace="normal"
                    >
                      <Text fontSize="2xl" mb={1}>🏆</Text>
                      Leaderboard
                    </Button>
                  </Grid>
                </VStack>

                {/* Streak Alert */}
                <Alert
                  status="warning"
                  variant="left-accent"
                  borderRadius="lg"
                >
                  <AlertIcon fontSize="2xl">🔥</AlertIcon>
                  <VStack align="flex-start" spacing={0}>
                    <AlertTitle>{USER_DATA.currentStreak}-Day Streak!</AlertTitle>
                    <AlertDescription fontSize="sm">
                      Keep it up! Complete a cleanup tomorrow to maintain your streak.
                    </AlertDescription>
                  </VStack>
                </Alert>
              </VStack>
            </TabPanel>

            {/* Achievements Tab */}
            <TabPanel overflow="y-auto" pb={24}>
              <VStack spacing={6} align="stretch">
                {/* Achievements Summary */}
                <VStack spacing={1} align="flex-start">
                  <Heading size="md" color="gray.900">
                    Achievements
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    {earnedCount} of {ACHIEVEMENTS.length} earned
                  </Text>
                </VStack>

                {/* Achievements Grid */}
                <VStack spacing={3} align="stretch">
                  {displayedAchievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      bg={achievement.earned ? 'white' : 'gray.50'}
                      border="1px solid"
                      borderColor={achievement.earned ? 'green.200' : 'gray.200'}
                      opacity={achievement.earned ? 1 : 0.75}
                    >
                      <CardBody>
                        <HStack spacing={4} align="flex-start">
                          <Box
                            fontSize="2xl"
                            w="12"
                            h="12"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="lg"
                            flexShrink={0}
                            bg={achievement.earned ? 'brand.100' : 'gray.200'}
                          >
                            {achievement.icon}
                          </Box>

                          <VStack align="flex-start" spacing={1} flex="1" minW="0">
                            <Heading as="h3" size="sm" color="gray.900">
                              {achievement.name}
                            </Heading>
                            <Text fontSize="sm" color="gray.600">
                              {achievement.description}
                            </Text>

                            {achievement.earned ? (
                              <Badge colorScheme="green" fontSize="xs" mt={2}>
                                ✓ Earned {achievement.earnedDate}
                              </Badge>
                            ) : (
                              <VStack align="stretch" spacing={1} w="full" mt={2}>
                                <Progress
                                  value={
                                    achievement.progress.includes('/500')
                                      ? (156 / 500) * 100
                                      : achievement.progress.includes('/30')
                                      ? (7 / 30) * 100
                                      : (420 / 1000) * 100
                                  }
                                  size="sm"
                                  colorScheme="brand"
                                  borderRadius="full"
                                />
                                <Text fontSize="xs" color="gray.600">
                                  {achievement.progress}
                                </Text>
                              </VStack>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>

                {/* Show More Button */}
                {!showAllAchievements && ACHIEVEMENTS.length > 3 && (
                  <Button
                    variant="ghost"
                    colorScheme="brand"
                    w="full"
                    mt={4}
                    onClick={() => setShowAllAchievements(true)}
                  >
                    Show All Achievements ({ACHIEVEMENTS.length})
                  </Button>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
};

export default ProfilePage;
