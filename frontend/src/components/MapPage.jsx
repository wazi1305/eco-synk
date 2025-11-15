import React from 'react';

const MapPage = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-blue-600 text-white">
        <h1 className="text-xl font-bold">Trash Map</h1>
        <p className="text-sm">View reported trash in your area</p>
      </div>
      
      <div className="flex-1 bg-gray-200 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-700">Live Trash Map</h2>
          <p className="text-gray-500 mt-2">Reports will appear here in real-time</p>
          <div className="mt-6 bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">🔴 High Priority: 3 reports</p>
            <p className="text-sm text-gray-600">🟡 Medium Priority: 7 reports</p>
            <p className="text-sm text-gray-600">🟢 Low Priority: 12 reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;