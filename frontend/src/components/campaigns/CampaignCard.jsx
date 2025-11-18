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
  Image,
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
      bg="neutral.800" 
      borderRadius="20px" 
      overflow="hidden" 
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.3)" 
      border="1px solid" 
      borderColor="neutral.700" 
      _hover={{ 
        borderColor: 'brand.500',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(47, 212, 99, 0.3)',
        transform: 'translateY(-4px)' 
      }} 
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      h="auto"
      minH="550px"
      backdropFilter="blur(10px)"
    >
      {/* Large Campaign Image/Hero Section */}
      <Box
        position="relative"
        h="220px"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgGradient={campaign.heroImage ? undefined : 'linear(to-br, brand.500, brand.700)'}
        color="white"
        fontSize="6xl"
      >
        {campaign.heroImage ? (
          <>
            <Image
              src={campaign.heroImage}
              alt={`${campaign.title} banner`}
              objectFit="cover"
              w="100%"
              h="100%"
            />
            {/* Dark gradient overlay for better text contrast */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bgGradient="linear(to-b, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.4))"
            />
          </>
        ) : (
          campaign.image
        )}
        <Badge
          position="absolute"
          top={4}
          right={4}
          bg={status.colorScheme === 'green' ? 'brand.500' : 'neutral.600'}
          color={status.colorScheme === 'green' ? 'neutral.900' : 'neutral.50'}
          fontSize="xs"
          fontWeight="600"
          px={3}
          py={1.5}
          borderRadius="8px"
          backdropFilter="blur(10px)"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          {status.label}
        </Badge>
      </Box>

      <CardBody p={6}>
        {/* Title and Description */}
        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="lg" color="neutral.50" lineHeight="1.3" fontWeight="600" letterSpacing="-0.01em">
            {campaign.title}
          </Heading>
          
          <Text fontSize="md" color="neutral.300" lineHeight="1.6" noOfLines={2}>
            {campaign.description}
          </Text>

          {/* Organizer */}
          <HStack spacing={3} p={3} bg="whiteAlpha.50" borderRadius="12px" w="full">
            <Avatar size="md" name={campaign.organizer.name} border="2px solid" borderColor="brand.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="600" color="neutral.50">
                {campaign.organizer.name}
              </Text>
              <Text fontSize="xs" color="neutral.400">
                Campaign Organizer
              </Text>
            </VStack>
          </HStack>
        </VStack>

        {/* Location and Date - Prominent */}
        <VStack align="flex-start" spacing={2} mt={4}>
          <HStack spacing={3} p={3} bg="whiteAlpha.50" borderRadius="12px" w="full" border="1px solid" borderColor="neutral.700">
            <Icon as={FiMapPin} boxSize={5} color="brand.500" />
            <Text fontSize="sm" color="neutral.200" fontWeight="500" noOfLines={1}>
              {campaign.location.address}
            </Text>
          </HStack>
          <HStack spacing={3} p={3} bg="whiteAlpha.50" borderRadius="12px" w="full" border="1px solid" borderColor="neutral.700">
            <Icon as={FiCalendar} boxSize={5} color="brand.500" />
            <Text fontSize="sm" color="neutral.200" fontWeight="500">
              {formatDate(campaign.date)}
            </Text>
          </HStack>
        </VStack>

        {/* Progress Sections - Enhanced */}
        <VStack spacing={6} mt={6}>
          {/* Volunteers Progress */}
          <Box w="full">
            <Flex justify="space-between" align="center" mb={3}>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="700" color="neutral.50">
                  {campaign.volunteers.length} Volunteers
                </Text>
                <Text fontSize="xs" color="neutral.400">
                  {campaign.volunteerGoal} needed
                </Text>
              </VStack>
              <Badge 
                bg="brand.500"
                color="neutral.900" 
                fontSize="sm" 
                px={3} 
                py={1} 
                borderRadius="8px"
                fontWeight="600"
              >
                {Math.round(volunteersPercent)}%
              </Badge>
            </Flex>
            <Progress
              value={volunteersPercent}
              size="md"
              borderRadius="full"
              w="full"
              bg="neutral.700"
              sx={{
                '& > div': {
                  bg: 'brand.500',
                  boxShadow: '0 0 10px rgba(47, 212, 99, 0.5)'
                }
              }}
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
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="700" color="neutral.50">
                  AED {campaign.funding.current.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="neutral.400">
                  AED {campaign.funding.goal.toLocaleString()} goal
                </Text>
              </VStack>
              <Badge 
                bg="whiteAlpha.200"
                color="neutral.200" 
                fontSize="sm" 
                px={3} 
                py={1} 
                borderRadius="8px"
                fontWeight="600"
              >
                {Math.round(progressPercent)}%
              </Badge>
            </Flex>
            <Progress
              value={progressPercent}
              size="md"
              borderRadius="full"
              w="full"
              bg="neutral.700"
              sx={{
                '& > div': {
                  bg: 'linear-gradient(90deg, #2fd463, #26b954)',
                  boxShadow: '0 0 10px rgba(47, 212, 99, 0.4)'
                }
              }}
            />
          </Box>

          {/* Impact Metrics */}
          <Box 
            w="full" 
            p={4} 
            bg="rgba(47, 212, 99, 0.08)" 
            borderRadius="12px"
            border="1px solid"
            borderColor="rgba(47, 212, 99, 0.2)"
          >
            <Text fontSize="xs" fontWeight="600" color="brand.400" mb={3} textTransform="uppercase" letterSpacing="0.05em">
              Environmental Impact
            </Text>
            <SimpleGrid columns={3} spacing={3} textAlign="center">
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="700" color="brand.500">
                  {campaign.esgImpact.itemsCollected}
                </Text>
                <Text fontSize="10px" color="neutral.400" textTransform="uppercase" letterSpacing="0.05em">
                  Items
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="700" color="brand.500">
                  {campaign.esgImpact.areaCleaned}
                </Text>
                <Text fontSize="10px" color="neutral.400" textTransform="uppercase" letterSpacing="0.05em">
                  km² Clean
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="700" color="brand.500">
                  {campaign.esgImpact.co2Saved}
                </Text>
                <Text fontSize="10px" color="neutral.400" textTransform="uppercase" letterSpacing="0.05em">
                  kg CO²
                </Text>
              </VStack>
            </SimpleGrid>
          </Box>
        </VStack>
      </CardBody>

      {/* Action Buttons - Enhanced */}
      <CardFooter p={6} pt={0}>
        <VStack spacing={2.5} w="full">
          <Button
            w="full"
            bg="brand.500"
            color="neutral.900"
            onClick={campaign.status === 'active' ? onJoin : onViewDetails}
            size="lg"
            fontWeight="600"
            borderRadius="12px"
            h="50px"
            _hover={{
              bg: 'brand.400',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(47, 212, 99, 0.3)'
            }}
            _active={{
              transform: 'translateY(0)'
            }}
          >
            {campaign.status === 'active' ? 'Join Campaign' : 'View Details'}
          </Button>
          <Button
            w="full"
            variant="outline"
            borderColor="neutral.600"
            color="neutral.200"
            onClick={onDonate}
            size="lg"
            fontWeight="500"
            borderRadius="12px"
            h="50px"
            _hover={{
              borderColor: 'brand.500',
              bg: 'whiteAlpha.50',
              color: 'brand.500'
            }}
          >
            💚 Support with Donation
          </Button>
        </VStack>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;