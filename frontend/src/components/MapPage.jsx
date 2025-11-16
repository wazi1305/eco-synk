import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
  Icon,
  Text,
  Heading,
  Container,
} from '@chakra-ui/react';
import { FiMapPin, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const TRASH_REPORTS = [
  {
    id: 1,
    location: 'Central Park',
    priority: 'high',
    description: 'Large pile of plastic waste',
    date: '2 hours ago',
    reports: 12,
    status: 'pending',
  },
  {
    id: 2,
    location: 'Main Street',
    priority: 'medium',
    description: 'Scattered litter',
    date: '4 hours ago',
    reports: 5,
    status: 'in-progress',
  },
  {
    id: 3,
    location: 'Beach Cleanup',
    priority: 'high',
    description: 'Marine debris',
    date: '6 hours ago',
    reports: 18,
    status: 'pending',
  },
];

const PRIORITY_COLORS = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
};

const STATUS_COLORS = {
  pending: 'gray',
  'in-progress': 'brand',
  completed: 'green',
};

const MapPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredReports = TRASH_REPORTS.filter((report) => {
    if (selectedFilter === 'all') return true;
    return report.priority === selectedFilter;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden">
      <Box bg="white" p={4} borderBottom="1px solid" borderColor="gray.200" shadow="sm">
        <Container maxW="container.lg" px={0}>
          <HStack justify="space-between" align="center" mb={4}>
            <HStack>
              <Icon as={FiMapPin} boxSize={6} color="brand.600" />
              <Heading size="md" color="gray.900">
                Trash Reports
              </Heading>
            </HStack>
            <Badge colorScheme="brand" fontSize="md" px={3} py={1}>
              {filteredReports.length} reports
            </Badge>
          </HStack>

          <HStack spacing={2} flex="1" overflowX="auto" pb={2}>
            <Button
              size="sm"
              variant={selectedFilter === 'all' ? 'solid' : 'outline'}
              colorScheme={selectedFilter === 'all' ? 'brand' : 'gray'}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'high' ? 'solid' : 'outline'}
              colorScheme={selectedFilter === 'high' ? 'red' : 'gray'}
              onClick={() => setSelectedFilter('high')}
            >
              High
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'medium' ? 'solid' : 'outline'}
              colorScheme={selectedFilter === 'medium' ? 'yellow' : 'gray'}
              onClick={() => setSelectedFilter('medium')}
            >
              Medium
            </Button>
            <Button
              size="sm"
              variant={selectedFilter === 'low' ? 'solid' : 'outline'}
              colorScheme={selectedFilter === 'low' ? 'blue' : 'gray'}
              onClick={() => setSelectedFilter('low')}
            >
              Low
            </Button>
          </HStack>
        </Container>
      </Box>

      <Box flex="1" overflow="auto" pb={20}>
        <Container maxW="container.lg" py={4}>
          <VStack spacing={3} align="stretch">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ shadow: 'md', borderColor: 'brand.300' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => toggleExpand(report.id)}
              >
                <CardBody p={4}>
                  <Flex justify="space-between" align="start" gap={3}>
                    <VStack align="start" flex="1" spacing={2}>
                      <HStack spacing={2}>
                        <Icon as={FiMapPin} boxSize={5} color="brand.600" />
                        <Heading size="sm" color="gray.900">
                          {report.location}
                        </Heading>
                        <Badge colorScheme={PRIORITY_COLORS[report.priority]} fontSize="xs">
                          {report.priority}
                        </Badge>
                        <Badge
                          colorScheme={STATUS_COLORS[report.status]}
                          fontSize="xs"
                          variant="subtle"
                        >
                          {report.status}
                        </Badge>
                      </HStack>

                      <HStack spacing={4} fontSize="sm" color="gray.600">
                        <Text>{report.date}</Text>
                        <Text fontWeight="600" color="brand.600">
                          {report.reports} reports
                        </Text>
                      </HStack>

                      {expandedId === report.id && (
                        <Box
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor="brand.500"
                          mt={2}
                        >
                          <Text color="gray.700" fontSize="sm">
                            {report.description}
                          </Text>
                        </Box>
                      )}
                    </VStack>

                    <Button size="sm" variant="ghost" colorScheme="brand" p={0} minW="auto">
                      {expandedId === report.id ? (
                        <Icon as={FiChevronUp} boxSize={5} />
                      ) : (
                        <Icon as={FiChevronDown} boxSize={5} />
                      )}
                    </Button>
                  </Flex>

                  {expandedId === report.id && (
                    <HStack spacing={2} mt={4} pt={3} borderTop="1px solid" borderColor="gray.200">
                      <Button size="sm" colorScheme="brand" variant="solid" flex="1">
                        Join Cleanup
                      </Button>
                      <Button size="sm" colorScheme="gray" variant="outline" flex="1">
                        Share
                      </Button>
                    </HStack>
                  )}
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Container>
      </Box>
    </Flex>
  );
};

export default MapPage;
