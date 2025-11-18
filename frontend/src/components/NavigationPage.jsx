import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Button, 
  Card, 
  CardBody, 
  Badge, 
  SimpleGrid,
  Icon,
  Flex
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiUser, 
  FiCamera, 
  FiMap, 
  FiUsers, 
  FiBarChart,
  FiArrowRight,
  FiZap
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NavigationPage = () => {
  const navigate = useNavigate();

  const pages = [
    {
      title: 'Feed',
      description: 'Community activity & impact stories',
      path: '/feed',
      icon: FiHome,
      gradient: 'linear(to-br, #2fd463, #26b954)',
      status: 'Live'
    },
    {
      title: 'Profile',
      description: 'Your impact & leaderboard rank',
      path: '/profile',
      icon: FiUser,
      gradient: 'linear(to-br, #818281, #404241)',
      status: 'Active'
    },
    {
      title: 'AI Scanner',
      description: 'Instant waste type detection',
      path: '/report',
      icon: FiCamera,
      gradient: 'linear(to-br, #2fd463, #1e9c45)',
      status: 'AI',
      highlight: true
    },
    {
      title: 'Map',
      description: 'Discover nearby cleanup sites',
      path: '/map',
      icon: FiMap,
      gradient: 'linear(to-br, #404241, #151515)',
      status: 'Live'
    },
    {
      title: 'Campaigns',
      description: 'Join & create eco missions',
      path: '/campaigns',
      icon: FiUsers,
      gradient: 'linear(to-br, #2fd463, #26b954)',
      status: 'New'
    },
    {
      title: 'Analytics',
      description: 'ESG metrics & environmental data',
      path: '/analytics',
      icon: FiBarChart,
      gradient: 'linear(to-br, #818281, #404241)',
      status: 'Data'
    },
  ];

  return (
    <Box minH="100vh" bg="neutral.900">
      {/* Hero Section */}
      <Box 
        px={6} 
        pt={12} 
        pb={8}
        bgGradient="linear(to-b, rgba(47, 212, 99, 0.05), transparent)"
        borderBottom="1px solid"
        borderColor="neutral.800"
      >
        <VStack spacing={4} maxW="600px" mx="auto">
          <Flex align="center" gap={2}>
            <Icon as={FiZap} color="brand.500" boxSize={8} />
            <Heading 
              size="2xl" 
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
              fontWeight="700"
              letterSpacing="-0.02em"
            >
              EcoSynk
            </Heading>
          </Flex>
          <Text 
            color="neutral.300" 
            fontSize="lg" 
            textAlign="center"
            fontWeight="400"
          >
            Transform waste into impact. Powered by AI.
          </Text>
        </VStack>
      </Box>

      {/* Feature Cards Grid */}
      <Box p={6} maxW="1200px" mx="auto">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {pages.map((page) => (
            <Card
              key={page.path}
              bg="neutral.800"
              cursor="pointer"
              position="relative"
              overflow="hidden"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              border="1px solid"
              borderColor={page.highlight ? 'brand.500' : 'neutral.700'}
              _hover={{
                transform: 'translateY(-4px)',
                borderColor: 'brand.500',
                boxShadow: page.highlight 
                  ? '0 12px 40px rgba(47, 212, 99, 0.3), 0 0 0 1px rgba(47, 212, 99, 0.5)'
                  : '0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(47, 212, 99, 0.3)',
              }}
              onClick={() => navigate(page.path)}
            >
              {/* Gradient overlay on hover */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgGradient={page.gradient}
                opacity={0}
                transition="opacity 0.3s"
                _groupHover={{ opacity: 0.05 }}
                pointerEvents="none"
              />

              {/* Highlight glow for featured items */}
              {page.highlight && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="2px"
                  bgGradient="linear(to-r, transparent, brand.500, transparent)"
                />
              )}

              <CardBody p={6} position="relative" zIndex={1}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="start">
                    <Flex
                      w="48px"
                      h="48px"
                      bg="whiteAlpha.50"
                      borderRadius="12px"
                      align="center"
                      justify="center"
                      border="1px solid"
                      borderColor="neutral.700"
                    >
                      <Icon
                        as={page.icon}
                        boxSize={6}
                        color="brand.500"
                      />
                    </Flex>
                    <Badge
                      bg="whiteAlpha.100"
                      color="neutral.300"
                      borderRadius="6px"
                      px={2}
                      py={0.5}
                      fontSize="10px"
                      fontWeight="600"
                      letterSpacing="0.05em"
                      textTransform="uppercase"
                    >
                      {page.status}
                    </Badge>
                  </HStack>
                  
                  <VStack align="start" spacing={2} flex={1}>
                    <Heading 
                      size="md" 
                      color="neutral.50"
                      fontWeight="600"
                      letterSpacing="-0.01em"
                    >
                      {page.title}
                    </Heading>
                    <Text 
                      color="neutral.400" 
                      fontSize="sm"
                      lineHeight="1.6"
                    >
                      {page.description}
                    </Text>
                  </VStack>
                  
                  <HStack 
                    color="brand.500"
                    fontSize="sm"
                    fontWeight="500"
                    spacing={1}
                    transition="all 0.2s"
                    _groupHover={{ 
                      transform: 'translateX(4px)',
                    }}
                  >
                    <Text>Explore</Text>
                    <Icon as={FiArrowRight} boxSize={4} />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {/* Quick Stats Footer */}
        <Box 
          mt={8} 
          p={6} 
          bg="neutral.800"
          borderRadius="16px"
          border="1px solid"
          borderColor="neutral.700"
        >
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={6}>
            <VStack spacing={1}>
              <Text color="brand.500" fontSize="2xl" fontWeight="700">
                1000+
              </Text>
              <Text color="neutral.400" fontSize="sm">
                Active Users
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text color="brand.500" fontSize="2xl" fontWeight="700">
                50K+
              </Text>
              <Text color="neutral.400" fontSize="sm">
                Items Collected
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Text color="brand.500" fontSize="2xl" fontWeight="700">
                AI
              </Text>
              <Text color="neutral.400" fontSize="sm">
                Powered Analysis
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
};

export default NavigationPage;