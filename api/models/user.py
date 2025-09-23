from pydantic import BaseModel, validator
from typing import Optional
import datetime
import re


class User(BaseModel):
    id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = datetime.datetime.utcnow().isoformat()
    updated_at: str = datetime.datetime.utcnow().isoformat()
    is_active: bool = True

    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format (Ghana format: +233XXXXXXXXX or 0XXXXXXXXX)"""
        if not v:
            raise ValueError('Phone number is required')
        
        # Remove spaces and special characters except +
        cleaned = re.sub(r'[^\d+]', '', v)
        
        # Check for Ghana format
        if cleaned.startswith('+233') and len(cleaned) == 13:
            return cleaned
        elif cleaned.startswith('0') and len(cleaned) == 10:
            return '+233' + cleaned[1:]  # Convert to international format
        else:
            raise ValueError('Invalid phone number format. Use +233XXXXXXXXX or 0XXXXXXXXX')

    @validator('email')
    def validate_email(cls, v):
        """Basic email validation"""
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v

    @validator('name')
    def validate_name(cls, v):
        """Validate name is not empty and contains only letters and spaces"""
        if not v or not v.strip():
            raise ValueError('Name is required')
        if not re.match(r'^[a-zA-Z\s]+$', v.strip()):
            raise ValueError('Name should contain only letters and spaces')
        return v.strip().title()  # Capitalize properly