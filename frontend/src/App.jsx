import React, { useState, useEffect } from 'react';
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
import FeedPage from './components/FeedPage';
import CameraPage from './components/CameraPage';
import MapPage from './components/MapPage';
import ProfilePage from './components/ProfilePage';
import CampaignsPage from './components/campaigns/CampaignsPage';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [windowHeight, setWindowHeight] = useState('100vh');

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
    { id: 'feed', label: 'Feed', icon: FiHome },
    { id: 'campaigns', label: 'Campaigns', icon: FiShare2 },
    { id: 'camera', label: 'Report', icon: FiCamera },
    { id: 'map', label: 'Map', icon: FiMap },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedPage />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'camera':
        return <CameraPage />;
      case 'map':
        return <MapPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <Flex
      direction="column"
      bg="gray.50"
      height={windowHeight}
      className="app-container safe-area-inset"
    >
      {/* Main Content Area */}
      <Box flex="1" overflow="hidden" position="relative">
        {renderContent()}
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
                  onClick={() => setActiveTab(tab.id)}
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