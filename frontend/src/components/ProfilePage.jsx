import React from 'react';
import { Box, Flex, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Flex direction="column" h="full" bg="gray.50" justify="center" align="center" p={6}>
        <VStack spacing={6}>
          <Icon as={FiUser} boxSize={12} color="brand.500" />
          <Text fontSize="xl" fontWeight="bold">Sign in to view your profile</Text>
          <Button colorScheme="brand">Sign In</Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>Profile</Text>
      <Text>Welcome to your profile page!</Text>
    </Box>
  );
};

export default ProfilePage;