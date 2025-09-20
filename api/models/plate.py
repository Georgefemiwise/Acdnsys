from pydantic import BaseModel
from typing import Optional
import datetime


class Plate(BaseModel):
    id: Optional[int] = None
    plate: str
    phone:str
    owner: Optional[str] = None
    detected_at: str = datetime.datetime.utcnow().isoformat()
