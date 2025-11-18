/**
 * Backend Integration Test Page
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { API_BASE_URL } from '../services/apiConfig';

const BackendTestPage = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const runTest = async (name, endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();
      
      return {
        success: response.ok,
        data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});

    const tests = [
      { name: 'Health Check', endpoint: '/health' },
      { name: 'ESG Metrics', endpoint: '/impact/esg' },
      { name: 'Active Campaigns', endpoint: '/campaigns/active' },
      { name: 'Volunteer Leaderboard', endpoint: '/leaderboard' },
      { 
        name: 'Hotspot Detection', 
        endpoint: '/detect-hotspots',
        method: 'POST',
        body: {
          location: { lat: 25.2048, lon: 55.2708 }, // Dubai coordinates
          radius_km: 5.0
        }
      },
      {
        name: 'Volunteer Matching',
        endpoint: '/find-volunteers',
        method: 'POST',
        body: {
          cleanup_type: 'beach',
          location: { lat: 25.2048, lon: 55.2708 },
          required_skills: ['water cleanup'],
          max_distance_km: 10.0
        }
      }
    ];

    const results = {};
    
    for (const test of tests) {
      console.log(`Running test: ${test.name}`);
      const result = await runTest(test.name, test.endpoint, test.method, test.body);
      results[test.name] = result;
      
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTestResults(results);
    setLoading(false);

    const successCount = Object.values(results).filter(r => r.success).length;
    toast({
      title: 'Backend Tests Complete',
      description: `${successCount}/${tests.length} tests passed`,
      status: successCount === tests.length ? 'success' : 'warning',
      duration: 3000,
      isClosable: true,
    });
  };

  const getStatusBadge = (result) => {
    if (!result) return <Badge>Not Run</Badge>;
    if (result.success) return <Badge colorScheme="green">✅ PASS</Badge>;
    return <Badge colorScheme="red">❌ FAIL</Badge>;
  };

  const getDataPreview = (result) => {
    if (!result || !result.success || !result.data) return 'No data';
    
    if (result.data.status === 'success') {
      return `Status: ${result.data.status}`;
    }
    
    return JSON.stringify(result.data).substring(0, 100) + '...';
  };

  return (
    <Box p={6} maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" color="brand.500" mb={2}>
            Backend Integration Test
          </Heading>
          <Text color="gray.600">
            Testing connection to EcoSynk AI Services API
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Backend URL: {API_BASE_URL}
          </Text>
        </Box>

        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Test Results</Text>
                <Button
                  colorScheme="brand"
                  onClick={runAllTests}
                  isLoading={loading}
                  loadingText="Running Tests..."
                >
                  Run All Tests
                </Button>
              </HStack>

              {Object.keys(testResults).length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {Object.entries(testResults).map(([testName, result]) => (
                    <Card key={testName} size="sm">
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{testName}</Text>
                            {getStatusBadge(result)}
                          </HStack>
                          
                          {result && (
                            <VStack align="stretch" spacing={1} fontSize="sm">
                              <Text color="gray.600">
                                Status: {result.status || 'Error'}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                {getDataPreview(result)}
                              </Text>
                              {result.error && (
                                <Text color="red.500" fontSize="xs">
                                  Error: {result.error}
                                </Text>
                              )}
                            </VStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}

              {Object.keys(testResults).length === 0 && !loading && (
                <Box textAlign="center" py={8} color="gray.500">
                  Click "Run All Tests" to test backend integration
                </Box>
              )}

              {loading && (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" color="brand.500" />
                  <Text mt={4} color="gray.600">Running backend integration tests...</Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        {Object.keys(testResults).length > 0 && (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Total Tests</StatLabel>
              <StatNumber>{Object.keys(testResults).length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Passed</StatLabel>
              <StatNumber color="green.500">
                {Object.values(testResults).filter(r => r.success).length}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Failed</StatLabel>
              <StatNumber color="red.500">
                {Object.values(testResults).filter(r => !r.success).length}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Success Rate</StatLabel>
              <StatNumber>
                {Math.round((Object.values(testResults).filter(r => r.success).length / Object.keys(testResults).length) * 100)}%
              </StatNumber>
            </Stat>
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
};

export default BackendTestPage;