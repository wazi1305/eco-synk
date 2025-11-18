import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Textarea,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Alert,
  AlertIcon,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
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
  FiRefreshCw,
} from 'react-icons/fi';
import campaignService from '../services/campaignService';
import volunteerService from '../services/volunteerService';
import trashReportService from '../services/trashReportService';
import { normalizeCampaignList } from '../utils/campaignFormatter';
import UserProfileModal from './UserProfileModal';

const DEFAULT_IMPACT_STATS = {
  activities: 0,
  participants: 0,
  itemsCollected: 0,
  co2Saved: 0,
  locationsCleared: 0,
};

const getSourceColor = (source) => {
  if (source === 'network' || source === 'qdrant') return 'green';
  if (source === 'memory') return 'blue';
  if (source === 'local-cache' || source === 'storage') return 'yellow';
  if (source === 'api-fallback') return 'orange';
  return 'gray';
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatRelativeTime = (dateInput) => {
  const date = new Date(dateInput || Date.now());
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months || 1}mo ago`;
};

const getDateMeta = (value) => {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date();
    return { date: fallback, value: fallback.getTime() };
  }
  return { date: parsed, value: parsed.getTime() };
};

const getVolunteerIdentifier = (volunteer) => {
  const fallbackParts = [
    volunteer.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'volunteer',
    volunteer.metadata?.created_at,
    volunteer.metadata?.timestamp,
    volunteer.metadata?.updated_at,
    volunteer.rank,
    volunteer.badge,
    volunteer.pastCleanupCount,
  ].filter(Boolean);

  return (
    volunteer.id ||
    volunteer.userId ||
    volunteer.metadata?.id ||
    volunteer.metadata?.source_id ||
    volunteer.metadata?.volunteer_id ||
    (fallbackParts.length ? fallbackParts.join('-') : `volunteer-${volunteer.pastCleanupCount || 'unknown'}`)
  );
};

const formatVolunteerForFeed = (volunteer) => ({
  id: getVolunteerIdentifier(volunteer),
  name: volunteer.name,
  username: volunteer.metadata?.username || volunteer.id?.slice(0, 8) || 'volunteer',
  avatar: volunteer.profilePictureUrl || '',
  location: volunteer.location?.address || 'United Arab Emirates',
  joinDate: volunteer.metadata?.created_at || volunteer.metadata?.timestamp,
  totalPoints: volunteer.metadata?.impact_points || safeNumber(volunteer.pastCleanupCount, 1) * 40,
  totalActivities: volunteer.pastCleanupCount || 0,
  rank: volunteer.rank ? `#${volunteer.rank}` : volunteer.badge,
  streak: volunteer.metadata?.activity_streak || volunteer.metadata?.streak || 0,
  totalItems: volunteer.metadata?.total_items_removed,
  co2Saved: volunteer.metadata?.co2_saved,
  totalHours: volunteer.hoursContributed || 0,
  level: volunteer.badge,
  verified: true,
  title: `${volunteer.badge || 'Eco'} Volunteer`,
  rawVolunteer: volunteer,
});

const buildCampaignActivity = (campaign) => {
  if (!campaign) return null;
  const { date: campaignDate, value: timestampValue } = getDateMeta(
    campaign.date || campaign.timeline?.startDate
  );
  const stats = {
    items: safeNumber(campaign.esgImpact?.itemsCollected),
    co2Saved: campaign.esgImpact?.co2Saved ? `${safeNumber(campaign.esgImpact.co2Saved)}kg` : null,
    volunteers: safeNumber(campaign.volunteers?.length || campaign.volunteerSummary?.current),
    points: safeNumber(campaign.funding?.current / 100),
  };

  return {
    id: `campaign-${campaign.id}`,
    user: {
      id: campaign.organizer?.id || campaign.organizer?.name || campaign.id,
      name: campaign.organizer?.name || 'EcoSynk Operations',
      username: campaign.organizer?.username || 'ecosynk',
      avatar: '',
      location: campaign.location?.address || 'Unknown location',
      joinDate: campaign.timeline?.startDate,
      totalPoints: stats.points * 10,
      totalActivities: stats.volunteers,
      rank: campaign.status === 'completed' ? 'Completed' : 'Active',
      streak: campaign.timeline?.daysRemaining || 0,
      totalItems: stats.items,
      co2Saved: safeNumber(campaign.esgImpact?.co2Saved),
      totalHours: campaign.timeline?.durationDays || 0,
      level: campaign.priority || campaign.difficulty || 'Medium',
      verified: true,
      title: 'Campaign Organizer',
    },
    type: 'campaign',
    title: campaign.title,
    description: campaign.description,
    location: campaign.location?.address || 'Unknown location',
    timestamp: formatRelativeTime(campaignDate),
    timestampValue,
    duration: campaign.timeline?.durationDays ? `${campaign.timeline.durationDays} days` : 'Scheduled',
    stats,
    images: [campaign.image || '♻️'],
    tags: campaign.hotspot?.materials || [],
    likes: stats.volunteers,
    comments: Math.max(2, Math.round(stats.points / 5)),
    weather: null,
    achievements: campaign.status === 'completed' ? ['Campaign Complete'] : null,
  };
};

const buildVolunteerActivity = (volunteer) => {
  if (!volunteer) return null;
  const volunteerId = getVolunteerIdentifier(volunteer);
  const { date: volunteerDate, value: timestampValue } = getDateMeta(
    volunteer.metadata?.updated_at || volunteer.metadata?.created_at
  );
  const stats = {
    level: volunteer.badge,
    points: safeNumber(volunteer.metadata?.impact_points || volunteer.pastCleanupCount * 50),
    items: safeNumber(volunteer.metadata?.total_items_removed),
    volunteers: volunteer.pastCleanupCount,
  };
  return {
    id: `volunteer-${volunteerId}`,
    user: formatVolunteerForFeed(volunteer),
    type: 'milestone',
    title: `${volunteer.name} reached ${volunteer.badge} status`,
    description:
      volunteer.metadata?.bio ||
      `Celebrating ${volunteer.pastCleanupCount || 0}+ cleanups across the UAE. Keep the streak going!`,
    location: volunteer.location?.address || 'United Arab Emirates',
    timestamp: formatRelativeTime(volunteerDate),
    timestampValue,
    duration: 'Milestone',
    stats,
    images: ['🏅', '🌱'],
    tags: volunteer.skills || [],
    likes: Math.max(12, volunteer.pastCleanupCount || 3),
    comments: Math.max(1, Math.round((volunteer.pastCleanupCount || 2) / 2)),
    achievements: volunteer.skills?.slice(0, 2) || null,
  };
};

const buildReportActivity = (report) => {
  if (!report) return null;
  const { date: reportDate, value: timestampValue } = getDateMeta(report.timestamp);
  return {
    id: `report-${report.id}`,
    user: {
      id: report.metadata?.analyzed_by || report.id,
      name: 'AI Report',
      username: 'ecosynk_ai',
      avatar: '',
      location: report.location?.address || 'Unknown location',
      joinDate: reportDate,
      totalPoints: 0,
      totalActivities: 0,
      rank: 'Reporter',
      streak: 0,
      totalItems: 0,
      co2Saved: 0,
      totalHours: 0,
      level: 'AI',
      verified: true,
      title: 'Cleanup Reporter',
    },
    type: 'report',
    title: `Waste hotspot in ${report.location?.address || 'your area'}`,
    description: report.description,
    location: report.location?.address,
    timestamp: formatRelativeTime(reportDate),
    timestampValue,
    duration: 'Report',
    stats: {
      items: safeNumber(report.metadata?.estimated_items || report.metadata?.items_estimated),
      points: safeNumber(report.cleanupPriority * 10),
      co2Saved: null,
      volunteers: null,
      reports: safeNumber(report.metadata?.reports || 1),
      impact: report.riskLevel || 'Medium Priority',
      followUps: safeNumber(report.metadata?.follow_ups),
    },
    images: ['📍'],
    tags: [report.primaryMaterial, report.estimatedVolume, report.riskLevel].filter(Boolean),
    likes: Math.max(3, Math.round(report.cleanupPriority)),
    comments: Math.max(1, Math.round(report.cleanupPriority / 2)),
    achievements: ['Hotspot Identified'],
  };
};

const buildFeedActivities = (campaigns, volunteers, reports) => {
  const items = [
    ...campaigns.map(buildCampaignActivity),
    ...volunteers.slice(0, 5).map(buildVolunteerActivity),
    ...reports.slice(0, 5).map(buildReportActivity),
  ].filter(Boolean);

  const seenIds = new Map();

  return items
    .sort((a, b) => (b.timestampValue || 0) - (a.timestampValue || 0))
    .map((item) => {
      const baseId = item.id || 'activity';
      const occurrence = seenIds.get(baseId) || 0;
      seenIds.set(baseId, occurrence + 1);
      const uniqueId = occurrence === 0 ? baseId : `${baseId}__${occurrence + 1}`;

      return {
        ...item,
        id: uniqueId,
        timestampValue: undefined
      };
    });
};

const buildImpactStats = (campaigns, reports) => {
  if (!campaigns.length && !reports.length) {
    return DEFAULT_IMPACT_STATS;
  }

  const participants = campaigns.reduce(
    (sum, campaign) => sum + safeNumber(campaign.volunteers?.length || campaign.volunteerSummary?.current),
    0
  );
  const items = campaigns.reduce((sum, campaign) => sum + safeNumber(campaign.esgImpact?.itemsCollected), 0);
  const co2 = campaigns.reduce((sum, campaign) => sum + safeNumber(campaign.esgImpact?.co2Saved), 0);
  const locations = new Set([
    ...campaigns.map((campaign) => campaign.location?.address).filter(Boolean),
    ...reports.map((report) => report.location?.address).filter(Boolean),
  ]);

  return {
    activities: campaigns.length + reports.length,
    participants,
    itemsCollected: items + reports.length * 5,
    co2Saved: co2,
    locationsCleared: locations.size || campaigns.length,
  };
};

const FeedPage = () => {
  const scrollRef = useRef(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activities, setActivities] = useState([]);
  const [todayImpact, setTodayImpact] = useState(DEFAULT_IMPACT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [metadata, setMetadata] = useState({ campaigns: null, volunteers: null, reports: null });
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const loadFeedData = useCallback(
    async ({ forceRefresh = false } = {}) => {
      setError(null);
      setWarning(null);
      setIsLoading((prev) => (forceRefresh ? prev : true));
      setIsRefreshing(forceRefresh);

      try {
        const [campaignResult, volunteerResult, reportResult] = await Promise.allSettled([
          campaignService.getAllCampaigns({ limit: 120, forceRefresh }),
          volunteerService.getLeaderboard(15, { forceRefresh }),
          trashReportService.getRecentTrashReports({ limit: 30 }),
        ]);

        const issues = [];
        const warnings = [];
        let campaigns = [];
        let volunteers = [];
        let reports = [];
        const nextMetadata = {};

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

        if (reportResult.status === 'fulfilled' && reportResult.value.success) {
          reports = reportResult.value.reports || [];
          nextMetadata.reports = {
            source: reportResult.value.source,
            count: reports.length,
          };
          if (reportResult.value.warning) {
            warnings.push(reportResult.value.warning);
          }
        } else {
          issues.push('Unable to load reports');
        }

        const hasData = campaigns.length || volunteers.length || reports.length;
        if (!hasData) {
          setError(issues.join('. ') || 'No feed data available');
        } else if (issues.length) {
          setWarning(issues.join('. '));
        } else if (warnings.length) {
          setWarning(warnings.join('. '));
        }

        setActivities(buildFeedActivities(campaigns, volunteers, reports));
        setTodayImpact(buildImpactStats(campaigns, reports));
        setMetadata(nextMetadata);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Feed load failed:', err);
        setError(err.message || 'Unable to load feed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  const handleRefresh = () => {
    loadFeedData({ forceRefresh: true });
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

          {/* Activity Stats */}
          {activity.stats && (
            <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={4}>
              {Object.entries(activity.stats)
                .filter(([, value]) => value !== null && value !== undefined)
                .slice(0, 3)
                .map(([label, value]) => (
                  <GridItem key={label}>
                    <Stat>
                      <StatLabel textTransform="capitalize" color="gray.500">
                        {label}
                      </StatLabel>
                      <StatNumber fontSize="lg">{value}</StatNumber>
                    </Stat>
                  </GridItem>
                ))}
            </Grid>
          )}

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
              {activity.tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="outline" colorScheme="gray" size="sm">
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
                {todayImpact.activities} activities today
              </Text>
            </VStack>
            <HStack spacing={2}>
              <IconButton icon={<FiSearch />} variant="ghost" size="sm" />
              <IconButton icon={<FiFilter />} variant="ghost" size="sm" />
              <IconButton icon={<FiPlus />} variant="ghost" size="sm" colorScheme="brand" />
              <IconButton
                icon={<FiRefreshCw />}
                variant="ghost"
                size="sm"
                aria-label="Refresh feed"
                onClick={handleRefresh}
                isLoading={isRefreshing}
              />
            </HStack>
          </HStack>

          {/* Today's Impact Bar */}
          <Box w="full" bg="gradient.primary" px={4} py={3}>
            <Box maxW="600px" mx="auto">
              <HStack justify="space-between" color="white" fontSize="xs">
                <VStack spacing={0}>
                  <Text fontWeight="bold">{todayImpact.participants}</Text>
                  <Text opacity={0.9}>Active</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{todayImpact.itemsCollected}</Text>
                  <Text opacity={0.9}>Items</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{todayImpact.co2Saved}kg</Text>
                  <Text opacity={0.9}>CO₂ Saved</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="bold">{todayImpact.locationsCleared}</Text>
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
            {(metadata.campaigns || metadata.volunteers || metadata.reports || lastUpdated) && (
              <HStack spacing={2} mt={2} flexWrap="wrap">
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
                {metadata.reports && (
                  <Badge colorScheme={getSourceColor(metadata.reports.source)}>
                    Reports · {metadata.reports.source}
                  </Badge>
                )}
                {lastUpdated && (
                  <Text fontSize="xs" color="gray.500">
                    Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </HStack>
            )}
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
          {(error || warning) && (
            <Box w="full">
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
          {isLoading ? (
            <Card w="full" variant="outline">
              <CardBody>
                <VStack spacing={3} py={6}>
                  <Spinner color="brand.500" />
                  <Text color="gray.600">Loading live activities...</Text>
                </VStack>
              </CardBody>
            </Card>
          ) : activities.length ? (
            activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
          ) : (
            <Card w="full" variant="outline">
              <CardBody>
                <VStack spacing={2} py={4}>
                  <Text fontWeight="semibold">No activities yet</Text>
                  <Text fontSize="sm" color="gray.600">
                    Try refreshing or adjusting filters to see more updates.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Refresh CTA */}
          <Button variant="outline" size="lg" w="full" isDisabled={isLoading} onClick={handleRefresh}>
            Refresh Feed
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