from tinydb import TinyDB, Query
import os

# Initialize database
DB_PATH = os.getenv("DB_PATH", "acdnsys.json")
db = TinyDB(DB_PATH)

# Define tables
users_table = db.table("users")
plates_table = db.table("plates") 
detections_table = db.table("detections")
notifications_table = db.table("notifications")

# Create indexes for better performance (TinyDB doesn't have real indexes, but we can optimize queries)
User = Query()
Plate = Query()
Detection = Query()
Notification = Query()


def init_database():
    """Initialize database with sample data if empty"""
    if len(users_table) == 0:
        # Add sample users for testing
        sample_users = [
            {
                "id": 1,
                "name": "John Doe",
                "phone": "+233241234567",
                "email": "john@example.com",
                "address": "Accra, Ghana",
                "emergency_contact": "+233501234567",
                "notes": "VIP Customer",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
                "is_active": True
            },
            {
                "id": 2,
                "name": "Jane Smith",
                "phone": "+233209876543",
                "email": "jane@example.com",
                "address": "Kumasi, Ghana",
                "emergency_contact": "+233559876543",
                "notes": "Regular Customer",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
                "is_active": True
            }
        ]
        
        sample_plates = [
            {
                "id": 1,
                "user_id": 1,
                "plate": "GR-1234-21",
                "vehicle_make": "Toyota",
                "vehicle_model": "Corolla",
                "vehicle_color": "Silver",
                "is_primary": True,
                "created_at": "2024-01-01T00:00:00"
            },
            {
                "id": 2,
                "user_id": 1,
                "plate": "GR-5678-21",
                "vehicle_make": "Honda",
                "vehicle_model": "Civic",
                "vehicle_color": "Blue",
                "is_primary": False,
                "created_at": "2024-01-01T00:00:00"
            },
            {
                "id": 3,
                "user_id": 2,
                "plate": "AS-9876-22",
                "vehicle_make": "Nissan",
                "vehicle_model": "Sentra",
                "vehicle_color": "White",
                "is_primary": True,
                "created_at": "2024-01-01T00:00:00"
            }
        ]
        
        users_table.insert_multiple(sample_users)
        plates_table.insert_multiple(sample_plates)
        
        print("✅ Database initialized with sample data")


# Initialize on import
init_database()


