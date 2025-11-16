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
} from '@chakra-ui/react';
import { FiMapPin, FiCalendar } from 'react-icons/fi';

const CampaignCard = ({ campaign, onViewDetails, onDonate }) => {
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
    <Card bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm" border="1px solid" borderColor="gray.100" _hover={{ boxShadow: 'md' }} transition="all 0.2s">
      {/* Campaign Header with Image and Status */}
      <Box
        bgGradient="linear(to-br, brand.50, brand.100)"
        h="32"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
        fontSize="4xl"
      >
        {campaign.image}
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme={status.colorScheme}
          fontSize="xs"
          fontWeight="bold"
          px={3}
          py={1}
        >
          {status.label}
        </Badge>
      </Box>

      <CardBody spacing={4}>
        {/* Title and Organizer */}
        <VStack align="flex-start" spacing={2}>
          <Heading as="h3" size="md" color="gray.900">
            {campaign.title}
          </Heading>
          <HStack spacing={2}>
            <Avatar size="sm" name={campaign.organizer.name} />
            <Text fontSize="sm" color="gray.600">
              {campaign.organizer.name}
            </Text>
          </HStack>
        </VStack>

        {/* Location and Date */}
        <VStack align="flex-start" spacing={2} fontSize="sm" color="gray.600">
          <HStack spacing={2}>
            <Icon as={FiMapPin} boxSize={4} />
            <Text>{campaign.location.address}</Text>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FiCalendar} boxSize={4} />
            <Text>{formatDate(campaign.date)}</Text>
          </HStack>
        </VStack>

        <Divider />

        {/* Volunteers Progress */}
        <VStack align="flex-start" spacing={2} w="full">
          <Flex justify="space-between" w="full" align="center">
            <Text fontSize="sm" fontWeight="600" color="gray.700">
              Volunteers
            </Text>
            <Badge colorScheme="brand" fontSize="xs">
              {campaign.volunteers.length}/{campaign.volunteerGoal}
            </Badge>
          </Flex>
          <Progress
            value={volunteersPercent}
            size="sm"
            colorScheme="brand"
            borderRadius="full"
            w="full"
          />
          <AvatarGroup size="sm" max={4}>
            {campaign.volunteers.map((vol, idx) => (
              <Avatar key={idx} name={vol.name} />
            ))}
          </AvatarGroup>
        </VStack>

        {/* Funding Progress */}
        <VStack align="flex-start" spacing={2} w="full">
          <Flex justify="space-between" w="full" align="center">
            <Text fontSize="sm" fontWeight="600" color="gray.700">
              Funding
            </Text>
            <Badge colorScheme="blue" fontSize="xs">
              ${campaign.funding.current}/${campaign.funding.goal}
            </Badge>
          </Flex>
          <Progress
            value={progressPercent}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
            w="full"
          />
        </VStack>

        {/* Materials and Impact */}
        <VStack align="flex-start" spacing={2} fontSize="sm">
          <Text color="gray.600">
            <strong>Materials:</strong> {campaign.materials.slice(0, 2).join(', ')}
          </Text>
          <HStack spacing={4} fontSize="xs" color="brand.600" fontWeight="600">
            <Text>{campaign.esgImpact.itemsCollected} items collected</Text>
            <Text>{campaign.esgImpact.areaCleaned} km² cleaned</Text>
          </HStack>
        </VStack>
      </CardBody>

      <Divider />

      <CardFooter>
        <HStack spacing={2} w="full">
          <Button
            flex={1}
            colorScheme="brand"
            onClick={onViewDetails}
            size="md"
            fontWeight="600"
          >
            {campaign.status === 'active' ? 'Join Campaign' : 'View Details'}
          </Button>
          <Button
            flex={1}
            variant="outline"
            colorScheme="brand"
            onClick={onDonate}
            size="md"
            fontWeight="600"
          >
            Donate
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;