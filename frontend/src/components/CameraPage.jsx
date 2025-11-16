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
} from '@chakra-ui/react';
import { FiCamera, FiImage, FiStar } from 'react-icons/fi';
import { analyzeTrashImage } from '../services/gemini';

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

  useEffect(() => {
    const setAppHeight = () => {
      setWindowHeight(`${ window.innerHeight }px`);
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
    if (navigator.mediaDevices) {
      checkCamera();
    }
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
      } catch (error) {
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

    try {
      const result = await analyzeTrashImage(capturedImage);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setAnalysisResult(result);
      setSubmitted(true);
    } catch (error) {
      setAnalysisResult({
        primary_material: 'Mixed Waste',
        cleanup_priority_score: 7,
        specific_items: ['Plastic bottle', 'Paper', 'Can'],
      });
      setSubmitted(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmSubmission = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSubmitted(false);
    setCameraError(null);
  };

  return (
    <Flex
      direction="column"
      h="full"
      bg="black"
      overflow="hidden"
      style={{ height: windowHeight }}
    >
      <Box
        bgGradient="linear(to-r, brand.600, brand.500, teal.500)"
        color="white"
        px={4}
        py={4}
        flexShrink={0}
        shadow="md"
      >
        <HStack justify="space-between" align="start" mb={4}>
          <VStack align="start" spacing={1} flex="1">
            <Heading size="lg">Report Trash</Heading>
            <Text fontSize="xs" opacity={0.9}>Earn points for environmental impact</Text>
          </VStack>
          <VStack align="end" spacing={0}>
            <Heading size="md">{USER_STATS.points}</Heading>
            <Text fontSize="xs" opacity={0.9}>Points</Text>
          </VStack>
        </HStack>

        <Grid templateColumns="repeat(2, 1fr)" gap={2}>
          <GridItem bg="whiteAlpha.20" px={3} py={2} borderRadius="md" textAlign="center">
            <Heading size="sm">{USER_STATS.streak}</Heading>
            <Text fontSize="xs" opacity={0.9}>Day Streak</Text>
          </GridItem>
          <GridItem bg="whiteAlpha.20" px={3} py={2} borderRadius="md" textAlign="center">
            <Heading size="sm">{USER_STATS.cleanups}</Heading>
            <Text fontSize="xs" opacity={0.9}>Cleanups</Text>
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
        overflow="hidden"
      >
        {!capturedImage ? (
          <>
            {useFileUpload ? (
              <VStack h="full" w="full" spacing={4} px={6} justify="center" align="center">
                <Icon as={FiCamera} boxSize={16} color="whiteAlpha.50" />
                <Heading size="lg" color="white" textAlign="center">Camera Unavailable</Heading>
                {cameraError && <Text fontSize="sm" color="gray.400" textAlign="center">{cameraError}</Text>}
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Upload an image from your device
                </Text>

                <VStack gap={3} w="full" mt={6}>
                  <Button w="full" bgGradient="linear(to-r, brand.600, brand.500)" color="white" size="lg" onClick={triggerFileUpload}>
                    <Icon as={FiImage} mr={2} /> Upload Photo
                  </Button>

                  <Button w="full" bg="gray.700" color="white" size="lg" onClick={() => { setCameraError(null); setUseFileUpload(false); }}>
                    <Icon as={FiCamera} mr={2} /> Try Again
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

                <Flex position="absolute" bottom="2rem" left="50%" transform="translateX(-50%)" justify="center" zIndex={10}>
                  <Button
                    onClick={capture}
                    variant="ghost"
                    p={1}
                    borderRadius="full"
                    w={20}
                    h={20}
                    bg="white"
                    border="8px solid"
                    borderColor="brand.600"
                    shadow="2xl"
                    _hover={{ transform: 'scale(1.1)' }}
                    _active={{ transform: 'scale(0.95)' }}
                  >
                    <Box w={16} h={16} bg="brand.600" borderRadius="full" animation="pulse 2s infinite" />
                  </Button>
                </Flex>

                <Button position="absolute" bottom="2rem" left={4} bg="gray.700" color="white" size="sm" onClick={triggerFileUpload}>
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
              <Flex position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.8))" align="center" justify="center" p={6}>
                <Card bg="white" borderRadius="2xl" shadow="2xl" maxW="sm" w="full">
                  <CardBody p={6}>
                    <VStack spacing={4} textAlign="center">
                      <Icon as={FiStar} boxSize={12} color="brand.500" />
                      <Heading size="lg" color="gray.900">Report Submitted!</Heading>
                      <Text fontSize="sm" color="gray.600">Contributing to a cleaner environment</Text>

                      <Box w="full" bg="brand.50" p={4} borderRadius="lg" border="1px solid" borderColor="brand.200">
                        <Heading size="sm" mb={3} color="gray.900" textAlign="left">AI Analysis:</Heading>
                        <VStack spacing={3} align="start">
                          <HStack align="start" spacing={3}>
                            <Icon as={FiImage} boxSize={5} color="brand.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600" fontWeight="semibold">PRIMARY MATERIAL</Text>
                              <Text fontWeight="bold">{analysisResult.primary_material}</Text>
                            </VStack>
                          </HStack>
                          <HStack align="start" spacing={3}>
                            <Icon as={FiStar} boxSize={5} color="brand.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600" fontWeight="semibold">PRIORITY</Text>
                              <Text fontWeight="bold">{analysisResult.cleanup_priority_score}/10</Text>
                            </VStack>
                          </HStack>
                          <HStack align="start" spacing={3}>
                            <Icon as={FiCamera} boxSize={5} color="brand.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600" fontWeight="semibold">ITEMS DETECTED</Text>
                              <Text fontWeight="bold">{analysisResult.specific_items.join(', ')}</Text>
                            </VStack>
                          </HStack>
                          <HStack align="start" spacing={3} pt={2} borderTop="1px" borderColor="brand.200" w="full">
                            <Icon as={FiStar} boxSize={5} color="brand.600" />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.600" fontWeight="semibold">POINTS EARNED</Text>
                              <Text fontWeight="bold" fontSize="lg" color="brand.600">+{analysisResult.cleanup_priority_score * 5} PTS</Text>
                            </VStack>
                          </HStack>
                        </VStack>
                      </Box>

                      <Button w="full" bgGradient="linear(to-r, brand.600, brand.500)" color="white" size="lg" onClick={confirmSubmission}>
                        Capture Another
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </Flex>
            )}

            {!submitted && !isAnalyzing && (
              <HStack position="absolute" bottom={0} left={0} right={0} justify="center" spacing={3} px={4} py={4} bgGradient="linear(to-t, rgba(0,0,0,0.8), transparent)">
                <Button flex={1} maxW="xs" bg="gray.700" color="white" size="lg" onClick={retake} isDisabled={isAnalyzing}>
                  Retake
                </Button>
                <Button flex={1} maxW="xs" bgGradient="linear(to-r, brand.600, brand.500)" color="white" size="lg" onClick={submitReport} isDisabled={isAnalyzing}>
                  Analyze & Submit
                </Button>
              </HStack>
            )}
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export default CameraPage;
