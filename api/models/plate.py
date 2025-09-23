from pydantic import BaseModel
from typing import Optional
from pydantic import validator
import datetime
import re


class Plate(BaseModel):
    id: Optional[int] = None
    user_id: int
    plate: str
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_year: Optional[int] = None
    is_primary: bool = True
    notes: Optional[str] = None
    created_at: str = datetime.datetime.utcnow().isoformat()
    updated_at: str = datetime.datetime.utcnow().isoformat()
    is_active: bool = True

    @validator('plate')
    def validate_plate(cls, v):
        """Validate and format license plate number"""
        if not v or not v.strip():
            raise ValueError('License plate number is required')
        
        # Clean the plate number
        cleaned = re.sub(r'\s+', ' ', v.strip().upper())
        
        # Ghana plate format validation (flexible)
        if not re.match(r'^[A-Z]{1,3}[-\s]*\d{1,4}[-\s]*[A-Z\d]{1,3}$', cleaned):
            # Allow more flexible formats but warn
            if len(cleaned) < 3:
                raise ValueError('License plate number too short')
        
        return cleaned

    @validator('vehicle_year')
    def validate_vehicle_year(cls, v):
        """Validate vehicle year"""
        if v is not None:
            current_year = datetime.datetime.now().year
            if v < 1900 or v > current_year + 1:
                raise ValueError(f'Vehicle year must be between 1900 and {current_year + 1}')
        return v

    @validator('user_id')
    def validate_user_id(cls, v):
        """Validate user_id is provided"""
        if not v:
            raise ValueError('User ID is required')
        return v