import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import {
  FiFilter,
  FiSearch,
  FiMap,
  FiList,
  FiLayers,
  FiSettings,
} from 'react-icons/fi';

const MapControls = ({
  onViewChange,
  currentView = 'map',
  onSearch,
  searchTerm = '',
  onFilterChange,
  filters = {},
  campaignCounts = {}
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [distanceFilter, setDistanceFilter] = useState(filters.maxDistance || 25);
  const [distanceEnabled, setDistanceEnabled] = useState(filters.enableDistanceFilter || false);
  const [showCompleted, setShowCompleted] = useState(filters.showCompleted || false);

  useEffect(() => {
    setDistanceFilter(filters.maxDistance || 25);
    setDistanceEnabled(Boolean(filters.enableDistanceFilter));
    setShowCompleted(Boolean(filters.showCompleted));
  }, [filters.maxDistance, filters.enableDistanceFilter, filters.showCompleted]);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(localSearchTerm);
  };

  const handleDistanceChange = (value) => {
    setDistanceFilter(value);
    onFilterChange({
      ...filters,
      maxDistance: value,
      enableDistanceFilter: true
    });
  };

  const handleDistanceToggle = (checked) => {
    setDistanceEnabled(checked);
    onFilterChange({
      ...filters,
      enableDistanceFilter: checked,
      maxDistance: distanceFilter
    });
  };

  const handleCompletedToggle = (checked) => {
    setShowCompleted(checked);
    onFilterChange({
      ...filters,
      showCompleted: checked
    });
  };

  const handleClearFilters = () => {
    setDistanceFilter(25);
    setDistanceEnabled(false);
    setShowCompleted(false);
    setLocalSearchTerm('');
    onSearch('');
    onFilterChange({
      maxDistance: 25,
      enableDistanceFilter: false,
      showCompleted: false,
      priority: null
    });
  };

  const handlePriorityFilter = (priority) => {
    onFilterChange({
      ...filters,
      priority: filters.priority === priority ? null : priority
    });
  };

  return (
    <Box
      position="absolute"
      top="16px"
      right="16px"
      zIndex={1000}
    >
      <VStack spacing={3} align="end">
        {/* View Toggle */}
        <HStack 
          bg="white" 
          borderRadius="lg" 
          boxShadow="md" 
          p={1}
          spacing={0}
        >
          <Button
            leftIcon={<FiMap />}
            size="sm"
            variant={currentView === 'map' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'map' ? 'brand' : 'gray'}
            onClick={() => onViewChange('map')}
            borderRadius="md"
          >
            Map
          </Button>
          <Button
            leftIcon={<FiList />}
            size="sm"
            variant={currentView === 'list' ? 'solid' : 'ghost'}
            colorScheme={currentView === 'list' ? 'brand' : 'gray'}
            onClick={() => onViewChange('list')}
            borderRadius="md"
          >
            List
          </Button>
        </HStack>

        {currentView === 'map' && (
          <>
            {/* Search Bar */}
            <Box bg="white" borderRadius="lg" boxShadow="md" p={3} minW="280px">
              <form onSubmit={handleSearchSubmit}>
                <InputGroup size="sm">
                  <InputLeftElement>
                    <FiSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search campaigns or locations..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    borderRadius="md"
                    bg="gray.50"
                    border="none"
                  />
                </InputGroup>
              </form>
            </Box>

            {/* Quick Priority Filters */}
            <HStack spacing={2}>
              {[
                { key: 'high', label: 'Urgent', color: 'red' },
                { key: 'medium', label: 'Medium', color: 'orange' },
                { key: 'low', label: 'Low', color: 'blue' }
              ].map(({ key, label, color }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={filters.priority === key ? 'solid' : 'outline'}
                  colorScheme={color}
                  onClick={() => handlePriorityFilter(key)}
                  bg={filters.priority === key ? undefined : 'white'}
                  boxShadow="sm"
                >
                  {label}
                  {campaignCounts[key] && (
                    <Badge ml={2} colorScheme={color} variant="solid">
                      {campaignCounts[key]}
                    </Badge>
                  )}
                </Button>
              ))}
            </HStack>
          </>
        )}

        {/* Advanced Filters */}
        <Popover placement="left">
          <PopoverTrigger>
            <IconButton
              icon={<FiFilter />}
              size="lg"
              colorScheme="brand"
              variant="solid"
              boxShadow="lg"
              position="relative"
            >
              {/* Filter indicator */}
              {(filters.enableDistanceFilter || filters.showCompleted || filters.priority) && (
                <Box
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  w="8px"
                  h="8px"
                  bg="red.500"
                  borderRadius="full"
                />
              )}
            </IconButton>
          </PopoverTrigger>
          <PopoverContent w="300px">
            <PopoverArrow />
            <PopoverBody p={4}>
              <VStack spacing={4} align="stretch">
                <Text fontWeight="semibold" fontSize="md">
                  Filter Options
                </Text>

                {/* Distance Filter */}
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">
                      Distance Limit
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="xs" color="gray.500">
                        {distanceEnabled ? `${distanceFilter}km` : 'No limit'}
                      </Text>
                      <Switch
                        size="sm"
                        colorScheme="brand"
                        isChecked={distanceEnabled}
                        onChange={(e) => handleDistanceToggle(e.target.checked)}
                      />
                    </HStack>
                  </HStack>
                  <Slider
                    value={distanceFilter}
                    onChange={handleDistanceChange}
                    min={1}
                    max={100}
                    step={1}
                    colorScheme="brand"
                    isDisabled={!distanceEnabled}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <HStack justify="space-between" fontSize="xs" color="gray.500" mt={1}>
                    <Text>1km</Text>
                    <Text>100km</Text>
                  </HStack>
                </Box>

                {/* Show Completed Toggle */}
                <FormControl display="flex" alignItems="center">
                  <FormLabel fontSize="sm" mb="0" flex={1}>
                    Show completed campaigns
                  </FormLabel>
                  <Switch
                    colorScheme="brand"
                    isChecked={showCompleted}
                    onChange={(e) => handleCompletedToggle(e.target.checked)}
                  />
                </FormControl>

                {/* Clear Filters */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearFilters}
                  colorScheme="gray"
                >
                  Clear All Filters
                </Button>

                {/* Filter Summary */}
                {(filters.enableDistanceFilter || filters.showCompleted || filters.priority) && (
                  <Box p={2} bg="brand.50" borderRadius="md" fontSize="sm">
                    <Text color="brand.700" fontWeight="medium">
                      Active Filters:
                    </Text>
                    <VStack align="start" spacing={1} mt={1}>
                      {filters.enableDistanceFilter && (
                        <Text color="brand.600" fontSize="xs">
                          • Within {filters.maxDistance}km
                        </Text>
                      )}
                      {filters.showCompleted && (
                        <Text color="brand.600" fontSize="xs">
                          • Including completed
                        </Text>
                      )}
                      {filters.priority && (
                        <Text color="brand.600" fontSize="xs">
                          • {filters.priority} priority only
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </VStack>
    </Box>
  );
};

export default MapControls;