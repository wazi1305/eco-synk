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
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import AuthGuard from './auth/AuthGuard';
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
    images: [campaign.heroImage || campaign.image || '♻️'],
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();

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
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
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
    <Card 
      bg="neutral.800" 
      border="1px solid" 
      borderColor="neutral.700" 
      borderRadius="12px"
      _hover={{ 
        shadow: '0 0 20px rgba(47, 212, 99, 0.2)', 
        borderColor: 'brand.500'
      }} 
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" 
      mb={{ base: 3, md: 4 }}
      display="flex"
      flexDirection="column"
    >
      <CardBody p={0} display="flex" flexDirection="column" flex={1}>
        {/* Activity Header */}
        <HStack spacing={{ base: 2, md: 3 }} p={{ base: 3, md: 4 }} pb={3}>
          <Avatar 
            size={{ base: 'sm', md: 'md' }} 
            name={activity.user.name}
            cursor="pointer"
            bg="rgba(47, 212, 99, 0.1)"
            border="2px solid"
            borderColor="brand.500"
            color="brand.500"
            _hover={{ transform: 'scale(1.05)' }}
            onClick={() => openProfile(activity.user)}
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap">
              <Text 
                fontWeight="600"
                fontSize={{ base: 'sm', md: 'md' }}
                cursor="pointer"
                color="neutral.50"
                _hover={{ color: 'brand.500' }}
                onClick={() => openProfile(activity.user)}
              >
                {activity.user.name}
              </Text>
              {activity.user.verified && (
                <Icon as={FiAward} color="blue.400" boxSize={4} />
              )}
              <Badge 
                bg="rgba(47, 212, 99, 0.1)" 
                color="brand.500" 
                border="1px solid" 
                borderColor="brand.500"
                size="sm"
              >
                {activity.user.title}
              </Badge>
            </HStack>
            <HStack spacing={2} fontSize="sm" color="neutral.400">
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
            <MenuButton 
              as={IconButton} 
              icon={<FiMoreVertical />} 
              variant="ghost" 
              size="sm" 
              color="neutral.400"
              _hover={{ bg: 'neutral.700', color: 'neutral.50' }}
            />
            <MenuList bg="neutral.800" borderColor="neutral.700">
              <MenuItem icon={<FiBell />} bg="neutral.800" color="neutral.200" _hover={{ bg: 'neutral.700' }}>Get notifications</MenuItem>
              <MenuItem icon={<FiFlag />} bg="neutral.800" color="neutral.200" _hover={{ bg: 'neutral.700' }}>Report post</MenuItem>
              <MenuItem icon={<FiShare2 />} bg="neutral.800" color="neutral.200" _hover={{ bg: 'neutral.700' }}>Share activity</MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Activity Content */}
        <Box px={{ base: 3, md: 4 }} pb={3} flex={1}>
          <Heading size={{ base: 'sm', md: 'md' }} mb={2} color="neutral.50" fontWeight="700">{activity.title}</Heading>
          <Text fontSize={{ base: 'sm', md: 'md' }} color="neutral.300" mb={3}>{activity.description}</Text>
          
          {/* Activity Images */}
          {activity.images && (
            <HStack spacing={2} mb={3}>
              {activity.images.map((image, index) => (
                <Box
                  key={index}
                  fontSize="2xl"
                  p={2}
                  bg="neutral.700"
                  borderRadius="8px"
                  w="60px"
                  h="60px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="1px solid"
                  borderColor="neutral.600"
                >
                  {image}
                </Box>
              ))}
            </HStack>
          )}

          {/* Activity Stats */}
          {activity.stats && (
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={{ base: 2, md: 3 }} mb={4}>
              {Object.entries(activity.stats)
                .filter(([, value]) => value !== null && value !== undefined)
                .slice(0, 3)
                .map(([label, value]) => (
                  <GridItem key={label}>
                    <Stat>
                      <StatLabel textTransform="capitalize" color="neutral.400" fontSize="xs">
                        {label}
                      </StatLabel>
                      <StatNumber fontSize="lg" color="neutral.50" fontWeight="700">{value}</StatNumber>
                    </Stat>
                  </GridItem>
                ))}
            </Grid>
          )}

          {/* Weather & Duration */}
          <HStack justify="space-between" fontSize="sm" color="neutral.400" mb={3}>
            <HStack spacing={4}>
              {activity.weather && (
                <HStack spacing={1}>
                  <Text>☀️</Text>
                  <Text color="neutral.300">{activity.weather.temp}</Text>
                </HStack>
              )}
              <HStack spacing={1}>
                <Icon as={FiClock} boxSize={3} />
                <Text color="neutral.300">{activity.duration}</Text>
              </HStack>
            </HStack>
            {activity.achievements && (
              <HStack spacing={1}>
                <Icon as={FiAward} boxSize={3} color="yellow.400" />
                <Text fontSize="xs" color="neutral.300">+{activity.achievements.length} achievements</Text>
              </HStack>
            )}
          </HStack>

          {/* Tags */}
          {activity.tags && (
            <HStack spacing={2} mb={3} flexWrap="wrap">
              {activity.tags.map((tag, index) => (
                <Badge 
                  key={`${tag}-${index}`} 
                  bg="neutral.700" 
                  color="neutral.300" 
                  border="1px solid" 
                  borderColor="neutral.600"
                  size="sm"
                >
                  #{tag}
                </Badge>
              ))}
            </HStack>
          )}
        </Box>

        <Divider borderColor="neutral.700" />

        {/* Action Buttons */}
        <HStack spacing={0} p={{ base: 2, md: 3 }}>
          <Button
            leftIcon={<FiHeart />}
            variant="ghost"
            size={{ base: 'sm', md: 'md' }}
            flex={1}
            minH={{ base: '44px', md: 'auto' }}
            color={likedPosts.has(activity.id) ? 'red.500' : 'neutral.400'}
            _hover={{ bg: 'neutral.700', color: likedPosts.has(activity.id) ? 'red.400' : 'brand.500' }}
            onClick={() => toggleLike(activity.id)}
          >
            {activity.likes + (likedPosts.has(activity.id) ? 1 : 0)}
          </Button>
          <Button 
            leftIcon={<FiMessageCircle />} 
            variant="ghost" 
            size={{ base: 'sm', md: 'md' }} 
            flex={1} 
            minH={{ base: '44px', md: 'auto' }} 
            color="neutral.400"
            _hover={{ bg: 'neutral.700', color: 'brand.500' }}
          >
            {activity.comments}
          </Button>
          <Button 
            leftIcon={<FiShare2 />} 
            variant="ghost" 
            size={{ base: 'sm', md: 'md' }} 
            flex={1} 
            minH={{ base: '44px', md: 'auto' }} 
            color="neutral.400"
            _hover={{ bg: 'neutral.700', color: 'brand.500' }}
          >
            Share
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );

  return (
    <Box bg="neutral.900" minH="100vh" position="relative">
      {/* Enhanced Header with Transform */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        bg="rgba(2, 2, 2, 0.95)"
        backdropFilter="blur(20px)"
        borderBottomWidth={1}
        borderColor="neutral.700"
        transform={showHeader ? 'translateY(0)' : 'translateY(-100%)'}
        transition="transform 0.3s ease-in-out"
      >
        <VStack spacing={0}>
          {/* Main Header */}
          <HStack justify="space-between" p={{ base: 3, md: 4 }} pb={0} w="full" maxW="800px" mx="auto">
            <Text fontSize="sm" color="neutral.400">
              {todayImpact.activities} activities today
            </Text>
            <HStack spacing={2}>

              <IconButton 
                icon={<FiSearch />} 
                variant="ghost" 
                size="sm" 
                color="neutral.400"
                _hover={{ bg: 'rgba(47, 212, 99, 0.1)', color: 'brand.500' }}
              />
              <IconButton 
                icon={<FiFilter />} 
                variant="ghost" 
                size="sm"
                color="neutral.400"
                _hover={{ bg: 'rgba(47, 212, 99, 0.1)', color: 'brand.500' }}
              />
              <IconButton 
                icon={<FiPlus />} 
                variant="ghost" 
                size="sm" 
                color="brand.500"
                _hover={{ bg: 'rgba(47, 212, 99, 0.1)' }}
              />
              <IconButton icon={<FiSearch />} variant="ghost" size="sm" />
              <IconButton icon={<FiFilter />} variant="ghost" size="sm" />

              <IconButton
                icon={<FiRefreshCw />}
                variant="ghost"
                size="sm"
                aria-label="Refresh feed"
                onClick={handleRefresh}
                isLoading={isRefreshing}
                color="neutral.400"
                _hover={{ bg: 'rgba(47, 212, 99, 0.1)', color: 'brand.500' }}
              />
              {isAuthenticated ? (
                <Menu>
                  <MenuButton as={Button} variant="ghost" size="sm" p={1}>
                    <Avatar size="sm" name={user?.name} src={user?.avatar} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>Profile</MenuItem>
                    <MenuItem>Settings</MenuItem>
                    <MenuItem onClick={logout}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button size="sm" colorScheme="brand" onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
              )}
            </HStack>
          </HStack>

          {/* Today's Impact Bar */}
          <Box w="full" bgGradient="linear(to-r, rgba(47, 212, 99, 0.1), rgba(47, 212, 99, 0.05))" px={{ base: 2, md: 4 }} py={2} borderY="1px solid" borderColor="rgba(47, 212, 99, 0.2)">
            <Box maxW="800px" mx="auto">
              <HStack justify="space-around" fontSize={{ base: 'xs', md: 'sm' }} spacing={{ base: 1, md: 4 }}>
                <VStack spacing={0}>
                  <Text fontWeight="700" color="neutral.50">{todayImpact.participants}</Text>
                  <Text color="neutral.400" fontSize="xs">Active</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="700" color="neutral.50">{todayImpact.itemsCollected}</Text>
                  <Text color="neutral.400" fontSize="xs">Items</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="700" color="neutral.50">{todayImpact.co2Saved}kg</Text>
                  <Text color="neutral.400" fontSize="xs">CO₂ Saved</Text>
                </VStack>
                <VStack spacing={0}>
                  <Text fontWeight="700" color="neutral.50">{todayImpact.locationsCleared}</Text>
                  <Text color="neutral.400" fontSize="xs">Locations</Text>
                </VStack>
              </HStack>
            </Box>
          </Box>

          {/* Feed Tabs */}
          <Box w="full" maxW="800px" mx="auto" px={{ base: 2, md: 4 }}>
            <Tabs index={activeTab} onChange={setActiveTab} size={{ base: 'sm', md: 'md' }}>
              <TabList borderBottomColor="neutral.700">
                <Tab 
                  flex={1} 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  color="neutral.400"
                  _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
                >
                  Following
                </Tab>
                <Tab 
                  flex={1} 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  color="neutral.400"
                  _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
                >
                  Local
                </Tab>
                <Tab 
                  flex={1} 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  color="neutral.400"
                  _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
                >
                  Trending
                </Tab>
                <Tab 
                  flex={1} 
                  fontSize={{ base: 'xs', md: 'sm' }}
                  color="neutral.400"
                  _selected={{ color: 'brand.500', borderColor: 'brand.500' }}
                >
                  Challenges
                </Tab>
              </TabList>
            </Tabs>

          </Box>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        pt={{ base: '180px', md: '200px' }}
        px={{ base: 2, md: 4 }}
        maxW="800px"
        mx="auto"
        overflowY="auto"
        h="100vh"
      >
        <VStack spacing={4} pb={6}>
          {(error || warning) && (
            <Box w="full">
              {error && (
                <Alert 
                  status="error" 
                  borderRadius="12px" 
                  mb={warning ? 3 : 0}
                  bg="rgba(245, 101, 101, 0.1)"
                  border="1px solid"
                  borderColor="red.500"
                >
                  <AlertIcon color="red.400" />
                  <Text color="neutral.200">{error}</Text>
                </Alert>
              )}
              {!error && warning && (
                <Alert 
                  status="warning" 
                  borderRadius="12px"
                  bg="rgba(237, 137, 54, 0.1)"
                  border="1px solid"
                  borderColor="orange.500"
                >
                  <AlertIcon color="orange.400" />
                  <Text color="neutral.200">{warning}</Text>
                </Alert>
              )}
            </Box>
          )}

          {/* Create Post Section */}
          <Card 
            w="full" 
            bg="neutral.800" 
            border="1px solid" 
            borderColor="neutral.700"
            borderRadius="12px"
          >
            <CardBody>

              <HStack spacing={3} mb={3}>
                <Avatar 
                  size="sm" 
                  name="Current User" 
                  bg="rgba(47, 212, 99, 0.1)"
                  border="2px solid"
                  borderColor="brand.500"
                  color="brand.500"
                />
                <Textarea
                  placeholder="Share your eco-impact..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  resize="none"
                  minH="unset"
                  rows={2}
                  bg="neutral.700"
                  border="1px solid"
                  borderColor="neutral.600"
                  color="neutral.50"
                  _placeholder={{ color: 'neutral.400' }}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </HStack>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <IconButton 
                    icon={<FiCamera />} 
                    variant="ghost" 
                    size="sm" 
                    color="neutral.400"
                    _hover={{ bg: 'neutral.700', color: 'brand.500' }}
                  />
                  <IconButton 
                    icon={<FiMapPin />} 
                    variant="ghost" 
                    size="sm"
                    color="neutral.400"
                    _hover={{ bg: 'neutral.700', color: 'brand.500' }}
                  />
                  <IconButton 
                    icon={<FiUsers />} 
                    variant="ghost" 
                    size="sm"
                    color="neutral.400"
                    _hover={{ bg: 'neutral.700', color: 'brand.500' }}
                  />
                </HStack>
                <Button 
                  size="sm" 
                  bg="brand.500"
                  color="neutral.900"
                  _hover={{ bg: 'brand.600' }}
                  isDisabled={!newPost.trim()}
                >
                  Post
                </Button>
              </HStack>
              {isAuthenticated ? (
                <>
                  <HStack spacing={3} mb={3}>
                    <Avatar size="sm" name={user?.name} src={user?.avatar} />
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
                </>
              ) : (
                <VStack spacing={3} py={4}>
                  <Text color="gray.600" textAlign="center">
                    Sign in to share your eco-impact and connect with the community
                  </Text>
                  <Button colorScheme="brand" onClick={() => setShowAuthModal(true)}>
                    Sign In to Post
                  </Button>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Activities Feed */}
          {isLoading ? (
            <Card 
              w="full" 
              bg="neutral.800" 
              border="1px solid" 
              borderColor="neutral.700"
              borderRadius="12px"
            >
              <CardBody>
                <VStack spacing={3} py={6}>
                  <Spinner color="brand.500" />
                  <Text color="neutral.400">Loading live activities...</Text>
                </VStack>
              </CardBody>
            </Card>
          ) : activities.length ? (
            activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
          ) : (
            <Card 
              w="full" 
              bg="neutral.800" 
              border="1px solid" 
              borderColor="neutral.700"
              borderRadius="12px"
            >
              <CardBody>
                <VStack spacing={2} py={4}>
                  <Text fontWeight="600" color="neutral.50">No activities yet</Text>
                  <Text fontSize="sm" color="neutral.400">
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
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </Box>
  );
};

export default FeedPage;