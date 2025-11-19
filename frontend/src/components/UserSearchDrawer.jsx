import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  InputGroup,
  InputLeftElement,
  Input,
  VStack,
  HStack,
  Avatar,
  Text,
  Badge,
  Icon,
  Spinner,
  Box,
  useToast,
  Wrap,
  WrapItem,
  Divider
} from '@chakra-ui/react';
import { FiSearch, FiMapPin, FiAward, FiUsers } from 'react-icons/fi';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const DEBOUNCE_DELAY = 250;

const UserSearchDrawer = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localFollows, setLocalFollows] = useState({});

  // Keep a lightweight map of following status for quick lookups
  const followingMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(user?.following)) {
      user.following.forEach((id) => map.set(id, true));
    }
    return map;
  }, [user]);

  const handleDrawerClose = useCallback(() => {
    setQuery('');
    setResults([]);
    setError('');
    setLoading(false);
    setLocalFollows({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    setLoading(true);
    setError('');
    const controller = new AbortController();

    const handler = setTimeout(async () => {
      try {
        const response = await userService.searchUsers(trimmedQuery, 15);
        if (controller.signal.aborted) {
          return;
        }

        if (response.success) {
          const filtered = response.users.filter((candidate) => candidate.user_id !== user?.user_id);
          setResults(filtered);
          setError('');
        } else {
          setResults([]);
          setError(response.error || 'Unable to search users right now');
        }
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(searchError instanceof Error ? searchError.message : 'Unknown search error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      controller.abort();
      clearTimeout(handler);
    };
  }, [query, isOpen, user?.user_id]);

  const handleFollow = async (candidate) => {
    if (!token) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow people.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const result = await userService.followUser(candidate.name, token);
    if (result.success) {
      toast({
        title: 'Following',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setLocalFollows((prev) => ({
        ...prev,
        [candidate.user_id]: true
      }));
    } else {
      toast({
        title: 'Error',
        description: result.error,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const renderEmptyState = () => (
    <VStack spacing={4} py={12} color="neutral.500">
      <Icon as={FiSearch} boxSize={10} />
      <VStack spacing={1}>
        <Text fontWeight="600" color="neutral.200">
          Search eco allies
        </Text>
        <Text fontSize="sm">
          Type a name, skill, or material to discover people with similar expertise.
        </Text>
      </VStack>
    </VStack>
  );

  const renderResults = () => {
    if (loading) {
      return (
        <VStack spacing={4} py={12} color="neutral.400">
          <Spinner color="brand.500" />
          <Text>Finding people who match your vibe...</Text>
        </VStack>
      );
    }

    if (error) {
      return (
        <VStack spacing={2} py={8} color="red.400">
          <Text fontWeight="600">Search unavailable</Text>
          <Text fontSize="sm">{error}</Text>
        </VStack>
      );
    }

    if (!query.trim()) {
      return renderEmptyState();
    }

    if (results.length === 0) {
      return (
        <VStack spacing={2} py={8} color="neutral.400">
          <Text fontWeight="600">No matches yet</Text>
          <Text fontSize="sm">Try another keyword or explore different skills.</Text>
        </VStack>
      );
    }

    return (
      <VStack spacing={3} align="stretch">
        {results.map((candidate) => {
          const isFollowing = !!(localFollows[candidate.user_id] || followingMap.get(candidate.user_id));
          const matchLabel = candidate.match_type === 'keyword' ? 'Name match' : 'Similarity match';
          const matchTone = candidate.match_type === 'keyword' ? 'green' : 'purple';
          const matchScore = typeof candidate.match_score === 'number' ? Math.round(candidate.match_score) : null;

          return (
            <Box
              key={candidate.user_id}
              bg="neutral.800"
              px={4}
              py={3}
              borderWidth="1px"
              borderColor="neutral.700"
              rounded="lg"
              _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)' }}
              transition="all 0.2s"
            >
              <HStack align="start" spacing={3}>
                <Avatar
                  name={candidate.name}
                  src={candidate.profile_picture_url}
                  bg="brand.500"
                  color="neutral.900"
                  size="md"
                />
                <VStack align="stretch" spacing={2} flex={1}>
                  <HStack justify="space-between" align="start">
                    <VStack spacing={0} align="start">
                      <Text fontWeight="600" color="neutral.50">
                        {candidate.name || 'EcoSynk Member'}
                      </Text>
                      {candidate.city && (
                        <HStack spacing={1} fontSize="xs" color="neutral.500">
                          <Icon as={FiMapPin} />
                          <Text>{candidate.city}</Text>
                        </HStack>
                      )}
                    </VStack>
                    <VStack spacing={1} align="end">
                      <Badge colorScheme={matchTone} fontSize="xs">
                        {matchScore !== null ? `${matchScore}% · ${matchLabel}` : matchLabel}
                      </Badge>
                      {candidate.experience_level && (
                        <Badge colorScheme="purple" fontSize="xs" textTransform="capitalize">
                          <Icon as={FiAward} mr={1} />
                          {candidate.experience_level}
                        </Badge>
                      )}
                    </VStack>
                  </HStack>

                  {candidate.bio && (
                    <Text fontSize="sm" color="neutral.300" noOfLines={2}>
                      {candidate.bio}
                    </Text>
                  )}

                  {(candidate.interests?.length || candidate.skills?.length || candidate.materials_expertise?.length) && (
                    <Wrap spacing={1}>
                      {candidate.interests?.slice(0, 3).map((interest, index) => (
                        <WrapItem key={`interest-${candidate.user_id}-${index}`}>
                          <Badge bg="neutral.700" color="brand.300" fontSize="0.65rem">
                            #{interest}
                          </Badge>
                        </WrapItem>
                      ))}
                      {candidate.skills?.slice(0, 3).map((skill, index) => (
                        <WrapItem key={`skill-${candidate.user_id}-${index}`}>
                          <Badge bg="neutral.700" color="neutral.200" fontSize="0.65rem">
                            {skill}
                          </Badge>
                        </WrapItem>
                      ))}
                      {candidate.materials_expertise?.slice(0, 2).map((material, index) => (
                        <WrapItem key={`material-${candidate.user_id}-${index}`}>
                          <Badge bg="neutral.700" color="blue.300" fontSize="0.65rem">
                            {material}
                          </Badge>
                        </WrapItem>
                      ))}
                    </Wrap>
                  )}

                  {candidate.stats && (
                    <HStack spacing={4} fontSize="xs" color="neutral.500">
                      <HStack spacing={1}>
                        <Icon as={FiUsers} />
                        <Text>{candidate.stats.campaigns_joined || 0} campaigns</Text>
                      </HStack>
                      <Divider orientation="vertical" borderColor="neutral.700" />
                      <Text>{candidate.total_cleanups || 0} cleanups</Text>
                    </HStack>
                  )}

                  {user && candidate.name && !isFollowing && (
                    <Box>
                      <Text
                        as="button"
                        fontSize="sm"
                        color="brand.400"
                        fontWeight="600"
                        onClick={() => handleFollow(candidate)}
                      >
                        Follow
                      </Text>
                    </Box>
                  )}
                  {user && isFollowing && (
                    <Text fontSize="xs" color="neutral.500">Already following</Text>
                  )}
                </VStack>
              </HStack>
            </Box>
          );
        })}
      </VStack>
    );
  };

  return (
    <Drawer placement="top" isOpen={isOpen} onClose={handleDrawerClose} size="xl">
      <DrawerOverlay />
      <DrawerContent bg="neutral.900" borderBottomWidth="1px" borderColor="neutral.700">
        <DrawerCloseButton color="neutral.400" />
        <DrawerHeader borderBottomWidth="1px" borderColor="neutral.700">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="neutral.500" />
            </InputLeftElement>
            <Input
              placeholder="Search by name, skills, or interests"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (!value.trim()) {
                  setResults([]);
                  setError('');
                  setLoading(false);
                }
              }}
              autoFocus
              bg="neutral.800"
              borderColor="neutral.700"
              _hover={{ borderColor: 'brand.500' }}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px rgba(47, 212, 99, 0.35)' }}
            />
          </InputGroup>
        </DrawerHeader>
        <DrawerBody>{renderResults()}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default UserSearchDrawer;
