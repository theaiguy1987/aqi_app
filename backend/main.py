from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uvicorn
import os
from aqi_calculator import calculate_aqi, generate_sample_pollutant_data
from station_service import get_all_cities, get_stations_by_city, get_station_by_id, get_metadata
from openaq_client import fetch_live_aqi_data

app = FastAPI(
    title="AQI Calculator API",
    description="Air Quality Index calculator with real-time data from OpenAQ",
    version="2.0.0"
)

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


# ============================================================
# NEW ENDPOINTS: City and Station Selection with Live Data
# ============================================================

class CityResponse(BaseModel):
    name: str
    station_count: int

class StationResponse(BaseModel):
    id: int
    name: str
    locality: str
    coordinates: dict
    sensors: List[str]
    provider: str
    is_active: bool
    last_updated: Optional[str] = None

class LiveAQIRequest(BaseModel):
    station_id: int

class MeasurementResponse(BaseModel):
    parameter: str
    display_name: str
    value: float
    unit: str
    datetime: Optional[str] = None

class LiveAQIResponse(BaseModel):
    station_id: int
    station_name: str
    locality: Optional[str] = None
    aqi: int
    category: str
    color: str
    dominant_pollutant: str
    message: str
    measurements: List[MeasurementResponse]
    individual_aqis: dict
    fetched_at: str


@app.get("/cities", response_model=List[CityResponse])
async def list_cities():
    """
    Get list of all cities with air quality stations.
    
    Returns cities sorted alphabetically with station counts.
    Use this to populate a city dropdown in the UI.
    """
    try:
        cities = get_all_cities()
        return cities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cities: {str(e)}")


@app.get("/stations/{city}", response_model=List[StationResponse])
async def list_stations(city: str):
    """
    Get all air quality stations in a specific city.
    
    Args:
        city: City name (case-insensitive)
    
    Returns list of stations sorted by active status and name.
    Active stations (with recent data) appear first.
    """
    try:
        stations = get_stations_by_city(city)
        
        if not stations:
            raise HTTPException(
                status_code=404, 
                detail=f"No stations found in city: {city}"
            )
        
        return stations
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stations: {str(e)}")


@app.post("/aqi/live", response_model=LiveAQIResponse)
async def calculate_live_aqi(request: LiveAQIRequest):
    """
    Fetch real-time air quality data and calculate AQI for a station.
    
    This calls the OpenAQ API to get the latest measurements,
    then calculates the AQI using EPA standards.
    
    Args:
        station_id: OpenAQ location ID
    
    Returns:
        Live AQI data with measurements and health recommendations
    """
    try:
        # Verify station exists in our data
        station = get_station_by_id(request.station_id)
        if not station:
            raise HTTPException(
                status_code=404,
                detail=f"Station ID {request.station_id} not found in database"
            )
        
        # Fetch live data from OpenAQ
        live_data = fetch_live_aqi_data(request.station_id)
        
        if not live_data.get('pollutants'):
            raise HTTPException(
                status_code=404,
                detail=f"No recent measurements available for station {request.station_id}"
            )
        
        # Calculate AQI from pollutant data
        aqi_result = calculate_aqi(live_data['pollutants'])
        
        # Format measurements for response
        measurements = [
            MeasurementResponse(
                parameter=m['parameter'],
                display_name=m['display_name'],
                value=m['value'],
                unit=m['unit'],
                datetime=m.get('datetime')
            )
            for m in live_data.get('measurements', [])
        ]
        
        return LiveAQIResponse(
            station_id=request.station_id,
            station_name=live_data.get('station_name', 'Unknown'),
            locality=live_data.get('locality'),
            aqi=aqi_result['aqi'],
            category=aqi_result['category'],
            color=aqi_result['color'],
            dominant_pollutant=aqi_result['dominant_pollutant'],
            message=aqi_result['message'],
            measurements=measurements,
            individual_aqis=aqi_result.get('individual_aqis', {}),
            fetched_at=live_data.get('fetched_at', datetime.utcnow().isoformat() + 'Z')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching live AQI: {str(e)}")


@app.get("/stations/metadata")
async def get_stations_metadata():
    """Get metadata about the station database (total count, fetch date, etc.)"""
    return get_metadata()

if __name__ == "__main__":
    # Use PORT environment variable for Cloud Run, default to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
