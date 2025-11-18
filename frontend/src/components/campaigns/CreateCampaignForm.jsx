import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner
} from '@chakra-ui/react';
import campaignService from '../../services/campaignService';

const CreateCampaignForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    campaign_name: '',
    description: '',
    location: { lat: 25.2048, lon: 55.2708 }, // Default Dubai coordinates
    target_funding_usd: 500,
    volunteer_goal: 10,
    duration_days: 30,
    estimated_waste_kg: 50,
    materials: 'mixed'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationName, setLocationName] = useState('Dubai, UAE');
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const parts = [];
        
        // Building/house number and street
        if (addr.house_number && addr.road) {
          parts.push(`${addr.house_number} ${addr.road}`);
        } else if (addr.road) {
          parts.push(addr.road);
        }
        
        // Neighborhood/suburb
        if (addr.neighbourhood) {
          parts.push(addr.neighbourhood);
        } else if (addr.suburb) {
          parts.push(addr.suburb);
        }
        
        // City/town
        if (addr.city) {
          parts.push(addr.city);
        } else if (addr.town) {
          parts.push(addr.town);
        }
        
        // State/emirate
        if (addr.state && !parts.includes(addr.state)) {
          parts.push(addr.state);
        }
        
        // Country
        if (addr.country && !parts.includes(addr.country)) {
          parts.push(addr.country);
        }
        
        return parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
      
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support geolocation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        handleInputChange('location', { lat: latitude, lon: longitude });
        const locationText = await reverseGeocode(latitude, longitude);
        setLocationName(locationText);
        toast({
          title: 'Location updated',
          description: `Campaign location set to ${locationText}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        toast({
          title: 'Location error',
          description: 'Unable to get your current location',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.campaign_name.trim()) {
      newErrors.campaign_name = 'Campaign name is required';
    }
    
    if (formData.target_funding_usd < 100) {
      newErrors.target_funding_usd = 'Minimum funding goal is $100';
    }
    
    if (formData.volunteer_goal < 1) {
      newErrors.volunteer_goal = 'At least 1 volunteer is required';
    }
    
    if (formData.duration_days < 1 || formData.duration_days > 365) {
      newErrors.duration_days = 'Duration must be between 1-365 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignData = {
        ...formData,
        hotspot: {
          report_count: 1,
          report_ids: [],
          average_priority: 5,
          materials: [formData.materials]
        }
      };

      const result = await campaignService.createCampaign(campaignData);

      if (result.success) {
        toast({
          title: 'Campaign Created!',
          description: result.message || 'Your campaign has been created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onSuccess?.(result.campaign);
        onClose();
        
        // Reset form
        setFormData({
          campaign_name: '',
          description: '',
          location: { lat: 25.2048, lon: 55.2708 },
          target_funding_usd: 500,
          volunteer_goal: 10,
          duration_days: 30,
          estimated_waste_kg: 50,
          materials: 'mixed'
        });
      } else {
        throw new Error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Campaign creation failed:', error);
      toast({
        title: 'Creation Failed',
        description: error.message || 'Unable to create campaign. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Campaign</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={errors.campaign_name}>
                <FormLabel>Campaign Name</FormLabel>
                <Input
                  value={formData.campaign_name}
                  onChange={(e) => handleInputChange('campaign_name', e.target.value)}
                  placeholder="e.g., Marina Beach Cleanup"
                />
                <FormErrorMessage>{errors.campaign_name}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your campaign goals and activities..."
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Location</FormLabel>
                <VStack spacing={2} align="stretch">
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Enter campaign location..."
                  />
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={getCurrentLocation}
                    isLoading={isGettingLocation}
                    loadingText="Getting..."
                    alignSelf="flex-start"
                  >
                    📍 Use Current Location
                  </Button>
                </VStack>
              </FormControl>

              <HStack spacing={4}>
                <FormControl isInvalid={errors.target_funding_usd}>
                  <FormLabel>Funding Goal (USD)</FormLabel>
                  <NumberInput
                    value={formData.target_funding_usd}
                    onChange={(value) => handleInputChange('target_funding_usd', parseInt(value) || 0)}
                    min={100}
                    max={10000}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <Slider
                    value={formData.target_funding_usd}
                    onChange={(value) => handleInputChange('target_funding_usd', value)}
                    min={100}
                    max={10000}
                    step={50}
                    mt={2}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <FormErrorMessage>{errors.target_funding_usd}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.volunteer_goal}>
                  <FormLabel>Volunteer Goal</FormLabel>
                  <NumberInput
                    value={formData.volunteer_goal}
                    onChange={(value) => handleInputChange('volunteer_goal', parseInt(value) || 0)}
                    min={1}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>{errors.volunteer_goal}</FormErrorMessage>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl isInvalid={errors.duration_days}>
                  <FormLabel>Duration (Days)</FormLabel>
                  <NumberInput
                    value={formData.duration_days}
                    onChange={(value) => handleInputChange('duration_days', parseInt(value) || 0)}
                    min={1}
                    max={365}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormErrorMessage>{errors.duration_days}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Waste Type</FormLabel>
                  <Select
                    value={formData.materials}
                    onChange={(e) => handleInputChange('materials', e.target.value)}
                  >
                    <option value="mixed">Mixed Waste</option>
                    <option value="plastic">Plastic</option>
                    <option value="metal">Metal</option>
                    <option value="glass">Glass</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Estimated Waste (kg)</FormLabel>
                <NumberInput
                  value={formData.estimated_waste_kg}
                  onChange={(value) => handleInputChange('estimated_waste_kg', parseInt(value) || 0)}
                  min={1}
                  max={1000}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <HStack spacing={4} pt={4}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={isSubmitting}
                  loadingText="Creating..."
                  flex={1}
                >
                  Create Campaign
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CreateCampaignForm;