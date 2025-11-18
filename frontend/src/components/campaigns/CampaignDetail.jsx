import React, { useState } from 'react';

const CampaignDetail = ({ campaign, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isJoined, setIsJoined] = useState(false);

  const fundingPercent = Math.min(
    (campaign.funding.current / campaign.funding.goal) * 100,
    100
  );

  const volunteersPercent = Math.min(
    (campaign.volunteers.length / campaign.volunteerGoal) * 100,
    100
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleJoin = () => {
    setIsJoined(!isJoined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto safe-area-inset">
      <div className="min-h-screen flex items-end">
        {/* Modal Content */}
        <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto animate-slide-up max-h-[95vh] overflow-y-auto">
          {/* Close Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-900">Campaign Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Campaign Header */}
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 h-40 flex items-center justify-center overflow-hidden">
            {campaign.heroImage ? (
              <img
                src={campaign.heroImage}
                alt={`${campaign.title} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-8xl">{campaign.image}</div>
            )}
          </div>

          {/* Campaign Info */}
          <div className="p-4">
            {/* Title and Status */}
            <div className="mb-4">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">{campaign.title}</h1>
                <div className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                  {campaign.status === 'active' ? '🚀 Active' : '✅ Completed'}
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-1">{campaign.organizer.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Organized by {campaign.organizer.name}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaign.volunteers.length}</div>
                <div className="text-xs text-gray-600">Volunteers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${campaign.funding.current}</div>
                <div className="text-xs text-gray-600">Raised</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaign.esgImpact.itemsCollected}</div>
                <div className="text-xs text-gray-600">Items</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="font-bold text-gray-900 mb-2">About</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{campaign.description}</p>
            </div>

            {/* Location and Date */}
            <div className="mb-4 space-y-2">
              <div className="flex items-start">
                <span className="mr-3 text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{campaign.location.address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">📅</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Date & Time</p>
                  <p className="font-semibold text-gray-900">{formatDate(campaign.date)}</p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
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
                onClick={() => setActiveTab('progress')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === 'progress'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Progress
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
                  activeTab === 'impact'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600'
                }`}
              >
                Impact
              </button>
            </div>

            {/* Tab Content */}
            <div className="mb-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Materials */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Expected Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {campaign.materials.map((material, idx) => (
                        <div
                          key={idx}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {material}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Participants ({campaign.volunteers.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {campaign.volunteers.map((vol, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-xl border-2 border-gray-200 hover:border-green-500 transition-colors cursor-pointer"
                          title={vol.name}
                        >
                          {vol.avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="space-y-4">
                  {/* Volunteer Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900">Volunteer Goal</h4>
                      <span className="text-sm font-bold text-green-600">
                        {campaign.volunteers.length}/{campaign.volunteerGoal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${volunteersPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900">Funding Goal</h4>
                      <span className="text-sm font-bold text-green-600">
                        ${campaign.funding.current}/${campaign.funding.goal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${fundingPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🌍</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">CO2 Reduction</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {campaign.esgImpact.co2Saved} kg CO₂ saved
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">♻️</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">Items Collected</p>
                        <p className="text-lg font-bold text-blue-700">
                          {campaign.esgImpact.itemsCollected} items
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">📐</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium">Area Cleaned</p>
                        <p className="text-lg font-bold text-green-700">
                          {campaign.esgImpact.areaCleaned} km²
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {campaign.status === 'active' && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleJoin}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all duration-200 min-h-12 ${
                    isJoined
                      ? 'bg-green-100 text-green-700 border-2 border-green-600'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  {isJoined ? '✅ Joined!' : '📣 Join Campaign'}
                </button>
                <button className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-50 py-3 rounded-lg font-bold transition-colors duration-200 min-h-12">
                  💚 Donate
                </button>
              </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-600 text-center pb-4">
              ✓ Join to help clean your community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
