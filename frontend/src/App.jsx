import React, { useState, useEffect } from 'react';
import CameraPage from './components/CameraPage';
import MapPage from './components/MapPage';
import CommunityPage from './components/CommunityPage';

function App() {
  const [activeTab, setActiveTab] = useState('camera');
  const [windowHeight, setWindowHeight] = useState('100vh');

  // Handle mobile viewport height issues
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
      setWindowHeight(`${window.innerHeight}px`);
    };
    
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  return (
    <div 
      className="flex flex-col bg-gray-50 app-container safe-area-inset"
      style={{ height: windowHeight }}
    >
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'camera' && <CameraPage />}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'community' && <CommunityPage />}
      </div>

      {/* Bottom Navigation - Fixed at bottom with safe areas */}
      <div className="bg-white border-t border-gray-200 safe-area-inset-bottom shrink-0">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center justify-center p-3 flex-1 ${
              activeTab === 'camera' 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-green-500'
            } transition-colors duration-200`}
          >
            <span className="text-2xl mb-1">📸</span>
            <span className="text-xs font-medium">Report</span>
          </button>
          
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center p-3 flex-1 ${
              activeTab === 'map' 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-green-500'
            } transition-colors duration-200`}
          >
            <span className="text-2xl mb-1">🗺️</span>
            <span className="text-xs font-medium">Map</span>
          </button>
          
          <button
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center justify-center p-3 flex-1 ${
              activeTab === 'community' 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-green-500'
            } transition-colors duration-200`}
          >
            <span className="text-2xl mb-1">👥</span>
            <span className="text-xs font-medium">Community</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;