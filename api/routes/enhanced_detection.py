"""
Enhanced Detection Routes with Comprehensive Error Handling
Provides robust API endpoints for license plate detection including:
- Real-time detection processing with retry logic
- Batch detection processing for multiple images
- Detection history with advanced filtering
- Performance metrics and system health monitoring
- Webhook support for external integrations
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query as QueryParam, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging

from ..models.detection import DetectionRequest, DetectionResult
from ..services.enhanced_detection_service import enhanced_detection_service
from ..db.database import detections_table, Detection as DetectionQuery
from ..services.validation_service import validation_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/detection", tags=["Enhanced Detection"])


@router.post("/process", response_model=DetectionResult)
async def process_single_detection(
    request: DetectionRequest, 
    background_tasks: BackgroundTasks
):
    """
    Process a single image for license plate detection with comprehensive error handling
    
    This endpoint provides:
    - Advanced plate recognition with multiple detection strategies
    - Intelligent database matching with fuzzy logic
    - Real-time SMS notifications for matches
    - Comprehensive error handling and logging
    - Performance optimization with caching
    
    **Request Parameters:**
    - **image_url**: Public URL of the image to analyze (required)
    - **camera_id**: Identifier for the camera source (optional, default: "default")
    - **location**: Physical location where detection occurred (optional)
    
    **Response:**
    - Complete detection result with match information
    - SMS notification status if match found
    - Confidence scores and processing metadata
    
    **Error Handling:**
    - Invalid image URLs return 400 Bad Request
    - Detection failures return 500 with detailed error information
    - All errors are logged for system monitoring
    """
    try:
        # Validate request parameters
        if not request.image_url:
            raise HTTPException(
                status_code=400,
                detail="Image URL is required"
            )
        
        if not request.image_url.startswith(('http://', 'https://')):
            raise HTTPException(
                status_code=400,
                detail="Image URL must be a valid HTTP/HTTPS URL"
            )
        
        logger.info(f"Processing detection request for image: {request.image_url[:100]}...")
        
        # Process detection using enhanced service
        result = await enhanced_detection_service.process_detection_with_retry(request)
        
        # Log successful detection
        logger.info(
            f"Detection completed successfully: "
            f"Plate={result.plate_number}, "
            f"Confidence={result.confidence:.3f}, "
            f"Matched={bool(result.matched_user_id)}, "
            f"SMS_Sent={result.notification_sent}"
        )
        
        return result
        
    except ValueError as e:
        # Client error (bad input)
        logger.warning(f"Detection validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        # Server error (processing failure)
        logger.error(f"Detection processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Detection processing failed: {str(e)}"
        )


@router.post("/batch", response_model=List[DetectionResult])
async def process_batch_detection(
    requests: List[DetectionRequest],
    background_tasks: BackgroundTasks,
    max_concurrent: int = QueryParam(5, description="Maximum concurrent detections")
):
    """
    Process multiple images for license plate detection in batch
    
    **Features:**
    - Concurrent processing for improved performance
    - Configurable concurrency limits to prevent overload
    - Individual error handling per image
    - Comprehensive batch processing statistics
    
    **Parameters:**
    - **requests**: List of DetectionRequest objects (max 20 per batch)
    - **max_concurrent**: Maximum number of concurrent detections (default: 5)
    
    **Returns:**
    - List of DetectionResult objects (one per input image)
    - Failed detections return error information in the result
    """
    try:
        # Validate batch size
        if len(requests) > 20:
            raise HTTPException(
                status_code=400,
                detail="Batch size cannot exceed 20 images"
            )
        
        if len(requests) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one detection request is required"
            )
        
        # Validate concurrent limit
        max_concurrent = min(max_concurrent, 10)  # Cap at 10 for system stability
        
        logger.info(f"Processing batch of {len(requests)} detections with max_concurrent={max_concurrent}")
        
        # Create semaphore to limit concurrent processing
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_single_with_semaphore(request: DetectionRequest) -> DetectionResult:
            """Process single detection with concurrency control"""
            async with semaphore:
                try:
                    return await enhanced_detection_service.process_detection_with_retry(request)
                except Exception as e:
                    # Return error result instead of raising exception
                    logger.error(f"Batch detection failed for {request.image_url}: {str(e)}")
                    return DetectionResult(
                        id=enhanced_detection_service._generate_detection_id(),
                        plate_number="BATCH_ERROR",
                        confidence=0.0,
                        camera_id=request.camera_id or "default",
                        location=request.location,
                        image_url=request.image_url,
                        detected_at=datetime.utcnow().isoformat(),
                        raw_response={"error": str(e), "batch_processing": True}
                    )
        
        # Process all requests concurrently
        start_time = datetime.utcnow()
        results = await asyncio.gather(
            *[process_single_with_semaphore(req) for req in requests],
            return_exceptions=False
        )
        
        # Calculate batch statistics
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        successful_detections = len([r for r in results if r.plate_number != "BATCH_ERROR"])
        matched_detections = len([r for r in results if r.matched_user_id])
        notifications_sent = len([r for r in results if r.notification_sent])
        
        logger.info(
            f"Batch processing completed: "
            f"Total={len(results)}, "
            f"Successful={successful_detections}, "
            f"Matched={matched_detections}, "
            f"SMS_Sent={notifications_sent}, "
            f"Time={processing_time:.2f}s"
        )
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch processing failed: {str(e)}"
        )


@router.get("/history", response_model=List[Dict[str, Any]])
def get_enhanced_detection_history(
    limit: int = QueryParam(50, description="Maximum number of results"),
    offset: int = QueryParam(0, description="Number of results to skip"),
    user_id: Optional[int] = QueryParam(None, description="Filter by specific user ID"),
    camera_id: Optional[str] = QueryParam(None, description="Filter by camera ID"),
    location: Optional[str] = QueryParam(None, description="Filter by location"),
    matched_only: bool = QueryParam(False, description="Show only matched detections"),
    date_from: Optional[str] = QueryParam(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = QueryParam(None, description="End date (YYYY-MM-DD)"),
    min_confidence: float = QueryParam(0.0, description="Minimum confidence threshold"),
    plate_search: Optional[str] = QueryParam(None, description="Search by plate number")
):
    """
    Get detection history with advanced filtering and pagination
    
    **Advanced Filtering Options:**
    - **Date Range**: Filter detections by date range
    - **Confidence Threshold**: Show only high-confidence detections
    - **Location/Camera**: Filter by specific detection sources
    - **Plate Search**: Search for specific plate numbers (supports partial matching)
    - **User-specific**: Show detections for specific users only
    
    **Pagination:**
    - **limit**: Number of results per page (max 200)
    - **offset**: Skip number of results for pagination
    
    **Returns:**
    - Paginated list of detection records with enriched user information
    - Total count information for pagination
    - Processing statistics and metadata
    """
    try:
        # Validate parameters
        limit = min(limit, 200)  # Cap at 200 for performance
        if limit <= 0:
            raise HTTPException(status_code=400, detail="Limit must be positive")
        
        if offset < 0:
            raise HTTPException(status_code=400, detail="Offset cannot be negative")
        
        # Get all detections (we'll filter in Python since TinyDB has limited query capabilities)
        all_detections = detections_table.all()
        
        # Apply filters
        filtered_detections = []
        
        for detection in all_detections:
            # Skip if doesn't match filters
            if user_id and detection.get("matched_user_id") != user_id:
                continue
            
            if camera_id and detection.get("camera_id") != camera_id:
                continue
            
            if location and detection.get("location") != location:
                continue
            
            if matched_only and not detection.get("matched_user_id"):
                continue
            
            if min_confidence > 0 and detection.get("confidence", 0) < min_confidence:
                continue
            
            if plate_search:
                plate_number = detection.get("plate_number", "")
                if plate_search.upper() not in plate_number.upper():
                    continue
            
            # Date filtering
            if date_from or date_to:
                try:
                    detection_date = datetime.fromisoformat(
                        detection.get("detected_at", "").replace('Z', '+00:00')
                    ).date()
                    
                    if date_from:
                        from_date = datetime.strptime(date_from, "%Y-%m-%d").date()
                        if detection_date < from_date:
                            continue
                    
                    if date_to:
                        to_date = datetime.strptime(date_to, "%Y-%m-%d").date()
                        if detection_date > to_date:
                            continue
                            
                except (ValueError, TypeError):
                    # Skip detections with invalid dates
                    continue
            
            filtered_detections.append(detection)
        
        # Sort by detection time (most recent first)
        filtered_detections.sort(
            key=lambda x: x.get("detected_at", ""),
            reverse=True
        )
        
        # Apply pagination
        total_count = len(filtered_detections)
        paginated_detections = filtered_detections[offset:offset + limit]
        
        # Enrich with user information
        enriched_detections = []
        for detection in paginated_detections:
            enriched_detection = dict(detection)
            
            # Add user information for matched detections
            if detection.get("matched_user_id"):
                from ..db.database import users_table, User as UserQuery
                user = users_table.get(UserQuery.id == detection["matched_user_id"])
                if user:
                    enriched_detection["matched_user"] = {
                        "id": user["id"],
                        "name": user["name"],
                        "phone": user["phone"],
                        "email": user.get("email")
                    }
            
            # Add processing metadata
            enriched_detection["processing_metadata"] = {
                "has_error": detection.get("plate_number") in ["DETECTION_FAILED", "BATCH_ERROR", "UNKNOWN"],
                "confidence_level": (
                    "high" if detection.get("confidence", 0) >= 0.8 else
                    "medium" if detection.get("confidence", 0) >= 0.6 else
                    "low"
                ),
                "match_type": (
                    "exact" if detection.get("matched_user_id") and detection.get("confidence", 0) == 1.0 else
                    "fuzzy" if detection.get("matched_user_id") else
                    "no_match"
                )
            }
            
            enriched_detections.append(enriched_detection)
        
        # Return with pagination metadata
        return {
            "detections": enriched_detections,
            "pagination": {
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count,
                "next_offset": offset + limit if offset + limit < total_count else None
            },
            "filters_applied": {
                "user_id": user_id,
                "camera_id": camera_id,
                "location": location,
                "matched_only": matched_only,
                "date_from": date_from,
                "date_to": date_to,
                "min_confidence": min_confidence,
                "plate_search": plate_search
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching detection history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch detection history: {str(e)}"
        )


@router.get("/metrics", response_model=Dict[str, Any])
def get_detection_metrics():
    """
    Get comprehensive detection system performance metrics
    
    **Metrics Included:**
    - **Processing Performance**: Success rates, average processing times
    - **Cache Performance**: Hit rates, cache efficiency
    - **Detection Quality**: Confidence distributions, accuracy metrics
    - **System Health**: Error rates, recent activity indicators
    
    **Use Cases:**
    - System monitoring and alerting
    - Performance optimization analysis
    - Capacity planning and scaling decisions
    - Quality assurance and accuracy tracking
    """
    try:
        # Get service metrics
        service_metrics = enhanced_detection_service.get_performance_metrics()
        
        # Get database statistics
        all_detections = detections_table.all()
        recent_detections = [
            d for d in all_detections
            if d.get("detected_at") and
               (datetime.utcnow() - datetime.fromisoformat(
                   d.get("detected_at", "").replace('Z', '+00:00')
               )).total_seconds() < 3600  # Last hour
        ]
        
        # Calculate additional metrics
        total_detections = len(all_detections)
        matched_detections = len([d for d in all_detections if d.get("matched_user_id")])
        error_detections = len([
            d for d in all_detections 
            if d.get("plate_number") in ["DETECTION_FAILED", "BATCH_ERROR", "UNKNOWN"]
        ])
        
        # Confidence distribution
        confidence_scores = [
            d.get("confidence", 0) for d in all_detections 
            if d.get("confidence") is not None and d.get("plate_number") not in ["DETECTION_FAILED", "BATCH_ERROR", "UNKNOWN"]
        ]
        
        confidence_distribution = {
            "high_confidence": len([c for c in confidence_scores if c >= 0.8]),
            "medium_confidence": len([c for c in confidence_scores if 0.6 <= c < 0.8]),
            "low_confidence": len([c for c in confidence_scores if c < 0.6]),
            "average_confidence": sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        }
        
        # Recent activity metrics
        recent_activity = {
            "detections_last_hour": len(recent_detections),
            "matches_last_hour": len([d for d in recent_detections if d.get("matched_user_id")]),
            "errors_last_hour": len([
                d for d in recent_detections 
                if d.get("plate_number") in ["DETECTION_FAILED", "BATCH_ERROR", "UNKNOWN"]
            ])
        }
        
        return {
            "service_metrics": service_metrics,
            "database_metrics": {
                "total_detections": total_detections,
                "matched_detections": matched_detections,
                "error_detections": error_detections,
                "match_rate_percent": (matched_detections / total_detections * 100) if total_detections > 0 else 0,
                "error_rate_percent": (error_detections / total_detections * 100) if total_detections > 0 else 0
            },
            "confidence_distribution": confidence_distribution,
            "recent_activity": recent_activity,
            "system_health": {
                "status": "healthy" if recent_activity["errors_last_hour"] < 5 else "degraded",
                "last_detection": max([d.get("detected_at", "") for d in all_detections], default="never"),
                "cache_status": "optimal" if service_metrics.get("cache_hit_rate", 0) > 20 else "low_efficiency"
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating detection metrics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate metrics: {str(e)}"
        )


@router.post("/cache/clear", response_model=Dict[str, str])
def clear_detection_cache():
    """
    Clear the detection cache to free memory and force fresh detections
    
    **Use Cases:**
    - System maintenance and cleanup
    - Troubleshooting detection issues
    - Memory optimization
    - Testing with fresh detection results
    
    **Note:** This operation will temporarily reduce performance as the cache rebuilds
    """
    try:
        enhanced_detection_service.clear_cache()
        logger.info("Detection cache cleared via API request")
        
        return {
            "message": "Detection cache cleared successfully",
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error clearing detection cache: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
def get_detection_health():
    """
    Get detection system health status for monitoring and alerting
    
    **Health Indicators:**
    - **Service Status**: Overall system operational status
    - **Recent Activity**: Detection processing in the last hour
    - **Error Rates**: System error and failure rates
    - **Performance**: Processing times and throughput
    - **Dependencies**: External service availability
    
    **Status Levels:**
    - **healthy**: All systems operational, low error rates
    - **degraded**: Some issues detected, elevated error rates
    - **unhealthy**: Significant problems, high error rates or service unavailable
    """
    try:
        # Get current metrics
        metrics = enhanced_detection_service.get_performance_metrics()
        
        # Determine health status
        error_rate = (
            metrics["failed_detections"] / metrics["total_detections"] * 100
            if metrics["total_detections"] > 0 else 0
        )
        
        # Health status logic
        if error_rate < 5 and metrics["total_detections"] > 0:
            status = "healthy"
        elif error_rate < 20:
            status = "degraded"
        else:
            status = "unhealthy"
        
        # Check external dependencies
        dependencies = {
            "roboflow_api": "available" if enhanced_detection_service.roboflow_api_key else "not_configured",
            "sms_service": "available",  # Assume available unless we can test it
            "database": "available"  # TinyDB is always available
        }
        
        return {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "total_detections": metrics["total_detections"],
                "success_rate": metrics.get("success_rate", 0),
                "error_rate": error_rate,
                "average_processing_time": metrics["average_processing_time"],
                "cache_hit_rate": metrics.get("cache_hit_rate", 0)
            },
            "dependencies": dependencies,
            "recommendations": [
                "System is operating normally" if status == "healthy" else
                "Monitor error rates closely" if status == "degraded" else
                "Immediate attention required - high error rates detected"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error checking detection health: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "recommendations": ["System health check failed - investigate immediately"]
        }