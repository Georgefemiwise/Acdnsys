"""
Comprehensive Input Validation and Sanitization Service
Provides robust validation for all user inputs including:
- Phone number validation with international format support
- License plate format validation for Ghana and other regions
- Email validation with domain checking
- Name validation with character filtering
- Data sanitization to prevent injection attacks
"""

import re
import html
from typing import Optional, Dict, Any, List, Tuple
from email_validator import validate_email, EmailNotValidError
import phonenumbers
from phonenumbers import NumberParseException


class ValidationService:
    """
    Centralized validation service for all user inputs
    Implements comprehensive validation rules and sanitization
    """
    
    def __init__(self):
        # Ghana license plate patterns
        self.ghana_plate_patterns = [
            r'^[A-Z]{2}-\d{4}-\d{2}$',  # GR-1234-21 (standard format)
            r'^[A-Z]{2}\s*\d{4}\s*\d{2}$',  # GR 1234 21 (with spaces)
            r'^[A-Z]{3}-\d{3,4}-[A-Z]{1,2}$',  # ABC-123-A (alternative format)
            r'^[A-Z]{1,3}\s*\d{3,4}\s*[A-Z\d]{1,3}$',  # Flexible format
        ]
        
        # Common dangerous patterns to sanitize
        self.dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',  # Event handlers
            r'<iframe[^>]*>.*?</iframe>',  # Iframes
            r'<object[^>]*>.*?</object>',  # Objects
            r'<embed[^>]*>.*?</embed>',  # Embeds
        ]
    
    def validate_phone_number(self, phone: str, country_code: str = "GH") -> Tuple[bool, str, Optional[str]]:
        """
        Validate and format phone number with international support
        
        Args:
            phone: Raw phone number input
            country_code: ISO country code (default: GH for Ghana)
            
        Returns:
            Tuple of (is_valid, formatted_number, error_message)
        """
        if not phone or not phone.strip():
            return False, "", "Phone number is required"
        
        # Clean the input
        cleaned_phone = re.sub(r'[^\d+]', '', phone.strip())
        
        try:
            # Parse the phone number
            parsed_number = phonenumbers.parse(cleaned_phone, country_code)
            
            # Validate the number
            if not phonenumbers.is_valid_number(parsed_number):
                return False, "", "Invalid phone number format"
            
            # Format to international format
            formatted = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            
            return True, formatted, None
            
        except NumberParseException as e:
            error_messages = {
                NumberParseException.INVALID_COUNTRY_CODE: "Invalid country code",
                NumberParseException.NOT_A_NUMBER: "Not a valid phone number",
                NumberParseException.TOO_SHORT_NSN: "Phone number too short",
                NumberParseException.TOO_LONG: "Phone number too long",
                NumberParseException.TOO_SHORT_AFTER_IDD: "Phone number too short after country code",
            }
            
            return False, "", error_messages.get(e.error_type, "Invalid phone number")
    
    def validate_email(self, email: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate email address with comprehensive checks
        
        Args:
            email: Raw email input
            
        Returns:
            Tuple of (is_valid, normalized_email, error_message)
        """
        if not email or not email.strip():
            return True, "", None  # Email is optional
        
        try:
            # Validate and normalize email
            validated_email = validate_email(email.strip())
            return True, validated_email.email, None
            
        except EmailNotValidError as e:
            return False, "", str(e)
    
    def validate_license_plate(self, plate: str, country: str = "GH") -> Tuple[bool, str, Optional[str]]:
        """
        Validate and format license plate number
        
        Args:
            plate: Raw license plate input
            country: Country code for format validation
            
        Returns:
            Tuple of (is_valid, formatted_plate, error_message)
        """
        if not plate or not plate.strip():
            return False, "", "License plate number is required"
        
        # Clean and normalize the input
        cleaned_plate = re.sub(r'\s+', ' ', plate.strip().upper())
        
        # Remove extra spaces and normalize separators
        normalized_plate = re.sub(r'[-\s]+', '-', cleaned_plate)
        
        # Basic length check
        if len(normalized_plate) < 3:
            return False, "", "License plate number too short"
        
        if len(normalized_plate) > 15:
            return False, "", "License plate number too long"
        
        # Country-specific validation
        if country == "GH":  # Ghana
            # Check against Ghana patterns
            for pattern in self.ghana_plate_patterns:
                if re.match(pattern, normalized_plate):
                    return True, normalized_plate, None
            
            # If no exact match, check if it's a reasonable format
            if re.match(r'^[A-Z]{1,3}[-\s]*\d{3,4}[-\s]*[A-Z\d]{1,3}$', normalized_plate):
                return True, normalized_plate, None
            
            return False, "", "Invalid Ghana license plate format. Expected format: GR-1234-21"
        
        else:  # Generic validation for other countries
            # Basic alphanumeric check with common separators
            if re.match(r'^[A-Z0-9\-\s]{3,15}$', normalized_plate):
                return True, normalized_plate, None
            
            return False, "", "Invalid license plate format"
    
    def validate_name(self, name: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate and sanitize person name
        
        Args:
            name: Raw name input
            
        Returns:
            Tuple of (is_valid, sanitized_name, error_message)
        """
        if not name or not name.strip():
            return False, "", "Name is required"
        
        # Sanitize the input
        sanitized_name = self.sanitize_text_input(name.strip())
        
        # Check length
        if len(sanitized_name) < 2:
            return False, "", "Name must be at least 2 characters long"
        
        if len(sanitized_name) > 100:
            return False, "", "Name must be less than 100 characters"
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", sanitized_name):
            return False, "", "Name can only contain letters, spaces, hyphens, and apostrophes"
        
        # Check for reasonable format (not all spaces or special characters)
        if not re.search(r'[a-zA-Z]', sanitized_name):
            return False, "", "Name must contain at least one letter"
        
        # Capitalize properly
        formatted_name = ' '.join(word.capitalize() for word in sanitized_name.split())
        
        return True, formatted_name, None
    
    def validate_vehicle_year(self, year: Optional[int]) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Validate vehicle year
        
        Args:
            year: Vehicle year input
            
        Returns:
            Tuple of (is_valid, year, error_message)
        """
        if year is None:
            return True, None, None  # Year is optional
        
        current_year = 2024  # You might want to use datetime.now().year
        
        if year < 1900:
            return False, None, "Vehicle year cannot be before 1900"
        
        if year > current_year + 1:
            return False, None, f"Vehicle year cannot be after {current_year + 1}"
        
        return True, year, None
    
    def sanitize_text_input(self, text: str) -> str:
        """
        Sanitize text input to prevent XSS and injection attacks
        
        Args:
            text: Raw text input
            
        Returns:
            Sanitized text
        """
        if not text:
            return ""
        
        # HTML escape
        sanitized = html.escape(text)
        
        # Remove dangerous patterns
        for pattern in self.dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        # Remove null bytes and control characters
        sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', sanitized)
        
        # Normalize whitespace
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        return sanitized
    
    def validate_address(self, address: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate and sanitize address input
        
        Args:
            address: Raw address input
            
        Returns:
            Tuple of (is_valid, sanitized_address, error_message)
        """
        if not address or not address.strip():
            return True, "", None  # Address is optional
        
        # Sanitize the input
        sanitized_address = self.sanitize_text_input(address.strip())
        
        # Check length
        if len(sanitized_address) > 500:
            return False, "", "Address must be less than 500 characters"
        
        # Basic format check (allow letters, numbers, common punctuation)
        if not re.match(r"^[a-zA-Z0-9\s\-'.,#/()]+$", sanitized_address):
            return False, "", "Address contains invalid characters"
        
        return True, sanitized_address, None
    
    def validate_notes(self, notes: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate and sanitize notes/comments input
        
        Args:
            notes: Raw notes input
            
        Returns:
            Tuple of (is_valid, sanitized_notes, error_message)
        """
        if not notes or not notes.strip():
            return True, "", None  # Notes are optional
        
        # Sanitize the input
        sanitized_notes = self.sanitize_text_input(notes.strip())
        
        # Check length
        if len(sanitized_notes) > 1000:
            return False, "", "Notes must be less than 1000 characters"
        
        return True, sanitized_notes, None
    
    def validate_user_data(self, user_data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """
        Comprehensive validation for user data
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            Tuple of (is_valid, validated_data, error_messages)
        """
        errors = []
        validated_data = {}
        
        # Validate name
        name_valid, validated_name, name_error = self.validate_name(user_data.get('name', ''))
        if name_valid:
            validated_data['name'] = validated_name
        else:
            errors.append(f"Name: {name_error}")
        
        # Validate phone
        phone_valid, validated_phone, phone_error = self.validate_phone_number(user_data.get('phone', ''))
        if phone_valid:
            validated_data['phone'] = validated_phone
        else:
            errors.append(f"Phone: {phone_error}")
        
        # Validate email (optional)
        email_valid, validated_email, email_error = self.validate_email(user_data.get('email', ''))
        if email_valid:
            validated_data['email'] = validated_email
        else:
            errors.append(f"Email: {email_error}")
        
        # Validate address (optional)
        address_valid, validated_address, address_error = self.validate_address(user_data.get('address', ''))
        if address_valid:
            validated_data['address'] = validated_address
        else:
            errors.append(f"Address: {address_error}")
        
        # Validate emergency contact (optional)
        emergency_contact = user_data.get('emergency_contact', '')
        if emergency_contact:
            ec_valid, validated_ec, ec_error = self.validate_phone_number(emergency_contact)
            if ec_valid:
                validated_data['emergency_contact'] = validated_ec
            else:
                errors.append(f"Emergency Contact: {ec_error}")
        else:
            validated_data['emergency_contact'] = ""
        
        # Validate notes (optional)
        notes_valid, validated_notes, notes_error = self.validate_notes(user_data.get('notes', ''))
        if notes_valid:
            validated_data['notes'] = validated_notes
        else:
            errors.append(f"Notes: {notes_error}")
        
        return len(errors) == 0, validated_data, errors
    
    def validate_plate_data(self, plate_data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], List[str]]:
        """
        Comprehensive validation for license plate data
        
        Args:
            plate_data: Dictionary containing plate information
            
        Returns:
            Tuple of (is_valid, validated_data, error_messages)
        """
        errors = []
        validated_data = {}
        
        # Validate user_id
        user_id = plate_data.get('user_id')
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            errors.append("User ID: Valid user ID is required")
        else:
            validated_data['user_id'] = user_id
        
        # Validate license plate
        plate_valid, validated_plate, plate_error = self.validate_license_plate(plate_data.get('plate', ''))
        if plate_valid:
            validated_data['plate'] = validated_plate
        else:
            errors.append(f"License Plate: {plate_error}")
        
        # Validate vehicle make (optional)
        vehicle_make = plate_data.get('vehicle_make', '')
        if vehicle_make:
            make_valid, validated_make, make_error = self.validate_name(vehicle_make)
            if make_valid:
                validated_data['vehicle_make'] = validated_make
            else:
                errors.append(f"Vehicle Make: {make_error}")
        else:
            validated_data['vehicle_make'] = ""
        
        # Validate vehicle model (optional)
        vehicle_model = plate_data.get('vehicle_model', '')
        if vehicle_model:
            model_valid, validated_model, model_error = self.validate_name(vehicle_model)
            if model_valid:
                validated_data['vehicle_model'] = validated_model
            else:
                errors.append(f"Vehicle Model: {model_error}")
        else:
            validated_data['vehicle_model'] = ""
        
        # Validate vehicle color (optional)
        vehicle_color = plate_data.get('vehicle_color', '')
        if vehicle_color:
            color_valid, validated_color, color_error = self.validate_name(vehicle_color)
            if color_valid:
                validated_data['vehicle_color'] = validated_color
            else:
                errors.append(f"Vehicle Color: {color_error}")
        else:
            validated_data['vehicle_color'] = ""
        
        # Validate vehicle year (optional)
        vehicle_year = plate_data.get('vehicle_year')
        if vehicle_year is not None:
            try:
                year_int = int(vehicle_year) if not isinstance(vehicle_year, int) else vehicle_year
                year_valid, validated_year, year_error = self.validate_vehicle_year(year_int)
                if year_valid:
                    validated_data['vehicle_year'] = validated_year
                else:
                    errors.append(f"Vehicle Year: {year_error}")
            except (ValueError, TypeError):
                errors.append("Vehicle Year: Must be a valid year number")
        else:
            validated_data['vehicle_year'] = None
        
        # Validate is_primary (boolean)
        is_primary = plate_data.get('is_primary', True)
        validated_data['is_primary'] = bool(is_primary)
        
        # Validate notes (optional)
        notes_valid, validated_notes, notes_error = self.validate_notes(plate_data.get('notes', ''))
        if notes_valid:
            validated_data['notes'] = validated_notes
        else:
            errors.append(f"Notes: {notes_error}")
        
        return len(errors) == 0, validated_data, errors


# Create singleton instance
validation_service = ValidationService()