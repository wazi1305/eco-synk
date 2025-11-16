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
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
} from '@chakra-ui/react';
import { FiMapPin, FiChevronDown, FiChevronUp, FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';

const TRASH_REPORTS = [
  {
    id: 1,
    location: 'Central Park',
    priority: 'high',
    description: 'Large pile of plastic waste near the fountain area. Multiple water bottles, food packaging, and plastic bags observed.',
    date: '2 hours ago',
    reports: 12,
    status: 'pending',
    distance: '0.8 km',
    volunteersNeeded: 5,
    materials: ['Plastic', 'Glass', 'Organic']
  },
  {
    id: 2,
    location: 'Main Street Downtown',
    priority: 'medium',
    description: 'Scattered litter along the sidewalk and bus stops. Mostly paper and food wrappers.',
    date: '4 hours ago',
    reports: 5,
    status: 'in-progress',
    distance: '1.2 km',
    volunteersNeeded: 3,
    materials: ['Paper', 'Food Waste']
  },
  {
    id: 3,
    location: 'Ocean Beach',
    priority: 'high',
    description: 'Marine debris including fishing nets, plastic bottles, and styrofoam containers washed ashore.',
    date: '6 hours ago',
    reports: 18,
    status: 'pending',
    distance: '2.5 km',
    volunteersNeeded: 8,
    materials: ['Plastic', 'Fishing Gear', 'Styrofoam']
  },
  {
    id: 4,
    location: 'Riverside Park',
    priority: 'low',
    description: 'Minor litter in picnic areas. Mostly organic waste and some paper products.',
    date: '1 day ago',
    reports: 3,
    status: 'completed',
    distance: '1.8 km',
    volunteersNeeded: 2,
    materials: ['Organic', 'Paper']
  },
];

const PRIORITY_COLORS = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const STATUS_COLORS = {
  pending: 'gray',
  'in-progress': 'brand',
  completed: 'green',
};

const STATUS_ICONS = {
  pending: FiClock,
  'in-progress': FiAlertTriangle,
  completed: FiCheckCircle,
};

const MapPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollYRef = React.useRef(0);
  const scrollTimeoutRef = React.useRef(null);

  // Simplified scroll handler with debouncing
  const handleScroll = React.useCallback((e) => {
    const currentScrollY = e.target.scrollTop;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Simple logic: show header when near top, hide when scrolling down significantly
    if (currentScrollY < 50) {
      setShowHeader(true);
    } else if (currentScrollY > 150 && currentScrollY > lastScrollYRef.current + 5) {
      setShowHeader(false);
    } else if (currentScrollY < lastScrollYRef.current - 20) {
      setShowHeader(true);
    }
    
    // Debounced update
    scrollTimeoutRef.current = setTimeout(() => {
      lastScrollYRef.current = currentScrollY;
    }, 50);
  }, []);

  const filteredReports = TRASH_REPORTS.filter((report) => {
    if (selectedFilter === 'all') return true;
    return report.priority === selectedFilter;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Calculate stats
  const stats = {
    total: TRASH_REPORTS.length,
    highPriority: TRASH_REPORTS.filter(r => r.priority === 'high').length,
    inProgress: TRASH_REPORTS.filter(r => r.status === 'in-progress').length,
    completed: TRASH_REPORTS.filter(r => r.status === 'completed').length,
  };

  return (
    <Flex direction="column" h="full" bg="gray.50" overflow="hidden" overflowX="hidden">
      {/* Header - Collapsible */}
      <Box 
        bg="white" 
        p={4} 
        borderBottom="1px solid" 
        borderColor="gray.200" 
        shadow="sm"
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={20}
      >
        <Container maxW="container.lg" px={0}>
          <HStack justify="space-between" align="center" mb={4}>
            <HStack spacing={3}>
              <Box
                bg="brand.50"
                p={2}
                borderRadius="lg"
              >
                <Icon as={FiMapPin} boxSize={5} color="brand.600" />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="gray.900" fontWeight="bold">
                  Trash Map
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  Live reports in your area
                </Text>
              </VStack>
            </HStack>
            <Badge colorScheme="brand" fontSize="sm" px={3} py={1} borderRadius="full">
              {filteredReports.length} active
            </Badge>
          </HStack>

          {/* Quick Stats */}
          <Grid templateColumns="repeat(4, 1fr)" gap={3} mb={4}>
            <Stat textAlign="center" p={2} bg="gray.50" borderRadius="lg">
              <StatNumber fontSize="lg" color="gray.900">{stats.total}</StatNumber>
              <StatLabel fontSize="xs" color="gray.600">Total</StatLabel>
            </Stat>
            <Stat textAlign="center" p={2} bg="red.50" borderRadius="lg">
              <StatNumber fontSize="lg" color="red.600">{stats.highPriority}</StatNumber>
              <StatLabel fontSize="xs" color="red.600">High</StatLabel>
            </Stat>
            <Stat textAlign="center" p={2} bg="brand.50" borderRadius="lg">
              <StatNumber fontSize="lg" color="brand.600">{stats.inProgress}</StatNumber>
              <StatLabel fontSize="xs" color="brand.600">Active</StatLabel>
            </Stat>
            <Stat textAlign="center" p={2} bg="green.50" borderRadius="lg">
              <StatNumber fontSize="lg" color="green.600">{stats.completed}</StatNumber>
              <StatLabel fontSize="xs" color="green.600">Done</StatLabel>
            </Stat>
          </Grid>

          {/* Filter Buttons */}
          <HStack spacing={2} flex="1" overflowX="hidden" pb={1} flexWrap="wrap">
            {[
              { key: 'all', label: 'All Reports', color: 'gray' },
              { key: 'high', label: 'High Priority', color: 'red' },
              { key: 'medium', label: 'Medium', color: 'orange' },
              { key: 'low', label: 'Low', color: 'blue' },
            ].map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={selectedFilter === filter.key ? 'solid' : 'outline'}
                colorScheme={filter.color}
                onClick={() => setSelectedFilter(filter.key)}
                borderRadius="full"
                fontSize="xs"
                fontWeight="medium"
              >
                {filter.label}
              </Button>
            ))}
          </HStack>
        </Container>
      </Box>

      {/* Reports List */}
      <Box 
        flex="1" 
        overflowY="auto"
        overflowX="hidden"
        pb={20} 
        onScroll={handleScroll} 
        pt={showHeader ? "240px" : "80px"} 
        transition="padding-top 0.4s ease-out"
      >
        <Container maxW="container.lg" py={4}>
          <VStack spacing={3} align="stretch">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                shadow="sm"
                _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => toggleExpand(report.id)}
              >
                <CardBody p={4}>
                  <Flex justify="space-between" align="start" gap={4}>
                    <VStack align="start" flex="1" spacing={3}>
                      {/* Header Row */}
                      <HStack justify="space-between" w="full">
                        <HStack spacing={3}>
                          <Box
                            bg={`${PRIORITY_COLORS[report.priority]}.100`}
                            p={2}
                            borderRadius="lg"
                          >
                            <Icon 
                              as={FiMapPin} 
                              boxSize={4} 
                              color={`${PRIORITY_COLORS[report.priority]}.600`} 
                            />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Heading size="sm" color="gray.900" fontWeight="semibold">
                              {report.location}
                            </Heading>
                            <Text fontSize="xs" color="gray.500">
                              {report.distance} away • {report.date}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack spacing={2}>
                          <Badge 
                            colorScheme={PRIORITY_COLORS[report.priority]} 
                            fontSize="xs"
                            borderRadius="full"
                          >
                            {report.priority}
                          </Badge>
                          <Badge
                            colorScheme={STATUS_COLORS[report.status]}
                            fontSize="xs"
                            variant="subtle"
                            borderRadius="full"
                          >
                            <Icon as={STATUS_ICONS[report.status]} mr={1} boxSize={3} />
                            {report.status}
                          </Badge>
                        </HStack>
                      </HStack>

                      {/* Stats Row */}
                      <HStack spacing={4} fontSize="sm" color="gray.600" w="full">
                        <HStack spacing={1}>
                          <Text fontWeight="600" color="brand.600">
                            {report.reports}
                          </Text>
                          <Text>reports</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Text fontWeight="600" color="orange.600">
                            {report.volunteersNeeded}
                          </Text>
                          <Text>volunteers needed</Text>
                        </HStack>
                      </HStack>

                      {/* Materials */}
                      <HStack spacing={2}>
                        {report.materials.map((material, index) => (
                          <Badge
                            key={index}
                            colorScheme="gray"
                            variant="subtle"
                            fontSize="xs"
                            borderRadius="md"
                          >
                            {material}
                          </Badge>
                        ))}
                      </HStack>

                      {/* Expanded Content */}
                      {expandedId === report.id && (
                        <Box
                          p={4}
                          bg="gray.50"
                          borderRadius="lg"
                          borderLeft="4px solid"
                          borderLeftColor="brand.500"
                          mt={2}
                          w="full"
                        >
                          <Text color="gray.700" fontSize="sm" mb={3} lineHeight="tall">
                            {report.description}
                          </Text>
                          
                          <Progress 
                            value={report.status === 'completed' ? 100 : report.status === 'in-progress' ? 50 : 10} 
                            colorScheme="brand" 
                            size="sm" 
                            borderRadius="full"
                            mb={3}
                          />
                          
                          <HStack spacing={2} justify="space-between">
                            <Button size="sm" colorScheme="brand" variant="solid" flex="1">
                              Join Cleanup
                            </Button>
                            <Button size="sm" colorScheme="gray" variant="outline" flex="1">
                              Share Location
                            </Button>
                            <Button size="sm" colorScheme="green" variant="ghost" flex="1">
                              +25 pts
                            </Button>
                          </HStack>
                        </Box>
                      )}
                    </VStack>

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      colorScheme="gray" 
                      p={1} 
                      minW="auto"
                      borderRadius="full"
                    >
                      {expandedId === report.id ? (
                        <Icon as={FiChevronUp} boxSize={5} />
                      ) : (
                        <Icon as={FiChevronDown} boxSize={5} />
                      )}
                    </Button>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>

          {/* Empty State */}
          {filteredReports.length === 0 && (
            <VStack spacing={4} py={12} textAlign="center" color="gray.500">
              <Icon as={FiCheckCircle} boxSize={12} color="green.400" />
              <VStack spacing={1}>
                <Text fontWeight="semibold" fontSize="lg">No reports found</Text>
                <Text fontSize="sm">Great job! Your area looks clean.</Text>
              </VStack>
              <Button colorScheme="brand" size="md">
                Report First Trash
              </Button>
            </VStack>
          )}
        </Container>
      </Box>
    </Flex>
  );
};

export default MapPage;