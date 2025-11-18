/**
 * Test script to verify backend integration
 */

const API_BASE_URL = 'http://localhost:8000';

// Test ESG Metrics Integration (Analytics Dashboard)
async function testESGMetrics() {
  try {
    console.log('🧪 Testing ESG Metrics endpoint...');
    const response = await fetch(`${API_BASE_URL}/impact/esg`);
    const data = await response.json();
    
    console.log('✅ ESG Metrics Response:');
    console.log('- Environmental Score:', data.esg_metrics.environmental);
    console.log('- Social Impact:', data.esg_metrics.social);
    console.log('- Total Impact Score:', data.summary.total_impact_score);
    console.log('- Waste Diverted:', data.summary.waste_diverted_from_landfill_kg, 'kg');
    return data;
  } catch (error) {
    console.log('❌ ESG Metrics failed:', error.message);
    return null;
  }
}

// Test Volunteer Leaderboard (Profile Integration)
async function testVolunteerLeaderboard() {
  try {
    console.log('\n🧪 Testing Volunteer Leaderboard...');
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    const data = await response.json();
    
    console.log('✅ Leaderboard Response:');
    console.log('- Total Volunteers:', data.total_volunteers);
    console.log('- Top Volunteer:', data.leaderboard[0].name, '-', data.leaderboard[0].badge);
    console.log('- Top Cleanup Count:', data.leaderboard[0].past_cleanup_count);
    return data;
  } catch (error) {
    console.log('❌ Leaderboard failed:', error.message);
    return null;
  }
}

// Test Active Campaigns (Campaign Integration)
async function testActiveCampaigns() {
  try {
    console.log('\n🧪 Testing Active Campaigns...');
    const response = await fetch(`${API_BASE_URL}/campaigns/active`);
    const data = await response.json();
    
    console.log('✅ Active Campaigns Response:');
    console.log('- Active Campaigns:', data.count);
    console.log('- Latest Campaign:', data.campaigns[0].campaign_name);
    console.log('- Funding Progress:', data.campaigns[0].goals.funding_progress_percent + '%');
    return data;
  } catch (error) {
    console.log('❌ Campaigns failed:', error.message);
    return null;
  }
}

// Test Hotspot Detection
async function testHotspotDetection() {
  try {
    console.log('\n🧪 Testing Hotspot Detection...');
    const testLocation = { lat: 37.7749, lon: -122.4194 };
    
    const response = await fetch(`${API_BASE_URL}/detect-hotspots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: testLocation,
        radius_km: 5.0
      })
    });
    
    const data = await response.json();
    console.log('✅ Hotspot Detection Response:');
    console.log('- Hotspots Found:', data.hotspots.length);
    if (data.hotspots.length > 0) {
      console.log('- First Hotspot Priority:', data.hotspots[0].priority_score);
      console.log('- Materials:', data.hotspots[0].materials_detected);
    }
    return data;
  } catch (error) {
    console.log('❌ Hotspot Detection failed:', error.message);
    return null;
  }
}

// Test Volunteer Matching
async function testVolunteerMatching() {
  try {
    console.log('\n🧪 Testing Volunteer Matching...');
    const response = await fetch(`${API_BASE_URL}/find-volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cleanup_type: "beach",
        location: { lat: 37.7749, lon: -122.4194 },
        required_skills: ["water cleanup"],
        max_distance_km: 10.0
      })
    });
    
    const data = await response.json();
    console.log('✅ Volunteer Matching Response:');
    console.log('- Matched Volunteers:', data.volunteers.length);
    if (data.volunteers.length > 0) {
      console.log('- Best Match:', data.volunteers[0].name);
      console.log('- Match Score:', data.volunteers[0].match_score);
    }
    return data;
  } catch (error) {
    console.log('❌ Volunteer Matching failed:', error.message);
    return null;
  }
}

// Run all tests
async function runIntegrationTests() {
  console.log('🚀 Starting Backend Integration Tests...\n');
  
  const results = {
    esg: await testESGMetrics(),
    leaderboard: await testVolunteerLeaderboard(),
    campaigns: await testActiveCampaigns(),
    hotspots: await testHotspotDetection(),
    volunteers: await testVolunteerMatching()
  };
  
  console.log('\n📊 Integration Test Summary:');
  console.log('✅ ESG Metrics:', results.esg ? 'WORKING' : 'FAILED');
  console.log('✅ Leaderboard:', results.leaderboard ? 'WORKING' : 'FAILED');
  console.log('✅ Campaigns:', results.campaigns ? 'WORKING' : 'FAILED');
  console.log('✅ Hotspots:', results.hotspots ? 'WORKING' : 'FAILED');
  console.log('✅ Volunteers:', results.volunteers ? 'WORKING' : 'FAILED');
  
  const workingCount = Object.values(results).filter(r => r !== null).length;
  console.log(`\n🎯 Integration Status: ${workingCount}/5 endpoints working`);
  
  return results;
}

// For Node.js execution
if (typeof window === 'undefined') {
  // Running in Node.js
  const fetch = require('node-fetch');
  runIntegrationTests();
}

// For browser execution
if (typeof window !== 'undefined') {
  window.testIntegration = runIntegrationTests;
}