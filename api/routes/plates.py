from datetime import datetime
import random
from fastapi import APIRouter, HTTPException

from api.routes.sms import send_sms_route

from ..models.sms import Sms
from ..services.sms_service import send_sms
from ..models.plate import Plate
from ..db.tinydb import plates_table

router = APIRouter(prefix="/plates", tags=["Plates"])


# Create Plate + Send SMS
@router.post("/")
def create_plate(plate: Plate):
    plate.id = random.randint(1000, 9999)
    plate.detected_at = datetime.utcnow().isoformat()
    plates_table.insert(plate.dict())

    # Send SMS if phone exists
    if plate.owner and plate.phone:
        sms = Sms(
            to=plate.phone,
            message=f"Hello {plate.owner}, your plate {plate.plate} was detected at {plate.detected_at}",
        )
        send_sms_route(sms)

    return {"plates": plates_table.all()}


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
