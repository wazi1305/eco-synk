import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect, 
  placeholder = "Enter location...",
  ...props 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EcoSynk/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const formattedSuggestions = data.map(item => ({
          id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: formatAddress(item.address)
        }));
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [];
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.address || suggestion.display_name);
    onLocationSelect({
      lat: suggestion.lat,
      lon: suggestion.lon,
      address: suggestion.address || suggestion.display_name
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Box position="relative" {...props}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          maxH="200px"
          overflowY="auto"
          mt={1}
        >
          {isLoading ? (
            <Box p={3} textAlign="center">
              <Spinner size="sm" mr={2} />
              <Text fontSize="sm" color="gray.500">Searching...</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {suggestions.map((suggestion, index) => (
                <Box
                  key={suggestion.id}
                  p={3}
                  cursor="pointer"
                  bg={index === selectedIndex ? hoverBg : 'transparent'}
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  borderBottom={index < suggestions.length - 1 ? "1px solid" : "none"}
                  borderColor={borderColor}
                >
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {suggestion.address || suggestion.display_name}
                  </Text>
                  {suggestion.address && suggestion.address !== suggestion.display_name && (
                    <Text fontSize="xs" color="gray.500" noOfLines={1} mt={1}>
                      {suggestion.display_name}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LocationAutocomplete;