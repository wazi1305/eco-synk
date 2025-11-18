"""
Download Roboflow Public Waste Detection Dataset
Free, no API key required for this specific public dataset
"""

import urllib.request
import zipfile
from pathlib import Path
import shutil

def download_waste_dataset():
    """
    Download a public waste detection dataset from Roboflow Universe
    This is a pre-labeled dataset ready for YOLOv8 training
    """
    
    print("=" * 70)
    print("📥 Downloading Public Waste Detection Dataset")
    print("=" * 70)
    
    # Public Roboflow dataset (no API key needed)
    # This is a curated waste detection dataset
    dataset_url = "https://universe.roboflow.com/ds/zVz2r8BfmZ?key=zM6JCx6TLa"
    
    print("\n⚠️  Note: This requires manual download from Roboflow")
    print("\n📋 EASY SETUP INSTRUCTIONS:")
    print("=" * 70)
    
    print("\n1️⃣  Go to Roboflow Universe:")
    print("   https://universe.roboflow.com/")
    
    print("\n2️⃣  Search for 'waste detection' datasets, for example:")
    print("   - 'Garbage Classification'")
    print("   - 'Waste Detection'")  
    print("   - 'Trash Detection'")
    
    print("\n3️⃣  Select a dataset and click 'Download'")
    
    print("\n4️⃣  Choose format: YOLOv8")
    
    print("\n5️⃣  Download the ZIP file")
    
    print("\n6️⃣  Extract to: ai-services/yolo/waste_dataset/")
    
    print("\n" + "=" * 70)
    print("✅ OR use this specific ready-to-use dataset:")
    print("=" * 70)
    
    print("\nDataset: Plastic Waste Detection")
    print("URL: https://universe.roboflow.com/objectdetection-o4rdr/plastic-dectection-yctug")
    print("Classes: Plastic bottles, bags, containers")
    print("Size: ~2000 images")
    print("Format: YOLOv8 (ready to use)")
    
    print("\n📝 Download Steps:")
    print("1. Visit the URL above")
    print("2. Click 'Download Dataset'")
    print("3. Select 'YOLOv8' format")
    print("4. Choose 'Continue' (free download)")
    print("5. Extract ZIP to: ai-services/yolo/waste_dataset/")
    
    print("\n" + "=" * 70)
    print("💡 ALTERNATIVE: Use Python to download")
    print("=" * 70)
    
    print("\nIf you have a Roboflow account (free):")
    print("1. Get your API key from: https://app.roboflow.com/settings/api")
    print("2. Run:")
    print("   python")
    print("   >>> from roboflow import Roboflow")
    print("   >>> rf = Roboflow(api_key='YOUR_API_KEY')")
    print("   >>> project = rf.workspace('waste-detection').project('trash')")
    print("   >>> dataset = project.version(1).download('yolov8')")
    
    print("\n" + "=" * 70)
    print("🎯 After downloading, verify structure:")
    print("=" * 70)
    
    print("\nwaste_dataset/")
    print("├── data.yaml         (dataset config)")
    print("├── images/")
    print("│   ├── train/       (training images)")
    print("│   ├── val/         (validation images)")
    print("│   └── test/        (test images)")
    print("└── labels/")
    print("    ├── train/       (training labels)")
    print("    ├── val/         (validation labels)")
    print("    └── test/        (test labels)")
    
    print("\n✅ Then run: python start_training.py")
    print("=" * 70)


def setup_sample_dataset():
    """
    Create a minimal sample dataset for testing
    """
    print("\n🔧 Creating sample dataset structure...")
    
    dataset_path = Path("waste_dataset_sample")
    
    # Create structure
    for split in ['train', 'val', 'test']:
        (dataset_path / 'images' / split).mkdir(parents=True, exist_ok=True)
        (dataset_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    # Create data.yaml
    yaml_content = """
# Waste Detection Dataset Configuration
path: waste_dataset_sample
train: images/train
val: images/val
test: images/test

# Classes
nc: 15
names:
  - plastic_bottle
  - glass_bottle
  - can
  - paper
  - cardboard
  - plastic_bag
  - food_waste
  - e_waste
  - battery
  - clothing
  - metal
  - medical_waste
  - hazardous
  - organic
  - recyclable_plastic
"""
    
    with open(dataset_path / 'data.yaml', 'w') as f:
        f.write(yaml_content.strip())
    
    print(f"✅ Sample structure created at: {dataset_path.absolute()}")
    print("\n📝 Next: Add your labeled images to this structure")
    

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--sample':
        setup_sample_dataset()
    else:
        download_waste_dataset()
