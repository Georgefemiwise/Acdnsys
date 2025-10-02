from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime


class DetectionRequest(BaseModel):
    """Model for incoming detection requests"""
    image_url: str
    camera_id: Optional[str] = "default"
    location: Optional[str] = None


class DetectionResult(BaseModel):
    """Model for detection results"""
    id: Optional[int] = None
    plate_number: str
    confidence: float
    camera_id: Optional[str] = "default"
    location: Optional[str] = None
    image_url: Optional[str] = None
    detected_at: str = datetime.datetime.utcnow().isoformat()
    matched_user_id: Optional[int] = None
    notification_sent: bool = False
    raw_response: Optional[Dict[str, Any]] = None


class PlateMatch(BaseModel):
    """Model for plate matching results"""
    plate_number: str
    user_id: int
    user_name: str
    user_phone: str
    confidence: float
    exact_match: bool
    similarity_score: Optional[float] = None