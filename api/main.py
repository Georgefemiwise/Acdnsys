from fastapi import FastAPI
from pydantic import BaseModel
import base64


app = FastAPI()


@app.get("/ping")
def ping():
    return {"message": "pong from FastAPI"}
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image: str  # base64 string

@app.post("/analyze")
def analyze_image(req: ImageRequest):
    # Here you’d run ML or car plate detection etc.
    # For demo just return mock data

    
    return {
        "car": "Toyota Corolla",
        "color": "Silver",
        "plate": "GR-1234-21",
        "confidence": 0.95
    }
