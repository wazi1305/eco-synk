import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { analyzeTrashImage } from '../services/gemini';

const CameraPage = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const submitReport = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeTrashImage(capturedImage);
      
      // Simulate API call
      setTimeout(() => {
        alert(`✅ Report submitted!\n\nAI Analysis:\nMaterial: ${result.primary_material}\nPriority: ${result.cleanup_priority_score}/10\nItems: ${result.specific_items.join(', ')}`);
        setCapturedImage(null);
        setIsAnalyzing(false);
      }, 2000);
      
    } catch (error) {
      alert('Error analyzing image');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col safe-area-inset">
      {/* Header */}
      <div className="p-4 bg-green-600 text-white safe-area-inset-top">
        <h1 className="text-xl font-bold">Report Trash</h1>
        <p className="text-sm opacity-90">Take a photo to identify and report trash</p>
      </div>

      {/* Camera Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black relative overflow-hidden">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                facingMode: 'environment'
              }}
            />
            <button
              onClick={capture}
              className="absolute bottom-8 bg-white rounded-full p-4 shadow-lg z-10"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
            >
              <div className="w-16 h-16 bg-red-500 rounded-full border-4 border-white"></div>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col relative">
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover" 
            />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg font-semibold">AI is analyzing trash...</p>
                  <p className="text-sm opacity-80 mt-2">Identifying materials and priority</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div 
              className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 px-4 safe-area-inset-bottom"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
            >
              <button
                onClick={retake}
                disabled={isAnalyzing}
                className="flex-1 bg-gray-600 text-white px-6 py-4 rounded-full disabled:opacity-50 font-semibold max-w-xs"
              >
                Retake
              </button>
              <button
                onClick={submitReport}
                disabled={isAnalyzing}
                className="flex-1 bg-green-600 text-white px-6 py-4 rounded-full disabled:opacity-50 font-semibold max-w-xs"
              >
                {isAnalyzing ? 'Analyzing...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPage;