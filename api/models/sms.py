from pydantic import BaseModel
from typing import Optional


class Sms(BaseModel):
    id: Optional[int] = None
    to: str  # recipient phone
    message: str  # sms text
    sender: Optional[str] = "Acdnsys"  # default sender
