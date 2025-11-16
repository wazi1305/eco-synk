import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
} from 'react-icons/fi';
import SplashScreen from './components/SplashScreen';
import FeedPage from './components/FeedPage';
import CameraPage from './components/CameraPage';
import MapPage from './components/MapPage';
import ProfilePage from './components/ProfilePage';
import CampaignsPage from './components/campaigns/CampaignsPage';

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
    if (path === '/' || path === '/feed') return 'feed';
    if (path === '/campaigns') return 'campaigns';
    if (path === '/report') return 'camera';
    if (path === '/map') return 'map';
    if (path === '/profile') return 'profile';
    return 'feed';
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
      bg="gray.50"
      height={windowHeight}
      className="app-container safe-area-inset"
    >
      {/* Main Content Area */}
      <Box flex="1" overflow="hidden" position="relative">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/report" element={<CameraPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Box>

      {/* Bottom Navigation - Fixed at bottom with safe areas */}
      <Box
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        className="safe-area-inset-bottom"
        flexShrink={0}
        overflowX="auto"
        boxShadow="0 -1px 3px rgba(0, 0, 0, 0.1)"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={50}
      >
        <HStack
          spacing={0}
          h="16"
          minW="max-content"
          justify="space-around"
          px={2}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Tooltip key={tab.id} label={tab.label} placement="top">
                <Box
                  as="button"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  p={2}
                  flex={1}
                  minH="16"
                  minW="14"
                  cursor="pointer"
                  transition="all 0.2s"
                  color={isActive ? 'brand.600' : 'gray.500'}
                  _hover={{
                    color: 'brand.500',
                  }}
                  _active={{
                    bg: 'gray.100',
                  }}
                  onClick={() => handleNavigation(tab.path)}
                  aria-label={tab.label}
                  borderRadius="md"
                >
                  <Icon size={24} style={{ marginBottom: '0.25rem' }} />
                  <Box as="span" fontSize="xs" fontWeight="600" mt={1}>
                    {tab.label}
                  </Box>
                </Box>
              </Tooltip>
            );
          })}
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;