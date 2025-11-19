import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Button,
  Input,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Divider,
  Icon
} from '@chakra-ui/react';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  
  const { login } = useAuth();
  const toast = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isSignUp && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (isSignUp) {
        result = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await authService.login(formData.email, formData.password);
      }
      
      if (result.success) {
        login(result.user, result.token);
        
        toast({
          title: isSignUp ? 'Account created!' : 'Welcome back!',
          description: result.message || (isSignUp ? 'Your EcoSynk account has been created.' : 'You have successfully signed in.'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        onClose();
        resetForm();
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: error.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setErrors({});
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isSignUp ? 'Join EcoSynk' : 'Welcome Back'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {isSignUp 
                ? 'Create your account to start making an environmental impact'
                : 'Sign in to access all EcoSynk features'
              }
            </Text>

            {isSignUp && (
              <FormControl isInvalid={errors.name}>
                <FormLabel>Full Name</FormLabel>
                <Input
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>
            )}

            <FormControl isInvalid={errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.password}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <Button
              w="full"
              colorScheme="brand"
              size="lg"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText={isSignUp ? 'Creating Account...' : 'Signing In...'}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <Divider />

            <HStack spacing={1}>
              <Text fontSize="sm" color="gray.600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Button variant="link" size="sm" onClick={switchMode}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;