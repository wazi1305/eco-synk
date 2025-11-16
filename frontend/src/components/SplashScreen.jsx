import React from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  keyframes,
} from '@chakra-ui/react';

// Animation for the logo/brand name
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const SplashScreen = () => {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bgGradient="linear(135deg, brand.500 0%, brand.600 50%, brand.700 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      className="safe-area-inset"
    >
      <VStack spacing={8} textAlign="center">
        {/* Main Logo/Brand */}
        <VStack
          spacing={6}
          animation={`${fadeInUp} 0.8s ease-out`}
        >
          {/* Modern Logo Design */}
          <Box position="relative">
            {/* Outer Circle */}
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              bg="whiteAlpha.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
              animation={`${pulse} 2s ease-in-out infinite`}
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                w: '60px',
                h: '60px',
                borderRadius: 'full',
                bg: 'white',
                opacity: 0.3,
              }}
            >
              {/* Inner Design */}
              <VStack spacing={1}>
                <Box w="20px" h="2px" bg="white" borderRadius="full" />
                <Box w="16px" h="2px" bg="white" borderRadius="full" />
                <Box w="12px" h="2px" bg="white" borderRadius="full" />
              </VStack>
            </Box>
          </Box>
          
          {/* Brand Name */}
          <Heading
            as="h1"
            size="2xl"
            color="white"
            fontWeight="300"
            letterSpacing="wide"
            textAlign="center"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            ECO-SYNK
          </Heading>
          
          {/* Tagline */}
          <Text
            fontSize="md"
            color="whiteAlpha.800"
            fontWeight="300"
            maxW="280px"
            lineHeight="1.6"
            textAlign="center"
            letterSpacing="wide"
          >
            Connect. Clean. Create Change.
          </Text>
        </VStack>

        {/* Loading Spinner */}
        <VStack spacing={6} mt={12}>
          <Spinner
            size="md"
            color="whiteAlpha.700"
            thickness="2px"
            speed="1s"
          />
          <Text
            fontSize="xs"
            color="whiteAlpha.600"
            fontWeight="300"
            letterSpacing="widest"
            textTransform="uppercase"
          >
            Loading
          </Text>
        </VStack>
      </VStack>

      {/* Subtle Geometric Background Elements */}
      <Box
        position="absolute"
        top="15%"
        left="10%"
        w="40px"
        h="40px"
        borderRadius="full"
        bg="whiteAlpha.100"
        animation={`${fadeInUp} 1.2s ease-out`}
      />
      <Box
        position="absolute"
        top="25%"
        right="15%"
        w="6px"
        h="6px"
        borderRadius="full"
        bg="whiteAlpha.300"
        animation={`${fadeInUp} 1.4s ease-out`}
      />
      <Box
        position="absolute"
        bottom="30%"
        left="20%"
        w="12px"
        h="12px"
        borderRadius="full"
        bg="whiteAlpha.200"
        animation={`${fadeInUp} 1.6s ease-out`}
      />
      <Box
        position="absolute"
        bottom="20%"
        right="10%"
        w="20px"
        h="20px"
        borderRadius="full"
        bg="whiteAlpha.150"
        animation={`${fadeInUp} 1.8s ease-out`}
      />
    </Box>
  );
};

export default SplashScreen;