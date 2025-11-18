import React, { useState, useEffect } from 'react';
import volunteerService from '../../services/volunteerService';

const FriendInviteModal = ({ campaign, onClose, onInvite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [invitationMessage, setInvitationMessage] = useState(
    `Join me for ${campaign.title}! Let's make a difference together.`
  );
  const [inviteMethod, setInviteMethod] = useState('message');
  const [isInviting, setIsInviting] = useState(false);
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const response = await volunteerService.getLeaderboard(20);
        if (response.success) {
          const volunteerList = response.leaderboard.map((volunteer, index) => ({
            id: volunteer.user_id || `volunteer_${index}`,
            name: volunteer.name,
            avatar: volunteer.name.charAt(0).toUpperCase(),
            status: Math.random() > 0.7 ? 'invited' : (Math.random() > 0.8 ? 'joined' : 'none'),
            cleanups: volunteer.past_cleanup_count,
            badge: volunteer.badge
          }));
          setVolunteers(volunteerList);
        }
      } catch (error) {
        console.error('Failed to load volunteers:', error);
        // Fallback to empty array on error
        setVolunteers([]);
      }
    };

    loadVolunteers();
  }, []);

  const filteredFriends = volunteers.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFriend = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const toggleAllFriends = () => {
    if (selectedFriends.length === filteredFriends.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(filteredFriends.map((f) => f.id));
    }
  };

  const handleInvite = async () => {
    if (selectedFriends.length === 0) return;

    setIsInviting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const selectedFriendNames = volunteers
        .filter((f) => selectedFriends.includes(f.id))
        .map((f) => f.name);

      onInvite(selectedFriendNames, invitationMessage, inviteMethod);
    } finally {
      setIsInviting(false);
    }
  };

  const selectedFriendsData = volunteers.filter((f) => selectedFriends.includes(f.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto safe-area-inset">
      <div className="min-h-screen flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto animate-slide-up max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-900">Invite Friends</h2>
            <button
              onClick={onClose}
              disabled={isInviting}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Campaign Info */}
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-1">Inviting to:</p>
              <p className="text-lg font-bold text-gray-900">{campaign.title}</p>
              <p className="text-xs text-gray-600 mt-1">📍 {campaign.location.address}</p>
            </div>

            {/* Search Bar */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Search Friends</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none font-medium"
              />
            </div>

            {/* Select All Button */}
            <div>
              <button
                onClick={toggleAllFriends}
                disabled={isInviting}
                className="w-full flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-900 transition-colors disabled:opacity-50"
              >
                {selectedFriends.length === filteredFriends.length && filteredFriends.length > 0
                  ? '✓ Unselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Friends List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-sm">No friends found</p>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    disabled={isInviting}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      selectedFriends.includes(friend.id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-400'
                    }`}
                  >
                    <div className="flex-1 flex items-center text-left">
                      <span className="text-xl mr-3">{friend.avatar}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{friend.name}</p>
                        <p className="text-xs text-gray-500">
                          {friend.status === 'joined'
                            ? '✅ Already joined'
                            : friend.status === 'invited'
                            ? '📨 Invited'
                            : 'Not invited'}
                        </p>
                      </div>
                    </div>
                    {selectedFriends.includes(friend.id) && (
                      <span className="text-green-600 font-bold text-lg">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Selected Friends Summary */}
            {selectedFriendsData.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 font-semibold mb-2">Selected: {selectedFriendsData.length}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedFriendsData.map((friend) => (
                    <span key={friend.id} className="bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {friend.avatar} {friend.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Invitation Message */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Invitation Message</label>
              <textarea
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                disabled={isInviting}
                rows="3"
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none font-medium resize-none disabled:opacity-50"
              />
              <p className="text-xs text-gray-600 mt-1">{invitationMessage.length}/160 characters</p>
            </div>

            {/* Invite Method */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Share Via</label>
              <div className="space-y-2">
                {[
                  { id: 'message', label: '💬 Direct Message', icon: 'Direct message through app' },
                  { id: 'link', label: '🔗 Shareable Link', icon: 'Generate campaign link' },
                  { id: 'social', label: '📱 Social Media', icon: 'Share to social networks' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-400 transition-colors"
                  >
                    <input
                      type="radio"
                      name="inviteMethod"
                      value={method.id}
                      checked={inviteMethod === method.id}
                      onChange={(e) => setInviteMethod(e.target.value)}
                      disabled={isInviting}
                      className="w-4 h-4"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-semibold text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-600">{method.icon}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Send Invitations Button */}
            <button
              onClick={handleInvite}
              disabled={selectedFriendsData.length === 0 || isInviting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold transition-all duration-200 min-h-12"
            >
              {isInviting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </div>
              ) : (
                `📨 Send to ${selectedFriendsData.length} Friend${selectedFriendsData.length !== 1 ? 's' : ''}`
              )}
            </button>

            {/* Info Text */}
            <p className="text-xs text-gray-600 text-center pb-4">
              ✓ Invitations can be customized for each friend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendInviteModal;
