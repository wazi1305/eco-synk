import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Badge,
  Card,
  Heading,
  Icon,
  Spinner,
  useToast,
  Tooltip,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FiUsers, FiMapPin, FiAward, FiTrendingUp } from 'react-icons/fi';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const RecommendedUsers = ({ limit = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});
  const { user, token } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (user && token) {
      loadRecommendations();
    }
  }, [user, token]);

  const loadRecommendations = async () => {
    setLoading(true);
    const result = await userService.getRecommendedUsers(limit, token);
    if (result.success) {
      setRecommendations(result.recommendations);
      
      // Initialize following states
      const states = {};
      result.recommendations.forEach(rec => {
        states[rec.user_id] = userService.isFollowing(user, rec.user_id);
      });
      setFollowingStates(states);
    }
    setLoading(false);
  };

  const handleFollow = async (userName, userId) => {
    const result = await userService.followUser(userName, token);
    
    if (result.success) {
      setFollowingStates(prev => ({
        ...prev,
        [userId]: true
      }));
      
      toast({
        title: 'Success',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Refresh recommendations
      loadRecommendations();
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

  if (!user) return null;

  if (loading) {
    return (
      <Card bg="neutral.800" p={6}>
        <VStack spacing={4}>
          <Spinner color="brand.500" />
          <Text color="neutral.400">Finding people you might know...</Text>
        </VStack>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card bg="neutral.800" p={6}>
        <VStack spacing={3}>
          <Icon as={FiUsers} boxSize={8} color="neutral.600" />
          <Text color="neutral.400">No recommendations available</Text>
        </VStack>
      </Card>
    );
  }

  return (
    <Card bg="neutral.800" p={6}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="md" color="neutral.50">
            <Icon as={FiUsers} mr={2} color="brand.500" />
            People You May Know
          </Heading>
          <Tooltip label="Powered by AI vector similarity">
            <Icon as={FiTrendingUp} color="brand.500" cursor="help" />
          </Tooltip>
        </HStack>

        <VStack spacing={3} align="stretch">
          {recommendations.map((rec) => {
            const isFollowing = followingStates[rec.user_id];
            const score = rec.recommendation_score || 0;
            const factors = rec.recommendation_factors || {};

            return (
              <Card
                key={rec.user_id}
                bg="neutral.700"
                p={4}
                borderWidth="1px"
                borderColor="neutral.600"
                _hover={{ borderColor: 'brand.500', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <HStack spacing={3} align="start">
                  <Avatar
                    name={rec.name}
                    src={rec.profile_picture_url}
                    size="md"
                    bg="brand.500"
                    color="neutral.900"
                  />

                  <VStack flex={1} align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600" color="neutral.50">
                          {rec.name}
                        </Text>
                        {rec.city && (
                          <HStack spacing={1} fontSize="xs" color="neutral.400">
                            <Icon as={FiMapPin} />
                            <Text>{rec.city}</Text>
                          </HStack>
                        )}
                      </VStack>

                      <VStack align="end" spacing={1}>
                        <Tooltip label={`Match Score: ${score.toFixed(0)}%`}>
                          <Badge
                            colorScheme={score >= 70 ? 'green' : score >= 50 ? 'blue' : 'gray'}
                            fontSize="xs"
                          >
                            {score.toFixed(0)}% Match
                          </Badge>
                        </Tooltip>
                        {rec.experience_level && (
                          <Badge
                            colorScheme="purple"
                            fontSize="xs"
                            textTransform="capitalize"
                          >
                            <Icon as={FiAward} mr={1} />
                            {rec.experience_level}
                          </Badge>
                        )}
                      </VStack>
                    </HStack>

                    {rec.bio && (
                      <Text fontSize="sm" color="neutral.300" noOfLines={2}>
                        {rec.bio}
                      </Text>
                    )}

                    {/* Show top matching factors */}
                    {(rec.skills?.length > 0 || rec.interests?.length > 0 || rec.materials_expertise?.length > 0) && (
                      <Wrap spacing={1} mt={1}>
                        {rec.interests?.slice(0, 2).map((interest, i) => (
                          <WrapItem key={`interest-${i}`}>
                            <Badge size="sm" bg="neutral.600" color="neutral.300" fontSize="xs">
                              {interest}
                            </Badge>
                          </WrapItem>
                        ))}
                        {rec.skills?.slice(0, 2).map((skill, i) => (
                          <WrapItem key={`skill-${i}`}>
                            <Badge size="sm" bg="neutral.600" color="brand.300" fontSize="xs">
                              {skill}
                            </Badge>
                          </WrapItem>
                        ))}
                        {rec.materials_expertise?.slice(0, 2).map((material, i) => (
                          <WrapItem key={`material-${i}`}>
                            <Badge size="sm" bg="neutral.600" color="blue.300" fontSize="xs">
                              {material}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    )}

                    {/* Match factors breakdown */}
                    {factors.vector_similarity > 0 && (
                      <HStack spacing={2} fontSize="xs" color="neutral.500" flexWrap="wrap">
                        {factors.vector_similarity > 50 && (
                          <Text>✨ Similar interests</Text>
                        )}
                        {factors.location_match > 0 && (
                          <Text>📍 Same city</Text>
                        )}
                        {factors.common_skills > 0 && (
                          <Text>🛠️ Common skills</Text>
                        )}
                        {factors.experience_compatibility > 10 && (
                          <Text>🎯 Similar experience</Text>
                        )}
                      </HStack>
                    )}

                    <HStack spacing={2} mt={2}>
                      <Button
                        size="sm"
                        bg={isFollowing ? 'neutral.600' : 'brand.500'}
                        color={isFollowing ? 'neutral.300' : 'neutral.900'}
                        _hover={{
                          bg: isFollowing ? 'neutral.500' : 'brand.600'
                        }}
                        onClick={() => handleFollow(rec.name, rec.user_id)}
                        isDisabled={isFollowing}
                        leftIcon={<Icon as={FiUsers} />}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="neutral.400"
                        _hover={{ bg: 'neutral.600', color: 'neutral.200' }}
                      >
                        View Profile
                      </Button>
                    </HStack>
                  </VStack>
                </HStack>
              </Card>
            );
          })}
        </VStack>

        {recommendations.length >= limit && (
          <Button
            variant="outline"
            size="sm"
            borderColor="neutral.600"
            color="neutral.300"
            _hover={{ borderColor: 'brand.500', color: 'brand.500' }}
            onClick={loadRecommendations}
          >
            Show More
          </Button>
        )}
      </VStack>
    </Card>
  );
};

export default RecommendedUsers;
