import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  Text,
  Button,
  Avatar,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import { FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';

// Mock data for activity feed
const MOCK_ACTIVITIES = [
  {
    id: 1,
    user: 'Green Warrior',
    action: 'cleaned up',
    location: 'Central Park',
    image: '🌳',
    stats: { trash: '15 items', points: 45 },
    time: '2 hours ago',
    likes: 124,
    liked: false,
  },
  {
    id: 2,
    user: 'Eco Hero',
    action: 'reported',
    location: 'Times Square',
    image: '🏙️',
    stats: { trash: '8 items', points: 24 },
    time: '4 hours ago',
    likes: 89,
    liked: false,
  },
  {
    id: 3,
    user: 'Clean Crew',
    action: 'organized cleanup',
    location: 'Brooklyn Bridge',
    image: '🌉',
    stats: { volunteers: '12 people', points: 120 },
    time: '1 day ago',
    likes: 245,
    liked: false,
  },
  {
    id: 4,
    user: 'Nature Guardian',
    action: 'cleaned up',
    location: 'Riverside Park',
    image: '🏞️',
    stats: { trash: '23 items', points: 69 },
    time: '1 day ago',
    likes: 156,
    liked: false,
  },
];

// Today's impact mock data
const TODAY_IMPACT = {
  cleanups: 12,
  itemsCollected: 156,
  volunteers: 45,
};

const FeedPage = () => {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading more activities
  const loadMoreActivities = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, fetch more activities from API
    }, 1000);
  };

  // Toggle like on activity
  const toggleLike = (id) => {
    setActivities(
      activities.map((activity) => {
        if (activity.id === id) {
          return {
            ...activity,
            liked: !activity.liked,
            likes: activity.liked ? activity.likes - 1 : activity.likes + 1,
          };
        }
        return activity;
      })
    );
  };

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden" className="safe-area-inset">
      {/* Header with Impact Stats */}
      <Box
        bgGradient="linear(to-r, brand.600, brand.500)"
        color="white"
        px={6}
        pt={6}
        pb={8}
        className="safe-area-inset-top"
        flexShrink={0}
        boxShadow="sm"
      >
        <Heading as="h1" size="2xl" mb={6} fontWeight="bold">
          EcoSynk
        </Heading>

        {/* Today's Impact Stats */}
        <Grid templateColumns="repeat(3, 1fr)" gap={3}>
          <GridItem>
            <Stat p={3} bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg">
              <StatNumber fontSize="2xl" fontWeight="bold" mb={2}>
                {TODAY_IMPACT.cleanups}
              </StatNumber>
              <StatLabel fontSize="xs" opacity={0.9}>
                Cleanups
              </StatLabel>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat p={3} bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg">
              <StatNumber fontSize="2xl" fontWeight="bold" mb={2}>
                {TODAY_IMPACT.itemsCollected}
              </StatNumber>
              <StatLabel fontSize="xs" opacity={0.9}>
                Items
              </StatLabel>
            </Stat>
          </GridItem>
          <GridItem>
            <Stat p={3} bg="whiteAlpha.20" backdropBlur="sm" borderRadius="lg">
              <StatNumber fontSize="2xl" fontWeight="bold" mb={2}>
                {TODAY_IMPACT.volunteers}
              </StatNumber>
              <StatLabel fontSize="xs" opacity={0.9}>
                Volunteers
              </StatLabel>
            </Stat>
          </GridItem>
        </Grid>
      </Box>

      {/* Activity Feed */}
      <Box flex="1" overflowY="auto">
        {/* Section Header */}
        <Box px={6} pt={6} pb={3} flexShrink={0}>
          <Heading as="h2" size="lg" color="gray.900">
            Recent Activity
          </Heading>
        </Box>

        {/* Activity Cards */}
        <VStack spacing={4} px={6} pb={24}>
          {activities.map((activity) => (
            <Card
              key={activity.id}
              w="full"
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              _hover={{ boxShadow: 'md' }}
              transition="all 0.2s"
            >
              {/* Card Header */}
              <CardHeader pb={2} borderBottom="1px solid" borderBottomColor="gray.100">
                <HStack justify="space-between">
                  <HStack spacing={3} flex={1}>
                    <Avatar
                      size="md"
                      name={activity.user}
                      bg="brand.500"
                    />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="bold" color="gray.900">
                        {activity.user}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {activity.time}
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
              </CardHeader>

              {/* Card Body */}
              <CardBody spacing={3}>
                <Text color="gray.700">
                  <strong>{activity.user}</strong> {activity.action} at{' '}
                  <span style={{ color: '#2d7f4c', fontWeight: 'bold' }}>
                    {activity.location}
                  </span>
                </Text>

                {/* Stats Grid */}
                <Grid templateColumns="repeat(2, 1fr)" gap={2} bg="gray.50" p={3} borderRadius="lg">
                  {Object.entries(activity.stats).map(([key, value]) => (
                    <GridItem key={key} textAlign="center">
                      <Text fontSize="lg" fontWeight="bold" color="brand.600">
                        {value}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textTransform="capitalize">
                        {key}
                      </Text>
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>

              {/* Card Footer - Engagement */}
              <Divider />
              <CardFooter>
                <HStack justify="space-around" w="full" spacing={2}>
                  <Button
                    flex={1}
                    variant="ghost"
                    size="sm"
                    color={activity.liked ? 'red.600' : 'gray.600'}
                    bg={activity.liked ? 'red.50' : 'transparent'}
                    leftIcon={<Icon as={FiHeart} fill={activity.liked ? 'currentColor' : 'none'} />}
                    onClick={() => toggleLike(activity.id)}
                  >
                    {activity.likes}
                  </Button>
                  <Button
                    flex={1}
                    variant="ghost"
                    size="sm"
                    leftIcon={<Icon as={FiMessageCircle} />}
                    color="gray.600"
                  >
                    Comment
                  </Button>
                  <Button
                    flex={1}
                    variant="ghost"
                    size="sm"
                    leftIcon={<Icon as={FiShare2} />}
                    color="gray.600"
                  >
                    Share
                  </Button>
                </HStack>
              </CardFooter>
            </Card>
          ))}

          {/* Load More Button */}
          <Button
            w="full"
            colorScheme="brand"
            onClick={loadMoreActivities}
            isLoading={isLoading}
            loadingText="Loading..."
            size="md"
            mt={4}
          >
            Load More Activities
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default FeedPage;
