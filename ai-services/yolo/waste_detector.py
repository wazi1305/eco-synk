"""
YOLOv8 Waste Detection Service
Optimized for web backend processing
"""

import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

# Waste categories optimized for urban environments
WASTE_CLASSES = [
    'plastic_bottle', 'glass_bottle', 'can', 'paper', 'cardboard',
    'plastic_bag', 'food_waste', 'e_waste', 'battery', 'clothing',
    'metal', 'medical_waste', 'hazardous', 'organic', 'recyclable_plastic'
]

# Map COCO classes to waste categories (for pretrained YOLOv8)
COCO_TO_WASTE_MAPPING = {
    'bottle': 'plastic_bottle',  # Assume plastic by default
    'wine glass': 'glass_bottle',
    'cup': 'plastic_bottle',
    'fork': 'metal',
    'knife': 'metal',
    'spoon': 'metal',
    'bowl': 'food_waste',
    'banana': 'organic',
    'apple': 'organic',
    'orange': 'organic',
    'carrot': 'organic',
    'broccoli': 'organic',
    'pizza': 'food_waste',
    'cake': 'food_waste',
    'donut': 'food_waste',
    'hot dog': 'food_waste',
    'sandwich': 'food_waste',
    'cell phone': 'e_waste',
    'keyboard': 'e_waste',
    'laptop': 'e_waste',
    'mouse': 'e_waste',
    'remote': 'e_waste',
    'book': 'paper',
    'vase': 'glass_bottle',
    'scissors': 'metal',
    'teddy bear': 'clothing',
    'backpack': 'clothing',
    'handbag': 'clothing',
    'tie': 'clothing',
    'suitcase': 'clothing',
}

# Color mapping for visualization (BGR format for OpenCV)
CLASS_COLORS = {
    'plastic_bottle': (0, 255, 0),      # Green - Recyclable
    'glass_bottle': (0, 200, 255),      # Light Blue - Recyclable
    'can': (255, 200, 0),                # Cyan - Recyclable
    'paper': (255, 255, 0),              # Yellow - Recyclable
    'cardboard': (200, 200, 0),          # Dark Yellow - Recyclable
    'plastic_bag': (0, 165, 255),        # Orange - Single-use
    'food_waste': (0, 100, 0),           # Dark Green - Compostable
    'e_waste': (0, 0, 255),              # Red - Hazardous
    'battery': (0, 0, 200),              # Dark Red - Hazardous
    'clothing': (255, 0, 255),           # Magenta - Reusable
    'metal': (200, 200, 200),            # Gray - Recyclable
    'medical_waste': (128, 0, 128),      # Purple - Hazardous
    'hazardous': (0, 0, 128),            # Maroon - Hazardous
    'organic': (0, 128, 0),              # Forest Green - Compostable
    'recyclable_plastic': (0, 200, 0),   # Bright Green - Recyclable
}


class WasteDetector:
    """
    YOLOv8-based waste detection for backend processing
    """
    
    def __init__(self, model_path: str = None, confidence_threshold: float = 0.15):
        """
        Initialize waste detector
        
        Args:
            model_path: Path to trained YOLOv8 model
            confidence_threshold: Minimum confidence for detections (lowered for COCO mapping)
        """
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.model_loaded = False
        
        if model_path:
            self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load YOLOv8 model"""
        try:
            model_path = Path(model_path)
            if not model_path.exists():
                logger.warning(f"Model not found at {model_path}. Using pretrained YOLOv8n.")
                # Fallback to pretrained model
                self.model = YOLO('yolov8n.pt')
            else:
                self.model = YOLO(str(model_path))
            
            self.model_loaded = True
            logger.info(f"✅ YOLOv8 model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model_loaded = False
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for YOLO detection
        
        Args:
            image_path: Path to input image
            
        Returns:
            Preprocessed image array
        """
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        # YOLOv8 handles resizing internally
        return img
    
    def detect(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detect waste objects in image
        
        Args:
            image_path: Path to input image
            
        Returns:
            List of detection dictionaries with bbox, class, confidence
        """
        if not self.model_loaded:
            logger.warning("Model not loaded. Returning empty detections.")
            return []
        
        try:
            # Run inference
            results = self.model.predict(
                source=image_path,
                conf=self.confidence_threshold,
                iou=0.45,
                device='cpu',  # Use 'cuda' if GPU available
                verbose=False
            )
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                
                for box in boxes:
                    # Extract box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Get COCO class name
                    coco_class = result.names[class_id]
                    
                    # Map COCO class to waste category
                    waste_class = COCO_TO_WASTE_MAPPING.get(coco_class, None)
                    
                    # Skip if not mappable to waste category
                    if waste_class is None:
                        continue
                    
                    detection = {
                        'bbox': {
                            'x1': float(x1),
                            'y1': float(y1),
                            'x2': float(x2),
                            'y2': float(y2),
                            'width': float(x2 - x1),
                            'height': float(y2 - y1)
                        },
                        'class': waste_class,  # Use mapped waste class
                        'coco_class': coco_class,  # Keep original for reference
                        'confidence': confidence,
                        'class_id': class_id
                    }
                    
                    detections.append(detection)
            
            logger.info(f"Detected {len(detections)} waste objects (mapped from COCO classes)")
            return detections
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return []
    
    def visualize_detections(
        self,
        image_path: str,
        detections: List[Dict],
        output_path: str = None
    ) -> str:
        """
        Draw bounding boxes on image
        
        Args:
            image_path: Input image path
            detections: List of detections from detect()
            output_path: Where to save annotated image
            
        Returns:
            Path to annotated image
        """
        img = cv2.imread(image_path)
        
        for det in detections:
            bbox = det['bbox']
            class_name = det['class']
            confidence = det['confidence']
            
            # Get color for class
            color = CLASS_COLORS.get(class_name, (255, 255, 255))
            
            # Draw bounding box
            x1, y1 = int(bbox['x1']), int(bbox['y1'])
            x2, y2 = int(bbox['x2']), int(bbox['y2'])
            
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{class_name} {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            
            # Background for text
            cv2.rectangle(
                img,
                (x1, y1 - label_size[1] - 10),
                (x1 + label_size[0], y1),
                color,
                -1
            )
            
            # Text
            cv2.putText(
                img,
                label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                2
            )
        
        # Save annotated image
        if output_path is None:
            output_path = str(Path(image_path).with_suffix('.annotated.jpg'))
        
        cv2.imwrite(output_path, img)
        return output_path
    
    def get_detection_summary(self, detections: List[Dict]) -> Dict[str, Any]:
        """
        Generate summary statistics from detections
        
        Args:
            detections: List of detections
            
        Returns:
            Summary dictionary
        """
        if not detections:
            return {
                'total_items': 0,
                'categories': {},
                'recyclable_count': 0,
                'hazardous_count': 0,
                'avg_confidence': 0
            }
        
        # Categorize items
        recyclable = ['plastic_bottle', 'glass_bottle', 'can', 'paper', 'cardboard', 'metal', 'recyclable_plastic']
        hazardous = ['e_waste', 'battery', 'medical_waste', 'hazardous']
        
        categories = {}
        recyclable_count = 0
        hazardous_count = 0
        total_confidence = 0
        
        for det in detections:
            class_name = det['class']
            
            # Count categories
            categories[class_name] = categories.get(class_name, 0) + 1
            
            # Count recyclable/hazardous
            if class_name in recyclable:
                recyclable_count += 1
            elif class_name in hazardous:
                hazardous_count += 1
            
            total_confidence += det['confidence']
        
        return {
            'total_items': len(detections),
            'categories': categories,
            'recyclable_count': recyclable_count,
            'hazardous_count': hazardous_count,
            'avg_confidence': total_confidence / len(detections) if detections else 0,
            'primary_waste_type': max(categories.items(), key=lambda x: x[1])[0] if categories else None
        }


# Example usage
if __name__ == "__main__":
    # Initialize detector
    detector = WasteDetector(
        model_path="models/yolov8_waste_custom.pt",
        confidence_threshold=0.3
    )
    
    # Detect waste in image
    detections = detector.detect("test_trash_image.jpg")
    
    # Generate summary
    summary = detector.get_detection_summary(detections)
    print(f"Detection Summary: {summary}")
    
    # Visualize results
    annotated_path = detector.visualize_detections(
        "test_trash_image.jpg",
        detections,
        "output_annotated.jpg"
    )
    print(f"Annotated image saved to: {annotated_path}")
