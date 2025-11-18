import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  useToast,
  Spinner,
  Box,
  Text,
  Alert,
  AlertIcon,
  VStack,
} from '@chakra-ui/react';
import { FiNavigation, FiMapPin } from 'react-icons/fi';
import { getUserLocation, getDefaultLocation } from '../../utils/distanceCalculator';

const LocationButton = ({ onLocationUpdate, userLocation, loading }) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const toast = useToast();

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const location = await getUserLocation();
      onLocationUpdate(location);
      
      toast({
        title: 'Location found!',
        description: `Accuracy: ±${Math.round(location.accuracy)}m`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Location error:', error);
      
      // Fallback to Dubai center
      const fallbackLocation = getDefaultLocation();
      onLocationUpdate(fallbackLocation);
      
      toast({
        title: 'Location unavailable',
        description: error.message + '. Using Dubai city center.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const LocationStatus = () => {
    if (loading || isGettingLocation) {
      return (
        <Box 
          position="absolute" 
          top="16px" 
          left="16px" 
          bg="white" 
          p={3} 
          borderRadius="lg" 
          boxShadow="md"
          zIndex={1000}
        >
          <VStack spacing={2}>
            <Spinner size="sm" color="brand.500" />
            <Text fontSize="sm" color="gray.600">
              Getting location...
            </Text>
          </VStack>
        </Box>
      );
    }

    if (userLocation) {
      return (
        <Alert 
          status="success" 
          position="absolute" 
          top="16px" 
          left="16px" 
          w="auto" 
          borderRadius="lg" 
          boxShadow="md"
          zIndex={1000}
          bg="white"
        >
          <AlertIcon />
          <Text fontSize="sm">
            Location: {userLocation.name || 'Current position'}
          </Text>
        </Alert>
      );
    }

    return null;
  };

  return (
    <>
      <LocationStatus />
      
      <Tooltip 
        label={userLocation ? "Update location" : "Find my location"} 
        placement="left"
      >
        <IconButton
          icon={
            isGettingLocation ? (
              <Spinner size="sm" />
            ) : userLocation ? (
              <FiMapPin />
            ) : (
              <FiNavigation />
            )
          }
          colorScheme={userLocation ? "green" : "brand"}
          variant={userLocation ? "solid" : "solid"}
          size="lg"
          position="absolute"
          bottom="80px"
          right="16px"
          zIndex={1000}
          boxShadow="lg"
          isLoading={isGettingLocation}
          onClick={handleGetLocation}
          _hover={{
            transform: 'scale(1.05)',
          }}
          transition="all 0.2s"
        />
      </Tooltip>
    </>
  );
};

export default LocationButton;