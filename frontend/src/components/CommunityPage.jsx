import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Avatar,
  AvatarGroup,
  Badge,
  Progress,
  Icon,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
} from '@chakra-ui/react';
import { FiUsers, FiAward, FiCalendar, FiPlus, FiTrendingUp } from 'react-icons/fi';

const CommunityPage = () => {
  // Mock data
  const leaderboard = [
    {
      rank: 1,
      name: 'Green Warriors',
      points: 245,
      members: 12,
      progress: 85,
      badge: '🏆',
      color: 'yellow'
    },
    {
      rank: 2,
      name: 'Eco Heroes',
      points: 189,
      members: 8,
      progress: 65,
      badge: '🥈',
      color: 'gray'
    },
    {
      rank: 3,
      name: 'Clean Crew',
      points: 156,
      members: 15,
      progress: 55,
      badge: '🥉',
      color: 'orange'
    },
    {
      rank: 4,
      name: 'Planet Savers',
      points: 142,
      members: 10,
      progress: 50,
      badge: '⭐',
      color: 'blue'
    }
  ];

  const activeCleanups = [
    {
      id: 1,
      title: 'Beach Cleanup Day',
      location: 'Ocean Beach',
      date: 'Tomorrow, 9:00 AM',
      participants: 8,
      maxParticipants: 15,
      organizer: 'Green Warriors'
    },
    {
      id: 2,
      title: 'Park Restoration',
      location: 'Central Park',
      date: 'Saturday, 10:00 AM',
      participants: 12,
      maxParticipants: 20,
      organizer: 'Eco Heroes'
    }
  ];

  const communityStats = {
    totalMembers: 156,
    activeCleanups: 8,
    totalPoints: 2450,
    itemsCollected: 1245
  };

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden">
      {/* Header */}
      <Box
        bgGradient="linear(to-r, purple.600, purple.500)"
        color="white"
        px={6}
        pt={6}
        pb={6}
        shadow="sm"
      >
        <HStack justify="space-between" align="start" mb={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" fontWeight="bold">Community</Heading>
            <Text fontSize="sm" opacity={0.9}>Join forces for a cleaner planet</Text>
          </VStack>
          <Box
            bg="whiteAlpha.20"
            p={2}
            borderRadius="lg"
          >
            <Icon as={FiUsers} boxSize={6} />
          </Box>
        </HStack>

        {/* Community Stats */}
        <Grid templateColumns="repeat(2, 1fr)" gap={3}>
          <GridItem>
            <Stat p={3} bg="whiteAlpha.20" borderRadius="lg">
              <StatNumber fontSize="xl" fontWeight="bold">{communityStats.totalMembers}</StatNumber>
              <StatLabel fontSize="xs" opacity={0.9}>Members</StatLabel>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat p={3} bg="whiteAlpha.20" borderRadius="lg">
              <StatNumber fontSize="xl" fontWeight="bold">{communityStats.activeCleanups}</StatNumber>
              <StatLabel fontSize="xs" opacity={0.9}>Active</StatLabel>
            </Stat>
          </GridItem>
        </Grid>
      </Box>

      {/* Content */}
      <Box flex="1" overflowY="auto" p={4} pb={24}>
        <VStack spacing={6} align="stretch">
          {/* Leaderboard Section */}
          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200">
            <CardHeader pb={3}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    bg="yellow.100"
                    p={2}
                    borderRadius="lg"
                  >
                    <Icon as={FiAward} boxSize={5} color="yellow.600" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.900">Community Leaderboard</Heading>
                    <Text fontSize="sm" color="gray.600">Top performing teams</Text>
                  </VStack>
                </HStack>
                <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                  This Week
                </Badge>
              </HStack>
            </CardHeader>

            <CardBody pt={0}>
              <VStack spacing={4}>
                {leaderboard.map((team) => (
                  <Box key={team.rank} w="full" p={3} bg="gray.50" borderRadius="lg">
                    <HStack justify="space-between" align="start" mb={2}>
                      <HStack spacing={3}>
                        <Text fontSize="2xl">{team.badge}</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold" color="gray.900">
                            {team.name}
                          </Text>
                          <HStack spacing={2}>
                            <Icon as={FiUsers} boxSize={3} color="gray.500" />
                            <Text fontSize="xs" color="gray.600">
                              {team.members} members
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <Badge 
                        colorScheme={team.color} 
                        fontSize="sm" 
                        px={2} 
                        py={1}
                        borderRadius="full"
                      >
                        {team.points} pts
                      </Badge>
                    </HStack>
                    
                    <Progress 
                      value={team.progress} 
                      colorScheme={team.color} 
                      size="sm" 
                      borderRadius="full"
                      mb={1}
                    />
                    <Text fontSize="xs" color="gray.600" textAlign="right">
                      {team.progress}% to next level
                    </Text>
                  </Box>
                ))}
              </VStack>

              <Button 
                w="full" 
                variant="ghost" 
                colorScheme="purple" 
                size="sm" 
                mt={4}
                rightIcon={<Icon as={FiTrendingUp} />}
              >
                View Full Leaderboard
              </Button>
            </CardBody>
          </Card>

          {/* Active Cleanups Section */}
          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200">
            <CardHeader pb={3}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    bg="green.100"
                    p={2}
                    borderRadius="lg"
                  >
                    <Icon as={FiCalendar} boxSize={5} color="green.600" />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading size="md" color="gray.900">Active Cleanups</Heading>
                    <Text fontSize="sm" color="gray.600">Join upcoming events</Text>
                  </VStack>
                </HStack>
                <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                  {activeCleanups.length} events
                </Badge>
              </HStack>
            </CardHeader>

            <CardBody pt={0}>
              {activeCleanups.length > 0 ? (
                <VStack spacing={4}>
                  {activeCleanups.map((cleanup) => (
                    <Card key={cleanup.id} variant="outline" w="full" bg="gray.50">
                      <CardBody p={4}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Heading size="sm" color="gray.900">{cleanup.title}</Heading>
                            <Badge colorScheme="green" fontSize="xs">
                              {cleanup.participants}/{cleanup.maxParticipants}
                            </Badge>
                          </HStack>
                          
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color="gray.700">{cleanup.location}</Text>
                            <Text fontSize="xs" color="gray.600">{cleanup.date}</Text>
                            <Text fontSize="xs" color="gray.500">by {cleanup.organizer}</Text>
                          </VStack>

                          <Progress 
                            value={(cleanup.participants / cleanup.maxParticipants) * 100} 
                            colorScheme="green" 
                            size="sm" 
                            w="full"
                            borderRadius="full"
                          />

                          <HStack spacing={2} w="full">
                            <Button size="sm" colorScheme="green" variant="solid" flex={1}>
                              Join Event
                            </Button>
                            <Button size="sm" variant="outline" flex={1}>
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <VStack spacing={4} py={8} textAlign="center">
                  <Box
                    bg="green.100"
                    p={4}
                    borderRadius="full"
                  >
                    <Icon as={FiCalendar} boxSize={8} color="green.600" />
                  </Box>
                  <VStack spacing={1}>
                    <Text fontWeight="semibold" color="gray.900">No active cleanups</Text>
                    <Text fontSize="sm" color="gray.600">Be the first to organize one!</Text>
                  </VStack>
                </VStack>
              )}

              <Button 
                w="full" 
                colorScheme="green" 
                size="md" 
                mt={4}
                leftIcon={<Icon as={FiPlus} />}
              >
                Organize Cleanup
              </Button>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200">
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md" color="gray.900" w="full">Community Actions</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={3} w="full">
                  <Button colorScheme="blue" size="sm" height="auto" py={3}>
                    <VStack spacing={1}>
                      <Icon as={FiUsers} boxSize={5} />
                      <Text fontSize="xs">Invite Friends</Text>
                    </VStack>
                  </Button>
                  <Button colorScheme="orange" size="sm" height="auto" py={3}>
                    <VStack spacing={1}>
                      <Icon as={FiAward} boxSize={5} />
                      <Text fontSize="xs">My Achievements</Text>
                    </VStack>
                  </Button>
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Flex>
  );
};

export default CommunityPage;