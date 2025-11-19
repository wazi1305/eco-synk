import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  Text,
  Button,
  Divider
} from '@chakra-ui/react';

const AuthModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="md">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Demo Account Active</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            Manual sign in is disabled for the current build. The dashboard automatically authenticates
            using the demo credentials:
          </Text>
          <Divider />
          <VStack spacing={1} align="stretch">
            <Text fontWeight="600">Email: ryanballoo@gmail.com</Text>
            <Text fontWeight="600">Password: StrongPass</Text>
          </VStack>
          <Text fontSize="sm" color="gray.600">
            If something looks out of sync, close this dialog and use the refresh action to re-establish the
            session.
          </Text>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="brand" onClick={onClose} w="full">
          Got it
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default AuthModal;