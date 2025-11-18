import React, { useRef, useState, useEffect, useCallback } from 'react';
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

const formatCoordinatePair = (lat, lon) => {
  const latNum = typeof lat === 'number' ? lat : Number(lat);
  const lonNum = typeof lon === 'number' ? lon : Number(lon);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return null;
  }

  return `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
};


const LIVE_PREVIEW_INTERVAL_MS = 1500;


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
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [detections, setDetections] = useState([]);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [liveDetections, setLiveDetections] = useState([]);
  const [liveDetectionError, setLiveDetectionError] = useState(null);
  const [liveDetectionLatency, setLiveDetectionLatency] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const liveDetectionIntervalRef = useRef(null);
  const liveDetectionInFlightRef = useRef(false);
  const toast = useToast();

  const stopLiveDetection = useCallback((clearOverlay = false) => {
    if (liveDetectionIntervalRef.current) {
      clearInterval(liveDetectionIntervalRef.current);
      liveDetectionIntervalRef.current = null;
    }
    liveDetectionInFlightRef.current = false;

    if (clearOverlay) {
      setLiveDetections([]);
      setLiveDetectionLatency(null);
      setLiveDetectionError(null);
    }
  }, []);

  const captureFrameBlob = useCallback(() => {
    const videoElement = webcamRef.current?.video;
    if (!videoElement || videoElement.readyState < 2) {
      return Promise.resolve(null);
    }

    const { videoWidth, videoHeight } = videoElement;
    if (!videoWidth || !videoHeight) {
      return Promise.resolve(null);
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return Promise.resolve(null);
    }

    context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, []);

  useEffect(() => {
    return () => {
      stopLiveDetection();
    };
  }, [stopLiveDetection]);


  const locationMetadata = analysisResult?.metadata?.location;
  const locationContext = analysisResult?.metadata?.location_context;
  const locationName = analysisResult?.metadata?.location_name || locationContext?.name || locationContext?.display_name;
  const locationDisplayName = locationContext?.display_name;
  const locationCoordinatesLabel = locationMetadata
    ? formatCoordinatePair(locationMetadata.lat, locationMetadata.lon)
    : null;
  const locationSource = locationContext?.source;
  const locationSourceLabel = locationSource
    ? locationSource
        .split('_')
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
    : null;

  const liveLatencyLabel = Number.isFinite(liveDetectionLatency)
    ? `${Math.round(liveDetectionLatency)}ms`
    : null;


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
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        if (videoInputs.length === 0) {
          setCameraError('No camera device found');
          setUseFileUpload(true);
        } else {
          // Prefer back camera on mobile (environment facing)
          const backCamera = videoInputs.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          setSelectedDeviceId(backCamera?.deviceId || videoInputs[0]?.deviceId);
        }
      } catch (err) {
        console.error('Error checking camera:', err);
        setUseFileUpload(true);
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

  useEffect(() => {
    setIsVideoReady(false);
  }, [selectedDeviceId]);

  useEffect(() => {
    if (selectedDeviceId) {
      stopLiveDetection(true);
    }
  }, [selectedDeviceId, stopLiveDetection]);

  useEffect(() => {
    if (capturedImage || useFileUpload || cameraError) {
      stopLiveDetection(true);
      setIsVideoReady(false);
    }
  }, [capturedImage, useFileUpload, cameraError, stopLiveDetection]);

  useEffect(() => {
    const shouldRunLivePreview = !useFileUpload && !cameraError && !capturedImage && !isAnalyzing && isVideoReady;

    if (!shouldRunLivePreview) {
      stopLiveDetection();
      return;
    }

    let cancelled = false;

    const runDetection = async () => {
      if (cancelled || liveDetectionInFlightRef.current) {
        return;
      }

      const frameBlob = await captureFrameBlob();
      if (!frameBlob || cancelled) {
        return;
      }

      liveDetectionInFlightRef.current = true;

      try {
        const result = await aiAnalysisService.detectLiveFrame(frameBlob, location, {
          includeSummary: false
        });

        if (cancelled) {
          return;
        }

        if (result.success) {
          setLiveDetections(result.detections || []);
          setLiveDetectionLatency(result.latencyMs ?? null);
          setLiveDetectionError(null);
        } else if (result.error) {
          setLiveDetectionError(result.error);
          setLiveDetections([]);
          setLiveDetectionLatency(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLiveDetectionError(error.message || 'Live detection failed');
          setLiveDetections([]);
          setLiveDetectionLatency(null);
        }
      } finally {
        liveDetectionInFlightRef.current = false;
      }
    };

    runDetection();
    liveDetectionIntervalRef.current = setInterval(runDetection, LIVE_PREVIEW_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (liveDetectionIntervalRef.current) {
        clearInterval(liveDetectionIntervalRef.current);
        liveDetectionIntervalRef.current = null;
      }
      liveDetectionInFlightRef.current = false;
    };
  }, [useFileUpload, cameraError, capturedImage, isAnalyzing, isVideoReady, location, captureFrameBlob, stopLiveDetection]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const videoElement = webcamRef.current?.video;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const clearCanvas = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (!videoElement) {
      clearCanvas();
      return;
    }

    const displayWidth = videoElement.clientWidth || videoElement.videoWidth || 0;
    const displayHeight = videoElement.clientHeight || videoElement.videoHeight || 0;

    if (!displayWidth || !displayHeight) {
      canvas.width = 0;
      canvas.height = 0;
      clearCanvas();
      return;
    }

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    } else {
      clearCanvas();
    }

    if (!liveDetections || liveDetections.length === 0) {
      clearCanvas();
      return;
    }

    const naturalWidth = videoElement.videoWidth || displayWidth;
    const naturalHeight = videoElement.videoHeight || displayHeight;

    const scaleX = naturalWidth ? canvas.width / naturalWidth : 1;
    const scaleY = naturalHeight ? canvas.height / naturalHeight : 1;

    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.font = '14px "Inter", sans-serif';
    context.textBaseline = 'top';

    liveDetections.forEach((detection) => {
      const bbox = detection?.bbox;
      if (!bbox) {
        return;
      }

      const x = (bbox.x1 || 0) * scaleX;
      const y = (bbox.y1 || 0) * scaleY;
      const width = (bbox.width || 0) * scaleX;
      const height = (bbox.height || 0) * scaleY;

      context.strokeStyle = 'rgba(56, 161, 105, 0.95)';
      context.strokeRect(x, y, width, height);

      const labelClass = detection?.class || detection?.coco_class || 'trash';
      const friendlyClass = labelClass.replace(/_/g, ' ');
      const confidence = detection?.confidence ? `${Math.round(detection.confidence * 100)}%` : '';
      const label = confidence ? `${friendlyClass} ${confidence}` : friendlyClass;

      const paddingX = 6;
      const paddingY = 4;
      const textMetrics = context.measureText(label);
      const labelWidth = textMetrics.width + paddingX * 2;
      const labelHeight = 18 + paddingY;
      const labelX = x;
      const labelY = Math.max(0, y - labelHeight);

      context.fillStyle = 'rgba(56, 161, 105, 0.85)';
      context.fillRect(labelX, labelY, labelWidth, labelHeight);

      context.fillStyle = '#0B1F17';
      context.fillText(label, labelX + paddingX, labelY + paddingY / 2);
    });

  }, [liveDetections, windowHeight, isVideoReady]);

  const handleUserMedia = () => {
    setCameraError(null);
    setUseFileUpload(false);
    setIsVideoReady(true);
    setLiveDetectionError(null);
  };

  const handleUserMediaError = (error) => {
    const errorMsg = error.name === 'NotAllowedError' 
      ? 'Camera permission denied'
      : error.name === 'NotFoundError'
      ? 'No camera device found'
      : 'Camera access unavailable';
    setCameraError(errorMsg);
    setUseFileUpload(true);
    setIsVideoReady(false);
    stopLiveDetection(true);
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
    console.log('handleFileUpload called!', event);
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    if (!file) return;

    console.log('File type:', file.type, 'Size:', file.size);
    
    if (file.size > 15 * 1024 * 1024) {
      const errorMsg = `Image file is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 15MB)`;
      console.error(errorMsg);
      setCameraError(errorMsg);
      return;
    }

    // Accept common image formats, including HEIC which may have empty type
    if (file.type && !file.type.startsWith('image/')) {
      const errorMsg = `Invalid file type: ${file.type}. Please select an image file.`;
      console.error(errorMsg);
      setCameraError(errorMsg);
      return;
    }

    console.log('Starting FileReader...');
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('FileReader onload triggered');
      if (e.target?.result) {
        console.log('FileReader loaded, setting capturedImage, length:', e.target.result.length);
        setCapturedImage(e.target.result);
        setCameraError(null);
        console.log('capturedImage should be set, component should re-render');
      } else {
        console.error('FileReader result is empty');
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setCameraError('Failed to read file');
    };
    reader.readAsDataURL(file);
    console.log('FileReader.readAsDataURL() called');
  };

  const triggerFileUpload = () => {
    console.log('triggerFileUpload called', fileInputRef.current);
    if (fileInputRef.current) {
      // Reset value to allow selecting the same file again
      fileInputRef.current.value = '';
      console.log('About to click file input');
      fileInputRef.current.click();
      console.log('File input clicked');
    } else {
      console.error('fileInputRef.current is null!');
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSubmitted(false);
    setCameraError(null);
    setDetections([]);
    setAnnotatedImage(null);
  };

  const submitReport = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setVolunteerMatches([]);
    setHotspotData(null);
    setDetections([]);
    setAnnotatedImage(null);

    try {
      // Convert base64 to File object for the API
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'trash-image.jpg', { type: 'image/jpeg' });

      // Use YOLO detection endpoint instead of basic analyze
      const analysisResponse = await aiAnalysisService.detectWaste(
        file,
        location,
        userNotes || null,
        true // use_yolo = true
      );

      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || 'Detection failed');
      }

      const analysisData = analysisResponse.data;
      console.log('Analysis response data:', {
        hasAnalysis: !!analysisData.analysis,
        hasDetections: !!analysisData.detections,
        detectionsCount: analysisData.detections?.length || 0,
        hasAnnotatedImage: !!analysisData.annotated_image,
        annotatedImagePreview: analysisData.annotated_image?.substring(0, 50)
      });
      
      setAnalysisResult(analysisData.analysis || analysisData);
      
      // Store YOLO detections and annotated image
      if (analysisData.detections) {
        console.log('Setting detections:', analysisData.detections.length);
        setDetections(analysisData.detections);
      }
      if (analysisData.annotated_image) {
        console.log('Setting annotated image, length:', analysisData.annotated_image.length);
        setAnnotatedImage(analysisData.annotated_image);
      } else {
        console.warn('No annotated image in response!');
      }

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
      
      const detectionCount = analysisData.detections?.length || 0;
      const primaryMaterial = analysisData.analysis?.primary_material || analysisData.primary_material;
      const priorityScore = analysisData.analysis?.cleanup_priority_score || analysisData.cleanup_priority_score;
      
      toast({
        title: 'Detection complete',
        description: detectionCount > 0 
          ? `Detected ${detectionCount} waste items with priority ${priorityScore}/10`
          : `Found ${primaryMaterial} waste with priority ${priorityScore}/10`,
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
    setDetections([]);
    setAnnotatedImage(null);
  };

  return (
    <Flex
      direction="column"
      h="full"
      bg="black"
      overflow="hidden"
      style={{ height: windowHeight }}
    >


      <Flex
        flex="1"
        direction="column"
        align="center"
        justify="center"
        bg="black"
        position="relative"
        overflow="auto"
        onScroll={handleScroll}

      >
        {console.log('Render check - capturedImage:', capturedImage ? 'SET' : 'NULL', 'submitted:', submitted, 'isAnalyzing:', isAnalyzing)}
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
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    facingMode: selectedDeviceId ? undefined : { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1440 },
                  }}
                  onUserMedia={handleUserMedia}
                  onUserMediaError={handleUserMediaError}
                  mirrored={false}
                />

                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />

                {liveDetectionError && !useFileUpload && !capturedImage && (
                  <Box
                    position="absolute"
                    top={4}
                    left={4}
                    zIndex={10}
                    bg="red.600"
                    color="white"
                    px={3}
                    py={2}
                    borderRadius="md"
                    shadow="lg"
                  >
                    <HStack spacing={2} align="center">
                      <Icon as={FiAlertCircle} />
                      <Text fontSize="xs">Live preview unavailable</Text>
                    </HStack>
                  </Box>
                )}

                {liveDetections.length > 0 && !useFileUpload && !capturedImage && !cameraError && (
                  <Badge
                    position="absolute"
                    top={4}
                    right={4}
                    zIndex={10}
                    colorScheme="green"
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                    bg="green.500"
                    color="white"
                  >
                    {`Live: ${liveDetections.length} ${liveDetections.length === 1 ? 'item' : 'items'}`}
                    {liveLatencyLabel ? ` • ${liveLatencyLabel}` : ''}
                  </Badge>
                )}

                {isFlashing && <Box position="absolute" inset={0} bg="white" opacity={0.7} pointerEvents="none" />}

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
              </Box>
            )}
          </>
        ) : (
          <Box w="full" h="full" position="relative">
            {/* Show annotated image with YOLO detections if available, otherwise original */}
            <Box as="img" 
              src={annotatedImage || capturedImage} 
              alt="Captured" 
              w="full" 
              h="full" 
              objectFit="cover" 
            />
            
            {/* Detection count badge */}
            {detections.length > 0 && !isAnalyzing && (
              <Badge
                position="absolute"
                top={4}
                right={4}
                colorScheme="green"
                fontSize="md"
                px={3}
                py={1}
                borderRadius="full"
              >
                {detections.length} item{detections.length !== 1 ? 's' : ''} detected
              </Badge>
            )}

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

                        {(locationName || locationCoordinatesLabel) && (
                          <Box p={3} bg="green.50" borderRadius="lg">
                            <HStack align="start" spacing={3}>
                              <Icon as={FiMapPin} color="green.600" mt={0.5} />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="semibold" color="green.700">Location</Text>
                                {locationName && (
                                  <Text fontSize="sm" color="green.900">{locationName}</Text>
                                )}
                                {locationDisplayName && locationDisplayName !== locationName && (
                                  <Text fontSize="xs" color="green.600">{locationDisplayName}</Text>
                                )}
                                {locationCoordinatesLabel && (
                                  <Text fontSize="xs" color="green.500">{locationCoordinatesLabel}</Text>
                                )}
                                {locationSourceLabel && (
                                  <Text fontSize="2xs" color="green.500">Source: {locationSourceLabel}</Text>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        )}
                        
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
      
      {/* Hidden file input - always rendered so ref is available */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </Flex>
  );
};

export default CameraPage;