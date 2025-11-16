import React, { useState } from 'react';

const CampaignManager = ({ campaign, onClose, onPublish }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [updateText, setUpdateText] = useState('');
  const mockTime = new Date();
  mockTime.setHours(mockTime.getHours() - 24);

  const [updates, setUpdates] = useState([
    {
      id: '1',
      author: { name: 'You', avatar: '👤' },
      text: 'Campaign just launched! Help us reach 50 volunteers.',
      timestamp: mockTime,
      likes: 12,
    },
  ]);

  const fundingPercent = Math.min(
    (campaign.funding.current / campaign.funding.goal) * 100,
    100
  );

  const volunteersPercent = Math.min(
    (campaign.volunteers.length / campaign.volunteerGoal) * 100,
    100
  );

  const handlePostUpdate = () => {
    if (updateText.trim()) {
      const newUpdate = {
        id: Date.now().toString(),
        author: { name: 'You', avatar: '👤' },
        text: updateText,
        timestamp: new Date(),
        likes: 0,
      };
      setUpdates([newUpdate, ...updates]);
      setUpdateText('');
    }
  };

  const handleLikeUpdate = (id) => {
    setUpdates(
      updates.map((update) =>
        update.id === id ? { ...update, likes: update.likes + 1 } : update
      )
    );
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffHours = Math.floor((now - date) / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto safe-area-inset">
      <div className="min-h-screen flex items-end">
        <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto animate-slide-up max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-900">Campaign Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            {/* Campaign Status */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg mb-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                  {campaign.status === 'draft' ? '📝 Draft' : '🚀 Active'}
                </div>
              </div>
              <p className="text-xs text-gray-600">📍 {campaign.location.address}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{campaign.volunteers.length}</div>
                <div className="text-xs text-gray-600 font-semibold">Volunteers</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                <div className="text-2xl font-bold text-green-600">${campaign.funding.current}</div>
                <div className="text-xs text-gray-600 font-semibold">Raised</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{updates.length}</div>
                <div className="text-xs text-gray-600 font-semibold">Updates</div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === 'updates'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Updates
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Analytics
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Volunteer Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900">Volunteer Progress</h4>
                      <span className="text-sm font-bold text-blue-600">
                        {campaign.volunteers.length}/{campaign.volunteerGoal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${volunteersPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900">Funding Progress</h4>
                      <span className="text-sm font-bold text-green-600">
                        ${campaign.funding.current}/${campaign.funding.goal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${fundingPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Recent Participants</h4>
                    <div className="space-y-2">
                      {campaign.volunteers.slice(0, 3).map((vol, idx) => (
                        <div key={idx} className="flex items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-lg mr-2">{vol.avatar}</span>
                          <span className="font-medium text-gray-900">{vol.name}</span>
                        </div>
                      ))}
                      {campaign.volunteers.length > 3 && (
                        <p className="text-xs text-gray-600 text-center py-2">
                          +{campaign.volunteers.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'updates' && (
                <div className="space-y-4">
                  {/* Post Update Form */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <textarea
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      placeholder="Share an update about your campaign..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-sm font-medium resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handlePostUpdate}
                        disabled={!updateText.trim()}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg font-bold transition-all text-sm"
                      >
                        Post Update
                      </button>
                    </div>
                  </div>

                  {/* Updates List */}
                  <div className="space-y-3">
                    {updates.map((update) => (
                      <div key={update.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{update.author.avatar}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{update.author.name}</p>
                              <p className="text-xs text-gray-600">{formatDate(update.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{update.text}</p>
                        <button
                          onClick={() => handleLikeUpdate(update.id)}
                          className="text-xs text-gray-600 hover:text-green-600 font-medium"
                        >
                          ❤️ {update.likes} Likes
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <span className="text-3xl mr-3">👥</span>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Volunteer Engagement</p>
                        <p className="text-2xl font-bold text-blue-600">{Math.round(volunteersPercent)}%</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {campaign.volunteers.length} of {campaign.volunteerGoal} volunteers
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <span className="text-3xl mr-3">💰</span>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Funding Progress</p>
                        <p className="text-2xl font-bold text-green-600">{Math.round(fundingPercent)}%</p>
                        <p className="text-xs text-gray-600 mt-1">
                          ${campaign.funding.current} of ${campaign.funding.goal} raised
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-start">
                      <span className="text-3xl mr-3">🌱</span>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Environmental Impact</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {campaign.esgImpact.itemsCollected} items collected
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {campaign.esgImpact.co2Saved} kg CO₂ saved
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Publish Button (if draft) */}
            {campaign.status === 'draft' && (
              <button
                onClick={onPublish}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-lg font-bold transition-all mt-4 min-h-12"
              >
                🚀 Publish Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;
