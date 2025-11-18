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

const JoinCampaignModal = ({ isOpen, onClose, campaign }) => {
  const [selectedRole, setSelectedRole] = useState('volunteer');
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  // Simulate weather data fetch
  useEffect(() => {
    if (isOpen && campaign) {
      setTimeout(() => {
        setWeatherData({
          temperature: 28,
          condition: 'Sunny',
          icon: FiSun,
          precipitation: 5,
          windSpeed: 12,
          recommendation: 'Perfect weather for outdoor activities! Stay hydrated.'
        });
        setLoadingWeather(false);
      }, 1000);
    }
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
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent maxH="90vh">
        <ModalHeader pb={2}>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="brand.600">{campaign.title}</Heading>
              <HStack spacing={4}>
                <Badge 
                  colorScheme={difficulty.color} 
                  variant="subtle" 
                  fontSize="sm"
                >
                  {difficulty.label} Level
                </Badge>
                <Badge colorScheme="purple" variant="outline">
                  +{Math.round(basePoints * pointsMultiplier)} Points (x{pointsMultiplier})
                </Badge>
                <HStack spacing={1} color="gray.600">
                  <Icon as={FiMapPin} boxSize={4} />
                  <Text fontSize="sm">{campaign.location?.address}</Text>
                </HStack>
              </HStack>
            </VStack>
            {rsvpConfirmed && (
              <Badge colorScheme="green" variant="solid" p={2}>
                <Icon as={FiCheck} mr={1} />
                RSVP Confirmed
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" size="sm">
            <TabList mb={4} flexWrap="wrap">
              <Tab>Overview</Tab>
              <Tab>Requirements</Tab>
              <Tab>Preparation</Tab>
              <Tab>Location & Weather</Tab>
              <Tab>Safety</Tab>
              <Tab>Community</Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  {/* Campaign Image & Stats */}
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6}>
                    <Box>
                      <Box
                        bgGradient="linear(to-br, brand.400, brand.600)"
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
                        {campaign.image}
                      </Box>
                    </Box>
                    
                    <VStack spacing={4} align="stretch">
                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <Stat>
                          <StatLabel fontSize="xs">Volunteers</StatLabel>
                          <StatNumber fontSize="lg">{campaign.volunteers?.length || 0}</StatNumber>
                          <StatHelpText>
                            <Text color="green.500">+5 this week</Text>
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel fontSize="xs">Spots Left</StatLabel>
                          <StatNumber fontSize="lg" color="orange.500">
                            {campaign.volunteerGoal - (campaign.volunteers?.length || 0)}
                          </StatNumber>
                          <StatHelpText>
                            <Text color="red.500">Filling fast</Text>
                          </StatHelpText>
                        </Stat>
                      </Grid>
                      
                      <Box p={4} bg="brand.50" borderRadius="lg" border="1px" borderColor="brand.200">
                        <VStack spacing={2}>
                          <Icon as={FiAward} color="brand.500" boxSize={6} />
                          <Text fontWeight="semibold" color="brand.700" textAlign="center">
                            Earn {Math.round(basePoints * pointsMultiplier)} EcoPoints
                          </Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">
                            {pointsMultiplier > 1 ? `${pointsMultiplier}x bonus for difficulty!` : 'Base reward'}
                          </Text>
                        </VStack>
                      </Box>
                    </VStack>
                  </Grid>

                  {/* Progress & Description */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="semibold">Volunteer Progress</Text>
                      <Text fontSize="sm" color="gray.600">
                        {Math.round(((campaign.volunteers?.length || 0) / campaign.volunteerGoal) * 100)}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={((campaign.volunteers?.length || 0) / campaign.volunteerGoal) * 100} 
                      colorScheme="green" 
                      borderRadius="full" 
                    />
                  </Box>

                  <Box>
                    <Heading size="sm" mb={2}>About This Campaign</Heading>
                    <Text color="gray.700" lineHeight="1.6">
                      {campaign.description || 'Join us in making a real environmental impact! This campaign focuses on cleaning up local waterways and restoring natural habitats. We\'ll be working together to remove debris, plant native vegetation, and educate the community about sustainable practices. Your participation helps create lasting change for future generations.'}
                    </Text>
                  </Box>

                  {/* Organizer */}
                  <Box p={4} bg="gray.50" borderRadius="lg">
                    <HStack spacing={4}>
                      <Avatar size="lg" name={campaign.organizer?.name} />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="semibold">{campaign.organizer?.name}</Text>
                        <Text fontSize="sm" color="gray.600">Campaign Organizer</Text>
                        <HStack>
                          <Icon as={FiStar} color="yellow.400" />
                          <Text fontSize="sm">4.8 • Organized 12 campaigns</Text>
                        </HStack>
                      </VStack>
                      <Button size="sm" variant="outline">
                        <Icon as={FiMessageCircle} mr={2} />
                        Message
                      </Button>
                    </HStack>
                  </Box>

                  {/* RSVP Section */}
                  {!rsvpConfirmed && (
                    <Alert status="info" borderRadius="lg">
                      <AlertIcon />
                      <Box flex={1}>
                        <AlertTitle fontSize="sm">Ready to join?</AlertTitle>
                        <AlertDescription fontSize="sm">
                          Complete your RSVP to secure your spot and receive updates.
                        </AlertDescription>
                      </Box>
                      <Button size="sm" colorScheme="blue" onClick={handleRSVP}>
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
                  <Box p={6} bg={`${difficulty.color}.50`} borderRadius="lg" border="2px" borderColor={`${difficulty.color}.200`}>
                    <VStack spacing={3}>
                      <Badge colorScheme={difficulty.color} variant="solid" fontSize="md" p={2}>
                        {difficulty.label} Difficulty
                      </Badge>
                      <Text fontSize="lg" fontWeight="semibold" textAlign="center">
                        {difficulty.description}
                      </Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {difficulty.requirements}
                      </Text>
                    </VStack>
                  </Box>

                  {/* Participation Options */}
                  <Box>
                    <Heading size="sm" mb={4}>How would you like to participate?</Heading>
                    <RadioGroup value={selectedRole} onChange={setSelectedRole}>
                      <VStack spacing={4} align="stretch">
                        <Box p={4} border="2px" borderColor={selectedRole === 'volunteer' ? 'brand.500' : 'gray.200'} borderRadius="lg">
                          <Radio value="volunteer" size="lg">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="semibold">Volunteer (+{Math.round(basePoints * pointsMultiplier)} points)</Text>
                              <Text fontSize="sm" color="gray.600">Join hands-on cleanup activities</Text>
                              <HStack>
                                <Icon as={FiClock} boxSize={3} />
                                <Text fontSize="xs">Full day commitment</Text>
                              </HStack>
                            </VStack>
                          </Radio>
                        </Box>
                        
                        <Box p={4} border="2px" borderColor={selectedRole === 'supporter' ? 'brand.500' : 'gray.200'} borderRadius="lg">
                          <Radio value="supporter" size="lg">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="semibold">Supporter (+{Math.round(basePoints * 0.5)} points)</Text>
                              <Text fontSize="sm" color="gray.600">Provide financial support for supplies</Text>
                              <HStack>
                                <Icon as={FiHeart} boxSize={3} />
                                <Text fontSize="xs">Any amount helps</Text>
                              </HStack>
                            </VStack>
                          </Radio>
                        </Box>
                        
                        <Box p={4} border="2px" borderColor={selectedRole === 'ambassador' ? 'brand.500' : 'gray.200'} borderRadius="lg">
                          <Radio value="ambassador" size="lg">
                            <VStack align="start" spacing={2} ml={3}>
                              <Text fontWeight="semibold">Ambassador (+{Math.round(basePoints * 0.8)} points)</Text>
                              <Text fontSize="sm" color="gray.600">Help spread awareness and recruit others</Text>
                              <HStack>
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
                    <Heading size="sm" mb={3}>Bringing others?</Heading>
                    <HStack spacing={4}>
                      <Text fontSize="sm">Number of people:</Text>
                      <NumberInput 
                        value={attendeeCount} 
                        onChange={(value) => setAttendeeCount(Number(value) || 1)}
                        min={1} 
                        max={5} 
                        size="sm"
                        width="100px"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      {attendeeCount > 1 && (
                        <Text fontSize="sm" color="green.600">
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
                      <Heading size="sm">Preparation Checklist</Heading>
                      <Text fontSize="sm" color="gray.600">
                        {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} completed
                      </Text>
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">
                      {checklistItems.map((item) => (
                        <Box 
                          key={item.id} 
                          p={3} 
                          border="1px" 
                          borderColor={item.required ? "orange.200" : "gray.200"} 
                          borderRadius="md"
                          bg={checklist[item.id] ? "green.50" : "white"}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Checkbox
                                isChecked={checklist[item.id] || false}
                                onChange={(e) => setChecklist({...checklist, [item.id]: e.target.checked})}
                                colorScheme="green"
                                size="lg"
                              />
                              <VStack align="start" spacing={0}>
                                <HStack>
                                  <Text fontWeight="semibold">{item.label}</Text>
                                  {item.required && <Badge colorScheme="orange" size="sm">Required</Badge>}
                                </HStack>
                                <Text fontSize="xs" color="gray.600" textTransform="capitalize">{item.category}</Text>
                              </VStack>
                            </HStack>
                            {checklist[item.id] && <Icon as={FiCheck} color="green.500" />}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Smart Recommendation</AlertTitle>
                      <AlertDescription fontSize="sm">
                        Based on the weather forecast, we recommend bringing extra sunscreen and staying hydrated!
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <Button 
                    variant="outline" 
                    leftIcon={<Icon as={FiDownload} />}
                    size="sm"
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
                    <Heading size="sm" mb={4}>Meeting Point & Schedule</Heading>
                    <Box p={4} border="1px" borderColor="gray.200" borderRadius="lg">
                      <VStack spacing={4} align="stretch">
                        <HStack spacing={3}>
                          <Icon as={FiMapPin} color="brand.500" boxSize={5} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold">{campaign.location?.address || 'Jumeirah Beach Park Entrance'}</Text>
                            <Text fontSize="sm" color="gray.600">Near Dubai Marina, Dubai</Text>
                            <Text fontSize="xs" color="blue.600">GPS: 25.2318, 55.2592</Text>
                          </VStack>
                        </HStack>
                        
                        <Divider />
                        
                        <VStack spacing={2} align="stretch">
                          <Text fontWeight="semibold" fontSize="sm">Schedule:</Text>
                          <VStack spacing={1} align="stretch" fontSize="sm">
                            <HStack justify="space-between">
                              <Text>Check-in & Welcome</Text>
                              <Text color="gray.600">6:30 - 7:00 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Safety Briefing</Text>
                              <Text color="gray.600">7:00 - 7:30 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Cleanup Activities</Text>
                              <Text color="gray.600">7:30 - 11:30 AM</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Wrap-up & Recognition</Text>
                              <Text color="gray.600">11:30 - 12:00 PM</Text>
                            </HStack>
                          </VStack>
                        </VStack>
                        
                        <Button variant="outline" size="sm" leftIcon={<Icon as={FiNavigation} />}>
                          Get Directions
                        </Button>
                      </VStack>
                    </Box>
                  </Box>

                  {/* Weather Forecast */}
                  <Box>
                    <Heading size="sm" mb={3}>Weather Forecast</Heading>
                    {loadingWeather ? (
                      <HStack spacing={3} p={4} justify="center">
                        <Spinner size="sm" />
                        <Text fontSize="sm">Loading weather data...</Text>
                      </HStack>
                    ) : (
                      <Box p={4} border="1px" borderColor="gray.200" borderRadius="lg">
                        <Grid templateColumns="1fr 2fr" gap={4}>
                          <VStack spacing={3}>
                            <Icon as={weatherData.icon} boxSize={8} color="orange.400" />
                            <VStack spacing={0}>
                              <Text fontSize="2xl" fontWeight="bold">{weatherData.temperature}°C</Text>
                              <Text fontSize="sm" color="gray.600">{weatherData.condition}</Text>
                            </VStack>
                          </VStack>
                          
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Icon as={FiUmbrella} boxSize={4} />
                                <Text fontSize="sm">Rain Chance</Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="semibold">{weatherData.precipitation}%</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <HStack spacing={2}>
                                <Icon as={FiCloud} boxSize={4} />
                                <Text fontSize="sm">Wind Speed</Text>
                              </HStack>
                              <Text fontSize="sm" fontWeight="semibold">{weatherData.windSpeed} km/h</Text>
                            </HStack>
                            <Alert status="success" variant="subtle" borderRadius="md" p={2}>
                              <AlertIcon boxSize={4} />
                              <Text fontSize="sm">{weatherData.recommendation}</Text>
                            </Alert>
                          </VStack>
                        </Grid>
                      </Box>
                    )}
                  </Box>

                  {/* Transportation */}
                  <Box>
                    <Heading size="sm" mb={3}>Transportation Options</Heading>
                    <VStack spacing={3} align="stretch">
                      <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Icon as={FiTruck} color="green.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold" fontSize="sm">Metro & Parking Available</Text>
                              <Text fontSize="xs" color="gray.600">Dubai Metro Red Line + paid parking</Text>
                            </VStack>
                          </HStack>
                          <Text fontSize="xs" color="green.600">Recommended</Text>
                        </HStack>
                      </Box>
                      
                      <Box p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <HStack justify="space-between">
                          <HStack spacing={3}>
                            <Icon as={FiUsers} color="blue.500" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold" fontSize="sm">Carpool Available</Text>
                              <Text fontSize="xs" color="gray.600">3 volunteers offering rides</Text>
                            </VStack>
                          </HStack>
                          <Button size="xs" variant="outline">Join</Button>
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
                    <Box p={4} border="1px" borderColor="red.200" borderRadius="lg">
                      <VStack spacing={2}>
                        <Icon as={FiPhone} color="red.500" boxSize={6} />
                        <Text fontWeight="semibold" fontSize="sm">Emergency Contacts</Text>
                        <VStack spacing={1} fontSize="xs">
                          <Text>Event Organizer: +971 50 123 4567</Text>
                          <Text>Emergency Services: 999</Text>
                          <Text>Dubai Municipality: +971 4 206 5555</Text>
                        </VStack>
                      </VStack>
                    </Box>
                    
                    <Box p={4} border="1px" borderColor="blue.200" borderRadius="lg">
                      <VStack spacing={2}>
                        <Icon as={FiAlertTriangle} color="blue.500" boxSize={6} />
                        <Text fontWeight="semibold" fontSize="sm">Safety Guidelines</Text>
                        <VStack spacing={1} fontSize="xs" align="start">
                          <Text>• Stay hydrated - drink water every 30 minutes</Text>
                          <Text>• Use proper lifting techniques</Text>
                          <Text>• Report any hazardous materials</Text>
                          <Text>• Stay within designated work areas</Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </Grid>

                  <Box>
                    <Heading size="sm" mb={3}>Health & Accessibility</Heading>
                    <VStack spacing={3} align="stretch">
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">
                          This event involves outdoor work on uneven terrain. Please inform organizers of any medical conditions or mobility requirements.
                        </Text>
                      </Alert>
                      
                      <Box p={3} bg="gray.50" borderRadius="md">
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>Accessibility Information:</Text>
                        <VStack spacing={1} align="start" fontSize="sm">
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                            <Text>Accessible parking available</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiCheckCircle} color="green.500" boxSize={4} />
                            <Text>Accessible restroom facilities</Text>
                          </HStack>
                          <HStack>
                            <Icon as={FiAlertTriangle} color="orange.500" boxSize={4} />
                            <Text>Some areas may not be wheelchair accessible</Text>
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
                      <Heading size="sm">Current Participants ({campaign.volunteers?.length || 0})</Heading>
                      <Button size="sm" variant="ghost">
                        <Icon as={FiUsers} mr={2} />
                        View All
                      </Button>
                    </HStack>
                    <VStack spacing={3} align="stretch">
                      {(campaign.volunteers || []).slice(0, 4).map((volunteer, i) => (
                        <HStack key={i} p={3} bg="gray.50" borderRadius="md">
                          <Avatar size="sm" name={volunteer.name} />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="semibold" fontSize="sm">{volunteer.name}</Text>
                            <Text fontSize="xs" color="gray.600">Volunteer • Joined 3 days ago</Text>
                          </VStack>
                          <Badge size="sm" colorScheme="green">Active</Badge>
                        </HStack>
                      ))}
                      {(campaign.volunteers || []).length === 0 && (
                        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
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

        <ModalFooter>
          <VStack spacing={3} w="full">
            {rsvpConfirmed ? (
              <Alert status="success" borderRadius="md" w="full">
                <AlertIcon />
                <Box flex={1}>
                  <AlertTitle fontSize="sm">You're all set!</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Event details sent to your email. See you there! 🌱
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Alert status="info" borderRadius="md" w="full">
                <AlertIcon />
                <Text fontSize="sm">
                  Complete your RSVP to join this campaign and start earning EcoPoints!
                </Text>
              </Alert>
            )}
            
            <HStack spacing={3} w="full">
              <Button variant="ghost" onClick={onClose}>
                {rsvpConfirmed ? 'Close' : 'Cancel'}
              </Button>
              
              {!rsvpConfirmed ? (
                <Button 
                  colorScheme="brand" 
                  flex={1}
                  onClick={handleRSVP}
                  leftIcon={<Icon as={FiCheckCircle} />}
                >
                  Complete RSVP
                </Button>
              ) : (
                <Button 
                  colorScheme="green" 
                  flex={1}
                  leftIcon={<Icon as={FiCalendar} />}
                >
                  Add to Calendar
                </Button>
              )}
              
              <Button 
                variant="outline"
                leftIcon={<Icon as={FiShare2} />}
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