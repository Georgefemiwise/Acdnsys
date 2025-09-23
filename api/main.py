from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import plates, sms, users, detection


app = FastAPI(
    title="Acdnsys - Vehicle Detection & License Plate Recognition System",
    description="Comprehensive backend API for vehicle detection, license plate recognition, user management, and SMS notifications",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include all routers
app.include_router(plates.router)
app.include_router(sms.router)
app.include_router(users.router)
app.include_router(detection.router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
@router.get("/")
def root():
    """
    API root endpoint with system information
    """
    return {
        "message": "Acdnsys Backend API",
        "version": "2.0.0",
        "description": "Vehicle Detection & License Plate Recognition System",
        "endpoints": {
            "users": "/users - User management",
            "plates": "/plates - License plate management", 
            "detection": "/detection - Vehicle detection and matching",
            "sms": "/sms - SMS notifications",
            "docs": "/docs - API documentation"
        },
        "status": "operational"
    }
    allow_headers=["*"],
)
@app.get("/ping")
def ping():
    """
    Health check endpoint
    """
    return {
        "message": "pong from Acdnsys API",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/stats")
def get_system_stats():
    """
    Get system-wide statistics
    """
    from .db.database import users_table, plates_table, detections_table
    
    total_users = len(users_table.all())
    active_users = len(users_table.search(User.is_active == True))
    total_plates = len(plates_table.all())
    active_plates = len(plates_table.search(Plate.is_active == True))
    total_detections = len(detections_table.all())
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "plates": {
            "total": total_plates,
            "active": active_plates
        },
        "detections": {
            "total": total_detections
        },
        "system": {
            "database_status": "operational",
            "api_version": "2.0.0"
        }
    }


# Import datetime for timestamps
from datetime import datetime
from .db.database import User, Plate
