from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from ..models.detection import DetectionRequest, DetectionResult
from ..services.detection_service import detection_service
from ..db.database import detections_table, Detection as DetectionQuery

router = APIRouter(prefix="/detection", tags=["Detection"])


@router.post("/process", response_model=DetectionResult)
async def process_detection(request: DetectionRequest, background_tasks: BackgroundTasks):
    """
    Process camera input for license plate detection and matching
    
    This endpoint:
    1. Analyzes the provided image for license plates
    2. Matches detected plates against the database
    3. Sends SMS notifications for matches
    4. Stores the detection result
    
    - **image_url**: Public URL of the image to analyze
    - **camera_id**: Identifier for the camera (optional)
    - **location**: Location where detection occurred (optional)
    """
    try:
        print(request.image_url)
        # Validate image URL
        # if not request.image_url or not request.image_url.startswith(('http://', 'https://')):
        #     raise HTTPException(
        #         status_code=400, 
        #         detail="Valid image URL is required (must start with http:// or https://)"
        #     )
        
        # Process detection in the background for better performance
        result = await detection_service.process_detection(request)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection processing failed: {str(e)}")


@router.get("/history", response_model=List[dict])
def get_detection_history(
    limit: int = 50,
    user_id: Optional[int] = None,
    matched_only: bool = False
):
    """
    Get detection history with optional filtering
    
    - **limit**: Maximum number of results (default: 50)
    - **user_id**: Filter by specific user ID
    - **matched_only**: Show only detections that matched a user
    """
    try:
        if user_id:
            # Get detections for specific user
            detections = detection_service.get_user_detections(user_id)
        else:
            # Get all detections
            detections = detection_service.get_detection_history(limit)
        
        # Filter matched only if requested
        if matched_only:
            detections = [d for d in detections if d.get("matched_user_id")]
        
        # Enrich with user information for matched detections
        enriched_detections = []
        for detection in detections:
            if detection.get("matched_user_id"):
                from ..db.database import users_table, User as UserQuery
                user = users_table.get(UserQuery.id == detection["matched_user_id"])
                if user:
                    detection["matched_user"] = {
                        "name": user["name"],
                        "phone": user["phone"]
                    }
            enriched_detections.append(detection)
        
        return enriched_detections
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch detection history: {str(e)}")


@router.get("/stats", response_model=dict)
def get_detection_stats():
    """
    Get detection statistics and analytics
    """
    try:
        all_detections = detections_table.all()
        
        total_detections = len(all_detections)
        matched_detections = len([d for d in all_detections if d.get("matched_user_id")])
        notifications_sent = len([d for d in all_detections if d.get("notification_sent")])
        
        # Calculate success rates
        match_rate = (matched_detections / total_detections * 100) if total_detections > 0 else 0
        notification_rate = (notifications_sent / matched_detections * 100) if matched_detections > 0 else 0
        
        # Get recent activity (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_detections = [
            d for d in all_detections 
            if d.get("detected_at", "") > yesterday
        ]
        
        # Top detected plates
        plate_counts = {}
        for detection in all_detections:
            plate = detection.get("plate_number", "UNKNOWN")
            plate_counts[plate] = plate_counts.get(plate, 0) + 1
        
        top_plates = sorted(plate_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_detections": total_detections,
            "matched_detections": matched_detections,
            "notifications_sent": notifications_sent,
            "match_rate_percent": round(match_rate, 2),
            "notification_success_rate_percent": round(notification_rate, 2),
            "recent_detections_24h": len(recent_detections),
            "top_detected_plates": [{"plate": plate, "count": count} for plate, count in top_plates],
            "average_confidence": round(
                sum(d.get("confidence", 0) for d in all_detections) / total_detections, 2
            ) if total_detections > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch detection stats: {str(e)}")


@router.delete("/history", response_model=dict)
def clear_detection_history(confirm: bool = False):
    """
    Clear all detection history (use with caution)
    
    - **confirm**: Must be true to proceed with deletion
    """
    if not confirm:
        raise HTTPException(
            status_code=400, 
            detail="Must set confirm=true to clear detection history"
        )
    
    try:
        # Clear detections table
        detections_table.truncate()
        
        # Clear notifications table
        from ..db.database import notifications_table
        notifications_table.truncate()
        
        return {
            "message": "Detection history cleared successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear detection history: {str(e)}")