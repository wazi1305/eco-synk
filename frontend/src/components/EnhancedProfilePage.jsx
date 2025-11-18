/**
 * Enhanced Profile Page with AI Integration
 * Shows achievements, impact metrics, and AI-driven insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Avatar,
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiTrendingUp, 
  FiAward, 
  FiMapPin, 
  FiClock,
  FiTarget,
  FiUsers,
  FiFeather,
  FiCheckCircle,
  FiStar
} from 'react-icons/fi';

import volunteerService from '../services/volunteerService';
import campaignService from '../services/campaignService';

const EnhancedProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [esgMetrics, setEsgMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const toast = useToast();

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);

      // Load profile from local storage
      const savedProfile = JSON.parse(localStorage.getItem('volunteerProfile') || '{}');
      setProfile(savedProfile);

      // Load volunteer statistics
      const statsResponse = await volunteerService.getVolunteerStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      // Load leaderboard
      const leaderboardResponse = await volunteerService.getLeaderboard(10);
      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.leaderboard);
      }

      // Load ESG metrics
      const esgResponse = await campaignService.getESGImpact();
      if (esgResponse.success) {
        setEsgMetrics(esgResponse.metrics);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: 'Error loading profile',
        description: 'Some data may not be available',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleAvailabilityToggle = async (isAvailable) => {
    try {
      setUpdatingAvailability(true);
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          title: 'No user ID found',
          description: 'Please create a volunteer profile first',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await volunteerService.updateAvailability(userId, isAvailable);
      
      if (response.success) {
        setProfile(prev => ({ ...prev, available: isAvailable }));
        toast({
          title: 'Availability updated',
          description: response.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Update failed',
          description: response.error,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Update error',
        description: 'Failed to update availability',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const getUserRank = () => {
    if (!profile?.pastCleanupCount || !leaderboard.length) return null;
    
    const userCleanups = profile.pastCleanupCount;
    const rank = leaderboard.findIndex(volunteer => 
      volunteer.past_cleanup_count <= userCleanups
    );
    
    return rank === -1 ? leaderboard.length + 1 : rank + 1;
  };

  const getAchievements = () => {
    const achievements = [];
    const cleanupCount = profile?.pastCleanupCount || 0;
    const reportCount = stats?.personal?.reportsSubmitted || 0;

    if (cleanupCount >= 50) achievements.push({ icon: '🏆', title: 'Legend', description: '50+ cleanups completed' });
    else if (cleanupCount >= 25) achievements.push({ icon: '⭐', title: 'Champion', description: '25+ cleanups completed' });
    else if (cleanupCount >= 10) achievements.push({ icon: '🌟', title: 'Expert', description: '10+ cleanups completed' });
    else if (cleanupCount >= 5) achievements.push({ icon: '✨', title: 'Active', description: '5+ cleanups completed' });
    else achievements.push({ icon: '🌱', title: 'Beginner', description: 'Getting started' });

    if (reportCount >= 20) achievements.push({ icon: '📸', title: 'Reporter', description: '20+ reports submitted' });
    if (reportCount >= 10) achievements.push({ icon: '👀', title: 'Eagle Eye', description: '10+ reports submitted' });

    if (profile?.skills?.length >= 5) achievements.push({ icon: '🛠️', title: 'Multi-skilled', description: '5+ skills listed' });
    if (profile?.equipmentOwned?.length >= 3) achievements.push({ icon: '⚙️', title: 'Well Equipped', description: '3+ equipment owned' });

    return achievements;
  };

  const getImpactSummary = () => {
    if (!esgMetrics || !stats) return null;

    const personalCleanups = profile?.pastCleanupCount || 0;
    const personalReports = stats.personal?.reportsSubmitted || 0;
    const totalCleanups = esgMetrics.social?.total_cleanups || 1;
    
    // Calculate personal contribution percentage
    const personalContribution = totalCleanups > 0 ? (personalCleanups / totalCleanups * 100).toFixed(1) : 0;
    
    // Estimate personal waste removed (25kg average per cleanup)
    const personalWasteRemoved = personalCleanups * 25;
    const personalCO2Saved = personalWasteRemoved * 0.5;

    return {
      personalContribution,
      personalWasteRemoved,
      personalCO2Saved,
      personalReports,
      communityImpact: {
        totalWaste: esgMetrics.environmental?.total_waste_removed_kg || 0,
        totalCO2: esgMetrics.environmental?.co2_reduction_kg || 0,
        totalVolunteers: esgMetrics.social?.active_volunteers || 0
      }
    };
  };

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Box>
    );
  }

  if (!profile || Object.keys(profile).length === 0) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="semibold">No profile found</Text>
            <Text>Create a volunteer profile to track your impact and join cleanups.</Text>
            <Button colorScheme="brand" size="sm" mt={2}>
              Create Profile
            </Button>
          </VStack>
        </Alert>
      </Box>
    );
  }

  const achievements = getAchievements();
  const impact = getImpactSummary();
  const userRank = getUserRank();

  return (
    <Box w="100%" minH="calc(100vh - 80px)" pb="80px" px={4} py={6}>
      <VStack spacing={6} maxW="container.xl" mx="auto">
        
        {/* Profile Header */}
        <Card w="100%">
          <CardBody>
            <HStack spacing={6} align="start">
              <Avatar 
                size="xl" 
                name={profile.name || 'Anonymous'} 
                bg="brand.500"
                color="white"
              />
              <VStack align="start" flex={1} spacing={3}>
                <VStack align="start" spacing={1}>
                  <Heading size="lg">{profile.name || 'Anonymous Volunteer'}</Heading>
                  <HStack spacing={4}>
                    <Badge colorScheme="brand" variant="subtle">
                      {profile.experienceLevel?.toUpperCase() || 'BEGINNER'}
                    </Badge>
                    {userRank && (
                      <Badge colorScheme="purple" variant="subtle">
                        #{userRank} ON LEADERBOARD
                      </Badge>
                    )}
                  </HStack>
                </VStack>
                
                <HStack spacing={6} wrap="wrap">
                  <HStack spacing={2}>
                    <FiMapPin color="gray" />
                    <Text fontSize="sm" color="gray.600">
                      {profile.location ? 'Dubai, UAE' : 'Location not set'}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <FiClock color="gray" />
                    <Text fontSize="sm" color="gray.600">
                      Joined {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
                    </Text>
                  </HStack>
                </HStack>

                {/* Availability Toggle */}
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="availability" mb="0" fontSize="sm">
                    Available for cleanups
                  </FormLabel>
                  <Switch
                    id="availability"
                    isChecked={profile.available !== false}
                    onChange={(e) => handleAvailabilityToggle(e.target.checked)}
                    isDisabled={updatingAvailability}
                    colorScheme="brand"
                  />
                </FormControl>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Tabs for different sections */}
        <Tabs variant="soft-rounded" colorScheme="brand" w="100%">
          <TabList>
            <Tab><FiUser style={{ marginRight: '8px' }} />Overview</Tab>
            <Tab><FiTrendingUp style={{ marginRight: '8px' }} />Impact</Tab>
            <Tab><FiAward style={{ marginRight: '8px' }} />Achievements</Tab>
            <Tab><FiUsers style={{ marginRight: '8px' }} />Leaderboard</Tab>
          </TabList>

          <TabPanels>
            {/* Overview Tab */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                  <StatLabel>Reports Submitted</StatLabel>
                  <StatNumber color="brand.600">{stats?.personal?.reportsSubmitted || 0}</StatNumber>
                  <StatHelpText>Photos analyzed by AI</StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                  <StatLabel>Cleanups Completed</StatLabel>
                  <StatNumber color="green.600">{profile.pastCleanupCount || 0}</StatNumber>
                  <StatHelpText>Hands-on participation</StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                  <StatLabel>Skills Listed</StatLabel>
                  <StatNumber color="blue.600">{profile.skills?.length || 0}</StatNumber>
                  <StatHelpText>Areas of expertise</StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
                  <StatLabel>Equipment Owned</StatLabel>
                  <StatNumber color="purple.600">{profile.equipmentOwned?.length || 0}</StatNumber>
                  <StatHelpText>Cleanup tools available</StatHelpText>
                </Stat>
              </SimpleGrid>

              {/* Skills and Equipment */}
              {(profile.skills?.length > 0 || profile.equipmentOwned?.length > 0) && (
                <VStack spacing={4} align="stretch" mt={6}>
                  {profile.skills?.length > 0 && (
                    <Card>
                      <CardHeader pb={3}>
                        <Heading size="sm">Skills & Expertise</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <HStack spacing={2} wrap="wrap">
                          {profile.skills.map((skill, index) => (
                            <Badge key={index} colorScheme="brand" variant="subtle">
                              {skill}
                            </Badge>
                          ))}
                        </HStack>
                      </CardBody>
                    </Card>
                  )}
                  
                  {profile.equipmentOwned?.length > 0 && (
                    <Card>
                      <CardHeader pb={3}>
                        <Heading size="sm">Equipment Owned</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <HStack spacing={2} wrap="wrap">
                          {profile.equipmentOwned.map((equipment, index) => (
                            <Badge key={index} colorScheme="green" variant="subtle">
                              {equipment}
                            </Badge>
                          ))}
                        </HStack>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              )}
            </TabPanel>

            {/* Impact Tab */}
            <TabPanel px={0}>
              {impact ? (
                <VStack spacing={6} align="stretch">
                  {/* Personal Impact */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">Your Environmental Impact</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Stat textAlign="center">
                          <StatLabel>Waste Removed</StatLabel>
                          <StatNumber color="green.600">{impact.personalWasteRemoved} kg</StatNumber>
                          <StatHelpText>From {profile.pastCleanupCount || 0} cleanups</StatHelpText>
                        </Stat>
                        
                        <Stat textAlign="center">
                          <StatLabel>CO₂ Saved</StatLabel>
                          <StatNumber color="blue.600">{Math.round(impact.personalCO2Saved)} kg</StatNumber>
                          <StatHelpText>Carbon offset equivalent</StatHelpText>
                        </Stat>
                        
                        <Stat textAlign="center">
                          <StatLabel>Community Contribution</StatLabel>
                          <StatNumber color="purple.600">{impact.personalContribution}%</StatNumber>
                          <StatHelpText>Of total community impact</StatHelpText>
                        </Stat>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Community Impact */}
                  <Card>
                    <CardHeader>
                      <Heading size="md">Community Impact</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <VStack spacing={2}>
                          <FiFeather size={24} color="green" />
                          <Text fontWeight="semibold">Total Waste Removed</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {Math.round(impact.communityImpact.totalWaste)} kg
                          </Text>
                        </VStack>
                        
                        <VStack spacing={2}>
                          <FiTarget size={24} color="blue" />
                          <Text fontWeight="semibold">CO₂ Reduction</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {Math.round(impact.communityImpact.totalCO2)} kg
                          </Text>
                        </VStack>
                        
                        <VStack spacing={2}>
                          <FiUsers size={24} color="purple" />
                          <Text fontWeight="semibold">Active Volunteers</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                            {impact.communityImpact.totalVolunteers}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </VStack>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Impact data is being calculated. Complete more cleanups to see your environmental impact!
                </Alert>
              )}
            </TabPanel>

            {/* Achievements Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Your Achievements</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {achievements.map((achievement, index) => (
                        <HStack key={index} p={4} bg="gray.50" borderRadius="lg" spacing={4}>
                          <Text fontSize="2xl">{achievement.icon}</Text>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{achievement.title}</Text>
                            <Text fontSize="sm" color="gray.600">{achievement.description}</Text>
                          </VStack>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Progress towards next achievement */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Next Milestone</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="semibold">Expert Level (10 cleanups)</Text>
                          <Text fontSize="sm" color="gray.600">
                            {profile.pastCleanupCount || 0}/10
                          </Text>
                        </HStack>
                        <Progress 
                          value={Math.min(100, ((profile.pastCleanupCount || 0) / 10) * 100)} 
                          colorScheme="brand" 
                          borderRadius="full"
                        />
                      </Box>
                      
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="semibold">Reporter Badge (10 reports)</Text>
                          <Text fontSize="sm" color="gray.600">
                            {stats?.personal?.reportsSubmitted || 0}/10
                          </Text>
                        </HStack>
                        <Progress 
                          value={Math.min(100, ((stats?.personal?.reportsSubmitted || 0) / 10) * 100)} 
                          colorScheme="green" 
                          borderRadius="full"
                        />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Leaderboard Tab */}
            <TabPanel px={0}>
              <Card>
                <CardHeader>
                  <Heading size="md">Community Leaderboard</Heading>
                  <Text color="gray.600" fontSize="sm">
                    Top volunteers ranked by cleanup count
                  </Text>
                </CardHeader>
                <CardBody>
                  {leaderboard.length > 0 ? (
                    <List spacing={3}>
                      {leaderboard.map((volunteer, index) => (
                        <ListItem key={index}>
                          <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                            <HStack spacing={4}>
                              <ListIcon as={index < 3 ? FiStar : FiCheckCircle} 
                                color={index < 3 ? 'yellow.500' : 'gray.400'} />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="semibold">
                                  #{volunteer.rank} {volunteer.name}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {volunteer.experience_level} • {volunteer.available ? 'Available' : 'Busy'}
                                </Text>
                              </VStack>
                            </HStack>
                            <VStack align="end" spacing={0}>
                              <Text fontWeight="bold" color="brand.600">
                                {volunteer.past_cleanup_count}
                              </Text>
                              <Text fontSize="xs" color="gray.500">cleanups</Text>
                            </VStack>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      Leaderboard is being updated. Check back soon!
                    </Alert>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default EnhancedProfilePage;