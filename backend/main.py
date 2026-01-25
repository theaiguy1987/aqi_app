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
import httpx

from aqicn_client import fetch_aqi_by_location, get_aqicn_client
from aqi_calculator import calculate_aqi, generate_sample_pollutant_data
from sheets_client import add_subscription, check_subscription_exists, add_feedback
import math


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the distance between two points using Haversine formula.
    Returns distance in kilometers.
    """
    if None in (lat1, lon1, lat2, lon2):
        return None
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 2)


async def reverse_geocode(latitude: float, longitude: float) -> Optional[str]:
    """
    Convert coordinates to a human-readable location name using Nominatim.
    Returns None if geocoding fails (fallback gracefully).
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "format": "json",
                    "zoom": 10,  # City level
                },
                headers={"User-Agent": "AQI-App/1.0"}
            )
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                # Build location name from address components
                city = address.get("city") or address.get("town") or address.get("village") or address.get("suburb")
                state = address.get("state")
                country = address.get("country")
                
                parts = [p for p in [city, state, country] if p]
                return ", ".join(parts[:2]) if parts else None  # Return city, state/country
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
    return None


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
    coordinates: dict  # Station coordinates
    user_coordinates: Optional[dict] = None  # User's requested coordinates
    user_location_name: Optional[str] = None  # Reverse geocoded location name
    distance_km: Optional[float] = None  # Distance from user to station in km
    aqi: Optional[int] = None
    category: str
    color: str
    aqi_standard: Optional[str] = None  # "EPA (US)"
    pollutant_breakdown: Optional[dict] = None  # Individual pollutant AQI values
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


class SubscriptionRequest(BaseModel):
    """Request model for AQI alert subscription."""
    method: str = Field(..., description="Subscription method: 'email' or 'phone'")
    contact: str = Field(..., description="Email address or phone number")
    location: str = Field(..., description="Location name for alerts")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude")


class SubscriptionResponse(BaseModel):
    """Response model for subscription."""
    success: bool
    message: str
    subscription_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    """Request model for user feedback."""
    rating: int = Field(..., ge=1, le=5, description="Star rating 1-5")
    feedback: Optional[str] = Field('', description="Optional text feedback")
    location: Optional[str] = Field('', description="Location context")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude")


class FeedbackResponse(BaseModel):
    """Response model for feedback."""
    success: bool
    message: str
    feedback_id: Optional[str] = None


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
        
        # Calculate distance from user to station
        station_coords = data.get("coordinates", {})
        distance_km = calculate_distance_km(
            request.latitude, 
            request.longitude,
            station_coords.get("latitude"),
            station_coords.get("longitude")
        )
        
        # Reverse geocode user's coordinates to get location name
        user_location_name = await reverse_geocode(request.latitude, request.longitude)
        
        return LocationAQIResponse(
            station_id=data.get("station_id"),
            station_name=data.get("station_name", "Unknown"),
            station_url=data.get("station_url"),
            coordinates=station_coords,
            user_coordinates={"latitude": request.latitude, "longitude": request.longitude},
            user_location_name=user_location_name,
            distance_km=distance_km,
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
            aqi_standard=data.get("aqi_standard", "EPA (US)"),
            pollutant_breakdown=data.get("pollutant_breakdown")
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


# ============================================================
# Subscription Endpoints
# ============================================================

@app.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe_to_alerts(request: SubscriptionRequest):
    """
    Subscribe to daily AQI alerts.
    
    Stores user contact info in Google Sheets for sending daily alerts.
    
    Args:
        method: 'email' or 'phone'
        contact: Email address or phone number
        location: Location name for context
        latitude: Optional latitude for precise location
        longitude: Optional longitude for precise location
    
    Returns subscription confirmation.
    """
    try:
        # Validate method
        if request.method not in ['email', 'phone']:
            raise HTTPException(status_code=400, detail="Method must be 'email' or 'phone'")
        
        # Basic validation
        if request.method == 'email' and '@' not in request.contact:
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        # International phone validation: should start with + and have 8-15 digits
        if request.method == 'phone':
            phone = request.contact
            if not phone.startswith('+'):
                raise HTTPException(status_code=400, detail="Phone number must include country code (e.g., +1 for US)")
            digits_only = phone.replace('+', '').replace(' ', '').replace('-', '')
            if len(digits_only) < 8 or len(digits_only) > 15:
                raise HTTPException(status_code=400, detail="Invalid phone number length")
        
        # Check if already subscribed
        if check_subscription_exists(request.contact):
            return SubscriptionResponse(
                success=True,
                message="You're already subscribed! We'll keep sending your daily alerts."
            )
        
        # Add subscription
        result = add_subscription(
            method=request.method,
            contact=request.contact,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        if result['success']:
            return SubscriptionResponse(
                success=True,
                message=result.get('message', 'Successfully subscribed!'),
                subscription_id=result.get('subscription_id')
            )
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Failed to subscribe'))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing subscription: {str(e)}")


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """
    Submit user feedback with star rating.
    
    Stores feedback in Google Sheets for analysis.
    
    Args:
        rating: Star rating 1-5
        feedback: Optional text feedback
        location: Location context
        latitude: Optional latitude
        longitude: Optional longitude
    
    Returns feedback confirmation.
    """
    try:
        # Add feedback
        result = add_feedback(
            rating=request.rating,
            feedback=request.feedback or '',
            location=request.location or '',
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        if result['success']:
            return FeedbackResponse(
                success=True,
                message=result.get('message', 'Thank you for your feedback!'),
                feedback_id=result.get('feedback_id')
            )
        else:
            raise HTTPException(status_code=500, detail=result.get('error', 'Failed to submit feedback'))
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")


if __name__ == "__main__":
    # Use PORT environment variable for Cloud Run, default to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
