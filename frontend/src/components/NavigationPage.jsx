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
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiUser, 
  FiCamera, 
  FiMap, 
  FiUsers, 
  FiBarChart,
  FiSettings,
  FiDatabase,
  FiTrendingUp
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NavigationPage = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.700');

  const pages = [
    {
      title: 'Feed',
      description: 'Social activity feed with cleanup posts',
      path: '/feed',
      icon: FiHome,
      color: 'blue',
      status: 'Live'
    },
    {
      title: 'Profile & Leaderboard',
      description: 'User profile with real volunteer leaderboard',
      path: '/profile',
      icon: FiUser,
      color: 'purple',
      status: 'Updated'
    },
    {
      title: 'Camera Analysis',
      description: 'AI-powered trash image analysis',
      path: '/report',
      icon: FiCamera,
      color: 'green',
      status: 'AI Ready'
    },
    {
      title: 'Campaign Map',
      description: 'Interactive map with cleanup locations',
      path: '/map',
      icon: FiMap,
      color: 'orange',
      status: 'Live'
    },
    {
      title: 'Campaigns',
      description: 'Create and join cleanup campaigns',
      path: '/campaigns',
      icon: FiUsers,
      color: 'teal',
      status: 'Live'
    },
    {
      title: 'Analytics Dashboard',
      description: 'ESG metrics and environmental impact data',
      path: '/analytics',
      icon: FiBarChart,
      color: 'pink',
      status: 'Real Data'
    },

  ];

  return (
    <Box p={6} maxW="6xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center" py={4}>
          <Heading size="xl" color="brand.500" mb={2}>
            🌱 EcoSynk Navigation
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Explore all EcoSynk features and join the environmental movement
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {pages.map((page) => (
            <Card
              key={page.path}
              bg={cardBg}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: 'xl',
              }}
              onClick={() => navigate(page.path)}
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Icon
                      as={page.icon}
                      boxSize={8}
                      color={`${page.color}.500`}
                    />
                    <Badge
                      colorScheme={page.color}
                      variant="subtle"
                      borderRadius="full"
                    >
                      {page.status}
                    </Badge>
                  </HStack>
                  
                  <VStack align="start" spacing={2}>
                    <Heading size="md" color="gray.900">
                      {page.title}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {page.description}
                    </Text>
                  </VStack>
                  
                  <Button
                    colorScheme={page.color}
                    size="sm"
                    rightIcon={<Icon as={FiTrendingUp} />}
                  >
                    Open Page
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>


      </VStack>
    </Box>
  );
};

export default NavigationPage;