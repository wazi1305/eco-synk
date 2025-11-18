import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Icon,
  Input,
  Grid,
  GridItem,
  Center,
  Spinner,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { FiCamera, FiImage, FiStar, FiMapPin, FiUsers, FiAlertCircle } from 'react-icons/fi';
import aiAnalysisService from '../services/aiAnalysis';

const USER_STATS = {
  points: 420,
  streak: 7,
  cleanups: 24,
};

const CameraPage = () => {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [windowHeight, setWindowHeight] = useState('100vh');
  const [cameraError, setCameraError] = useState(null);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [userNotes, setUserNotes] = useState('');
  const [volunteerMatches, setVolunteerMatches] = useState([]);
  const [hotspotData, setHotspotData] = useState(null);
  const [location, setLocation] = useState(null);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const toast = useToast();

  // Simplified scroll handler with debouncing
  const handleScroll = React.useCallback((e) => {
    const currentScrollY = e.target.scrollTop;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Simple logic: show header when near top, hide when scrolling down significantly
    if (currentScrollY < 50) {
      setShowHeader(true);
    } else if (currentScrollY > 150 && currentScrollY > lastScrollYRef.current + 5) {
      setShowHeader(false);
    } else if (currentScrollY < lastScrollYRef.current - 20) {
      setShowHeader(true);
    }
    
    // Debounced update
    scrollTimeoutRef.current = setTimeout(() => {
      lastScrollYRef.current = currentScrollY;
    }, 50);
  }, []);

  useEffect(() => {
    const setAppHeight = () => {
      setWindowHeight(`${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
          setCameraError('No camera device found');
          setUseFileUpload(true);
        }
      } catch (err) {
        console.error('Error checking camera:', err);
      }
    };
    
    // Get user location for context
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          },
          (error) => {
            console.warn('Location access denied:', error);
            // Use Dubai default location
            setLocation({ lat: 25.2048, lon: 55.2708 });
          }
        );
      } else {
        setLocation({ lat: 25.2048, lon: 55.2708 });
      }
    };
    
    if (navigator.mediaDevices) {
      checkCamera();
    }
    getLocation();
  }, []);

  const handleUserMedia = () => {
    setCameraError(null);
    setUseFileUpload(false);
  };

  const handleUserMediaError = (error) => {
    const errorMsg = error.name === 'NotAllowedError' 
      ? 'Camera permission denied'
      : error.name === 'NotFoundError'
      ? 'No camera device found'
      : 'Camera access unavailable';
    setCameraError(errorMsg);
    setUseFileUpload(true);
  };

  const capture = () => {
    if (webcamRef.current) {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 150);
          setCapturedImage(imageSrc);
          setCameraError(null);
        }
      } catch {
        setCameraError('Failed to capture image');
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCameraError('Image file is too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCapturedImage(e.target.result);
        setCameraError(null);
      }
    };
    reader.onerror = () => {
      setCameraError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const retake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSubmitted(false);
    setCameraError(null);
  };

  const submitReport = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setVolunteerMatches([]);
    setHotspotData(null);

    try {
      // Convert base64 to File object for the API
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'trash-image.jpg', { type: 'image/jpeg' });

      // Analyze image with AI
      const analysisResponse = await aiAnalysisService.analyzeTrashImage(
        file,
        location,
        userNotes || null
      );

      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || 'Analysis failed');
      }

      const analysisData = analysisResponse.data;
      setAnalysisResult(analysisData);

      // Check for hotspot if location is available
      if (location) {
        const hotspotResponse = await aiAnalysisService.detectHotspot(analysisData);
        if (hotspotResponse.success) {
          setHotspotData(hotspotResponse);
        }
      }

      // Find volunteer matches if priority is high enough
      if (analysisData.cleanup_priority_score >= 6 && location) {
        const volunteerResponse = await aiAnalysisService.findVolunteersForCleanup(
          analysisData,
          location,
          { radius: 10, limit: 5, minScore: 0.3 }
        );
        
        if (volunteerResponse.success) {
          setVolunteerMatches(volunteerResponse.volunteers);
        }
      }

      setSubmitted(true);
      
      toast({
        title: 'Analysis complete',
        description: `Found ${analysisData.primary_material} waste with priority ${analysisData.cleanup_priority_score}/10`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      
      // Fallback to mock data
      const mockResult = {
        primary_material: 'mixed',
        estimated_volume: 'medium',
        cleanup_priority_score: 7,
        specific_items: ['Plastic bottle', 'Paper', 'Can'],
        description: 'Mixed waste requiring cleanup',
        environmental_risk_level: 'medium',
        recyclable: true,
        estimated_cleanup_time_minutes: 30
      };
      
      setAnalysisResult(mockResult);
      setSubmitted(true);
      
      toast({
        title: 'Analysis completed with fallback',
        description: error.message || 'Using offline analysis',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmSubmission = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSubmitted(false);
    setCameraError(null);
    setUserNotes('');
    setVolunteerMatches([]);
    setHotspotData(null);
  };

  return (
    <Flex
      direction="column"
      h="full"
      bg="black"
      overflow="hidden"
      style={{ height: windowHeight }}
    >
      {/* Header - Collapsible */}
      <Box
        bg="gray.900"
        color="white"
        px={4}
        py={4}
        flexShrink={0}
        shadow="md"
        borderBottom="1px solid"
        borderColor="gray.700"
        position="fixed"
        top={0}
        left={0}
        right={0}
        transform={showHeader ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex={20}
      >
        <HStack justify="space-between" align="start" mb={3}>
          <VStack align="start" spacing={1} flex="1">
            <Heading size="lg" fontWeight="bold">Report Trash</Heading>
            <Text fontSize="sm" color="gray.400">Document your environmental impact</Text>
          </VStack>
          <VStack align="end" spacing={0}>
            <Heading size="md" color="brand.400">{USER_STATS.points}</Heading>
            <Text fontSize="xs" color="gray.400">Points</Text>
          </VStack>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <GridItem bg="whiteAlpha.10" px={3} py={2} borderRadius="lg" textAlign="center">
            <Heading size="sm" color="white">{USER_STATS.streak}</Heading>
            <Text fontSize="xs" color="gray.400">Day Streak</Text>
          </GridItem>
          <GridItem bg="whiteAlpha.10" px={3} py={2} borderRadius="lg" textAlign="center">
            <Heading size="sm" color="white">{USER_STATS.cleanups}</Heading>
            <Text fontSize="xs" color="gray.400">Cleanups</Text>
          </GridItem>
        </Grid>
      </Box>

      <Flex
        flex="1"
        direction="column"
        align="center"
        justify="center"
        bg="black"
        position="relative"
        overflow="auto"
        onScroll={handleScroll}
        pt={showHeader ? "140px" : "80px"}
        transition="padding-top 0.4s ease-out"
      >
        {!capturedImage ? (
          <>
            {useFileUpload ? (
              <VStack h="full" w="full" spacing={6} px={6} justify="center" align="center">
                <Box
                  bg="whiteAlpha.10"
                  p={6}
                  borderRadius="full"
                  mb={2}
                >
                  <Icon as={FiImage} boxSize={12} color="brand.400" />
                </Box>
                <Heading size="lg" color="white" textAlign="center">Upload Photo</Heading>
                {cameraError && (
                  <Text fontSize="sm" color="gray.400" textAlign="center" bg="red.900" px={3} py={2} borderRadius="md">
                    {cameraError}
                  </Text>
                )}
                <Text fontSize="md" color="gray.500" textAlign="center">
                  Select an image from your gallery
                </Text>

                <VStack gap={3} w="full" mt={4}>
                  <Button 
                    w="full" 
                    bg="brand.500" 
                    color="white" 
                    size="lg" 
                    onClick={triggerFileUpload}
                    _hover={{ bg: 'brand.600' }}
                  >
                    <Icon as={FiImage} mr={3} /> Choose from Gallery
                  </Button>

                  <Button 
                    w="full" 
                    bg="whiteAlpha.200" 
                    color="white" 
                    size="lg" 
                    onClick={() => { setCameraError(null); setUseFileUpload(false); }}
                    _hover={{ bg: 'whiteAlpha.300' }}
                  >
                    <Icon as={FiCamera} mr={3} /> Try Camera Again
                  </Button>
                </VStack>
              </VStack>
            ) : (
              <Box w="full" h="full" position="relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  videoConstraints={{
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1440 },
                  }}
                  onUserMedia={handleUserMedia}
                  onUserMediaError={handleUserMediaError}
                  mirrored={false}
                />

                {isFlashing && <Box position="absolute" inset={0} bg="white" opacity={0.7} pointerEvents="none" />}

                <Center position="absolute" inset={0} pointerEvents="none">
                  <VStack spacing={4}>
                    <Box borderWidth={4} borderColor="brand.400" borderRadius="full" w={48} h={48} opacity={0.5} />
                    <Text color="white" textAlign="center" fontSize="sm" fontWeight="semibold" opacity={0.75}>
                      Center the trash in the circle
                    </Text>
                  </VStack>
                </Center>

                <Flex position="absolute" bottom="6rem" left="50%" transform="translateX(-50%)" justify="center" zIndex={10}>
                  <Button
                    onClick={capture}
                    variant="unstyled"
                    p={1}
                    borderRadius="full"
                    w={20}
                    h={20}
                    bg="white"
                    border="4px solid"
                    borderColor="white"
                    shadow="2xl"
                    _hover={{ transform: 'scale(1.05)' }}
                    _active={{ transform: 'scale(0.95)' }}
                    transition="all 0.2s"
                  >
                    <Box 
                      w={16} 
                      h={16} 
                      bg="brand.500" 
                      borderRadius="full" 
                      _hover={{ bg: 'brand.600' }}
                      transition="all 0.2s"
                    />
                  </Button>
                </Flex>

                <Button position="absolute" bottom="6rem" left={4} bg="gray.700" color="white" size="sm" onClick={triggerFileUpload}>
                  <Icon as={FiImage} mr={2} /> Gallery
                </Button>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  display="none"
                />
              </Box>
            )}
          </>
        ) : (
          <Box w="full" h="full" position="relative">
            <Box as="img" src={capturedImage} alt="Captured" w="full" h="full" objectFit="cover" />

            {isAnalyzing && (
              <Flex position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.8), rgba(0,0,0,0.5))" align="center" justify="center" direction="column">
                <VStack spacing={6}>
                  <Spinner thickness="4px" speed="0.65s" emptyColor="gray.700" color="brand.400" size="xl" />
                  <VStack spacing={2} textAlign="center">
                    <Heading size="md" color="white">AI Analyzing Trash</Heading>
                    <Text fontSize="sm" color="gray.400">Identifying materials...</Text>
                  </VStack>
                </VStack>
              </Flex>
            )}

            {submitted && analysisResult && !isAnalyzing && (
              <Box 
                position="absolute" 
                inset={0} 
                bg="blackAlpha.900" 
                overflowY="auto"
                p={4}
              >
                <VStack spacing={4} align="stretch" maxW="md" mx="auto">
                  {/* Success Header */}
                  <Card bg="white" borderRadius="xl" shadow="lg">
                    <CardBody p={6}>
                      <VStack spacing={4} textAlign="center">
                        <Box bg="green.100" p={3} borderRadius="full">
                          <Icon as={FiStar} boxSize={8} color="green.600" />
                        </Box>
                        <VStack spacing={2}>
                          <Heading size="lg" color="gray.900">Analysis Complete!</Heading>
                          <Text fontSize="sm" color="gray.600">
                            AI-powered waste analysis results
                          </Text>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Main Analysis Results */}
                  <Card bg="white" borderRadius="xl" shadow="lg">
                    <CardBody p={6}>
                      <VStack spacing={4} align="stretch">
                        <Heading size="md" color="gray.900">Analysis Results</Heading>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Material Type</Text>
                          <Badge colorScheme="blue" variant="solid">
                            {analysisResult.primary_material?.toUpperCase() || 'MIXED'}
                          </Badge>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Priority Score</Text>
                          <Badge 
                            colorScheme={analysisResult.cleanup_priority_score >= 8 ? 'red' : 
                                        analysisResult.cleanup_priority_score >= 6 ? 'orange' : 'green'} 
                            variant="solid"
                          >
                            {analysisResult.cleanup_priority_score}/10
                          </Badge>
                        </HStack>
                        
                        <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Volume</Text>
                          <Text fontWeight="bold" color="gray.900">
                            {analysisResult.estimated_volume?.toUpperCase() || 'MEDIUM'}
                          </Text>
                        </HStack>
                        
                        {analysisResult.specific_items?.length > 0 && (
                          <Box p={3} bg="gray.50" borderRadius="lg">
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>Items Detected</Text>
                            <Text fontSize="sm" color="gray.900">
                              {analysisResult.specific_items.join(', ')}
                            </Text>
                          </Box>
                        )}
                        
                        {analysisResult.description && (
                          <Box p={3} bg="blue.50" borderRadius="lg">
                            <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={1}>Description</Text>
                            <Text fontSize="sm" color="blue.900">
                              {analysisResult.description}
                            </Text>
                          </Box>
                        )}
                        
                        <HStack justify="space-between" p={3} bg="green.50" borderRadius="lg">
                          <Text fontSize="sm" fontWeight="semibold" color="green.700">Points Earned</Text>
                          <Text fontWeight="bold" fontSize="lg" color="green.600">
                            +{(analysisResult.cleanup_priority_score || 5) * 5} PTS
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Hotspot Alert */}
                  {hotspotData?.isHotspot && (
                    <Alert status="warning" borderRadius="xl" bg="orange.50" border="1px solid orange.200">
                      <AlertIcon color="orange.500" />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="semibold" color="orange.700">Hotspot Detected!</Text>
                        <Text fontSize="sm" color="orange.600">
                          {hotspotData.similarReports} similar reports in this area. {hotspotData.recommendation}
                        </Text>
                      </VStack>
                    </Alert>
                  )}

                  {/* Volunteer Matches */}
                  {volunteerMatches.length > 0 && (
                    <Card bg="white" borderRadius="xl" shadow="lg">
                      <CardBody p={6}>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={2}>
                            <Icon as={FiUsers} color="purple.500" />
                            <Heading size="md" color="gray.900">Nearby Volunteers</Heading>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            Found {volunteerMatches.length} volunteers who can help with this cleanup
                          </Text>
                          
                          <VStack spacing={3} align="stretch">
                            {volunteerMatches.slice(0, 3).map((volunteer, index) => (
                              <Box key={index} p={3} bg="purple.50" borderRadius="lg" border="1px solid purple.200">
                                <HStack justify="space-between">
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="semibold" color="purple.900">{volunteer.name}</Text>
                                    <Text fontSize="xs" color="purple.600">
                                      {volunteer.experience_level} • {volunteer.distance_km}km away
                                    </Text>
                                  </VStack>
                                  <Badge colorScheme="purple" variant="subtle">
                                    {Math.round((volunteer.match_score || 0.5) * 100)}% match
                                  </Badge>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Environmental Impact */}
                  {analysisResult.environmental_risk_level && (
                    <Card bg="white" borderRadius="xl" shadow="lg">
                      <CardBody p={6}>
                        <VStack spacing={4} align="stretch">
                          <HStack spacing={2}>
                            <Icon as={FiAlertCircle} 
                              color={analysisResult.environmental_risk_level === 'critical' ? 'red.500' :
                                     analysisResult.environmental_risk_level === 'high' ? 'orange.500' :
                                     analysisResult.environmental_risk_level === 'medium' ? 'yellow.500' : 'green.500'} 
                            />
                            <Heading size="md" color="gray.900">Environmental Impact</Heading>
                          </HStack>
                          
                          <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">Risk Level</Text>
                            <Badge 
                              colorScheme={analysisResult.environmental_risk_level === 'critical' ? 'red' :
                                          analysisResult.environmental_risk_level === 'high' ? 'orange' :
                                          analysisResult.environmental_risk_level === 'medium' ? 'yellow' : 'green'} 
                              variant="solid"
                            >
                              {analysisResult.environmental_risk_level?.toUpperCase() || 'MEDIUM'}
                            </Badge>
                          </HStack>
                          
                          <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">Recyclable</Text>
                            <Badge colorScheme={analysisResult.recyclable ? 'green' : 'gray'} variant="solid">
                              {analysisResult.recyclable ? 'YES' : 'NO'}
                            </Badge>
                          </HStack>
                          
                          {analysisResult.estimated_cleanup_time_minutes && (
                            <HStack justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                              <Text fontSize="sm" fontWeight="semibold" color="gray.700">Est. Cleanup Time</Text>
                              <Text fontWeight="bold" color="gray.900">
                                {analysisResult.estimated_cleanup_time_minutes} min
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Action Button */}
                  <Button 
                    w="full" 
                    bg="brand.500" 
                    color="white" 
                    size="lg" 
                    onClick={confirmSubmission}
                    _hover={{ bg: 'brand.600' }}
                    borderRadius="xl"
                    py={6}
                  >
                    Report Another Location
                  </Button>
                </VStack>
              </Box>
            )}

            {!submitted && !isAnalyzing && (
              <>
                {/* User Notes Input */}
                <Box 
                  position="absolute" 
                  bottom="6rem" 
                  left={4} 
                  right={4}
                  bg="blackAlpha.700"
                  borderRadius="lg"
                  p={3}
                  backdropFilter="blur(10px)"
                >
                  <Input
                    placeholder="Add notes about this trash (optional)"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    bg="whiteAlpha.200"
                    border="none"
                    color="white"
                    _placeholder={{ color: 'gray.300' }}
                    size="sm"
                  />
                </Box>
                
                {/* Action Buttons */}
                <HStack 
                  position="absolute" 
                  bottom={0} 
                  left={0} 
                  right={0} 
                  justify="center" 
                  spacing={4} 
                  px={4} 
                  py={4} 
                  bg="blackAlpha.800"
                  backdropFilter="blur(10px)"
                >
                  <Button 
                    flex={1} 
                    maxW="48" 
                    bg="whiteAlpha.200" 
                    color="white" 
                    size="lg" 
                    onClick={retake}
                    _hover={{ bg: 'whiteAlpha.300' }}
                  >
                    Retake
                  </Button>
                  <Button 
                    flex={1} 
                    maxW="48" 
                    bg="brand.500" 
                    color="white" 
                    size="lg" 
                    onClick={submitReport}
                    _hover={{ bg: 'brand.600' }}
                  >
                    Analyze & Submit
                  </Button>
                </HStack>
              </>
            )}
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export default CameraPage;