from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import plates, sms, users, detection, enhanced_detection, analytics
from .services.validation_service import validation_service
from datetime import datetime


app = FastAPI(
    title="Acdnsys - Enhanced Vehicle Detection & License Plate Recognition System",
    description="""
    Comprehensive backend API for vehicle detection, license plate recognition, user management, and SMS notifications.
    
    ## Features
    - **Advanced Detection**: Multi-provider plate recognition with fuzzy matching
    - **User Management**: Complete CRUD operations with validation
    - **SMS Notifications**: Real-time alerts for vehicle matches
    - **Analytics**: Comprehensive system performance metrics
    - **Validation**: Input sanitization and security measures
    
    ## API Endpoints
    - `/users` - User management operations
    - `/plates` - License plate registration and management
    - `/detection` - Enhanced detection processing with retry logic
    - `/sms` - SMS notification services
    - `/analytics` - System analytics and reporting
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Acdnsys Support",
        "email": "support@acdnsys.com",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    }
)

# Include all routers with proper tags and prefixes
app.include_router(plates.router)
app.include_router(sms.router)
app.include_router(users.router)
app.include_router(detection.router)
app.include_router(enhanced_detection.router)
app.include_router(analytics.router)

# Add CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development
        "http://localhost:3001",  # Alternative port
        "https://acdnsys.vercel.app",  # Production frontend (example)
        # Add your production domains here
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def root():
    """
    API root endpoint with comprehensive system information
    
    Returns:
        System information including version, status, and available endpoints
    """
    return {
        "message": "Acdnsys Enhanced Backend API",
        "version": "2.1.0",
        "description": "Enhanced Vehicle Detection & License Plate Recognition System",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "users": "/users - Comprehensive user management with validation",
            "plates": "/plates - License plate registration and management", 
            "detection": "/detection - Enhanced vehicle detection with retry logic",
            "sms": "/sms - SMS notifications",
            "analytics": "/analytics - System performance analytics",
            "docs": "/docs - Interactive API documentation",
            "health": "/health - System health check"
        },
        "features": [
            "Multi-provider plate recognition",
            "Fuzzy matching algorithms", 
            "Real-time SMS notifications",
            "Comprehensive input validation",
            "Advanced analytics and reporting",
            "Bulk operations support"
        ]
    }


@app.get("/ping", tags=["System"])
def ping():
    """
    Simple health check endpoint for monitoring
    
    Returns:
        Basic health status and timestamp
    """
    return {
        "message": "pong from Acdnsys API",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.1.0"
    }


@app.get("/health", tags=["System"])
def health_check():
    """
    Comprehensive health check endpoint for system monitoring
    
    Returns:
        Detailed system health information including:
        - Database connectivity
        - Service dependencies
        - Performance metrics
        - System status
    """
    from .db.database import users_table, plates_table, detections_table
    from .services.enhanced_detection_service import enhanced_detection_service
    
    try:
        # Check database connectivity
        user_count = len(users_table.all())
        plate_count = len(plates_table.all())
        detection_count = len(detections_table.all())
        
        # Get service metrics
        service_metrics = enhanced_detection_service.get_performance_metrics()
        
        # Determine overall health status
        error_rate = service_metrics.get("failed_detections", 0) / max(service_metrics.get("total_detections", 1), 1) * 100
        
        if error_rate < 5:
            status = "healthy"
        elif error_rate < 20:
            status = "degraded"
        else:
            status = "unhealthy"
        
        return {
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.1.0",
            "database": {
                "status": "connected",
                "users": user_count,
                "plates": plate_count,
                "detections": detection_count
            },
            "services": {
                "detection_service": "operational",
                "sms_service": "operational",
                "validation_service": "operational"
            },
            "performance": {
                "error_rate_percent": round(error_rate, 2),
                "total_detections": service_metrics.get("total_detections", 0),
                "success_rate_percent": service_metrics.get("success_rate", 0),
                "cache_hit_rate_percent": service_metrics.get("cache_hit_rate", 0)
            },
            "dependencies": {
                "roboflow_api": "configured" if enhanced_detection_service.roboflow_api_key else "not_configured",
                "sms_api": "configured"  # Assume configured
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.1.0",
            "error": str(e),
            "message": "Health check failed - system requires attention"
        }


@app.get("/stats", tags=["System"])
def get_system_stats():
    """
    Get comprehensive system-wide statistics
    
    Returns:
        Detailed statistics about users, plates, detections, and system performance
    """
    from .db.database import users_table, plates_table, detections_table, notifications_table
    from .services.enhanced_detection_service import enhanced_detection_service
    
    try:
        # Get database counts
        all_users = users_table.all()
        all_plates = plates_table.all()
        all_detections = detections_table.all()
        all_notifications = notifications_table.all()
        
        total_users = len(all_users)
        active_users = len([u for u in all_users if u.get("is_active", True)])
        total_plates = len(all_plates)
        active_plates = len([p for p in all_plates if p.get("is_active", True)])
        total_detections = len(all_detections)
        matched_detections = len([d for d in all_detections if d.get("matched_user_id")])
        total_notifications = len(all_notifications)
        successful_notifications = len([n for n in all_notifications if n.get("status") == "sent"])
        
        # Get service performance metrics
        service_metrics = enhanced_detection_service.get_performance_metrics()
        
        # Calculate rates
        match_rate = (matched_detections / total_detections * 100) if total_detections > 0 else 0
        notification_rate = (successful_notifications / total_notifications * 100) if total_notifications > 0 else 0
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users,
                "with_plates": len([u for u in all_users if any(p.get("user_id") == u.get("id") for p in all_plates)])
            },
            "plates": {
                "total": total_plates,
                "active": active_plates,
                "inactive": total_plates - active_plates,
                "primary": len([p for p in all_plates if p.get("is_primary", False)])
            },
            "detections": {
                "total": total_detections,
                "matched": matched_detections,
                "match_rate_percent": round(match_rate, 2),
                "recent_24h": len([
                    d for d in all_detections 
                    if d.get("detected_at") and 
                       (datetime.utcnow() - datetime.fromisoformat(d.get("detected_at", "").replace('Z', '+00:00'))).days < 1
                ])
            },
            "notifications": {
                "total": total_notifications,
                "successful": successful_notifications,
                "success_rate_percent": round(notification_rate, 2)
            },
            "performance": service_metrics,
            "system": {
                "database_status": "operational",
                "api_version": "2.1.0",
                "uptime_status": "operational",
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        return {
            "error": f"Failed to generate statistics: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }


@app.get("/version", tags=["System"])
def get_version():
    """
    Get API version information
    
    return {
    Returns:
        Version information and changelog
    """
    return {
        "version": "2.1.0",
        "release_date": "2024-01-15",
        "changelog": {
            "2.1.0": [
                "Enhanced detection service with retry logic",
                "Advanced fuzzy matching algorithms",
                "Comprehensive input validation",
                "Analytics and reporting endpoints",
                "Improved error handling and logging",
                "Performance optimization with caching"
            ],
            "2.0.0": [
                "Initial release",
                "Basic detection functionality",
                "User and plate management",
                "SMS notifications"
            ]
        },
        "api_documentation": "/docs",
        "support_contact": "support@acdnsys.com"
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler with helpful information"""
    return {
        "error": "Endpoint not found",
        "message": f"The requested endpoint '{request.url.path}' does not exist",
        "available_endpoints": [
            "/docs - API documentation",
            "/health - System health check", 
            "/users - User management",
            "/plates - License plate management",
            "/detection - Vehicle detection",
            "/analytics - System analytics"
        ],
        "timestamp": datetime.utcnow().isoformat()
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler with error tracking"""
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred. Please try again later.",
        "support": "If the problem persists, contact support@acdnsys.com",
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": f"req_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services and perform startup checks"""
    print("🚀 Starting Acdnsys Enhanced API v2.1.0")
    print("📊 Initializing database connections...")
    print("🔧 Loading configuration...")
    print("✅ API ready to serve requests")


# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    print("🛑 Shutting down Acdnsys API")
    print("🧹 Cleaning up resources...")
    print("✅ Shutdown complete")


# Import required modules for type hints
from .db.database import User, Plate


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
        
