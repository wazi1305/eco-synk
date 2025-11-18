import React from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  keyframes,
  Flex,
} from '@chakra-ui/react';

// Futuristic animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(47, 212, 99, 0.4),
                0 0 40px rgba(47, 212, 99, 0.2),
                0 0 60px rgba(47, 212, 99, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(47, 212, 99, 0.6),
                0 0 60px rgba(47, 212, 99, 0.3),
                0 0 90px rgba(47, 212, 99, 0.2);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
`;

const progressSlide = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(500%);
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
      bg="neutral.900"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      className="safe-area-inset"
      overflow="hidden"
    >
      {/* Animated Background Gradients */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        w="200%"
        h="200%"
        bgGradient="radial(circle at 30% 50%, rgba(47, 212, 99, 0.1), transparent 50%)"
        animation={`${rotate} 20s linear infinite`}
      />
      <Box
        position="absolute"
        bottom="-50%"
        right="-50%"
        w="200%"
        h="200%"
        bgGradient="radial(circle at 70% 50%, rgba(47, 212, 99, 0.08), transparent 50%)"
        animation={`${rotate} 25s linear infinite reverse`}
      />

      <VStack spacing={10} textAlign="center" position="relative" zIndex={1}>
        {/* Futuristic Logo Design */}
        <VStack
          spacing={8}
          animation={`${fadeInUp} 0.8s ease-out`}
        >
          {/* Logo Container with Glow Effect */}
          <Box position="relative">
            {/* Outer Glow Rings */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="140px"
              h="140px"
              borderRadius="full"
              border="1px solid"
              borderColor="brand.500"
              opacity={0.2}
              animation={`${pulse} 3s ease-in-out infinite`}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="110px"
              h="110px"
              borderRadius="full"
              border="1px solid"
              borderColor="brand.500"
              opacity={0.3}
              animation={`${pulse} 2s ease-in-out infinite 0.5s`}
            />

            {/* Main Logo Circle */}
            <Flex
              w="80px"
              h="80px"
              borderRadius="full"
              bg="rgba(47, 212, 99, 0.1)"
              backdropFilter="blur(10px)"
              border="2px solid"
              borderColor="brand.500"
              align="center"
              justify="center"
              animation={`${glow} 2s ease-in-out infinite`}
              position="relative"
            >
              {/* Inner Icon - Stylized Leaf */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 8 C20 8, 32 12, 32 24 C32 30, 26 35, 20 35 C20 35, 20 20, 20 8Z"
                  fill="url(#leafGradient)"
                  opacity="0.9"
                />
                <path
                  d="M20 8 C20 8, 8 12, 8 24 C8 30, 14 35, 20 35"
                  fill="url(#leafGradient2)"
                  opacity="0.6"
                />
                <defs>
                  <linearGradient id="leafGradient" x1="20" y1="8" x2="32" y2="35" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2fd463" />
                    <stop offset="1" stopColor="#26b954" />
                  </linearGradient>
                  <linearGradient id="leafGradient2" x1="20" y1="8" x2="8" y2="35" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2fd463" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#1e9c45" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </svg>
            </Flex>
          </Box>
          
          {/* Brand Name with Gradient */}
          <VStack spacing={2}>
            <Heading
              as="h1"
              fontSize={{ base: "4xl", md: "5xl" }}
              fontWeight="700"
              letterSpacing="-0.03em"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
              textAlign="center"
            >
              EcoSynk
            </Heading>
            
            {/* Tagline */}
            <Text
              fontSize="md"
              color="neutral.300"
              fontWeight="400"
              maxW="320px"
              lineHeight="1.6"
              textAlign="center"
              letterSpacing="0.01em"
            >
              Transform waste into impact. Powered by AI.
            </Text>
          </VStack>
        </VStack>

        {/* Modern Loading Indicator */}
        <VStack spacing={4} mt={8}>
          {/* Animated Progress Bar */}
          <Box 
            w="200px" 
            h="3px" 
            bg="rgba(129, 130, 129, 0.2)" 
            borderRadius="full" 
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              h="full"
              w="40%"
              bgGradient="linear(to-r, transparent, brand.500, brand.400, brand.500, transparent)"
              borderRadius="full"
              animation={`${progressSlide} 1.5s ease-in-out infinite`}
              boxShadow="0 0 12px rgba(47, 212, 99, 0.6)"
            />
          </Box>
          <Text
            fontSize="xs"
            color="neutral.400"
            fontWeight="500"
            letterSpacing="0.1em"
            textTransform="uppercase"
          >
            Initializing
          </Text>
        </VStack>
      </VStack>

      {/* Minimal Geometric Accents */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="2px"
        h="60px"
        bg="brand.500"
        opacity={0.1}
        transform="rotate(45deg)"
      />
      <Box
        position="absolute"
        top="15%"
        right="12%"
        w="40px"
        h="2px"
        bg="brand.500"
        opacity={0.1}
      />
      <Box
        position="absolute"
        bottom="20%"
        left="15%"
        w="2px"
        h="40px"
        bg="brand.500"
        opacity={0.15}
      />
      <Box
        position="absolute"
        bottom="25%"
        right="10%"
        w="30px"
        h="30px"
        border="2px solid"
        borderColor="brand.500"
        opacity={0.1}
        borderRadius="4px"
        transform="rotate(15deg)"
      />
    </Box>
  );
};

export default SplashScreen;