"""
Waste Detection Dataset Preparation
Downloads and prepares datasets for training YOLOv8
"""

import os
import shutil
from pathlib import Path
import requests
from tqdm import tqdm
import zipfile

# Public waste detection datasets
DATASETS = {
    'taco': {
        'name': 'TACO (Trash Annotations in Context)',
        'url': 'http://tacodataset.org/download',
        'classes': ['Plastic', 'Glass', 'Metal', 'Paper', 'Cardboard', 'Organic'],
        'size': '~2GB',
        'images': '1500+'
    },
    'roboflow_waste': {
        'name': 'Roboflow Waste Detection',
        'url': 'https://universe.roboflow.com/mohamed-traore-2ekkp/self-driving-car',
        'classes': 'Custom',
        'note': 'Sign up at roboflow.com for API access'
    }
}


def download_file(url: str, destination: Path):
    """Download file with progress bar"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(destination, 'wb') as file, tqdm(
        desc=destination.name,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as progress_bar:
        for data in response.iter_content(chunk_size=1024):
            size = file.write(data)
            progress_bar.update(size)


def create_yolo_structure(base_path: Path):
    """
    Create YOLO dataset structure:
    
    dataset/
    ├── images/
    │   ├── train/
    │   ├── val/
    │   └── test/
    └── labels/
        ├── train/
        ├── val/
        └── test/
    """
    splits = ['train', 'val', 'test']
    
    for split in splits:
        (base_path / 'images' / split).mkdir(parents=True, exist_ok=True)
        (base_path / 'labels' / split).mkdir(parents=True, exist_ok=True)
    
    print(f"✅ Created YOLO dataset structure at: {base_path}")


def download_sample_images():
    """
    Download sample waste images from public sources
    """
    print("📥 Downloading sample waste images...")
    
    # Free stock photo APIs
    sample_queries = [
        'plastic+bottle+waste',
        'glass+bottle+recycling',
        'aluminum+can+trash',
        'paper+waste',
        'cardboard+box',
        'food+waste',
        'electronics+waste'
    ]
    
    # Unsplash API (requires free API key)
    # Pexels API (requires free API key)
    # Pixabay (public domain)
    
    print("⚠️  For production, you need labeled datasets.")
    print("📚 Recommended sources:")
    print("   1. TACO Dataset: http://tacodataset.org/")
    print("   2. TrashNet: https://github.com/garythung/trashnet")
    print("   3. Roboflow Universe: https://universe.roboflow.com/")
    print("   4. Your own images labeled with Roboflow/LabelImg")


def setup_roboflow_dataset(api_key: str, workspace: str, project: str, version: int = 1):
    """
    Download dataset from Roboflow
    
    Args:
        api_key: Your Roboflow API key
        workspace: Roboflow workspace name
        project: Project name
        version: Dataset version
    
    Example:
        setup_roboflow_dataset(
            api_key="YOUR_API_KEY",
            workspace="waste-detection",
            project="trash-classification",
            version=1
        )
    """
    try:
        from roboflow import Roboflow
        
        rf = Roboflow(api_key=api_key)
        project = rf.workspace(workspace).project(project)
        dataset = project.version(version).download("yolov8")
        
        print(f"✅ Dataset downloaded to: {dataset.location}")
        return dataset.location
        
    except ImportError:
        print("❌ Roboflow package not installed.")
        print("Install with: pip install roboflow")
        return None
    except Exception as e:
        print(f"❌ Error downloading from Roboflow: {e}")
        return None


def label_images_guide():
    """Print guide for labeling your own images"""
    guide = """
    
    🏷️  HOW TO LABEL YOUR OWN IMAGES
    ================================
    
    Option 1: Use Roboflow (Recommended)
    -------------------------------------
    1. Go to https://roboflow.com (free tier available)
    2. Create a new project → Object Detection
    3. Upload your waste images
    4. Label objects with bounding boxes
    5. Assign classes: plastic_bottle, glass_bottle, can, etc.
    6. Split dataset: 70% train, 20% val, 10% test
    7. Apply augmentations (flip, rotate, brightness)
    8. Export as YOLOv8 format
    9. Download and use with our training script
    
    Option 2: Use LabelImg (Open Source)
    -------------------------------------
    1. Install: pip install labelImg
    2. Run: labelImg
    3. Open image folder
    4. Draw bounding boxes
    5. Save as YOLO format (.txt files)
    6. Organize into train/val/test splits
    
    Option 3: Use CVAT (Team Collaboration)
    ----------------------------------------
    1. Go to https://www.cvat.ai
    2. Create annotation task
    3. Upload images
    4. Label collaboratively
    5. Export as YOLO 1.1 format
    
    📊 RECOMMENDED DATASET SIZE
    ---------------------------
    - Minimum: 500 images (100 per class)
    - Good: 1000-2000 images
    - Excellent: 5000+ images
    
    For each class, aim for:
    - Various lighting conditions
    - Different angles and distances
    - Cluttered and clean backgrounds
    - Different object conditions (crushed, clean, dirty)
    
    """
    print(guide)


def quick_start_with_existing_datasets():
    """
    Quick start guide with existing datasets
    """
    print("\n🚀 QUICK START OPTIONS")
    print("=" * 60)
    
    print("\n1️⃣  Use Pre-trained TrashNet Dataset")
    print("   - Clone: git clone https://github.com/garythung/trashnet")
    print("   - Convert to YOLO format with our converter script")
    
    print("\n2️⃣  Use TACO Dataset")
    print("   - Download: http://tacodataset.org/")
    print("   - Already in COCO format")
    print("   - Convert with: python convert_coco_to_yolo.py")
    
    print("\n3️⃣  Use Roboflow Public Datasets")
    print("   - Browse: https://universe.roboflow.com/")
    print("   - Search: 'waste detection' or 'trash classification'")
    print("   - Download directly in YOLOv8 format")
    
    print("\n4️⃣  Collect Your Own Images")
    print("   - Take 500+ photos of trash in your area")
    print("   - Label with Roboflow (easiest)")
    print("   - Export as YOLOv8")
    print("   - Train custom model")


if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  Waste Detection Dataset Preparation")
    print("=" * 60)
    
    # Show available options
    quick_start_with_existing_datasets()
    
    print("\n" + "=" * 60)
    
    # Ask user what they want to do
    print("\n📋 What would you like to do?")
    print("1. Create empty dataset structure")
    print("2. Show labeling guide")
    print("3. Download from Roboflow (requires API key)")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        dataset_path = Path("waste_dataset")
        create_yolo_structure(dataset_path)
        print(f"\n✅ Dataset structure created at: {dataset_path.absolute()}")
        print("📝 Next steps:")
        print("   1. Add images to images/train, images/val, images/test")
        print("   2. Add labels to labels/train, labels/val, labels/test")
        print("   3. Run: python train_model.py")
        
    elif choice == "2":
        label_images_guide()
        
    elif choice == "3":
        print("\n🔑 Enter your Roboflow credentials:")
        api_key = input("API Key: ").strip()
        workspace = input("Workspace: ").strip()
        project = input("Project: ").strip()
        
        if api_key and workspace and project:
            location = setup_roboflow_dataset(api_key, workspace, project)
            if location:
                print(f"\n✅ Ready to train!")
                print(f"   Dataset: {location}")
                print(f"   Run: python train_model.py --dataset {location}")
        else:
            print("❌ Missing required credentials")
    
    else:
        print("Invalid choice")
