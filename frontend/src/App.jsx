import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Flex,
  IconButton,
  VStack,
  HStack,
  Tooltip,
  Heading,
  Text,
} from '@chakra-ui/react';
import {
  FiHome,
  FiShare2,
  FiCamera,
  FiMap,
  FiUser,
  FiCompass,
} from 'react-icons/fi';
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import FeedPage from './components/FeedPage';
import CameraPage from './components/CameraPage';
import MapPage from './components/MapPage';
import ProfilePage from './components/ProfilePage';
import CampaignsPage from './components/campaigns/CampaignsPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NavigationPage from './components/NavigationPage';

function App() {
  const [windowHeight, setWindowHeight] = useState('100vh');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Simulate app initialization (replace with actual loading logic)
  useEffect(() => {
    const initializeApp = async () => {
      // Simulate loading time for splash screen (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Add any actual initialization logic here:
      // - Check authentication
      // - Load user preferences
      // - Initialize services
      // - Fetch initial data
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Get current active tab from route
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/nav') return 'nav';
    if (path === '/feed') return 'feed';
    if (path === '/campaigns') return 'campaigns';
    if (path === '/report') return 'camera';
    if (path === '/map') return 'map';
    if (path === '/profile') return 'profile';
    return 'nav';
  };

  const activeTab = getCurrentTab();

  // Handle mobile viewport height issues
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
      setWindowHeight(`${window.innerHeight}px`);
    };
    
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  const tabs = [
    { id: 'nav', label: 'Explore', icon: FiCompass, path: '/nav' },
    { id: 'feed', label: 'Feed', icon: FiHome, path: '/feed' },
    { id: 'campaigns', label: 'Campaigns', icon: FiShare2, path: '/campaigns' },
    { id: 'camera', label: 'Report', icon: FiCamera, path: '/report' },
    { id: 'map', label: 'Map', icon: FiMap, path: '/map' },
    { id: 'profile', label: 'Profile', icon: FiUser, path: '/profile' },
  ];

  // Navigation handler
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return (

    <Flex
      direction="column"
      bg="neutral.900"
      height={windowHeight}
      className="app-container safe-area-inset"
      position="relative"
    >

    <AuthProvider>
      <Flex
        direction="column"
        bg="gray.50"
        height={windowHeight}
        className="app-container safe-area-inset"
      >
      {/* Main Content Area */}
      <Box 
        flex="1" 
        overflowY="auto" 
        overflowX="hidden"
        position="relative"
        pb="80px" // Add padding for floating bottom nav
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/nav" replace />} />
          <Route path="/nav" element={<NavigationPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/report" element={<CameraPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/nav" replace />} />
        </Routes>
      </Box>

      {/* Floating Bottom Navigation - Futuristic glass morphism design */}
      <Box
        position="fixed"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={100}
        maxW="480px"
        w="calc(100% - 32px)"
      >
        <Box
          bg="rgba(21, 21, 21, 0.8)"
          backdropFilter="blur(20px) saturate(180%)"
          border="1px solid"
          borderColor="neutral.700"
          borderRadius="20px"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(47, 212, 99, 0.2)"
          p={2}
        >
          <HStack
            spacing={1}
            justify="space-around"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Tooltip 
                  key={tab.id} 
                  label={tab.label} 
                  placement="top"
                  bg="neutral.800"
                  color="neutral.50"
                  borderRadius="8px"
                  fontSize="xs"
                  hasArrow
                >
                  <Box
                    as="button"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    p={2.5}
                    flex={1}
                    cursor="pointer"
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    color={isActive ? 'brand.500' : 'neutral.400'}
                    bg={isActive ? 'rgba(47, 212, 99, 0.1)' : 'transparent'}
                    borderRadius="14px"
                    position="relative"
                    _hover={{
                      color: isActive ? 'brand.400' : 'neutral.200',
                      bg: isActive ? 'rgba(47, 212, 99, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      transform: 'translateY(-2px)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    onClick={() => handleNavigation(tab.path)}
                    aria-label={tab.label}
                  >
                    {/* Active indicator dot */}
                    {isActive && (
                      <Box
                        position="absolute"
                        top={1}
                        w="4px"
                        h="4px"
                        bg="brand.500"
                        borderRadius="full"
                        boxShadow="0 0 8px rgba(47, 212, 99, 0.6)"
                      />
                    )}
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <Box 
                      as="span" 
                      fontSize="10px" 
                      fontWeight={isActive ? 600 : 500} 
                      mt={1}
                      letterSpacing="0.02em"
                    >
                      {tab.label}
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}
          </HStack>
        </Box>
      </Box>
      </Flex>
    </AuthProvider>
  );
}

export default App;