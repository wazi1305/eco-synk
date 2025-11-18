import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Button,
  Badge,
  Avatar,
  Progress,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Icon,
  Divider,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiClock,
  FiStar,
  FiShare2,
  FiMessageCircle,
  FiCheckCircle,
  FiTool,
  FiTruck,
  FiCamera,
  FiHeart,
  FiTarget,
  FiAward,
  FiSun,
  FiCloud,
  FiUmbrella,
  FiAlertTriangle,
  FiPhone,
  FiNavigation,
  FiDownload,
  FiPlusCircle,
  FiCheck,
} from 'react-icons/fi';
import { WiDaySunny, WiCloudy, WiRain, WiThunderstorm, WiSnow, WiFog } from 'react-icons/wi';
import { getCurrentWeather, getWeatherRecommendation, parseLocationCoordinates } from '../../services/weatherService';

const JoinCampaignModal = ({ isOpen, onClose, campaign }) => {
  const [selectedRole, setSelectedRole] = useState('volunteer');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // Fetch real weather data
  useEffect(() => {
    const fetchWeather = async () => {
      if (isOpen && campaign) {
        setLoadingWeather(true);
        try {
          const coords = parseLocationCoordinates(campaign.location);
          const weather = await getCurrentWeather(coords.lat, coords.lon);
          
          // Map weather condition to icon
          const iconMap = {
            'Clear': WiDaySunny,
            'Clouds': WiCloudy,
            'Rain': WiRain,
            'Drizzle': WiRain,
            'Thunderstorm': WiThunderstorm,
            'Snow': WiSnow,
            'Mist': WiFog,
            'Fog': WiFog,
            'Haze': WiCloudy
          };
          
          setWeatherData({
            ...weather,
            icon: iconMap[weather.condition] || WiCloudy,
            recommendation: getWeatherRecommendation(weather)
          });
        } catch (error) {
          console.error('Error fetching weather:', error);
          setWeatherData({
            error: true,
            errorMessage: error.message || 'Failed to load weather data'
          });
          setLoadingWeather(false);
        }
      }
    };
    
    fetchWeather();
  }, [isOpen, campaign]);

  // Difficulty levels
  const difficultyLevels = {
    easy: { 
      color: 'green', 
      label: 'Easy', 
      description: 'Light cleanup, suitable for all ages',
      requirements: 'Basic mobility, can walk on uneven ground'
    },
    moderate: { 
      color: 'yellow', 
      label: 'Moderate', 
      description: 'Some physical activity required',
      requirements: 'Good fitness level, may involve lifting objects up to 25 lbs'
    },
    difficult: { 
      color: 'red', 
      label: 'Difficult', 
      description: 'Demanding physical work',
      requirements: 'Excellent fitness, heavy lifting up to 50+ lbs required'
    }
  };

  // Preparation checklist items
  const checklistItems = [
    { id: 'gloves', label: 'Work gloves', required: true, category: 'safety' },
    { id: 'shoes', label: 'Closed-toe shoes', required: true, category: 'safety' },
    { id: 'water', label: 'Water bottle (1L minimum)', required: true, category: 'hydration' },
    { id: 'sunscreen', label: 'Sunscreen (SPF 30+)', required: false, category: 'protection' },
    { id: 'hat', label: 'Hat or cap', required: false, category: 'protection' },
    { id: 'snacks', label: 'Energy snacks', required: false, category: 'nutrition' },
    { id: 'firstaid', label: 'Personal first aid kit', required: false, category: 'safety' },
    { id: 'phone', label: 'Fully charged phone', required: true, category: 'communication' },
  ];

  // Calculate points multiplier
  const getPointsMultiplier = () => {
    let multiplier = 1;
    const difficulty = campaign?.difficulty || 'easy';
    if (difficulty === 'moderate') multiplier += 0.5;
    if (difficulty === 'difficult') multiplier += 1;
    if (campaign?.duration === 'Full Day') multiplier += 0.5;
    return multiplier;
  };

  const handleRSVP = () => {
    setRsvpConfirmed(true);
    
    toast({
      title: "RSVP Confirmed! 🎉",
      description: "Event added to your calendar. Check your email for updates.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
  };

  if (!campaign) return null;

  const difficulty = difficultyLevels[campaign.difficulty || 'easy'];
  const pointsMultiplier = getPointsMultiplier();
  const basePoints = campaign.esgImpact?.itemsCollected || 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent maxH="90vh" bg="neutral.800" borderColor="neutral.700" border="1px solid">
        <ModalHeader pb={2} bg="neutral.900" borderTopRadius="md">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="brand.500" fontWeight="700">{campaign.title}</Heading>
              <HStack spacing={4}>
                <Badge 
                  bg="rgba(47, 212, 99, 0.1)"
                  color="brand.500"
                  border="1px solid"
                  borderColor="brand.500"
                  fontSize="sm"
                >
                  {difficulty.label} Level
                </Badge>
                <Badge bg="rgba(159, 122, 234, 0.1)" color="purple.400" border="1px solid" borderColor="purple.500">
                  +{Math.round(basePoints * pointsMultiplier)} Points (x{pointsMultiplier})
                </Badge>
                <HStack spacing={1} color="neutral.400">
                  <Icon as={FiMapPin} boxSize={4} />
                  <Text fontSize="sm">{campaign.location?.address}</Text>
                </HStack>
              </HStack>
            </VStack>
            {rsvpConfirmed && (
              <Badge bg="rgba(72, 187, 120, 0.2)" color="green.400" border="1px solid" borderColor="green.500" p={2}>
                <Icon as={FiCheck} mr={1} />
                RSVP Confirmed
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="neutral.400" _hover={{ bg: 'neutral.700', color: 'neutral.50' }} />
        
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab} size="sm">
            <TabList mb={4} flexWrap="wrap" borderBottomColor="neutral.700">
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Overview</Tab>
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Requirements</Tab>
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Preparation</Tab>
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Location & Weather</Tab>
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Safety</Tab>
              <Tab color="neutral.400" _selected={{ color: 'brand.500', borderColor: 'brand.500' }}>Community</Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Campaign Image & Stats */}
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6}>
                    <Box>
                      <Box
                        bgGradient={campaign.heroImage ? undefined : "linear(to-br, brand.400, brand.600)"}
                        h="200px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="6xl"
                        color="white"
                        borderRadius="lg"
                        position="relative"
                        overflow="hidden"
                      >
                        {campaign.heroImage ? (
                          <Image
                            src={campaign.heroImage}
                            alt={`${campaign.title} banner`}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                          />
                        ) : (
                          campaign.image
                        )}
                      </Box>
                    </Box>
                    
                    <VStack spacing={4} align="stretch">
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Stat>
                          <StatLabel fontSize="xs" color="neutral.400">Volunteers</StatLabel>
                          <StatNumber fontSize="lg" color="neutral.50" fontWeight="700">{campaign.volunteers?.length || 0}</StatNumber>
                          <StatHelpText>
                            <Text color="green.400">+5 this week</Text>
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel fontSize="xs" color="neutral.400">Spots Left</StatLabel>
                          <StatNumber fontSize="lg" color="orange.400" fontWeight="700">
                            {campaign.volunteerGoal - (campaign.volunteers?.length || 0)}
                          </StatNumber>
                          <StatHelpText>
                            <Text color="red.400">Filling fast</Text>
                          </StatHelpText>
                        </Stat>
                      </Grid>
                      
                      <Box p={4} bg="rgba(47, 212, 99, 0.1)" borderRadius="12px" border="1px" borderColor="brand.500">
                        <VStack spacing={2}>
                          <Icon as={FiAward} color="brand.500" boxSize={6} />
                          <Text fontWeight="600" color="brand.500" textAlign="center">
                            Earn {Math.round(basePoints * pointsMultiplier)} EcoPoints
                          </Text>
                          <Text fontSize="xs" color="neutral.400" textAlign="center">
                            {pointsMultiplier > 1 ? `${pointsMultiplier}x bonus for difficulty!` : 'Base reward'}
                          </Text>
                        </VStack>
                      </Box>
                    </VStack>
                  </Grid>

                  {/* Progress & Description */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="600" color="neutral.50">Volunteer Progress</Text>
                      <Text fontSize="sm" color="neutral.400" fontWeight="700">
                        {Math.round(((campaign.volunteers?.length || 0) / campaign.volunteerGoal) * 100)}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={((campaign.volunteers?.length || 0) / campaign.volunteerGoal) * 100} 
                      borderRadius="full"
                      bg="neutral.700"
                      sx={{
                        '& > div': {
                          bg: 'brand.500',
                          boxShadow: '0 0 10px rgba(47, 212, 99, 0.4)'
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Heading size="sm" mb={2} color="neutral.50" fontWeight="700">About This Campaign</Heading>
                    <Text color="neutral.300" lineHeight="1.6">
                      {campaign.description || 'Join us in making a real environmental impact! This campaign focuses on cleaning up local waterways and restoring natural habitats. We\'ll be working together to remove debris, plant native vegetation, and educate the community about sustainable practices. Your participation helps create lasting change for future generations.'}
                    </Text>
                  </Box>

                  {/* Organizer */}
                  <Box p={4} bg="neutral.700" borderRadius="12px" border="1px solid" borderColor="neutral.600">
                    <HStack spacing={4}>
                      <Avatar 
                        size="lg" 
                        name={campaign.organizer?.name}
                        bg="rgba(47, 212, 99, 0.1)"
                        border="2px solid"
                        borderColor="brand.500"
                        color="brand.500"
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="600" color="neutral.50">{campaign.organizer?.name}</Text>
                        <Text fontSize="sm" color="neutral.400">Campaign Organizer</Text>
                        <HStack color="neutral.300">
                          <Icon as={FiStar} color="yellow.400" />
                          <Text fontSize="sm">4.8 • Organized 12 campaigns</Text>
                        </HStack>
                      </VStack>
                      <Button 
                        size="sm" 
                        variant="outline"
                        borderColor="neutral.600"
                        color="neutral.200"
                        _hover={{ bg: 'neutral.600', borderColor: 'brand.500', color: 'brand.500' }}
                      >
                        <Icon as={FiMessageCircle} mr={2} />
                        Message
                      </Button>
                    </HStack>
                  </Box>

                  {/* RSVP Section */}
                  {!rsvpConfirmed && (
                    <Alert status="info" borderRadius="12px" bg="rgba(66, 153, 225, 0.1)" border="1px solid" borderColor="blue.500">
                      <AlertIcon color="blue.400" />
                      <Box flex={1}>
                        <AlertTitle fontSize="sm" color="neutral.50">Ready to join?</AlertTitle>
                        <AlertDescription fontSize="sm" color="neutral.300">
                          Complete your RSVP to secure your spot and receive updates.
                        </AlertDescription>
                      </Box>
                      <Button 
                        size="sm" 
                        bg="blue.500"
                        color="white"
                        _hover={{ bg: 'blue.600' }}
                        onClick={handleRSVP}
                      >
                        RSVP Now
                      </Button>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Requirements Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Difficulty Rating */}
                  <Box p={6} bg="rgba(47, 212, 99, 0.08)" borderRadius="12px" border="2px" borderColor="brand.500">
                    <VStack spacing={3}>
                      <Badge bg="brand.500" color="neutral.900" fontSize="md" p={2}>
                        {difficulty.label} Difficulty
                      </Badge>
                      <Text fontSize="lg" fontWeight="600" textAlign="center" color="neutral.50">
                        {difficulty.description}
                      </Text>
                      <Text fontSize="sm" color="neutral.400" textAlign="center">
                        {difficulty.requirements}
                      </Text>
                    </VStack>
                  </Box>

                  {/* Participation Options */}
                  <Box>
                    <Heading size="sm" mb={4} color="neutral.50" fontWeight="700">How would you like to participate?</Heading>
                    <RadioGroup value={selectedRole} onChange={setSelectedRole}>
                      <VStack spacing={4} align="stretch">
                        <Box p={4} border="2px" borderColor={selectedRole === 'volunteer' ? 'brand.500' : 'neutral.700'} borderRadius="lg" bg={selectedRole === 'volunteer' ? 'rgba(47,212,99,0.08)' : 'neutral.700'} transition="all 0.2s">
                          <Radio value="volunteer" size="lg" colorScheme="brand">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="700" color="neutral.50">Volunteer (+{Math.round(basePoints * pointsMultiplier)} points)</Text>
                              <Text fontSize="sm" color="neutral.300">Join hands-on cleanup activities</Text>
                              <HStack color="neutral.400">
                                <Icon as={FiClock} boxSize={3} />
                                <Text fontSize="xs">Full day commitment</Text>
                              </HStack>
                            </VStack>
                          </Radio>
                        </Box>
                        
                        <Box p={4} border="2px" borderColor={selectedRole === 'supporter' ? 'brand.500' : 'neutral.700'} borderRadius="lg" bg={selectedRole === 'supporter' ? 'rgba(47,212,99,0.08)' : 'neutral.700'} transition="all 0.2s">
                          <Radio value="supporter" size="lg" colorScheme="brand">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="700" color="neutral.50">Supporter (+{Math.round(basePoints * 0.5)} points)</Text>
                              <Text fontSize="sm" color="neutral.300">Provide financial support for supplies</Text>
                              <HStack color="neutral.400">
                                <Icon as={FiHeart} boxSize={3} />
                                <Text fontSize="xs">Any amount helps</Text>
                              </HStack>
                            </VStack>
                          </Radio>
                        </Box>
                        
                        <Box p={4} border="2px" borderColor={selectedRole === 'ambassador' ? 'brand.500' : 'neutral.700'} borderRadius="lg" bg={selectedRole === 'ambassador' ? 'rgba(47,212,99,0.08)' : 'neutral.700'} transition="all 0.2s">
                          <Radio value="ambassador" size="lg" colorScheme="brand">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="700" color="neutral.50">Ambassador (+{Math.round(basePoints * 0.8)} points)</Text>
                              <Text fontSize="sm" color="neutral.300">Help spread awareness and recruit others</Text>
                              <HStack color="neutral.400">
                                <Icon as={FiShare2} boxSize={3} />
                                <Text fontSize="xs">Social media & outreach</Text>
                              </HStack>
                            </VStack>
                          </Radio>
                        </Box>
                      </VStack>
                    </RadioGroup>
                  </Box>

                  {/* Group Registration */}
                  <Box>
                    <Heading size="sm" mb={3} color="neutral.50" fontWeight="700">Bringing others?</Heading>
                    <HStack spacing={4}>
                      <Text fontSize="sm" color="neutral.300">Number of people:</Text>
                      <NumberInput 
                        value={attendeeCount} 
                        onChange={(value) => setAttendeeCount(Number(value) || 1)}
                        min={1} 
                        max={5} 
                        size="sm"
                        width="100px"
                      >
                        <NumberInputField bg="neutral.700" border="1px solid" borderColor="neutral.600" color="neutral.50" _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }} />
                        <NumberInputStepper>
                          <NumberIncrementStepper borderColor="neutral.600" color="neutral.400" _hover={{ color: 'brand.500' }} />
                          <NumberDecrementStepper borderColor="neutral.600" color="neutral.400" _hover={{ color: 'brand.500' }} />
                        </NumberInputStepper>
                      </NumberInput>
                      {attendeeCount > 1 && (
                        <Text fontSize="sm" color="brand.500" fontWeight="600">
                          +{Math.round((attendeeCount - 1) * basePoints * 0.3)} bonus points for group participation!
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Preparation Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="sm" color="neutral.50" fontWeight="700">Preparation Checklist</Heading>
                      <Text fontSize="sm" color="neutral.400">
                        {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} completed
                      </Text>
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">
                      {checklistItems.map((item) => (
                        <Box 
                          key={item.id} 
                          p={3} 
                          border="1px" 
                          borderColor={item.required ? "orange.500" : "neutral.700"} 
                          borderRadius="md"
                          bg={checklist[item.id] ? "rgba(47,212,99,0.1)" : "neutral.700"}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Checkbox
                                isChecked={checklist[item.id] || false}
                                onChange={(e) => setChecklist({...checklist, [item.id]: e.target.checked})}
                                colorScheme="brand"
                                size="lg"
                              />
                              <VStack align="start" spacing={0}>
                                <HStack>
                                  <Text fontWeight="700" color="neutral.50">{item.label}</Text>
                                  {item.required && <Badge bg="rgba(237,137,54,0.1)" color="orange.400" border="1px solid" borderColor="orange.500" size="sm">Required</Badge>}
                                </HStack>
                                <Text fontSize="xs" color="neutral.400" textTransform="capitalize">{item.category}</Text>
                              </VStack>
                            </HStack>
                            {checklist[item.id] && <Icon as={FiCheck} color="brand.500" />}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  <Alert status="info" borderRadius="lg" bg="rgba(66,153,225,0.1)" border="1px solid" borderColor="blue.500">
                    <AlertIcon color="blue.400" />
                    <Box>
                      <AlertTitle fontSize="sm" color="neutral.50">Smart Recommendation</AlertTitle>
                      <AlertDescription fontSize="sm" color="neutral.300">
                        Based on the weather forecast, we recommend bringing extra sunscreen and staying hydrated!
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <Button 
                    variant="outline" 
                    leftIcon={<Icon as={FiDownload} />}
                    size="sm"
                    borderColor="neutral.600"
                    color="neutral.200"
                    _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
                  >
                    Download Preparation Guide (PDF)
                  </Button>
                </VStack>
              </TabPanel>

              {/* Location & Weather Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Meeting Point */}
                  <Box>
                    <Heading size="sm" mb={4} color="neutral.50" fontWeight="700">Meeting Point & Schedule</Heading>
                    <Box p={4} border="1px" borderColor="neutral.700" borderRadius="lg" bg="neutral.700">
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiMapPin} color="brand.500" boxSize={5} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="700" color="neutral.50">{campaign.location?.address || 'Jumeirah Beach Park Entrance'}</Text>
                            <Text fontSize="sm" color="neutral.300">Near Dubai Marina, Dubai</Text>
                            <Text fontSize="xs" color="blue.400">GPS: 25.2318, 55.2592</Text>
                          </VStack>
                        </HStack>
                        
                        <Divider borderColor="neutral.600" />
                        
                        <VStack spacing={2} align="stretch">
                          <Text fontWeight="700" fontSize="sm" color="neutral.50">Schedule:</Text>
                          <VStack spacing={1} align="stretch" fontSize="sm">
                            <HStack justify="space-between">
                              <Text color="neutral.200">Check-in & Welcome</Text>
                              <Text color="neutral.400">6:30 - 7:00 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color="neutral.200">Safety Briefing</Text>
                              <Text color="neutral.400">7:00 - 7:30 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color="neutral.200">Cleanup Activities</Text>
                              <Text color="neutral.400">7:30 - 11:30 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text color="neutral.200">Wrap-up & Recognition</Text>
                              <Text color="neutral.400">11:30 - 12:00 PM</Text>
                            </HStack>
                          </VStack>
                        </VStack>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          leftIcon={<Icon as={FiNavigation} />}
                          borderColor="neutral.600"
                          color="neutral.200"
                          _hover={{ bg: 'neutral.600', borderColor: 'brand.500', color: 'brand.500' }}
                          onClick={() => {
                            const coords = parseLocationCoordinates(campaign.location);
                            const address = campaign.location?.address || 'Campaign Location';
                            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}&destination_place_id=${encodeURIComponent(address)}`;
                            window.open(mapsUrl, '_blank');
                          }}
                        >
                          Get Directions
                        </Button>
                      </VStack>
                    </Box>
                  </Box>

                  {/* Weather Forecast */}
                  <Box>
                    <Heading size="sm" mb={3} color="neutral.50" fontWeight="700">Weather Forecast</Heading>
                    {loadingWeather ? (
                      <HStack spacing={3} p={4} justify="center">
                        <Spinner size="sm" color="brand.500" />
                        <Text fontSize="sm" color="neutral.300">Loading weather data...</Text>
                      </HStack>
                    ) : weatherData?.error ? (
                      <Alert status="error" borderRadius="lg" bg="rgba(245,101,101,0.1)" border="1px solid" borderColor="red.500">
                        <AlertIcon color="red.400" />
                        <Box flex={1}>
                          <AlertTitle fontSize="sm" color="neutral.50">Weather Data Unavailable</AlertTitle>
                          <AlertDescription fontSize="sm" color="neutral.300">
                            {weatherData.errorMessage}
                          </AlertDescription>
                        </Box>
                      </Alert>
                    ) : weatherData ? (
                      <Box p={4} border="1px" borderColor="neutral.700" borderRadius="lg" bg="neutral.700">
                        <Grid templateColumns="1fr 2fr" gap={4}>
                          <VStack spacing={3}>
                            <Icon as={weatherData.icon} boxSize={12} color="orange.400" />
                            <VStack spacing={0}>
                              <Text fontSize="2xl" fontWeight="700" color="neutral.50">{weatherData.temperature}°C</Text>
                              <Text fontSize="sm" color="neutral.400" textTransform="capitalize">{weatherData.description || weatherData.condition}</Text>
                              {weatherData.feelsLike && weatherData.feelsLike !== weatherData.temperature && (
                                <Text fontSize="xs" color="neutral.500">Feels like {weatherData.feelsLike}°C</Text>
                              )}
                            </VStack>
                          </VStack>
                          
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <HStack spacing={2} color="neutral.400">
                                <Icon as={FiUmbrella} boxSize={4} />
                                <Text fontSize="sm">Rain Chance</Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="700" color="neutral.50">{weatherData.precipitation}%</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <HStack spacing={2} color="neutral.400">
                                <Icon as={FiCloud} boxSize={4} />
                                <Text fontSize="sm">Wind Speed</Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="700" color="neutral.50">{weatherData.windSpeed} km/h</Text>
                            </HStack>
                            {weatherData.humidity && (
                              <HStack justify="space-between">
                                <HStack spacing={2} color="neutral.400">
                                  <Text fontSize="sm">💧 Humidity</Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="700" color="neutral.50">{weatherData.humidity}%</Text>
                              </HStack>
                            )}
                            <Alert 
                              status={weatherData.precipitation > 60 ? "warning" : "success"} 
                              borderRadius="md" 
                              p={2} 
                              bg={weatherData.precipitation > 60 ? "rgba(237,137,54,0.1)" : "rgba(72,187,120,0.1)"} 
                              border="1px solid" 
                              borderColor={weatherData.precipitation > 60 ? "orange.500" : "green.500"}
                            >
                              <AlertIcon boxSize={4} color={weatherData.precipitation > 60 ? "orange.400" : "green.400"} />
                              <Text fontSize="sm" color="neutral.300">{weatherData.recommendation}</Text>
                            </Alert>
                          </VStack>
                        </Grid>
                      </Box>
                    ) : (
                      <Box p={4} border="1px" borderColor="neutral.700" borderRadius="lg" bg="neutral.700">
                        <Text fontSize="sm" color="neutral.400" textAlign="center">Weather data unavailable</Text>
                      </Box>
                    )}
                  </Box>

                  {/* Transportation */}
                  <Box>
                    <Heading size="sm" mb={3} color="neutral.50" fontWeight="700">Transportation Options</Heading>
                    <VStack spacing={3} align="stretch">
                      <Box p={3} border="1px" borderColor="neutral.700" borderRadius="md" bg="neutral.700">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Icon as={FiTruck} color="brand.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="700" fontSize="sm" color="neutral.50">Metro & Parking Available</Text>
                              <Text fontSize="xs" color="neutral.400">Dubai Metro Red Line + paid parking</Text>
                            </VStack>
                          </HStack>
                          <Text fontSize="xs" color="brand.500" fontWeight="600">Recommended</Text>
                        </HStack>
                      </Box>
                      
                      <Box p={3} border="1px" borderColor="neutral.700" borderRadius="md" bg="neutral.700">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Icon as={FiUsers} color="blue.400" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="700" fontSize="sm" color="neutral.50">Carpool Available</Text>
                              <Text fontSize="xs" color="neutral.400">3 volunteers offering rides</Text>
                            </VStack>
                          </HStack>
                          <Button size="xs" variant="outline" borderColor="neutral.600" color="neutral.200" _hover={{ bg: 'neutral.600', borderColor: 'brand.500', color: 'brand.500' }}>Join</Button>
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Safety Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Emergency Information */}
                  <Alert status="warning" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Emergency Protocols</AlertTitle>
                      <AlertDescription fontSize="sm">
                        Trained first aid volunteers will be on-site. In case of emergency, locate the nearest volunteer with a red safety vest.
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box p={4} border="1px" borderColor="red.500" borderRadius="lg" bg="rgba(245,101,101,0.1)">
                      <VStack spacing={2}>
                        <Icon as={FiPhone} color="red.400" boxSize={6} />
                        <Text fontWeight="700" fontSize="sm" color="neutral.50">Emergency Contacts</Text>
                        <VStack spacing={1} fontSize="xs" color="neutral.300">
                          <Text>Event Organizer: +971 50 123 4567</Text>
                          <Text>Emergency Services: 999</Text>
                          <Text>Dubai Municipality: +971 4 206 5555</Text>
                        </VStack>
                      </VStack>
                    </Box>
                    
                    <Box p={4} border="1px" borderColor="blue.500" borderRadius="lg" bg="rgba(66,153,225,0.1)">
                      <VStack spacing={2}>
                        <Icon as={FiAlertTriangle} color="blue.400" boxSize={6} />
                        <Text fontWeight="700" fontSize="sm" color="neutral.50">Safety Guidelines</Text>
                        <VStack spacing={1} fontSize="xs" align="start" color="neutral.300">
                          <Text>• Stay hydrated - drink water every 30 minutes</Text>
                          <Text>• Use proper lifting techniques</Text>
                          <Text>• Report any hazardous materials</Text>
                          <Text>• Stay within designated work areas</Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </Grid>

                  <Box>
                    <Heading size="sm" mb={3} color="neutral.50" fontWeight="700">Health & Accessibility</Heading>
                    <VStack spacing={3} align="stretch">
                      <Alert status="info" borderRadius="md" bg="rgba(66,153,225,0.1)" border="1px solid" borderColor="blue.500">
                        <AlertIcon color="blue.400" />
                        <Text fontSize="sm" color="neutral.300">
                          This event involves outdoor work on uneven terrain. Please inform organizers of any medical conditions or mobility requirements.
                        </Text>
                      </Alert>
                      
                      <Box p={3} bg="neutral.700" borderRadius="md" border="1px solid" borderColor="neutral.600">
                        <Text fontSize="sm" fontWeight="700" mb={2} color="neutral.50">Accessibility Information:</Text>
                        <VStack spacing={1} align="start" fontSize="sm">
                          <HStack>
                            <Icon as={FiCheckCircle} color="brand.500" boxSize={4} />
                            <Text color="neutral.200">Accessible parking available</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="brand.500" boxSize={4} />
                            <Text color="neutral.200">Accessible restroom facilities</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiAlertTriangle} color="orange.400" boxSize={4} />
                            <Text color="neutral.200">Some areas may not be wheelchair accessible</Text>
                          </HStack>
                        </VStack>
                      </Box>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Community Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Current Participants */}
                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm" color="neutral.50" fontWeight="700">Current Participants ({campaign.volunteers?.length || 0})</Heading>
                      <Button size="sm" variant="ghost" color="neutral.400" _hover={{ bg: 'neutral.700', color: 'brand.500' }}>
                        <Icon as={FiUsers} mr={2} />
                        View All
                      </Button>
                    </HStack>
                    <VStack spacing={3} align="stretch">
                      {(campaign.volunteers || []).slice(0, 4).map((volunteer, i) => (
                        <HStack key={i} p={3} bg="neutral.700" borderRadius="md" border="1px solid" borderColor="neutral.600">
                          <Avatar size="sm" name={volunteer.name} bg="rgba(47,212,99,0.1)" color="brand.500" border="2px solid" borderColor="brand.500" />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="700" fontSize="sm" color="neutral.50">{volunteer.name}</Text>
                            <Text fontSize="xs" color="neutral.400">Volunteer • Joined 3 days ago</Text>
                          </VStack>
                          <Badge size="sm" bg="rgba(72,187,120,0.1)" color="green.400" border="1px solid" borderColor="green.500">Active</Badge>
                        </HStack>
                      ))}
                      {(campaign.volunteers || []).length === 0 && (
                        <Text fontSize="sm" color="neutral.400" textAlign="center" py={4}>
                          Be the first to join this campaign!
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  {/* Teams */}
                  <Box>
                    <Heading size="sm" mb={3}>Join a Team</Heading>
                    <VStack spacing={3}>
                      <Box p={4} border="1px" borderColor="gray.200" borderRadius="lg" w="full">
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">Waterfront Warriors</Text>
                            <Text fontSize="sm" color="gray.600">Focus on river cleanup • 8 members</Text>
                          </VStack>
                          <Button size="sm" colorScheme="brand">Join Team</Button>
                        </HStack>
                      </Box>
                      <Box p={4} border="1px" borderColor="gray.200" borderRadius="lg" w="full">
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">Green Ambassadors</Text>
                            <Text fontSize="sm" color="gray.600">Education & outreach • 12 members</Text>
                          </VStack>
                          <Button size="sm" colorScheme="brand">Join Team</Button>
                        </HStack>
                      </Box>
                      <Button variant="outline" w="full">
                        <Icon as={FiUsers} mr={2} />
                        Create New Team
                      </Button>
                    </VStack>
                  </Box>

                  {/* Recent Activity */}
                  <Box>
                    <Heading size="sm" mb={3}>Recent Activity</Heading>
                    <VStack spacing={3} align="stretch">
                      {[
                        { user: "Sarah M.", action: "shared photos from site visit", time: "2h ago" },
                        { user: "Mike K.", action: "joined the campaign", time: "5h ago" },
                        { user: "Team Leaders", action: "posted equipment checklist", time: "1d ago" },
                      ].map((activity, i) => (
                        <HStack key={i} spacing={3}>
                          <Avatar size="xs" src={`https://i.pravatar.cc/32?img=${i + 20}`} />
                          <Text fontSize="sm" flex={1}>
                            <Text as="span" fontWeight="semibold">{activity.user}</Text> {activity.action}
                          </Text>
                          <Text fontSize="xs" color="gray.500">{activity.time}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter bg="neutral.900" borderTop="1px solid" borderColor="neutral.700">
          <VStack spacing={3} w="full">
            {rsvpConfirmed ? (
              <Alert status="success" borderRadius="md" w="full" bg="rgba(72,187,120,0.1)" border="1px solid" borderColor="green.500">
                <AlertIcon color="green.400" />
                <Box flex={1}>
                  <AlertTitle fontSize="sm" color="neutral.50">You're all set!</AlertTitle>
                  <AlertDescription fontSize="sm" color="neutral.300">
                    Event details sent to your email. See you there! 🌱
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Alert status="info" borderRadius="md" w="full" bg="rgba(66,153,225,0.1)" border="1px solid" borderColor="blue.500">
                <AlertIcon color="blue.400" />
                <Text fontSize="sm" color="neutral.300">
                  Complete your RSVP to join this campaign and start earning EcoPoints!
                </Text>
              </Alert>
            )}
            
            <HStack spacing={3} w="full">
              <Button variant="ghost" onClick={onClose} color="neutral.400" _hover={{ bg: 'neutral.700', color: 'neutral.50' }}>
                {rsvpConfirmed ? 'Close' : 'Cancel'}
              </Button>
              
              {!rsvpConfirmed ? (
                <Button 
                  bg="brand.500"
                  color="neutral.900"
                  flex={1}
                  onClick={handleRSVP}
                  leftIcon={<Icon as={FiCheckCircle} />}
                  _hover={{ bg: 'brand.600', boxShadow: '0 0 15px rgba(47,212,99,0.5)' }}
                  fontWeight="700"
                >
                  Complete RSVP
                </Button>
              ) : (
                <Button 
                  bg="brand.500"
                  color="neutral.900"
                  flex={1}
                  leftIcon={<Icon as={FiCalendar} />}
                  _hover={{ bg: 'brand.600', boxShadow: '0 0 15px rgba(47,212,99,0.5)' }}
                  fontWeight="700"
                >
                  Add to Calendar
                </Button>
              )}
              
              <Button 
                variant="outline"
                leftIcon={<Icon as={FiShare2} />}
                borderColor="neutral.600"
                color="neutral.200"
                _hover={{ bg: 'neutral.700', borderColor: 'brand.500', color: 'brand.500' }}
              >
                Share
              </Button>
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default JoinCampaignModal;