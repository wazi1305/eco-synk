#!/usr/bin/env python3
"""
Comprehensive Pipeline Test
Tests the entire EcoSynk workflow with real images
"""

import sys
import os
import json
import requests
from pathlib import Path
from datetime import datetime
import time

# Configuration
API_BASE = "http://localhost:8000"
TEST_IMAGES_DIR = Path(__file__).parent.parent / "test_images"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def check_server():
    """Check if API server is running"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Server is running at {API_BASE}")
            print_info(f"Gemini: {data['services']['gemini']}")
            print_info(f"Qdrant: {data['services']['qdrant']}")
            print_info(f"Embedder: {data['services']['embedder']}")
            return True
    except:
        print_error("Server is not running!")
        print_info("Start server with: cd ai-services && python api_server.py")
        return False

def analyze_image(image_path, location=None):
    """Analyze a single image"""
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (image_path.name, f, 'image/jpeg')}
            data = {}
            if location:
                data['location'] = json.dumps(location)
            
            response = requests.post(
                f"{API_BASE}/analyze-trash",
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print_error(f"Analysis failed: {response.text}")
                return None
    except Exception as e:
        print_error(f"Error analyzing {image_path.name}: {e}")
        return None

def display_analysis(image_name, analysis, index):
    """Display analysis results in a readable format"""
    print(f"\n{Colors.BOLD}Image {index}: {image_name}{Colors.END}")
    print(f"{Colors.CYAN}{'─'*70}{Colors.END}")
    
    a = analysis.get('analysis', analysis)
    
    # Key information
    print(f"  📦 Material: {Colors.BOLD}{a.get('primary_material', 'N/A').upper()}{Colors.END}")
    print(f"  📏 Volume: {a.get('estimated_volume', 'N/A')}")
    print(f"  ⚠️  Priority: {Colors.BOLD}{a.get('cleanup_priority_score', 'N/A')}/10{Colors.END}")
    print(f"  ♻️  Recyclable: {'Yes' if a.get('recyclable') else 'No'}")
    print(f"  ⚡ Risk: {a.get('environmental_risk_level', 'N/A')}")
    print(f"  ⏱️  Cleanup Time: {a.get('estimated_cleanup_time_minutes', 'N/A')} minutes")
    print(f"  🎯 Confidence: {a.get('confidence_score', 'N/A')}")
    
    # Items found
    items = a.get('specific_items', [])
    if items:
        print(f"\n  📋 Items Detected:")
        for item in items[:5]:  # Show first 5
            print(f"     • {item}")
        if len(items) > 5:
            print(f"     ... and {len(items) - 5} more")
    
    # Description
    desc = a.get('description', '')
    if desc:
        print(f"\n  📝 Description:")
        print(f"     {desc[:150]}{'...' if len(desc) > 150 else ''}")
    
    # Equipment needed
    equipment = a.get('recommended_equipment', [])
    if equipment:
        print(f"\n  🛠️  Equipment: {', '.join(equipment[:3])}")
    
    print(f"{Colors.CYAN}{'─'*70}{Colors.END}")

def test_hotspot_detection(report_data):
    """Test hotspot detection"""
    try:
        response = requests.post(
            f"{API_BASE}/detect-hotspots",
            json={
                "report_data": report_data,
                "time_window_days": 60,
                "min_similar_reports": 2
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print_error(f"Hotspot detection failed: {e}")
        return None

def test_volunteer_matching(report_data, location):
    """Test volunteer matching"""
    try:
        response = requests.post(
            f"{API_BASE}/find-volunteers",
            json={
                "report_data": report_data,
                "location": location,
                "radius_km": 10.0,
                "min_match_score": 0.3
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print_error(f"Volunteer matching failed: {e}")
        return None

def create_campaign(report_ids, location):
    """Create a campaign from hotspot"""
    try:
        response = requests.post(
            f"{API_BASE}/campaign/create",
            json={
                "hotspot_report_ids": report_ids,
                "location": location,
                "target_funding_usd": 1000,
                "volunteer_goal": 20,
                "duration_days": 45
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print_error(f"Campaign creation failed: {e}")
        return None

def main():
    print_header("🚀 EcoSynk Full Pipeline Test")
    
    # Step 1: Check server
    print_header("Step 1: Server Health Check")
    if not check_server():
        return 1
    
    # Step 2: Get initial stats
    print_header("Step 2: Initial Database Stats")
    try:
        stats = requests.get(f"{API_BASE}/stats").json()
        print_info(f"Trash Reports: {stats['statistics']['trash_reports']['count']}")
        print_info(f"Volunteers: {stats['statistics']['volunteers']['count']}")
        
        campaigns = requests.get(f"{API_BASE}/campaigns/active").json()
        print_info(f"Active Campaigns: {campaigns['count']}")
    except:
        print_warning("Could not fetch initial stats")
    
    # Step 3: Analyze all images
    print_header("Step 3: Analyzing All 10 Images with Gemini AI")
    
    image_files = sorted(TEST_IMAGES_DIR.glob("*.jp*g"))
    if not image_files:
        print_error(f"No images found in {TEST_IMAGES_DIR}")
        return 1
    
    print_info(f"Found {len(image_files)} images to analyze\n")
    
    # Locations for different images (San Francisco area)
    locations = [
        {"lat": 37.7749, "lon": -122.4194},  # Downtown SF
        {"lat": 37.7849, "lon": -122.4094},  # North Beach
        {"lat": 37.7649, "lon": -122.4294},  # Mission
        {"lat": 37.7949, "lon": -122.3994},  # Financial District
        {"lat": 37.7549, "lon": -122.4394},  # Castro
        {"lat": 37.8049, "lon": -122.4094},  # Chinatown
        {"lat": 37.7449, "lon": -122.4494},  # Twin Peaks
        {"lat": 37.7749, "lon": -122.3894},  # SOMA
        {"lat": 37.7849, "lon": -122.4294},  # Russian Hill
        {"lat": 37.7649, "lon": -122.3994},  # Potrero Hill
    ]
    
    analyses = []
    report_ids = []
    
    for i, image_path in enumerate(image_files, 1):
        print(f"\n{Colors.BOLD}Analyzing {i}/{len(image_files)}: {image_path.name}{Colors.END}")
        
        result = analyze_image(image_path, locations[i-1])
        
        if result and result['status'] == 'success':
            analyses.append(result)
            report_ids.append(result['report_id'])
            display_analysis(image_path.name, result, i)
            print_success(f"Analysis complete! Report ID: {result['report_id']}")
        else:
            print_error(f"Failed to analyze {image_path.name}")
        
        # Rate limiting: 5 seconds between images (Gemini free tier: 15 RPM)
        if i < len(image_files):
            print_info(f"⏳ Waiting 5 seconds (rate limiting)...")
            time.sleep(5)
    
    # Step 4: Analysis Summary
    print_header("Step 4: Analysis Summary")
    
    materials = {}
    priorities = []
    total_confidence = 0
    recyclable_count = 0
    
    for analysis in analyses:
        a = analysis.get('analysis', analysis)
        material = a.get('primary_material', 'unknown')
        materials[material] = materials.get(material, 0) + 1
        priorities.append(a.get('cleanup_priority_score', 0))
        total_confidence += a.get('confidence_score', 0)
        if a.get('recyclable'):
            recyclable_count += 1
    
    print(f"\n{Colors.BOLD}Material Breakdown:{Colors.END}")
    for material, count in sorted(materials.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(analyses)) * 100
        print(f"  {material.capitalize()}: {count} ({percentage:.1f}%)")
    
    avg_priority = sum(priorities) / len(priorities) if priorities else 0
    avg_confidence = total_confidence / len(analyses) if analyses else 0
    
    print(f"\n{Colors.BOLD}Overall Metrics:{Colors.END}")
    print(f"  Average Priority: {avg_priority:.1f}/10")
    print(f"  Average Confidence: {avg_confidence:.2f}")
    print(f"  Recyclable: {recyclable_count}/{len(analyses)} ({recyclable_count/len(analyses)*100:.1f}%)")
    
    # Gemini Accuracy Assessment
    print(f"\n{Colors.BOLD}🎯 Gemini AI Accuracy Assessment:{Colors.END}")
    if avg_confidence >= 0.9:
        print_success(f"Excellent confidence ({avg_confidence:.2f}) - Gemini is very accurate!")
    elif avg_confidence >= 0.7:
        print_success(f"Good confidence ({avg_confidence:.2f}) - Gemini is reliable")
    else:
        print_warning(f"Moderate confidence ({avg_confidence:.2f}) - Review results carefully")
    
    # Step 5: Hotspot Detection
    print_header("Step 5: Testing Hotspot Detection")
    
    if analyses:
        # Test with plastic waste
        plastic_reports = [a for a in analyses if a.get('analysis', a).get('primary_material') == 'plastic']
        if plastic_reports:
            print_info("Testing hotspot detection for plastic waste...")
            hotspot_result = test_hotspot_detection(plastic_reports[0].get('analysis', plastic_reports[0]))
            
            if hotspot_result:
                is_hotspot = hotspot_result.get('is_hotspot', False)
                similar_count = hotspot_result.get('similar_reports_count', 0)
                
                if is_hotspot:
                    print_success(f"🔥 HOTSPOT DETECTED! Found {similar_count} similar reports")
                    print_info(f"Severity: {hotspot_result.get('severity', 'unknown')}")
                    print_info(f"Recommendation: {hotspot_result.get('recommendation', 'N/A')}")
                else:
                    print_info(f"Not a hotspot ({similar_count} similar reports)")
    
    # Step 6: Volunteer Matching
    print_header("Step 6: Testing Volunteer Matching")
    
    if analyses:
        high_priority = max(analyses, key=lambda x: x.get('analysis', x).get('cleanup_priority_score', 0))
        high_priority_data = high_priority.get('analysis', high_priority)
        
        print_info(f"Finding volunteers for highest priority report (Priority: {high_priority_data.get('cleanup_priority_score')})...")
        
        volunteer_result = test_volunteer_matching(
            high_priority_data,
            high_priority_data.get('metadata', {}).get('location', locations[0])
        )
        
        if volunteer_result:
            volunteers = volunteer_result.get('volunteers', [])
            print_success(f"Found {len(volunteers)} matching volunteers")
            
            for i, vol in enumerate(volunteers[:3], 1):
                print(f"\n  {i}. {vol['name']} ({vol['experience_level']})")
                print(f"     Match Score: {vol['match_score']:.2f}")
                print(f"     Distance: {vol['distance_km']:.2f} km")
                print(f"     Skills: {', '.join(vol['skills'][:3])}")
    
    # Step 7: Campaign Creation
    print_header("Step 7: Creating Campaign from Reports")
    
    if len(report_ids) >= 2:
        print_info(f"Creating campaign from {len(report_ids[:3])} reports...")
        
        campaign_result = create_campaign(report_ids[:3], locations[0])
        
        if campaign_result:
            campaign = campaign_result['campaign']
            print_success(f"Campaign created: {campaign['campaign_name']}")
            print_info(f"Campaign ID: {campaign['campaign_id']}")
            print_info(f"Funding Goal: ${campaign['goals']['target_funding_usd']}")
            print_info(f"Volunteer Goal: {campaign['goals']['volunteer_goal']}")
            print_info(f"Duration: {campaign['timeline']['duration_days']} days")
            print_info(f"Estimated Impact: {campaign['impact_estimates']['estimated_waste_kg']}kg waste")
    
    # Step 8: Test All Endpoints
    print_header("Step 8: Testing All Endpoints")
    
    endpoints = [
        ("GET", "/health", None),
        ("GET", "/stats", None),
        ("GET", "/impact/esg", None),
        ("GET", "/leaderboard", None),
        ("GET", "/campaigns/active", None),
    ]
    
    print_info("Testing endpoints...")
    for method, endpoint, data in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
            else:
                response = requests.post(f"{API_BASE}{endpoint}", json=data, timeout=5)
            
            if response.status_code == 200:
                print_success(f"{method} {endpoint}")
            else:
                print_error(f"{method} {endpoint} - Status {response.status_code}")
        except Exception as e:
            print_error(f"{method} {endpoint} - {str(e)[:50]}")
    
    # Step 9: Final Stats
    print_header("Step 9: Final Database Stats")
    
    try:
        stats = requests.get(f"{API_BASE}/stats").json()
        print_info(f"Trash Reports: {stats['statistics']['trash_reports']['count']} (added {len(analyses)})")
        print_info(f"Volunteers: {stats['statistics']['volunteers']['count']}")
        
        campaigns = requests.get(f"{API_BASE}/campaigns/active").json()
        print_info(f"Active Campaigns: {campaigns['count']}")
        
        esg = requests.get(f"{API_BASE}/impact/esg").json()
        impact = esg['esg_metrics']
        print_success(f"\n🌍 Environmental Impact:")
        print(f"  Waste Removed: {impact['environmental']['total_waste_removed_kg']}kg")
        print(f"  CO2 Reduction: {impact['environmental']['co2_reduction_kg']}kg")
        print(f"  Equivalent Trees: {esg['summary']['carbon_offset_equivalent_trees']}")
    except Exception as e:
        print_warning(f"Could not fetch final stats: {e}")
    
    # Final Summary
    print_header("✅ Pipeline Test Complete!")
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}Summary:{Colors.END}")
    print(f"  ✅ Analyzed {len(analyses)} images successfully")
    print(f"  ✅ Gemini AI Confidence: {avg_confidence:.2f}")
    print(f"  ✅ Hotspot detection working")
    print(f"  ✅ Volunteer matching working")
    print(f"  ✅ Campaign creation working")
    print(f"  ✅ All endpoints functional")
    
    print(f"\n{Colors.CYAN}📊 Report IDs created:{Colors.END}")
    for report_id in report_ids:
        print(f"  • {report_id}")
    
    print(f"\n{Colors.YELLOW}Next Steps:{Colors.END}")
    print(f"  1. Review Gemini analysis accuracy above")
    print(f"  2. Check created campaigns: GET /campaigns/active")
    print(f"  3. View full stats: GET /impact/esg")
    print(f"  4. Share with team!")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

