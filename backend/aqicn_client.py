"""
AQICN Client Module

This module fetches real-time air quality data from the AQICN (World Air Quality Index) API.
It provides functions to:
- Fetch AQI data by geographic coordinates (lat/lng)
- Fetch AQI data by city/station name
- Search for stations by keyword

API Documentation: https://aqicn.org/json-api/doc/
"""

import os
import httpx
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime
from dotenv import load_dotenv
from aqi_calculator import calculate_naqi_from_epa_aqi

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# AQICN API base URL
AQICN_API_BASE = "https://api.waqi.info"


class AQICNClient:
    """
    Client for fetching air quality data from AQICN API.
    
    Usage:
        client = AQICNClient()
        data = client.get_aqi_by_coordinates(12.9716, 77.5946)  # Bangalore
        data = client.get_aqi_by_city("bangalore")
        data = client.search_stations("delhi")
    """
    
    def __init__(self, api_token: Optional[str] = None):
        """Initialize the AQICN client with API token from environment."""
        self.api_token = api_token or os.getenv("AQICN_API_TOKEN")
        
        if not self.api_token:
            print("WARNING: AQICN_API_TOKEN not set. API calls will fail.")
    
    def _make_request(self, endpoint: str) -> Dict:
        """Make a request to the AQICN API."""
        url = f"{AQICN_API_BASE}{endpoint}"
        
        # Add token to URL
        separator = "&" if "?" in endpoint else "?"
        url = f"{url}{separator}token={self.api_token}"
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") == "error":
                    raise Exception(data.get("data", "Unknown API error"))
                
                return data
        except httpx.HTTPError as e:
            raise Exception(f"HTTP error: {str(e)}")
    
    def get_aqi_by_coordinates(self, latitude: float, longitude: float) -> Dict:
        """
        Fetch AQI data for a location using coordinates.
        
        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
        
        Returns:
            Dict with AQI data including:
            - aqi: Overall AQI value
            - station: Station name and info
            - pollutants: Individual pollutant values (PM2.5, PM10, O3, etc.)
            - time: Measurement time
            - forecast: Air quality forecast
        """
        endpoint = f"/feed/geo:{latitude};{longitude}/"
        response = self._make_request(endpoint)
        return self._parse_feed_response(response)
    
    def get_aqi_by_city(self, city: str) -> Dict:
        """
        Fetch AQI data for a city or station by name.
        
        Args:
            city: City name or station ID (e.g., "beijing", "@7397")
        
        Returns:
            Dict with AQI data
        """
        endpoint = f"/feed/{city}/"
        response = self._make_request(endpoint)
        return self._parse_feed_response(response)
    
    def search_stations(self, keyword: str) -> List[Dict]:
        """
        Search for air quality stations by keyword.
        
        Args:
            keyword: Search term (city name, station name, etc.)
        
        Returns:
            List of matching stations with basic info
        """
        endpoint = f"/search/?keyword={keyword}"
        response = self._make_request(endpoint)
        
        if response.get("status") != "ok":
            return []
        
        stations = []
        for item in response.get("data", []):
            stations.append({
                "uid": item.get("uid"),
                "aqi": item.get("aqi"),
                "station_name": item.get("station", {}).get("name"),
                "time": item.get("time", {}).get("stime"),
                "coordinates": {
                    "latitude": item.get("station", {}).get("geo", [None, None])[0],
                    "longitude": item.get("station", {}).get("geo", [None, None])[1]
                }
            })
        
        return stations
    
    def get_stations_in_bounds(self, lat1: float, lng1: float, lat2: float, lng2: float) -> List[Dict]:
        """
        Get all stations within map bounds.
        
        Args:
            lat1, lng1: South-west corner coordinates
            lat2, lng2: North-east corner coordinates
        
        Returns:
            List of stations within the bounds
        """
        endpoint = f"/v2/map/bounds?latlng={lat1},{lng1},{lat2},{lng2}&networks=all"
        response = self._make_request(endpoint)
        
        if response.get("status") != "ok":
            return []
        
        return response.get("data", [])
    
    def _parse_feed_response(self, response: Dict) -> Dict:
        """Parse the feed response into a standardized format."""
        if response.get("status") != "ok":
            raise Exception(response.get("data", "Unknown error"))
        
        data = response.get("data", {})
        
        # Extract station info
        city_info = data.get("city", {})
        station_name = city_info.get("name", "Unknown Station")
        station_url = city_info.get("url", "")
        geo = city_info.get("geo", [None, None])
        
        # Extract time info
        time_info = data.get("time", {})
        measurement_time = time_info.get("s", "")
        timezone = time_info.get("tz", "")
        
        # Extract AQI value (can be "-" if no data)
        aqi_value = data.get("aqi")
        if aqi_value == "-" or aqi_value is None:
            aqi_value = None
        else:
            aqi_value = int(aqi_value) if isinstance(aqi_value, (int, str)) and str(aqi_value).isdigit() else None
        
        # Extract individual pollutant AQIs
        iaqi = data.get("iaqi", {})
        pollutants = {}
        for param, val in iaqi.items():
            if isinstance(val, dict) and "v" in val:
                pollutants[param] = val["v"]
        
        # Extract forecast data
        forecast = data.get("forecast", {})
        daily_forecast = forecast.get("daily", {})
        
        # Get attributions
        attributions = data.get("attributions", [])
        
        # Determine dominant pollutant
        dominant_pollutant = data.get("dominentpol", "")
        
        return {
            "station_id": data.get("idx"),
            "station_name": station_name,
            "station_url": station_url,
            "coordinates": {
                "latitude": float(geo[0]) if geo[0] else None,
                "longitude": float(geo[1]) if geo[1] else None
            },
            "aqi": aqi_value,
            "dominant_pollutant": dominant_pollutant,
            "pollutants": pollutants,
            "measurement_time": measurement_time,
            "timezone": timezone,
            "forecast": daily_forecast,
            "attributions": attributions,
            "fetched_at": datetime.utcnow().isoformat() + "Z"
        }


def get_aqicn_client() -> AQICNClient:
    """Factory function to get an AQICN client instance."""
    return AQICNClient()


def fetch_aqi_by_location(latitude: float, longitude: float) -> Dict:
    """
    Convenience function to fetch AQI data by coordinates.
    
    This is the main function called by the API endpoint.
    Returns data formatted for the frontend, including both EPA AQI and Indian NAQI.
    """
    client = get_aqicn_client()
    data = client.get_aqi_by_coordinates(latitude, longitude)
    
    # Get EPA AQI category and color (this is what AQICN provides)
    epa_aqi = data.get("aqi")
    epa_category, epa_color = get_aqi_category(epa_aqi) if epa_aqi else ("Unknown", "#808080")
    epa_message = get_health_message(epa_aqi) if epa_aqi else "No data available"
    
    # Format pollutants for display
    measurements = []
    pollutant_display_names = {
        "pm25": "PM2.5",
        "pm10": "PM10",
        "o3": "Ozone (O₃)",
        "no2": "Nitrogen Dioxide (NO₂)",
        "so2": "Sulfur Dioxide (SO₂)",
        "co": "Carbon Monoxide (CO)",
        "t": "Temperature",
        "h": "Humidity",
        "w": "Wind",
        "p": "Pressure",
        "wg": "Wind Gust"
    }
    
    pollutant_units = {
        "pm25": "AQI",
        "pm10": "AQI",
        "o3": "AQI",
        "no2": "AQI",
        "so2": "AQI",
        "co": "AQI",
        "t": "°C",
        "h": "%",
        "w": "m/s",
        "p": "hPa",
        "wg": "m/s"
    }
    
    # Collect EPA AQI values for NAQI conversion
    epa_aqi_values = {}
    
    for param, value in data.get("pollutants", {}).items():
        measurements.append({
            "parameter": param,
            "display_name": pollutant_display_names.get(param, param.upper()),
            "value": value,
            "unit": pollutant_units.get(param, "AQI")
        })
        # Store air quality pollutants for NAQI calculation
        if param in ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']:
            epa_aqi_values[param] = value
    
    # Calculate Indian NAQI from EPA AQI values
    naqi_data = calculate_naqi_from_epa_aqi(epa_aqi_values)
    
    # Use Indian NAQI as the primary display value (if available)
    # The overall AQI is now based on Indian standards
    display_aqi = naqi_data.get('naqi') if naqi_data.get('naqi') else epa_aqi
    display_category = naqi_data.get('naqi_category', epa_category)
    display_color = naqi_data.get('naqi_color', epa_color)
    display_message = naqi_data.get('naqi_message', epa_message)
    
    return {
        "station_id": data.get("station_id"),
        "station_name": data.get("station_name"),
        "station_url": data.get("station_url"),
        "coordinates": data.get("coordinates"),
        # Primary AQI (now Indian NAQI)
        "aqi": display_aqi,
        "category": display_category,
        "color": display_color,
        "message": display_message,
        "aqi_standard": "NAQI (India)" if naqi_data.get('naqi') else "EPA (US)",
        # Also include EPA AQI for reference
        "epa_aqi": epa_aqi,
        "epa_category": epa_category,
        "epa_color": epa_color,
        # NAQI breakdown
        "naqi_breakdown": naqi_data.get('individual_naqi'),
        "concentrations": naqi_data.get('concentrations'),
        # Other data
        "dominant_pollutant": naqi_data.get('naqi_dominant', data.get("dominant_pollutant", "Unknown")),
        "measurements": measurements,
        "measurement_time": data.get("measurement_time"),
        "forecast": data.get("forecast"),
        "attributions": data.get("attributions"),
        "fetched_at": data.get("fetched_at")
    }


def get_aqi_category(aqi: int) -> tuple:
    """Get AQI category and color based on AQI value."""
    if aqi is None:
        return "Unknown", "#808080"
    if aqi <= 50:
        return "Good", "#00e400"
    elif aqi <= 100:
        return "Moderate", "#ffff00"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups", "#ff7e00"
    elif aqi <= 200:
        return "Unhealthy", "#ff0000"
    elif aqi <= 300:
        return "Very Unhealthy", "#8f3f97"
    else:
        return "Hazardous", "#7e0023"


def get_health_message(aqi: int) -> str:
    """Get health message based on AQI value."""
    if aqi is None:
        return "No air quality data available for this location."
    if aqi <= 50:
        return "Air quality is satisfactory, and air pollution poses little or no risk."
    elif aqi <= 100:
        return "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution."
    elif aqi <= 150:
        return "Members of sensitive groups may experience health effects. The general public is less likely to be affected."
    elif aqi <= 200:
        return "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects."
    elif aqi <= 300:
        return "Health alert: The risk of health effects is increased for everyone."
    else:
        return "Health warning of emergency conditions: everyone is more likely to be affected."
