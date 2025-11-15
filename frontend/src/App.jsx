import React, { useState } from 'react';
import CameraPage from './components/CameraPage';
import MapPage from './components/MapPage';
import CommunityPage from './components/CommunityPage';

function App() {
  const [activeTab, setActiveTab] = useState('camera');

  return (
    <div className="h-screen flex flex-col bg-gray-50 safe-area-inset">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'camera' && <CameraPage />}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'community' && <CommunityPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'camera' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">📸</span>
            <span className="text-xs mt-1">Report</span>
          </button>
          
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'map' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-xs mt-1">Map</span>
          </button>
          
          <button
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'community' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs mt-1">Community</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;