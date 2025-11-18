"""
YOLOv8 Waste Detection Model Training Script
Train custom waste detection model for EcoSynk
"""

import os
import yaml
from pathlib import Path
from ultralytics import YOLO
import torch
from datetime import datetime

# Training configuration
CONFIG = {
    'model': 'yolov8n.pt',  # Nano model for mobile deployment
    'data': 'waste_dataset.yaml',
    'epochs': 100,
    'imgsz': 640,
    'batch': 16,
    'patience': 20,
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'workers': 4,
    'project': 'waste_detection',
    'name': f'yolov8n_waste_{datetime.now().strftime("%Y%m%d")}',
    
    # Optimization for mobile
    'optimizer': 'AdamW',
    'lr0': 0.001,
    'weight_decay': 0.0005,
    
    # Augmentation
    'hsv_h': 0.015,
    'hsv_s': 0.7,
    'hsv_v': 0.4,
    'degrees': 15.0,
    'translate': 0.1,
    'scale': 0.5,
    'shear': 2.0,
    'perspective': 0.0,
    'flipud': 0.0,
    'fliplr': 0.5,
    'mosaic': 1.0,
    'mixup': 0.1,
}

# Waste classes
WASTE_CLASSES = [
    'plastic_bottle',
    'glass_bottle',
    'can',
    'paper',
    'cardboard',
    'plastic_bag',
    'food_waste',
    'e_waste',
    'battery',
    'clothing',
    'metal',
    'medical_waste',
    'hazardous',
    'organic',
    'recyclable_plastic'
]


def create_dataset_yaml(dataset_path: str, output_path: str = 'waste_dataset.yaml'):
    """
    Create YOLO dataset configuration file
    
    Dataset structure:
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
    dataset_config = {
        'path': str(Path(dataset_path).absolute()),
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test',
        'nc': len(WASTE_CLASSES),
        'names': WASTE_CLASSES
    }
    
    with open(output_path, 'w') as f:
        yaml.dump(dataset_config, f, default_flow_style=False)
    
    print(f"✅ Dataset config created: {output_path}")
    return output_path


def train_waste_detection_model(
    dataset_path: str,
    config: dict = CONFIG,
    resume: bool = False
):
    """
    Train YOLOv8 waste detection model
    
    Args:
        dataset_path: Path to dataset directory
        config: Training configuration
        resume: Resume from last checkpoint
    """
    
    print("=" * 60)
    print("🚀 Starting YOLOv8 Waste Detection Training")
    print("=" * 60)
    
    # Create dataset YAML
    data_yaml = create_dataset_yaml(dataset_path)
    
    # Load base model
    print(f"\n📦 Loading base model: {config['model']}")
    model = YOLO(config['model'])
    
    # Display training info
    print(f"\n📊 Training Configuration:")
    print(f"  Device: {config['device']}")
    print(f"  Epochs: {config['epochs']}")
    print(f"  Batch size: {config['batch']}")
    print(f"  Image size: {config['imgsz']}")
    print(f"  Classes: {len(WASTE_CLASSES)}")
    
    # Train model
    print(f"\n🏋️ Training started...")
    results = model.train(
        data=data_yaml,
        epochs=config['epochs'],
        imgsz=config['imgsz'],
        batch=config['batch'],
        patience=config['patience'],
        device=config['device'],
        workers=config['workers'],
        project=config['project'],
        name=config['name'],
        optimizer=config['optimizer'],
        lr0=config['lr0'],
        weight_decay=config['weight_decay'],
        hsv_h=config['hsv_h'],
        hsv_s=config['hsv_s'],
        hsv_v=config['hsv_v'],
        degrees=config['degrees'],
        translate=config['translate'],
        scale=config['scale'],
        shear=config['shear'],
        perspective=config['perspective'],
        flipud=config['flipud'],
        fliplr=config['fliplr'],
        mosaic=config['mosaic'],
        mixup=config['mixup'],
        resume=resume,
        save=True,
        save_period=10,
        plots=True,
        verbose=True
    )
    
    print("\n✅ Training completed!")
    
    # Validate model
    print("\n📊 Running validation...")
    metrics = model.val()
    
    print(f"\n📈 Validation Results:")
    print(f"  mAP50: {metrics.box.map50:.3f}")
    print(f"  mAP50-95: {metrics.box.map:.3f}")
    print(f"  Precision: {metrics.box.p:.3f}")
    print(f"  Recall: {metrics.box.r:.3f}")
    
    # Export for deployment
    export_model(model, config['name'])
    
    return model, results, metrics


def export_model(model, model_name: str):
    """
    Export trained model for different deployment targets
    """
    export_dir = Path(f"exports/{model_name}")
    export_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📤 Exporting model to: {export_dir}")
    
    # Export formats
    formats = {
        'PyTorch': 'torchscript',
        'ONNX': 'onnx',
        'TensorFlow Lite': 'tflite',
        'TensorFlow.js': 'tfjs',
    }
    
    for format_name, format_type in formats.items():
        try:
            print(f"  Exporting {format_name}...")
            model.export(format=format_type, imgsz=640)
            print(f"  ✅ {format_name} export complete")
        except Exception as e:
            print(f"  ❌ {format_name} export failed: {e}")
    
    print(f"\n✅ Model exports saved to: {export_dir}")


def quantize_for_mobile(model_path: str, output_path: str = None):
    """
    Quantize model for mobile deployment (reduces size ~4x)
    """
    try:
        import torch
        from torch.quantization import quantize_dynamic
        
        print("\n🔧 Quantizing model for mobile deployment...")
        
        # Load model
        model = torch.load(model_path)
        
        # Dynamic quantization
        quantized_model = quantize_dynamic(
            model,
            {torch.nn.Linear, torch.nn.Conv2d},
            dtype=torch.qint8
        )
        
        # Save quantized model
        if output_path is None:
            output_path = str(Path(model_path).with_suffix('.quantized.pt'))
        
        torch.save(quantized_model, output_path)
        
        # Compare sizes
        original_size = Path(model_path).stat().st_size / (1024 * 1024)
        quantized_size = Path(output_path).stat().st_size / (1024 * 1024)
        
        print(f"✅ Quantization complete!")
        print(f"  Original: {original_size:.2f} MB")
        print(f"  Quantized: {quantized_size:.2f} MB")
        print(f"  Reduction: {(1 - quantized_size/original_size)*100:.1f}%")
        
        return output_path
        
    except Exception as e:
        print(f"❌ Quantization failed: {e}")
        return None


def download_taco_dataset():
    """
    Download and prepare TACO dataset for training
    TACO: Trash Annotations in Context
    http://tacodataset.org/
    """
    print("\n📥 Downloading TACO dataset...")
    print("Note: This requires manual download from http://tacodataset.org/")
    print("\nDataset preparation steps:")
    print("1. Download TACO dataset")
    print("2. Convert annotations to YOLO format")
    print("3. Organize into train/val/test splits")
    print("4. Run this training script")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train YOLOv8 Waste Detection Model")
    parser.add_argument('--dataset', type=str, required=True, help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--resume', action='store_true', help='Resume from checkpoint')
    parser.add_argument('--quantize', action='store_true', help='Quantize model after training')
    
    args = parser.parse_args()
    
    # Update config with CLI args
    CONFIG['epochs'] = args.epochs
    CONFIG['batch'] = args.batch
    
    # Train model
    model, results, metrics = train_waste_detection_model(
        dataset_path=args.dataset,
        config=CONFIG,
        resume=args.resume
    )
    
    # Quantize if requested
    if args.quantize:
        best_model = Path(CONFIG['project']) / CONFIG['name'] / 'weights' / 'best.pt'
        quantize_for_mobile(str(best_model))
    
    print("\n🎉 Training pipeline complete!")
    print(f"Best model saved to: {CONFIG['project']}/{CONFIG['name']}/weights/best.pt")
