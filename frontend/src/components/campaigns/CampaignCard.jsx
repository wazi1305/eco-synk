import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Progress,
  Button,
  Avatar,
  AvatarGroup,
  Grid,
  GridItem,
  Icon,
  Flex,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiMapPin, FiCalendar } from 'react-icons/fi';

const CampaignCard = ({ campaign, onViewDetails, onJoin, onDonate }) => {
  const progressPercent = Math.min(
    (campaign.funding.current / campaign.funding.goal) * 100,
    100
  );
  const volunteersPercent = Math.min(
    (campaign.volunteers.length / campaign.volunteerGoal) * 100,
    100
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    active: { colorScheme: 'green', label: 'Active' },
    completed: { colorScheme: 'gray', label: 'Completed' },
  };

  const status = statusConfig[campaign.status];

  return (
    <Card 
      bg="white" 
      borderRadius="2xl" 
      overflow="hidden" 
      boxShadow="lg" 
      border="1px solid" 
      borderColor="gray.100" 
      _hover={{ 
        boxShadow: 'xl', 
        transform: 'translateY(-2px)' 
      }} 
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      h="auto"
      minH="550px"
    >
      {/* Large Campaign Image/Hero Section */}
      <Box
        bgGradient="linear(to-br, brand.400, brand.600)"
        h="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
        fontSize="6xl"
        color="white"
      >
        {campaign.image}
        <Badge
          position="absolute"
          top={4}
          right={4}
          colorScheme={status.colorScheme}
          fontSize="sm"
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="full"
        >
          {status.label}
        </Badge>
      </Box>

      <CardBody p={6}>
        {/* Title and Description */}
        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="lg" color="gray.900" lineHeight="1.3">
            {campaign.title}
          </Heading>
          
          <Text fontSize="md" color="gray.600" lineHeight="1.5" noOfLines={2}>
            {campaign.description}
          </Text>

          {/* Organizer */}
          <HStack spacing={3}>
            <Avatar size="md" name={campaign.organizer.name} />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="600" color="gray.900">
                {campaign.organizer.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Campaign Organizer
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Location and Date - Prominent */}
        <VStack align="flex-start" spacing={3} mt={4}>
          <HStack spacing={3} p={3} bg="gray.50" borderRadius="lg" w="full">
            <Icon as={FiMapPin} boxSize={5} color="brand.500" />
            <Text fontSize="md" color="gray.700" fontWeight="500">
              {campaign.location.address}
            </Text>
          </HStack>
          <HStack spacing={3} p={3} bg="gray.50" borderRadius="lg" w="full">
            <Icon as={FiCalendar} boxSize={5} color="brand.500" />
            <Text fontSize="md" color="gray.700" fontWeight="500">
              {formatDate(campaign.date)}
            </Text>
          </HStack>
        </VStack>

        {/* Progress Sections - Enhanced */}
        <VStack spacing={6} mt={6}>
          {/* Volunteers Progress */}
          <Box w="full">
            <Flex justify="space-between" align="center" mb={3}>
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color="gray.900">
                  {campaign.volunteers.length} Volunteers
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {campaign.volunteerGoal} needed
                </Text>
              </VStack>
              <Badge 
                colorScheme="brand" 
                fontSize="md" 
                px={3} 
                py={1} 
                borderRadius="full"
              >
                {Math.round(volunteersPercent)}%
              </Badge>
            </Flex>
            <Progress
              value={volunteersPercent}
              size="lg"
              colorScheme="brand"
              borderRadius="full"
              w="full"
              bg="gray.200"
            />
            <AvatarGroup size="md" max={5} mt={3}>
              {campaign.volunteers.map((vol, idx) => (
                <Avatar key={idx} name={vol.name} />
              ))}
            </AvatarGroup>
          </Box>

          {/* Funding Progress */}
          <Box w="full">
            <Flex justify="space-between" align="center" mb={3}>
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color="gray.900">
                  AED {campaign.funding.current.toLocaleString()} Raised
                </Text>
                <Text fontSize="sm" color="gray.600">
                  AED {campaign.funding.goal.toLocaleString()} goal
                </Text>
              </VStack>
              <Badge 
                colorScheme="blue" 
                fontSize="md" 
                px={3} 
                py={1} 
                borderRadius="full"
              >
                {Math.round(progressPercent)}%
              </Badge>
            </Flex>
            <Progress
              value={progressPercent}
              size="lg"
              colorScheme="blue"
              borderRadius="full"
              w="full"
              bg="gray.200"
            />
          </Box>

          {/* Impact Metrics */}
          <Box w="full" p={4} bg="brand.50" borderRadius="lg">
            <Text fontSize="sm" fontWeight="600" color="brand.700" mb={3}>
              Environmental Impact
            </Text>
            <SimpleGrid columns={3} spacing={4} textAlign="center">
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600">
                  {campaign.esgImpact.itemsCollected}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Items Collected
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600">
                  {campaign.esgImpact.areaCleaned}km²
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Area Cleaned
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color="brand.600">
                  {campaign.esgImpact.co2Saved}kg
                </Text>
                <Text fontSize="xs" color="gray.600">
                  CO² Saved
                </Text>
              </VStack>
            </SimpleGrid>
          </Box>
        </VStack>
      </CardBody>

      {/* Action Buttons - Enhanced */}
      <CardFooter p={6} pt={0}>
        <VStack spacing={3} w="full">
          <Button
            w="full"
            colorScheme="brand"
            onClick={campaign.status === 'active' ? onJoin : onViewDetails}
            size="lg"
            fontWeight="600"
            borderRadius="lg"
            py={6}
          >
            {campaign.status === 'active' ? 'Join Campaign' : 'View Details'}
          </Button>
          <Button
            w="full"
            variant="outline"
            colorScheme="brand"
            onClick={onDonate}
            size="lg"
            fontWeight="600"
            borderRadius="lg"
            py={6}
          >
            💚 Support with Donation
          </Button>
        </VStack>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;