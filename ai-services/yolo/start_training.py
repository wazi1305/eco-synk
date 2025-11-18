"""
Simple Training Script for Waste Detection
Easy-to-use wrapper for YOLOv8 training
"""

import sys
from pathlib import Path
from train_model import train_waste_detection_model, CONFIG, WASTE_CLASSES

def main():
    print("=" * 70)
    print("🗑️  EcoSynk Waste Detection Model Training")
    print("=" * 70)
    
    print("\n📋 This will train a YOLOv8 model to detect:")
    for i, class_name in enumerate(WASTE_CLASSES, 1):
        print(f"   {i:2d}. {class_name}")
    
    print("\n" + "=" * 70)
    
    # Check if dataset exists
    default_dataset = Path("waste_dataset")
    
    if not default_dataset.exists():
        print("\n❌ Dataset not found!")
        print(f"   Looking for: {default_dataset.absolute()}")
        print("\n📝 To prepare your dataset:")
        print("   1. Run: python prepare_dataset.py")
        print("   2. Or provide dataset path as argument")
        print("\nUsage: python start_training.py <dataset_path>")
        return
    
    # Get dataset path
    if len(sys.argv) > 1:
        dataset_path = Path(sys.argv[1])
    else:
        dataset_path = default_dataset
    
    # Verify dataset structure
    required_dirs = [
        dataset_path / "images" / "train",
        dataset_path / "images" / "val",
        dataset_path / "labels" / "train",
        dataset_path / "labels" / "val"
    ]
    
    missing = [d for d in required_dirs if not d.exists()]
    if missing:
        print("\n❌ Invalid dataset structure!")
        print("Missing directories:")
        for d in missing:
            print(f"   - {d}")
        print("\nRun: python prepare_dataset.py")
        return
    
    # Count images
    train_images = list((dataset_path / "images" / "train").glob("*.*"))
    val_images = list((dataset_path / "images" / "val").glob("*.*"))
    
    if not train_images:
        print("\n❌ No training images found!")
        print(f"   Add images to: {dataset_path}/images/train/")
        print("\n📸 Need help getting images?")
        print("   - Use Roboflow Universe public datasets")
        print("   - Download TACO dataset: http://tacodataset.org")
        print("   - Take your own photos and label with Roboflow")
        return
    
    print(f"\n✅ Dataset found: {dataset_path.absolute()}")
    print(f"   Training images: {len(train_images)}")
    print(f"   Validation images: {len(val_images)}")
    
    # Confirm training
    print(f"\n⚙️  Training Configuration:")
    print(f"   Model: {CONFIG['model']}")
    print(f"   Epochs: {CONFIG['epochs']}")
    print(f"   Batch size: {CONFIG['batch']}")
    print(f"   Image size: {CONFIG['imgsz']}")
    print(f"   Device: {CONFIG['device']}")
    
    print("\n" + "=" * 70)
    response = input("\n🚀 Start training? (y/n): ").strip().lower()
    
    if response != 'y':
        print("Training cancelled.")
        return
    
    # Start training
    print("\n" + "=" * 70)
    print("🏋️  TRAINING STARTED")
    print("=" * 70 + "\n")
    
    try:
        model, results, metrics = train_waste_detection_model(
            dataset_path=str(dataset_path),
            config=CONFIG
        )
        
        print("\n" + "=" * 70)
        print("✅ TRAINING COMPLETE!")
        print("=" * 70)
        
        # Show results location
        print(f"\n📊 Results saved to: {CONFIG['project']}/{CONFIG['name']}/")
        print("\n📈 Key Metrics:")
        print(f"   mAP50: {metrics.box.map50:.3f}")
        print(f"   mAP50-95: {metrics.box.map:.3f}")
        print(f"   Precision: {metrics.box.p:.3f}")
        print(f"   Recall: {metrics.box.r:.3f}")
        
        # Next steps
        print("\n🎯 Next Steps:")
        print("   1. Check training plots in the results folder")
        print("   2. Test the model: python test_model.py")
        print("   3. Deploy: Copy best.pt to ../yolov8n.pt")
        print(f"   4. Update api_server.py to use the new model")
        
        best_model = Path(CONFIG['project']) / CONFIG['name'] / 'weights' / 'best.pt'
        if best_model.exists():
            print(f"\n✅ Best model: {best_model}")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted by user")
        print("You can resume training by adding --resume flag")
        
    except Exception as e:
        print(f"\n\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
