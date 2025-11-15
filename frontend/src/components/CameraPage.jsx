import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';

const CameraPage = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const submitReport = () => {
    console.log('Submitting report with image:', capturedImage);
    alert('Trash report submitted! AI analysis in progress...');
    setCapturedImage(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-green-600 text-white">
        <h1 className="text-xl font-bold">Report Trash</h1>
        <p className="text-sm">Take a photo to identify and report trash</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-black relative">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
            />
            <button
              onClick={capture}
              className="absolute bottom-8 bg-white rounded-full p-4 shadow-lg"
            >
              <div className="w-16 h-16 bg-red-500 rounded-full border-4 border-white"></div>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <button
                onClick={retake}
                className="bg-gray-600 text-white px-6 py-3 rounded-full"
              >
                Retake
              </button>
              <button
                onClick={submitReport}
                className="bg-green-600 text-white px-6 py-3 rounded-full"
              >
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPage;