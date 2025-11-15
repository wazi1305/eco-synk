import React from 'react';

const CommunityPage = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-purple-600 text-white">
        <h1 className="text-xl font-bold">Community</h1>
        <p className="text-sm">Join cleanups and see leaderboards</p>
      </div>
      
      <div className="flex-1 bg-gray-100 p-4">
        <div className="bg-white rounded-lg p-4 shadow mb-4">
          <h2 className="font-bold text-lg mb-2">🏆 Community Leaderboard</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>1. Green Warriors</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">245 pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span>2. Eco Heroes</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">189 pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span>3. Clean Crew</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">156 pts</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-bold text-lg mb-2">📅 Active Cleanups</h2>
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-gray-600">No cleanups scheduled yet</p>
            <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg">
              Start a Cleanup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;