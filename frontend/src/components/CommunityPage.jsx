import React, { useCallback, useEffect, useState } from 'react';
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
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
} from '@chakra-ui/react';
import { FiUsers, FiAward, FiCalendar, FiPlus, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import campaignService from '../services/campaignService';
import volunteerService from '../services/volunteerService';
import { normalizeCampaignList } from '../utils/campaignFormatter';
import RecommendedUsers from './RecommendedUsers';

const getSourceColor = (source) => {
  if (source === 'network' || source === 'qdrant') return 'green';
  if (source === 'memory') return 'blue';
  if (source === 'local-cache' || source === 'storage') return 'yellow';
  if (source === 'api-fallback') return 'orange';
  return 'gray';
};

const formatCleanupDate = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Scheduled soon';
  }
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const deriveLeaderboard = (volunteers = []) =>
  volunteers.slice(0, 4).map((volunteer, index) => ({
    rank: volunteer.rank || index + 1,
    name: volunteer.name,
    points: volunteer.metadata?.impact_points || (volunteer.pastCleanupCount || 0) * 40,
    members: volunteer.pastCleanupCount || 0,
    progress: Math.min(100, ((volunteer.pastCleanupCount || 0) / 50) * 100),
    badge: ['🏆', '🥈', '🥉', '⭐'][index] || '🌱',
    color: ['yellow', 'gray', 'orange', 'blue'][index] || 'green',
  }));

const deriveCleanups = (campaigns = []) =>
  campaigns
    .filter((campaign) => campaign.status !== 'completed')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4)
    .map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      location: campaign.location?.address || 'Unknown location',
      date: formatCleanupDate(campaign.date),
      participants: campaign.volunteers?.length || campaign.volunteerSummary?.current || 0,
      maxParticipants: campaign.volunteerGoal || 0,
      organizer: campaign.organizer?.name || 'EcoSynk Operations',
    }));

const deriveStats = (volunteerMeta, campaigns = [], leaderboardData = []) => {
  const totalMembers = volunteerMeta?.totalVolunteers || leaderboardData.length;
  const totalPoints = leaderboardData.reduce((sum, entry) => sum + (entry.points || 0), 0);
  const itemsCollected = campaigns.reduce((sum, campaign) => sum + (campaign.esgImpact?.itemsCollected || 0), 0);
  return {
    totalMembers,
    activeCleanups: campaigns.filter((campaign) => campaign.status !== 'completed').length,
    totalPoints,
    itemsCollected,
  };
};

const CommunityPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeCleanups, setActiveCleanups] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeCleanups: 0,
    totalPoints: 0,
    itemsCollected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [metadata, setMetadata] = useState({ campaigns: null, volunteers: null });
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCommunityData = useCallback(
      async ({ forceRefresh = false } = {}) => {
        setError(null);
        setWarning(null);
        setLoading((prev) => (forceRefresh ? prev : true));
        setIsRefreshing(forceRefresh);

        try {
          const [campaignResult, volunteerResult] = await Promise.allSettled([
            campaignService.getAllCampaigns({ limit: 150, forceRefresh }),
            volunteerService.getLeaderboard(12, { forceRefresh }),
          ]);

          const nextMetadata = {};
          const issues = [];
          const warnings = [];
          let campaigns = [];
          let volunteers = [];
          let volunteerMeta = null;

          if (campaignResult.status === 'fulfilled' && campaignResult.value.success) {
            campaigns = normalizeCampaignList(campaignResult.value.campaigns || []);
            nextMetadata.campaigns = {
              source: campaignResult.value.source,
              count: campaigns.length,
            };
            if (campaignResult.value.warning) {
              warnings.push(campaignResult.value.warning);
            }
          } else {
            issues.push('Unable to load campaigns');
          }

          if (volunteerResult.status === 'fulfilled' && volunteerResult.value.success) {
            volunteers = volunteerResult.value.leaderboard || [];
            volunteerMeta = volunteerResult.value;
            nextMetadata.volunteers = {
              source: volunteerResult.value.source,
              count: volunteers.length,
            };
            if (volunteerResult.value.warning) {
              warnings.push(volunteerResult.value.warning);
            }
          } else {
            issues.push('Unable to load volunteers');
          }

          if (!campaigns.length && !volunteers.length) {
            setError(issues.join('. ') || 'No community data available');
          } else if (issues.length) {
            setWarning(issues.join('. '));
          } else if (warnings.length) {
            setWarning(warnings.join('. '));
          }

          const leaderboardData = deriveLeaderboard(volunteers);
          const cleanups = deriveCleanups(campaigns);
          setLeaderboard(leaderboardData);
          setActiveCleanups(cleanups);
          setCommunityStats(deriveStats(volunteerMeta, campaigns, leaderboardData));
          setMetadata(nextMetadata);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('Community load failed:', err);
          setError(err.message || 'Unable to load community data');
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      },
      []
    );

    useEffect(() => {
      loadCommunityData();
    }, [loadCommunityData]);

    const handleRefresh = () => {
      loadCommunityData({ forceRefresh: true });
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
          <HStack spacing={3}>
            <Box bg="whiteAlpha.20" p={2} borderRadius="lg">
              <Icon as={FiUsers} boxSize={6} />
            </Box>
            <IconButton
              aria-label="Refresh community data"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            />
          </HStack>
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

        {(metadata.campaigns || metadata.volunteers || lastUpdated) && (
          <HStack spacing={2} mt={3} flexWrap="wrap">
            {metadata.campaigns && (
              <Badge colorScheme={getSourceColor(metadata.campaigns.source)}>
                Campaigns · {metadata.campaigns.source}
              </Badge>
            )}
            {metadata.volunteers && (
              <Badge colorScheme={getSourceColor(metadata.volunteers.source)}>
                Volunteers · {metadata.volunteers.source}
              </Badge>
            )}
            {lastUpdated && (
              <Text fontSize="xs" opacity={0.8}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </HStack>
        )}
      </Box>

      {/* Content */}
      <Box flex="1" overflowY="auto" p={4} pb={24}>
        <VStack spacing={6} align="stretch">
          {(error || warning) && (
            <Box>
              {error && (
                <Alert status="error" borderRadius="lg" mb={warning ? 3 : 0}>
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              {!error && warning && (
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  {warning}
                </Alert>
              )}
            </Box>
          )}
          {/* Leaderboard Section */}
          <Card bg="neutral.800" shadow="sm" border="1px solid" borderColor="neutral.700">
            <CardHeader pb={3}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    bg="rgba(251, 191, 36, 0.1)"
                    p={2}
                    borderRadius="lg"
                  >
                    <Icon as={FiAward} boxSize={5} color="yellow.400" />
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
              {loading && !leaderboard.length ? (
                <VStack spacing={3} py={4}>
                  <Spinner color="purple.500" />
                  <Text fontSize="sm" color="gray.600">Loading leaderboard...</Text>
                </VStack>
              ) : leaderboard.length ? (
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
                                {team.members} cleanups
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
                        {Math.round(team.progress)}% to next badge
                      </Text>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <VStack spacing={3} py={4}>
                  <Text fontWeight="semibold" color="gray.800">No leaderboard data</Text>
                  <Text fontSize="sm" color="gray.600">Refresh to fetch volunteer rankings.</Text>
                </VStack>
              )}

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

          {/* Recommended Users Section */}
          <RecommendedUsers limit={5} />

          {/* Active Cleanups Section */}
          <Card bg="neutral.800" shadow="sm" border="1px solid" borderColor="neutral.700">
            <CardHeader pb={3}>
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Box
                    bg="rgba(47, 212, 99, 0.1)"
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
              {loading && !activeCleanups.length ? (
                <VStack spacing={3} py={4}>
                  <Spinner color="green.500" />
                  <Text fontSize="sm" color="gray.600">Loading upcoming cleanups...</Text>
                </VStack>
              ) : activeCleanups.length ? (
                <VStack spacing={4}>
                  {activeCleanups.map((cleanup) => (
                    <Card key={cleanup.id} variant="outline" w="full" bg="gray.50">
                      <CardBody p={4}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Heading size="sm" color="gray.900">{cleanup.title}</Heading>
                            <Badge colorScheme="green" fontSize="xs">
                              {cleanup.participants}/{cleanup.maxParticipants || cleanup.participants || 1}
                            </Badge>
                          </HStack>
                          
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm" color="gray.700">{cleanup.location}</Text>
                            <Text fontSize="xs" color="gray.600">{cleanup.date}</Text>
                            <Text fontSize="xs" color="gray.500">by {cleanup.organizer}</Text>
                          </VStack>

                          <Progress 
                            value={cleanup.maxParticipants ? (cleanup.participants / cleanup.maxParticipants) * 100 : 100} 
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
          <Card bg="neutral.800" shadow="sm" border="1px solid" borderColor="neutral.700">
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md" color="neutral.50" w="full">Community Actions</Heading>
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