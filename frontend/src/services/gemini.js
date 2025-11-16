import axios from 'axios';

// Mock service for now - replace with real Gemini API later
export const analyzeTrashImage = async (imageBase64) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock analysis results
  const mockResults = [
    {
      primary_material: "plastic",
      estimated_volume: "medium",
      specific_items: ["water bottles", "food packaging", "plastic bags"],
      cleanup_priority_score: 7,
      description: "Mixed plastic waste including bottles and food containers"
    },
    {
      primary_material: "mixed",
      estimated_volume: "large", 
      specific_items: ["cardboard", "plastic containers", "metal cans"],
      cleanup_priority_score: 9,
      description: "Large mixed waste pile with recyclable materials"
    },
    {
      primary_material: "organic",
      estimated_volume: "small",
      specific_items: ["food waste", "organic matter"],
      cleanup_priority_score: 3,
      description: "Small amount of organic waste"
    }
  ];
  
  // Return a random mock result for demo
  return mockResults[Math.floor(Math.random() * mockResults.length)];
};