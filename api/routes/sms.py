from fastapi import APIRouter
from ..models.sms import Sms
from ..services.sms_service import send_sms
import random

router = APIRouter(prefix="/sms", tags=["SMS"])


@router.post("/")
def send_sms_route(sms: Sms):
    sms.id = random.randint(1000, 9999)

    result = send_sms(sms.to, sms.message)

    return {"id": sms.id, "to": sms.to, "message": sms.message, "status": result}
