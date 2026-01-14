"""
AQI Calculator API - Using AQICN (World Air Quality Index) API

This FastAPI backend provides endpoints to:
- Get AQI by geographic coordinates (lat/lng)
- Search for air quality stations
- Calculate AQI from manual pollutant data

API Documentation: Visit /docs for interactive Swagger UI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uvicorn
import os

from aqicn_client import fetch_aqi_by_location, get_aqicn_client
from aqi_calculator import calculate_aqi, generate_sample_pollutant_data

app = FastAPI(
    title="AQI Calculator API",
    description="Air Quality Index calculator with real-time data from AQICN (World Air Quality Index)",
    version="3.0.0"
)

# CORS configuration - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request/Response Models
# ============================================================

class LocationAQIRequest(BaseModel):
    """Request model for fetching AQI by coordinates."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")


class MeasurementResponse(BaseModel):
    """Individual pollutant measurement."""
    parameter: str
    display_name: str
    value: float
    unit: str


class ForecastDay(BaseModel):
    """Daily forecast data."""
    avg: Optional[int] = None
    day: str
    max: Optional[int] = None
    min: Optional[int] = None


class AttributionResponse(BaseModel):
    """Data attribution info."""
    name: str
    url: Optional[str] = None


class LocationAQIResponse(BaseModel):
    """Response model for AQI by location."""
    station_id: Optional[int] = None
    station_name: str
    station_url: Optional[str] = None
    coordinates: dict
    aqi: Optional[int] = None
    category: str
    color: str
    aqi_standard: Optional[str] = None  # "NAQI (India)" or "EPA (US)"
    epa_aqi: Optional[int] = None  # Original EPA AQI from AQICN
    epa_category: Optional[str] = None
    epa_color: Optional[str] = None
    naqi_breakdown: Optional[dict] = None  # Individual NAQI per pollutant
    concentrations: Optional[dict] = None  # Estimated concentrations in μg/m³
    dominant_pollutant: str
    message: str
    measurements: List[MeasurementResponse]
    measurement_time: Optional[str] = None
    forecast: Optional[dict] = None
    attributions: Optional[List[dict]] = None
    fetched_at: str


class StationSearchResult(BaseModel):
    """Search result for a station."""
    uid: int
    station_name: str
    aqi: Optional[str] = None
    coordinates: dict


class ManualAQIRequest(BaseModel):
    """Request model for manual AQI calculation."""
    location: str
    date: str
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    co: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    o3: Optional[float] = None


class ManualAQIResponse(BaseModel):
    """Response model for manual AQI calculation."""
    aqi: int
    category: str
    color: str
    location: str
    date: str
    dominant_pollutant: str
    message: str


# ============================================================
# API Endpoints
# ============================================================

@app.get("/")
async def root():
    """Welcome endpoint."""
    return {
        "message": "AQI Calculator API",
        "version": "3.0.0",
        "data_source": "AQICN (World Air Quality Index)",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


@app.post("/aqi/location", response_model=LocationAQIResponse)
async def get_aqi_by_location(request: LocationAQIRequest):
    """
    Get real-time AQI for a location using coordinates.
    
    This endpoint:
    1. Takes latitude and longitude coordinates
    2. Finds the nearest air quality monitoring station
    3. Returns the current AQI, pollutant levels, and health recommendations
    
    The AQICN API automatically finds the nearest station to the given coordinates.
    """
    try:
        data = fetch_aqi_by_location(request.latitude, request.longitude)
        
        # Format measurements
        measurements = [
            MeasurementResponse(
                parameter=m["parameter"],
                display_name=m["display_name"],
                value=m["value"],
                unit=m["unit"]
            )
            for m in data.get("measurements", [])
        ]
        
        return LocationAQIResponse(
            station_id=data.get("station_id"),
            station_name=data.get("station_name", "Unknown"),
            station_url=data.get("station_url"),
            coordinates=data.get("coordinates", {}),
            aqi=data.get("aqi"),
            category=data.get("category", "Unknown"),
            color=data.get("color", "#808080"),
            dominant_pollutant=data.get("dominant_pollutant", "Unknown"),
            message=data.get("message", ""),
            measurements=measurements,
            measurement_time=data.get("measurement_time"),
            forecast=data.get("forecast"),
            attributions=data.get("attributions"),
            fetched_at=data.get("fetched_at", datetime.utcnow().isoformat() + "Z"),
            # Indian NAQI fields
            aqi_standard=data.get("aqi_standard", "EPA (US)"),
            epa_aqi=data.get("epa_aqi"),
            epa_category=data.get("epa_category"),
            epa_color=data.get("epa_color"),
            naqi_breakdown=data.get("naqi_breakdown"),
            concentrations=data.get("concentrations")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching AQI data: {str(e)}")


@app.get("/search", response_model=List[StationSearchResult])
async def search_stations(keyword: str):
    """
    Search for air quality stations by keyword.
    
    Args:
        keyword: City name, station name, or location to search for
    
    Returns a list of matching stations with their current AQI.
    """
    try:
        client = get_aqicn_client()
        results = client.search_stations(keyword)
        
        return [
            StationSearchResult(
                uid=r["uid"],
                station_name=r["station_name"] or "Unknown",
                aqi=str(r["aqi"]) if r["aqi"] else None,
                coordinates=r["coordinates"]
            )
            for r in results
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching stations: {str(e)}")


@app.get("/aqi/station/{station_id}", response_model=LocationAQIResponse)
async def get_aqi_by_station(station_id: str):
    """
    Get AQI for a specific station by ID.
    
    Args:
        station_id: Station ID (use "@" prefix, e.g., "@7397")
    
    Returns the current AQI data for that station.
    """
    try:
        client = get_aqicn_client()
        
        # Ensure station_id has @ prefix if it's a number
        if station_id.isdigit():
            station_id = f"@{station_id}"
        
        data = client.get_aqi_by_city(station_id)
        
        # Get AQI category and color
        from aqicn_client import get_aqi_category, get_health_message
        aqi = data.get("aqi")
        category, color = get_aqi_category(aqi) if aqi else ("Unknown", "#808080")
        message = get_health_message(aqi) if aqi else "No data available"
        
        # Format pollutants for display
        measurements = []
        pollutant_display_names = {
            "pm25": "PM2.5", "pm10": "PM10", "o3": "Ozone", 
            "no2": "NO₂", "so2": "SO₂", "co": "CO"
        }
        
        for param, value in data.get("pollutants", {}).items():
            if param in pollutant_display_names:
                measurements.append(
                    MeasurementResponse(
                        parameter=param,
                        display_name=pollutant_display_names.get(param, param.upper()),
                        value=value,
                        unit="AQI"
                    )
                )
        
        return LocationAQIResponse(
            station_id=data.get("station_id"),
            station_name=data.get("station_name", "Unknown"),
            station_url=data.get("station_url"),
            coordinates=data.get("coordinates", {}),
            aqi=aqi,
            category=category,
            color=color,
            dominant_pollutant=data.get("dominant_pollutant", "Unknown"),
            message=message,
            measurements=measurements,
            measurement_time=data.get("measurement_time"),
            forecast=data.get("forecast"),
            attributions=data.get("attributions"),
            fetched_at=data.get("fetched_at", datetime.utcnow().isoformat() + "Z")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching station data: {str(e)}")


@app.post("/calculate-aqi", response_model=ManualAQIResponse)
async def calculate_aqi_endpoint(request: ManualAQIRequest):
    """
    Calculate AQI based on manual pollutant concentrations.
    
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
        
        return ManualAQIResponse(
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
