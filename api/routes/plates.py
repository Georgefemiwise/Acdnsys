import time
import random
from fastapi import APIRouter, HTTPException
from ..models.plate import Plate
from ..db.tinydb import plates_table

router = APIRouter(prefix="/plates", tags=["Plates"])


# Create
@router.post("/")
def create_plate(plate: Plate):
    # Generate a unique ID based on timestamp
    plate.id = int(time.time() * 1000)

    print(plate)
    # Insert into TinyDB
    plates_table.insert(plate.dict())
    print(plate)

    # Return the newly created plate only
    return {"plate": plate.dict()}


# Read all
@router.get("/")
def get_plates():
    return plates_table.all()


# Read one
@router.get("/{plate_id}")
def get_plate(plate_id: int):
    plate = plates_table.get(doc_id=plate_id)
    if not plate:
        raise HTTPException(status_code=404, detail="Plate not found")
    return plate


# Update
@router.put("/{plate_id}")
def update_plate(plate_id: int, updated: Plate):
    if not plates_table.contains(doc_id=plate_id):
        raise HTTPException(status_code=404, detail="Plate not found")
    plates_table.update(updated.dict(), doc_ids=[plate_id])
    return {"message": "Plate updated"}


# Delete
@router.delete("/{plate_id}")
def delete_plate(plate_id: int):
    if not plates_table.contains(doc_id=plate_id):
        raise HTTPException(status_code=404, detail="Plate not found")
    plates_table.remove(doc_ids=[plate_id])
    return {"message": "Plate deleted"}
