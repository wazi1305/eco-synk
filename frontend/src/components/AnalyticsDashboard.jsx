/**
 * Analytics Dashboard Component
 * Displays ESG metrics, impact data, and AI insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FiTrendingUp, 
  FiFeather, 
  FiUsers, 
  FiTarget,
  FiDollarSign,
  FiAward,
  FiActivity,
  FiGlobe
} from 'react-icons/fi';

import campaignService from '../services/campaignService';
import volunteerService from '../services/volunteerService';

const AnalyticsDashboard = () => {
  const [esgMetrics, setEsgMetrics] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load ESG metrics
      const esgResponse = await campaignService.getESGImpact();
      if (esgResponse.success) {
        setEsgMetrics(esgResponse.metrics);
      }

      // Load database statistics
      const statsResponse = await campaignService.getStatistics();
      if (statsResponse.success) {
        setStatistics(statsResponse.statistics);
      }

      // Load leaderboard
      const leaderboardResponse = await volunteerService.getLeaderboard(5);
      if (leaderboardResponse.success) {
        setLeaderboard(leaderboardResponse.leaderboard);
      }

      // Load active campaigns
      const campaignsResponse = await campaignService.getActiveCampaigns();
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.campaigns);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Loading Error',
        description: 'Some analytics data may not be available',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 3.67); // Convert USD to AED
  };

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text>Loading analytics...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box w="100%" minH="calc(100vh - 80px)" pb="80px" px={4} py={6}>
      <VStack spacing={6} maxW="container.xl" mx="auto">
        
        {/* Header */}
        <VStack spacing={2} align="center" textAlign="center">
          <Heading size="xl">EcoSynk Analytics</Heading>
          <Text color="gray.600" maxW="md">
            Real-time insights into our environmental impact powered by AI analysis
          </Text>
        </VStack>

        {/* Key Metrics Grid */}
        {esgMetrics && (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="100%">
            <Stat bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
              <StatLabel color="gray.600">Waste Removed</StatLabel>
              <StatNumber color="green.600" fontSize="2xl">
                {formatNumber(Math.round(esgMetrics.environmental?.total_waste_removed_kg || 0))} kg
              </StatNumber>
              <StatHelpText color="green.500">
                <FiFeather style={{ display: 'inline', marginRight: '4px' }} />
                Environmental Impact
              </StatHelpText>
            </Stat>

            <Stat bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
              <StatLabel color="gray.600">CO₂ Reduced</StatLabel>
              <StatNumber color="blue.600" fontSize="2xl">
                {formatNumber(Math.round(esgMetrics.environmental?.co2_reduction_kg || 0))} kg
              </StatNumber>
              <StatHelpText color="blue.500">
                <FiGlobe style={{ display: 'inline', marginRight: '4px' }} />
                Carbon Offset
              </StatHelpText>
            </Stat>

            <Stat bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
              <StatLabel color="gray.600">Active Volunteers</StatLabel>
              <StatNumber color="purple.600" fontSize="2xl">
                {formatNumber(esgMetrics.social?.active_volunteers || 0)}
              </StatNumber>
              <StatHelpText color="purple.500">
                <FiUsers style={{ display: 'inline', marginRight: '4px' }} />
                Community Members
              </StatHelpText>
            </Stat>

            <Stat bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
              <StatLabel color="gray.600">Total Cleanups</StatLabel>
              <StatNumber color="orange.600" fontSize="2xl">
                {formatNumber(esgMetrics.social?.total_cleanups || 0)}
              </StatNumber>
              <StatHelpText color="orange.500">
                <FiTarget style={{ display: 'inline', marginRight: '4px' }} />
                Reports Processed
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        )}

        {/* Detailed Analytics Tabs */}
        <Tabs variant="soft-rounded" colorScheme="brand" w="100%">
          <TabList justifyContent="center" flexWrap="wrap">
            <Tab><FiTrendingUp style={{ marginRight: '8px' }} />Overview</Tab>
            <Tab><FiFeather style={{ marginRight: '8px' }} />Environmental</Tab>
            <Tab><FiUsers style={{ marginRight: '8px' }} />Social</Tab>
            <Tab><FiDollarSign style={{ marginRight: '8px' }} />Economic</Tab>
          </TabList>

          <TabPanels>
            
            {/* Overview Tab */}
            <TabPanel px={0}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                
                {/* Impact Summary */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Impact Summary</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {esgMetrics?.summary && (
                        <>
                          <HStack justify="space-between" p={3} bg="green.50" borderRadius="lg">
                            <Text fontWeight="semibold">Total Impact Score</Text>
                            <Badge colorScheme="green" fontSize="lg">
                              {esgMetrics.summary.total_impact_score}/100
                            </Badge>
                          </HStack>
                          
                          <HStack justify="space-between" p={3} bg="blue.50" borderRadius="lg">
                            <Text fontWeight="semibold">Waste Diverted</Text>
                            <Text fontWeight="bold" color="blue.600">
                              {formatNumber(Math.round(esgMetrics.summary.waste_diverted_from_landfill_kg))} kg
                            </Text>
                          </HStack>
                          
                          <HStack justify="space-between" p={3} bg="purple.50" borderRadius="lg">
                            <Text fontWeight="semibold">Tree Equivalent</Text>
                            <Text fontWeight="bold" color="purple.600">
                              {esgMetrics.summary.carbon_offset_equivalent_trees} trees
                            </Text>
                          </HStack>
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Top Volunteers */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Top Performers</Heading>
                  </CardHeader>
                  <CardBody>
                    {leaderboard.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {leaderboard.map((volunteer, index) => (
                          <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                            <HStack spacing={3}>
                              <Badge colorScheme="brand" variant="solid" borderRadius="full">
                                #{volunteer.rank}
                              </Badge>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="semibold" fontSize="sm">{volunteer.name}</Text>
                                <Text fontSize="xs" color="gray.600">{volunteer.experience_level}</Text>
                              </VStack>
                            </HStack>
                            <Text fontWeight="bold" color="brand.600">
                              {volunteer.past_cleanup_count}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        No leaderboard data available yet
                      </Alert>
                    )}
                  </CardBody>
                </Card>

                {/* Active Campaigns */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Active Campaigns</Heading>
                  </CardHeader>
                  <CardBody>
                    {campaigns.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {campaigns.slice(0, 3).map((campaign, index) => {
                          const formatted = campaignService.formatCampaignsForUI([campaign])[0];
                          return (
                            <Box key={index} p={3} bg="gray.50" borderRadius="lg">
                              <VStack align="start" spacing={2}>
                                <HStack justify="space-between" w="100%">
                                  <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                    {campaign.campaign_name}
                                  </Text>
                                  <Badge colorScheme={formatted.ui.statusBadge === 'urgent' ? 'red' : 'green'}>
                                    {formatted.ui.daysRemaining}d left
                                  </Badge>
                                </HStack>
                                <HStack spacing={4} w="100%">
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Text fontSize="xs" color="gray.600">Funding</Text>
                                    <Progress 
                                      value={formatted.ui.fundingProgress} 
                                      size="sm" 
                                      colorScheme="green" 
                                      w="100%"
                                      borderRadius="full"
                                    />
                                  </VStack>
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Text fontSize="xs" color="gray.600">Volunteers</Text>
                                    <Progress 
                                      value={formatted.ui.volunteerProgress} 
                                      size="sm" 
                                      colorScheme="blue" 
                                      w="100%"
                                      borderRadius="full"
                                    />
                                  </VStack>
                                </HStack>
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        No active campaigns at the moment
                      </Alert>
                    )}
                  </CardBody>
                </Card>

                {/* Database Statistics */}
                <Card>
                  <CardHeader>
                    <Heading size="md">System Statistics</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {statistics ? (
                        <>
                          <HStack justify="space-between" p={3} bg="blue.50" borderRadius="lg">
                            <Text fontWeight="semibold">Reports Stored</Text>
                            <Text fontWeight="bold" color="blue.600">
                              {statistics.trash_reports?.count || 0}
                            </Text>
                          </HStack>
                          <HStack justify="space-between" p={3} bg="purple.50" borderRadius="lg">
                            <Text fontWeight="semibold">Volunteer Profiles</Text>
                            <Text fontWeight="bold" color="purple.600">
                              {statistics.volunteers?.count || 0}
                            </Text>
                          </HStack>
                        </>
                      ) : (
                        <Alert status="info" size="sm">
                          <AlertIcon />
                          Statistics loading...
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

              </SimpleGrid>
            </TabPanel>

            {/* Environmental Tab */}
            <TabPanel px={0}>
              {esgMetrics?.environmental ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Total Waste Removed</StatLabel>
                    <StatNumber color="green.600">
                      {Math.round(esgMetrics.environmental.total_waste_removed_kg)} kg
                    </StatNumber>
                    <StatHelpText>Diverted from landfills</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>CO₂ Reduction</StatLabel>
                    <StatNumber color="blue.600">
                      {Math.round(esgMetrics.environmental.co2_reduction_kg)} kg
                    </StatNumber>
                    <StatHelpText>Carbon footprint reduced</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Recyclable Materials</StatLabel>
                    <StatNumber color="purple.600">
                      {Math.round(esgMetrics.environmental.recyclable_waste_kg)} kg
                    </StatNumber>
                    <StatHelpText>Ready for recycling</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Recycling Rate</StatLabel>
                    <StatNumber color="orange.600">
                      {esgMetrics.environmental.recycling_rate_percent}%
                    </StatNumber>
                    <StatHelpText>Of total waste collected</StatHelpText>
                  </Stat>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Environmental metrics are being calculated...
                </Alert>
              )}
            </TabPanel>

            {/* Social Tab */}
            <TabPanel px={0}>
              {esgMetrics?.social ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Total Cleanups</StatLabel>
                    <StatNumber color="green.600">
                      {esgMetrics.social.total_cleanups}
                    </StatNumber>
                    <StatHelpText>Community actions completed</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Active Volunteers</StatLabel>
                    <StatNumber color="blue.600">
                      {esgMetrics.social.active_volunteers}
                    </StatNumber>
                    <StatHelpText>Registered community members</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Volunteer Hours</StatLabel>
                    <StatNumber color="purple.600">
                      {esgMetrics.social.volunteer_hours_contributed}
                    </StatNumber>
                    <StatHelpText>Time contributed to cleanups</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Engagement Score</StatLabel>
                    <StatNumber color="orange.600">
                      {esgMetrics.social.community_engagement_score}/100
                    </StatNumber>
                    <StatHelpText>Community participation level</StatHelpText>
                  </Stat>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Social metrics are being calculated...
                </Alert>
              )}
            </TabPanel>

            {/* Economic Tab */}
            <TabPanel px={0}>
              {esgMetrics?.economic ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Estimated Value Generated</StatLabel>
                    <StatNumber color="green.600">
                      {formatCurrency(esgMetrics.economic.estimated_value_usd)}
                    </StatNumber>
                    <StatHelpText>Economic impact of cleanups</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Cost per Cleanup</StatLabel>
                    <StatNumber color="blue.600">
                      {formatCurrency(esgMetrics.economic.cost_per_cleanup_usd)}
                    </StatNumber>
                    <StatHelpText>Average operational cost</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Volunteer Value</StatLabel>
                    <StatNumber color="purple.600">
                      {formatCurrency(esgMetrics.economic.volunteer_value_per_hour_usd)}/hr
                    </StatNumber>
                    <StatHelpText>Economic value of volunteer time</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={6} borderRadius="xl" shadow="sm">
                    <StatLabel>Total Economic Impact</StatLabel>
                    <StatNumber color="orange.600">
                      {formatCurrency((esgMetrics.economic.estimated_value_usd || 0) + 
                        ((esgMetrics.social?.volunteer_hours_contributed || 0) * 
                         (esgMetrics.economic.volunteer_value_per_hour_usd || 0)))}
                    </StatNumber>
                    <StatHelpText>Combined value generated</StatHelpText>
                  </Stat>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Economic metrics are being calculated...
                </Alert>
              )}
            </TabPanel>

          </TabPanels>
        </Tabs>

      </VStack>
    </Box>
  );
};

export default AnalyticsDashboard;