import os
import requests
from dotenv import load_dotenv

load_dotenv()

ARKESEL_API_KEY = os.getenv("ARKESEL_API_KEY")
SMS_URL = "https://sms.arkesel.com/api/v2/sms/send"


def send_sms(to: str, message: str, sender_id="PlateSys"):
    headers = {"api-key": ARKESEL_API_KEY}
    payload = {
        "recipient": to,
        "sender": sender_id,
        "message": message,
    }

    try:
        response = requests.post(SMS_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}
