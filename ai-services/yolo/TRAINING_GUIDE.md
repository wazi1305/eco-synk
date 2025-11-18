# YOLOv8 Waste Detection Training Guide

Train a custom waste detection model for EcoSynk.

## 🚀 Quick Start

### Option 1: Use Public Dataset (Recommended for beginners)

```bash
# 1. View dataset download instructions
python download_dataset.py

# 2. Download a waste detection dataset from Roboflow
#    Visit: https://universe.roboflow.com
#    Search: "waste detection" or "garbage classification"
#    Download as YOLOv8 format
#    Extract to: waste_dataset/

# 3. Start training
python start_training.py
```

### Option 2: Create Your Own Dataset

```bash
# 1. Prepare dataset structure
python prepare_dataset.py

# 2. Label your images using Roboflow
#    - Go to https://roboflow.com (free tier)
#    - Create new project
#    - Upload 500+ waste images
#    - Label with bounding boxes
#    - Export as YOLOv8 format

# 3. Start training
python start_training.py
```

## 📋 Requirements

```bash
# Already installed via requirements.txt
pip install ultralytics opencv-python torch torchvision
```

## 🗂️ Dataset Structure

Your dataset should follow this structure:

```
waste_dataset/
├── data.yaml              # Dataset configuration
├── images/
│   ├── train/            # Training images (70%)
│   ├── val/              # Validation images (20%)
│   └── test/             # Test images (10%)
└── labels/
    ├── train/            # Training labels (.txt)
    ├── val/              # Validation labels (.txt)
    └── test/             # Test labels (.txt)
```

### Label Format (YOLO)

Each image has a corresponding `.txt` file with one line per object:

```
class_id center_x center_y width height
```

Example (`image001.txt`):
```
0 0.5 0.5 0.3 0.4
1 0.7 0.3 0.2 0.3
```

All values are normalized (0.0 to 1.0).

## 🏷️ Waste Classes

The model detects 15 waste categories:

1. **plastic_bottle** - PET bottles, water bottles
2. **glass_bottle** - Glass containers, wine bottles
3. **can** - Aluminum cans, tin cans
4. **paper** - Paper waste, newspapers
5. **cardboard** - Cardboard boxes, packaging
6. **plastic_bag** - Shopping bags, plastic wrap
7. **food_waste** - Organic food scraps
8. **e_waste** - Electronics, phones, keyboards
9. **battery** - Batteries of all types
10. **clothing** - Textile waste
11. **metal** - Metal scraps, utensils
12. **medical_waste** - Medical supplies
13. **hazardous** - Hazardous materials
14. **organic** - Leaves, branches
15. **recyclable_plastic** - Other recyclable plastics

## 🎯 Getting Training Data

### Recommended Public Datasets

1. **TACO Dataset** (Trash Annotations in Context)
   - URL: http://tacodataset.org
   - Size: 1,500+ images
   - Classes: 60 categories
   - Download and convert to YOLO format

2. **TrashNet**
   - URL: https://github.com/garythung/trashnet
   - Size: 2,527 images
   - Classes: 6 categories (glass, paper, cardboard, plastic, metal, trash)

3. **Roboflow Universe** (Best option)
   - URL: https://universe.roboflow.com
   - Search: "waste detection"
   - Many pre-labeled datasets
   - Download directly in YOLOv8 format

### Creating Your Own Dataset

**Option A: Roboflow (Easiest)**
1. Sign up at https://roboflow.com (free)
2. Create new project → Object Detection
3. Upload 500+ images of waste
4. Draw bounding boxes around objects
5. Assign class labels
6. Apply augmentations (flip, rotate, brightness)
7. Split: 70% train, 20% val, 10% test
8. Export as YOLOv8
9. Download and extract

**Option B: LabelImg (Open Source)**
```bash
pip install labelImg
labelImg
```
- Open image folder
- Draw boxes → Press 'w'
- Select class
- Save → Press 'Ctrl+S'
- Next image → Press 'd'

## ⚙️ Training Configuration

Edit `train_model.py` CONFIG dict:

```python
CONFIG = {
    'model': 'yolov8n.pt',  # n=nano, s=small, m=medium, l=large
    'epochs': 100,           # Training iterations
    'batch': 16,             # Batch size (reduce if GPU memory error)
    'imgsz': 640,            # Image size
    'patience': 20,          # Early stopping
    'device': 'cuda',        # 'cuda' or 'cpu'
}
```

### Model Size Options

- **yolov8n.pt** (Nano) - Fastest, best for mobile (6.3M params)
- **yolov8s.pt** (Small) - Balanced (11.2M params)
- **yolov8m.pt** (Medium) - More accurate (25.9M params)
- **yolov8l.pt** (Large) - Best accuracy (43.7M params)

## 🏋️ Training Process

```bash
# Start training
python start_training.py

# Resume training
python start_training.py --resume

# Custom dataset path
python start_training.py /path/to/dataset

# Monitor with TensorBoard
tensorboard --logdir waste_detection/
```

### What Happens During Training

1. **Data Loading** - Images loaded and augmented
2. **Forward Pass** - Model predicts bounding boxes
3. **Loss Calculation** - Compares predictions to labels
4. **Backward Pass** - Updates model weights
5. **Validation** - Tests on validation set
6. **Checkpointing** - Saves best model

### Expected Training Time

- **CPU**: 50-100 epochs = 6-12 hours
- **GPU (NVIDIA)**: 50-100 epochs = 1-2 hours
- **Apple M1/M2**: 50-100 epochs = 2-4 hours

## 📊 Monitoring Training

Training creates a results folder with:

```
waste_detection/yolov8n_waste_YYYYMMDD/
├── weights/
│   ├── best.pt           # Best model (use this!)
│   └── last.pt           # Last epoch
├── results.csv           # Training metrics
├── results.png           # Loss/metric plots
├── confusion_matrix.png  # Class confusion
├── F1_curve.png          # F1 score curve
├── PR_curve.png          # Precision-Recall curve
└── val_batch0_pred.jpg   # Sample predictions
```

### Key Metrics

- **mAP50** - Mean Average Precision at 50% IoU (target: >0.7)
- **mAP50-95** - mAP averaged across IoU thresholds (target: >0.5)
- **Precision** - % of correct detections (target: >0.8)
- **Recall** - % of objects found (target: >0.7)

## 🧪 Testing Your Model

```bash
# Test on single image
python test_model.py --image test_image.jpg

# Test on folder
python test_model.py --folder test_images/

# Test with confidence threshold
python test_model.py --image test.jpg --conf 0.5
```

## 🚀 Deploying Your Model

After training, deploy your model:

```bash
# 1. Copy best model
cp waste_detection/yolov8n_waste_YYYYMMDD/weights/best.pt ../yolov8n_waste_custom.pt

# 2. Update api_server.py
# Change line ~235:
waste_detector.load_model('yolov8n_waste_custom.pt')

# 3. Restart backend
python api_server.py
```

## 🔧 Troubleshooting

### GPU Out of Memory
```python
# Reduce batch size in CONFIG
'batch': 8  # or 4
```

### Poor Results
- Need more data (aim for 1000+ images)
- Check label quality
- Increase epochs
- Use larger model (yolov8s or yolov8m)
- Add more augmentations

### Slow Training
- Use GPU (CUDA)
- Reduce image size to 416
- Use smaller model (yolov8n)

### Overfitting
- Add more training data
- Increase augmentation
- Enable early stopping (patience=20)

## 📚 Resources

- **YOLOv8 Docs**: https://docs.ultralytics.com
- **Roboflow Tutorial**: https://blog.roboflow.com/how-to-train-yolov8-on-a-custom-dataset/
- **Dataset Tips**: https://blog.roboflow.com/what-makes-a-good-dataset/
- **Augmentation Guide**: https://blog.roboflow.com/when-to-use-image-augmentation/

## 💡 Tips for Best Results

1. **Quality over Quantity** - 500 well-labeled images > 2000 poor labels
2. **Diverse Data** - Various lighting, angles, backgrounds
3. **Balance Classes** - Similar number of examples per class
4. **Test Incrementally** - Start with small subset, then scale up
5. **Monitor Overfitting** - Watch train vs validation loss
6. **Use Augmentation** - Helps model generalize better
7. **Clean Labels** - Double-check bounding box accuracy

## ❓ FAQ

**Q: How many images do I need?**
A: Minimum 50-100 per class, ideal 200-500 per class.

**Q: Can I train on CPU?**
A: Yes, but it's slow. Use Google Colab free GPU instead.

**Q: How long does training take?**
A: 1-2 hours on GPU, 6-12 hours on CPU for 100 epochs.

**Q: My model isn't detecting anything?**
A: Check confidence threshold, try lower values (0.15-0.25).

**Q: Can I add new classes later?**
A: Yes, but you'll need to retrain from scratch.

## 🆘 Need Help?

- Check existing issues: GitHub Issues
- Read YOLOv8 docs
- Ask in project Discord/Slack
- Review training logs in results folder
