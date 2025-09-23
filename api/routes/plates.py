from fastapi import APIRouter, HTTPException, Query as QueryParam
from typing import List, Optional
from datetime import datetime
import random

from ..models.plate import Plate
from ..db.database import plates_table, users_table, Plate as PlateQuery, User as UserQuery

router = APIRouter(prefix="/plates", tags=["Plates"])


@router.post("/", response_model=dict)
def create_plate(plate: Plate):
    """
    Create a new license plate record
    
    - **user_id**: ID of the user who owns this plate (required)
    - **plate**: License plate number (required, will be validated and formatted)
    - **vehicle_make**: Vehicle manufacturer (optional)
    - **vehicle_model**: Vehicle model (optional)
    - **vehicle_color**: Vehicle color (optional)
    - **vehicle_year**: Vehicle year (optional, must be valid year)
    - **is_primary**: Whether this is the user's primary vehicle (default: true)
    - **notes**: Additional notes about the vehicle (optional)
    """
    try:
        # Verify user exists
        user = users_table.get(UserQuery.id == plate.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if plate already exists
        existing_plate = plates_table.get(PlateQuery.plate == plate.plate)
        if existing_plate:
            raise HTTPException(
                status_code=400, 
                detail=f"License plate {plate.plate} already exists"
            )
        
        # Generate unique ID and set timestamps
        plate.id = random.randint(10000, 99999)
        plate.created_at = datetime.utcnow().isoformat()
        plate.updated_at = datetime.utcnow().isoformat()
        
        # If this is set as primary, make sure no other plates for this user are primary
        if plate.is_primary:
            plates_table.update(
                {"is_primary": False, "updated_at": datetime.utcnow().isoformat()},
                PlateQuery.user_id == plate.user_id
            )
        
        # Insert plate into database
        plates_table.insert(plate.dict())
        
        return {
            "message": "License plate created successfully",
            "plate": plate.dict(),
            "owner": user["name"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create plate: {str(e)}")


@router.get("/", response_model=List[dict])
def get_plates(
    user_id: Optional[int] = QueryParam(None, description="Filter by user ID"),
    active_only: bool = QueryParam(True, description="Show only active plates"),
    search: Optional[str] = QueryParam(None, description="Search by plate number"),
    limit: int = QueryParam(100, description="Maximum number of results")
):
    """
    Get all license plates with optional filtering
    
    - **user_id**: Filter plates by specific user
    - **active_only**: Show only active plates (default: true)
    - **search**: Search by plate number
    - **limit**: Maximum number of results (default: 100)
    """
    try:
        # Build query conditions
        conditions = []
        
        if user_id:
            conditions.append(PlateQuery.user_id == user_id)
        
        if active_only:
            conditions.append(PlateQuery.is_active == True)
        
        # Execute query
        if conditions:
            # Combine conditions with AND
            query = conditions[0]
            for condition in conditions[1:]:
                query = query & condition
            plates = plates_table.search(query)
        else:
            plates = plates_table.all()
        
        # Apply search filter
        if search:
            search_term = search.upper()
            plates = [
                plate for plate in plates 
                if search_term in plate.get("plate", "").upper()
            ]
        
        # Apply limit
        plates = plates[:limit]
        
        # Enrich with user information
        enriched_plates = []
        for plate in plates:
            user = users_table.get(UserQuery.id == plate.get("user_id"))
            if user:
                plate["owner_name"] = user["name"]
                plate["owner_phone"] = user["phone"]
            enriched_plates.append(plate)
        
        return enriched_plates
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plates: {str(e)}")


@router.get("/{plate_id}", response_model=dict)
def get_plate(plate_id: int):
    """
    Get a specific license plate by ID
    """
    try:
        plate = plates_table.get(PlateQuery.id == plate_id)
        if not plate:
            raise HTTPException(status_code=404, detail="License plate not found")
        
        # Get owner information
        user = users_table.get(UserQuery.id == plate.get("user_id"))
        if user:
            plate["owner_name"] = user["name"]
            plate["owner_phone"] = user["phone"]
            plate["owner_email"] = user.get("email")
        
        return plate
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plate: {str(e)}")


@router.put("/{plate_id}", response_model=dict)
def update_plate(plate_id: int, updated: Plate):
    """
    Update an existing license plate
    
    All validation rules apply as in plate creation
    """
    try:
        # Check if plate exists
        existing_plate = plates_table.get(PlateQuery.id == plate_id)
        if not existing_plate:
            raise HTTPException(status_code=404, detail="License plate not found")
        
        # Verify user exists
        user = users_table.get(UserQuery.id == updated.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if plate number is taken by another record
        plate_check = plates_table.get(
            (PlateQuery.plate == updated.plate) & (PlateQuery.id != plate_id)
        )
        if plate_check:
            raise HTTPException(
                status_code=400, 
                detail=f"License plate {updated.plate} is already registered to another vehicle"
            )
        
        # Preserve original creation date and ID
        updated.id = plate_id
        updated.created_at = existing_plate["created_at"]
        updated.updated_at = datetime.utcnow().isoformat()
        
        # Handle primary plate logic
        if updated.is_primary and updated.user_id == existing_plate["user_id"]:
            # Make other plates for this user non-primary
            plates_table.update(
                {"is_primary": False, "updated_at": datetime.utcnow().isoformat()},
                (PlateQuery.user_id == updated.user_id) & (PlateQuery.id != plate_id)
            )
        
        # Update plate in database
        plates_table.update(updated.dict(), PlateQuery.id == plate_id)
        
        return {
            "message": "License plate updated successfully",
            "plate": updated.dict(),
            "owner": user["name"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update plate: {str(e)}")


@router.delete("/{plate_id}", response_model=dict)
def delete_plate(plate_id: int, hard_delete: bool = QueryParam(False, description="Permanently delete plate")):
    """
    Delete a license plate (soft delete by default)
    
    - **hard_delete**: If true, permanently removes the plate record
    - Default behavior: Sets is_active to false (soft delete)
    """
    try:
        plate = plates_table.get(PlateQuery.id == plate_id)
        if not plate:
            raise HTTPException(status_code=404, detail="License plate not found")
        
        if hard_delete:
            # Hard delete: Remove plate completely
            plates_table.remove(PlateQuery.id == plate_id)
            
            return {
                "message": "License plate permanently deleted",
                "plate_id": plate_id,
                "plate_number": plate.get("plate")
            }
        else:
            # Soft delete: Set is_active to false
            plates_table.update(
                {"is_active": False, "updated_at": datetime.utcnow().isoformat()},
                PlateQuery.id == plate_id
            )
            
            return {
                "message": "License plate deactivated successfully",
                "plate_id": plate_id,
                "plate_number": plate.get("plate")
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete plate: {str(e)}")


@router.post("/{plate_id}/activate", response_model=dict)
def activate_plate(plate_id: int):
    """
    Reactivate a deactivated license plate
    """
    try:
        plate = plates_table.get(PlateQuery.id == plate_id)
        if not plate:
            raise HTTPException(status_code=404, detail="License plate not found")
        
        plates_table.update(
            {"is_active": True, "updated_at": datetime.utcnow().isoformat()},
            PlateQuery.id == plate_id
        )
        
        return {
            "message": "License plate activated successfully",
            "plate_id": plate_id,
            "plate_number": plate.get("plate")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate plate: {str(e)}")


@router.get("/search/{plate_number}", response_model=List[dict])
def search_plates(plate_number: str):
    """
    Search for plates by plate number (supports partial matching)
    """
    try:
        search_term = plate_number.upper().strip()
        
        # Find plates that contain the search term
        all_plates = plates_table.search(PlateQuery.is_active == True)
        matching_plates = [
            plate for plate in all_plates 
            if search_term in plate.get("plate", "").upper()
        ]
        
        # Enrich with user information
        enriched_plates = []
        for plate in matching_plates:
            user = users_table.get(UserQuery.id == plate.get("user_id"))
            if user:
                plate["owner_name"] = user["name"]
                plate["owner_phone"] = user["phone"]
            enriched_plates.append(plate)
        
        return enriched_plates
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search plates: {str(e)}")