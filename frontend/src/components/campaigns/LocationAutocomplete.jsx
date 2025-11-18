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
    console.log('Searching for:', query);
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=ae,us,gb,ca,au,in`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'EcoSynk/1.0 (ecosynk.com)'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        
        if (data && data.length > 0) {
          const formattedSuggestions = data
            .map(item => ({
              id: item.place_id,
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              address: formatAddress(item.address) || item.display_name,
              raw: item
            }))
            .map(item => ({
              ...item,
              score: calculateRelevanceScore(query, item)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          
          console.log('Ranked suggestions:', formattedSuggestions);
          setSuggestions(formattedSuggestions);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          console.log('No results found');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRelevanceScore = (query, item) => {
    const q = query.toLowerCase();
    const address = item.address.toLowerCase();
    const displayName = item.display_name.toLowerCase();
    const raw = item.raw;
    
    let score = 0;
    
    // Exact match at start gets highest score
    if (address.startsWith(q) || displayName.startsWith(q)) score += 100;
    
    // City/town name matches
    const city = raw.address?.city?.toLowerCase() || raw.address?.town?.toLowerCase() || '';
    if (city.startsWith(q)) score += 80;
    if (city.includes(q)) score += 40;
    
    // Country matches (for popular places)
    const country = raw.address?.country?.toLowerCase() || '';
    if (country.startsWith(q)) score += 60;
    
    // State/region matches
    const state = raw.address?.state?.toLowerCase() || '';
    if (state.startsWith(q)) score += 50;
    
    // General word match in display name
    if (displayName.includes(q)) score += 20;
    
    // Boost major cities
    const majorCities = ['dubai', 'new york', 'london', 'paris', 'tokyo', 'sydney', 'toronto', 'mumbai'];
    if (majorCities.some(city => address.includes(city) || displayName.includes(city))) {
      score += 30;
    }
    
    // Penalize very long addresses (usually less relevant)
    if (displayName.length > 100) score -= 10;
    
    // Boost if it's a place type we want (city, town, etc.)
    const placeType = raw.type || '';
    if (['city', 'town', 'village', 'administrative'].includes(placeType)) {
      score += 25;
    }
    
    return score;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [];
    
    // Add city/town first for better readability
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    }
    
    // Add state/emirate
    if (address.state) {
      parts.push(address.state);
    }
    
    // Add country
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : '';
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