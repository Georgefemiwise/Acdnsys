from fastapi import APIRouter, HTTPException, Query as QueryParam
from typing import List, Optional
from datetime import datetime
import random

from ..models.user import User
from ..models.plate import Plate
from ..db.database import users_table, plates_table, User as UserQuery, Plate as PlateQuery

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=dict)
def create_user(user: User):
    """
    Create a new user with comprehensive validation
    
    - **name**: Full name (required, letters and spaces only)
    - **phone**: Phone number in Ghana format (+233XXXXXXXXX or 0XXXXXXXXX)
    - **email**: Valid email address (optional)
    - **address**: Physical address (optional)
    - **emergency_contact**: Emergency contact phone (optional)
    - **notes**: Additional notes (optional)
    """
    try:
        # Generate unique ID
        user.id = random.randint(10000, 99999)
        user.created_at = datetime.utcnow().isoformat()
        user.updated_at = datetime.utcnow().isoformat()
        
        # Check if phone number already exists
        existing_user = users_table.get(UserQuery.phone == user.phone)
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail=f"User with phone number {user.phone} already exists"
            )
        
        # Insert user into database
        users_table.insert(user.dict())
        
        return {
            "message": "User created successfully",
            "user": user.dict(),
            "id": user.id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.get("/", response_model=List[dict])
def get_users(
    active_only: bool = QueryParam(True, description="Filter active users only"),
    search: Optional[str] = QueryParam(None, description="Search by name or phone"),
    limit: int = QueryParam(100, description="Maximum number of users to return")
):
    """
    Get all users with optional filtering
    
    - **active_only**: Return only active users (default: true)
    - **search**: Search by name or phone number
    - **limit**: Maximum number of results (default: 100)
    """
    try:
        # Start with all users
        if active_only:
            users = users_table.search(UserQuery.is_active == True)
        else:
            users = users_table.all()
        
        # Apply search filter
        if search:
            search_term = search.lower()
            users = [
                user for user in users 
                if search_term in user.get("name", "").lower() 
                or search_term in user.get("phone", "").lower()
            ]
        
        # Apply limit
        users = users[:limit]
        
        # Enrich with plate information
        enriched_users = []
        for user in users:
            user_plates = plates_table.search(PlateQuery.user_id == user["id"])
            user["plates"] = user_plates
            user["plate_count"] = len(user_plates)
            enriched_users.append(user)
        
        return enriched_users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.get("/{user_id}", response_model=dict)
def get_user(user_id: int):
    """
    Get a specific user by ID with their associated plates
    """
    try:
        user = users_table.get(UserQuery.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's plates
        user_plates = plates_table.search(PlateQuery.user_id == user_id)
        user["plates"] = user_plates
        user["plate_count"] = len(user_plates)
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")


@router.put("/{user_id}", response_model=dict)
def update_user(user_id: int, updated_user: User):
    """
    Update an existing user
    
    All validation rules apply as in user creation
    """
    try:
        # Check if user exists
        existing_user = users_table.get(UserQuery.id == user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if phone number is taken by another user
        phone_check = users_table.get(
            (UserQuery.phone == updated_user.phone) & (UserQuery.id != user_id)
        )
        if phone_check:
            raise HTTPException(
                status_code=400, 
                detail=f"Phone number {updated_user.phone} is already taken by another user"
            )
        
        # Preserve original creation date and ID
        updated_user.id = user_id
        updated_user.created_at = existing_user["created_at"]
        updated_user.updated_at = datetime.utcnow().isoformat()
        
        # Update user in database
        users_table.update(updated_user.dict(), UserQuery.id == user_id)
        
        return {
            "message": "User updated successfully",
            "user": updated_user.dict()
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, hard_delete: bool = QueryParam(False, description="Permanently delete user")):
    """
    Delete a user (soft delete by default)
    
    - **hard_delete**: If true, permanently removes user and all associated data
    - Default behavior: Sets is_active to false (soft delete)
    """
    try:
        user = users_table.get(UserQuery.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if hard_delete:
            # Hard delete: Remove user and all associated plates
            users_table.remove(UserQuery.id == user_id)
            plates_table.remove(PlateQuery.user_id == user_id)
            
            return {
                "message": "User and all associated data permanently deleted",
                "user_id": user_id
            }
        else:
            # Soft delete: Set is_active to false
            users_table.update(
                {"is_active": False, "updated_at": datetime.utcnow().isoformat()},
                UserQuery.id == user_id
            )
            
            return {
                "message": "User deactivated successfully",
                "user_id": user_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.post("/{user_id}/activate", response_model=dict)
def activate_user(user_id: int):
    """
    Reactivate a deactivated user
    """
    try:
        user = users_table.get(UserQuery.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        users_table.update(
            {"is_active": True, "updated_at": datetime.utcnow().isoformat()},
            UserQuery.id == user_id
        )
        
        return {
            "message": "User activated successfully",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate user: {str(e)}")


@router.get("/{user_id}/plates", response_model=List[dict])
def get_user_plates(user_id: int):
    """
    Get all plates associated with a specific user
    """
    try:
        # Verify user exists
        user = users_table.get(UserQuery.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's plates
        user_plates = plates_table.search(PlateQuery.user_id == user_id)
        
        return user_plates
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user plates: {str(e)}")