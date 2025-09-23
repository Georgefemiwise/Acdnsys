import os
import requests
from typing import List, Optional, Tuple
from difflib import SequenceMatcher
import re
from ..models.detection import DetectionRequest, DetectionResult, PlateMatch
from ..models.user import User
from ..db.database import users_table, plates_table, detections_table, User as UserQuery, Plate as PlateQuery
from ..services.sms_service import send_sms
import random
import datetime


class DetectionService:
    """Service for handling license plate detection and matching"""
    
    def __init__(self):
        self.roboflow_api_key = os.getenv("ROBOFLOW_API_KEY")
        self.similarity_threshold = 0.8  # Minimum similarity for fuzzy matching
        
    async def process_detection(self, request: DetectionRequest) -> DetectionResult:
        """
        Main detection pipeline:
        1. Call Roboflow API for plate detection
        2. Extract plate number from response
        3. Match against database
        4. Send notifications if match found
        5. Store detection result
        """
        try:
            # Step 1: Detect plate using Roboflow
            roboflow_result = await self._call_roboflow_api(request.image_url)
            
            # Step 2: Extract plate number
            plate_number, confidence = self._extract_plate_from_response(roboflow_result)
            
            if not plate_number:
                raise ValueError("No license plate detected in image")
            
            # Step 3: Create detection result
            detection = DetectionResult(
                id=random.randint(10000, 99999),
                plate_number=plate_number,
                confidence=confidence,
                camera_id=request.camera_id,
                location=request.location,
                image_url=request.image_url,
                raw_response=roboflow_result
            )
            
            # Step 4: Match against database
            matches = self._find_plate_matches(plate_number)
            
            if matches:
                # Use the best match
                best_match = matches[0]
                detection.matched_user_id = best_match.user_id
                
                # Step 5: Send notification
                notification_sent = await self._send_detection_notification(best_match, detection)
                detection.notification_sent = notification_sent
                
                print(f"✅ Plate {plate_number} matched to user {best_match.user_name}")
            else:
                print(f"⚠️ No match found for plate {plate_number}")
            
            # Step 6: Store detection in database
            detections_table.insert(detection.dict())
            
            return detection
            
        except Exception as e:
            print(f"❌ Detection error: {str(e)}")
            # Still create a detection record for failed attempts
            error_detection = DetectionResult(
                id=random.randint(10000, 99999),
                plate_number="UNKNOWN",
                confidence=0.0,
                camera_id=request.camera_id,
                location=request.location,
                image_url=request.image_url,
                raw_response={"error": str(e)}
            )
            detections_table.insert(error_detection.dict())
            raise e
    
    async def _call_roboflow_api(self, image_url: str) -> dict:
        """Call Roboflow API for license plate detection"""
        if not self.roboflow_api_key:
            raise ValueError("ROBOFLOW_API_KEY not configured")
        
        try:
            response = requests.post(
                "https://serverless.roboflow.com/infer/workflows/axient/acdns",
                json={
                    "api_key": self.roboflow_api_key,
                    "inputs": {
                        "image": {
                            "type": "url",
                            "value": image_url
                        }
                    }
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Roboflow API error: {str(e)}")
    
    def _extract_plate_from_response(self, roboflow_response: dict) -> Tuple[str, float]:
        """Extract license plate number and confidence from Roboflow response"""
        try:
            # Navigate the Roboflow response structure
            outputs = roboflow_response.get("outputs", [])
            if not outputs:
                return None, 0.0
            
            first_output = outputs[0].get("output", [])
            if not first_output:
                return None, 0.0
            
            # Get the first detected plate
            plate_data = first_output[0] if isinstance(first_output, list) else first_output
            
            if isinstance(plate_data, str):
                # Simple string response
                return self._clean_plate_number(plate_data), 0.9
            elif isinstance(plate_data, dict):
                # Complex response with confidence
                plate_text = plate_data.get("text", plate_data.get("plate", ""))
                confidence = plate_data.get("confidence", 0.9)
                return self._clean_plate_number(plate_text), confidence
            
            return None, 0.0
            
        except Exception as e:
            print(f"⚠️ Error extracting plate from response: {e}")
            return None, 0.0
    
    def _clean_plate_number(self, raw_plate: str) -> str:
        """Clean and standardize plate number format"""
        if not raw_plate:
            return ""
        
        # Remove extra spaces and convert to uppercase
        cleaned = re.sub(r'\s+', ' ', raw_plate.strip().upper())
        
        # Ghana plate format: XX-XXXX-XX (letters-numbers-letters)
        # Try to match common patterns
        patterns = [
            r'([A-Z]{2})\s*[-\s]*(\d{4})\s*[-\s]*(\d{2})',  # GR-1234-21
            r'([A-Z]{2})\s*(\d{4})\s*([A-Z]{2})',           # GR1234AB
            r'([A-Z]+)\s*[-\s]*(\d+)\s*[-\s]*([A-Z\d]+)',   # Generic pattern
        ]
        
        for pattern in patterns:
            match = re.match(pattern, cleaned)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return f"{groups[0]}-{groups[1]}-{groups[2]}"
        
        # If no pattern matches, return cleaned version
        return cleaned
    
    def _find_plate_matches(self, detected_plate: str) -> List[PlateMatch]:
        """Find matching plates in database with fuzzy matching"""
        matches = []
        
        # Get all plates from database
        all_plates = plates_table.all()
        
        for plate_record in all_plates:
            stored_plate = plate_record.get("plate", "")
            similarity = self._calculate_similarity(detected_plate, stored_plate)
            
            # Check for exact match or high similarity
            exact_match = detected_plate.upper() == stored_plate.upper()
            is_similar = similarity >= self.similarity_threshold
            
            if exact_match or is_similar:
                # Get user information
                user_record = users_table.get(UserQuery.id == plate_record.get("user_id"))
                
                if user_record and user_record.get("is_active", True):
                    match = PlateMatch(
                        plate_number=stored_plate,
                        user_id=user_record["id"],
                        user_name=user_record["name"],
                        user_phone=user_record["phone"],
                        confidence=1.0 if exact_match else similarity,
                        exact_match=exact_match,
                        similarity_score=similarity
                    )
                    matches.append(match)
        
        # Sort by confidence (exact matches first, then by similarity)
        matches.sort(key=lambda x: (x.exact_match, x.confidence), reverse=True)
        
        return matches
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings using SequenceMatcher"""
        return SequenceMatcher(None, str1.upper(), str2.upper()).ratio()
    
    async def _send_detection_notification(self, match: PlateMatch, detection: DetectionResult) -> bool:
        """Send SMS notification to matched user"""
        try:
            # Create notification message
            message = self._create_notification_message(match, detection)
            
            # Send SMS
            result = send_sms(match.user_phone, message)
            
            # Log notification
            notification_record = {
                "id": random.randint(10000, 99999),
                "user_id": match.user_id,
                "detection_id": detection.id,
                "phone": match.user_phone,
                "message": message,
                "sent_at": datetime.datetime.utcnow().isoformat(),
                "status": "sent" if result.get("status") == "success" else "failed",
                "response": result
            }
            
            from ..db.database import notifications_table
            notifications_table.insert(notification_record)
            
            return result.get("status") == "success"
            
        except Exception as e:
            print(f"❌ Notification error: {str(e)}")
            return False
    
    def _create_notification_message(self, match: PlateMatch, detection: DetectionResult) -> str:
        """Create personalized notification message"""
        location_text = f" at {detection.location}" if detection.location else ""
        time_text = datetime.datetime.now().strftime("%I:%M %p on %B %d, %Y")
        
        message = (
            f"Hello {match.user_name}, "
            f"your vehicle with plate {match.plate_number} was detected{location_text} "
            f"at {time_text}. "
            f"If this wasn't you, please contact us immediately. - Acdnsys"
        )
        
        return message
    
    def get_detection_history(self, limit: int = 50) -> List[dict]:
        """Get recent detection history"""
        detections = detections_table.all()
        
        # Sort by detected_at (most recent first)
        sorted_detections = sorted(
            detections, 
            key=lambda x: x.get("detected_at", ""), 
            reverse=True
        )
        
        return sorted_detections[:limit]
    
    def get_user_detections(self, user_id: int) -> List[dict]:
        """Get detections for a specific user"""
        return detections_table.search(Detection.matched_user_id == user_id)


# Create singleton instance
detection_service = DetectionService()