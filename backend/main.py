from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uvicorn
import os
from aqi_calculator import calculate_aqi, generate_sample_pollutant_data

app = FastAPI(title="AQI Calculator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AQIRequest(BaseModel):
    location: str
    date: str
    # Optional pollutant concentrations (in µg/m³ for PM, ppm for gases)
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    co: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    o3: Optional[float] = None

class AQIResponse(BaseModel):
    aqi: int
    category: str
    color: str
    location: str
    date: str
    dominant_pollutant: str
    message: str

@app.get("/")
async def root():
    return {"message": "AQI Calculator API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/calculate-aqi", response_model=AQIResponse)
async def calculate_aqi_endpoint(request: AQIRequest):
    """
    Calculate AQI based on location and date.
    
    If pollutant concentrations are provided, use them.
    Otherwise, generate sample data for demonstration.
    """
    try:
        # Validate date format
        try:
            date_obj = datetime.fromisoformat(request.date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD)")
        
        # Collect pollutant data
        pollutants = {}
        if request.pm25 is not None:
            pollutants['pm25'] = request.pm25
        if request.pm10 is not None:
            pollutants['pm10'] = request.pm10
        if request.co is not None:
            pollutants['co'] = request.co
        if request.no2 is not None:
            pollutants['no2'] = request.no2
        if request.so2 is not None:
            pollutants['so2'] = request.so2
        if request.o3 is not None:
            pollutants['o3'] = request.o3
        
        # If no pollutants provided, generate sample data
        if not pollutants:
            pollutants = generate_sample_pollutant_data()
        
        # Calculate AQI
        result = calculate_aqi(pollutants)
        
        return AQIResponse(
            aqi=result['aqi'],
            category=result['category'],
            color=result['color'],
            location=request.location,
            date=request.date,
            dominant_pollutant=result['dominant_pollutant'],
            message=result['message']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating AQI: {str(e)}")

if __name__ == "__main__":
    # Use PORT environment variable for Cloud Run, default to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
