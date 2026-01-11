"""
OpenAQ Client Module

This module fetches real-time air quality data from the OpenAQ API.
It provides functions to:
- Fetch latest measurements for a station
- Convert OpenAQ data to our AQI calculator format

Key Concepts:
- Uses the official openaq Python package
- Handles API rate limiting and errors gracefully
- Maps OpenAQ parameter names to our internal format
"""

import os
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)


# Parameter mapping: OpenAQ names to our internal keys
# OpenAQ uses various names; we map them to standard keys
PARAMETER_MAPPING = {
    'pm25': 'pm25',
    'pm2.5': 'pm25',
    'pm10': 'pm10',
    'co': 'co',
    'no2': 'no2',
    'so2': 'so2',
    'o3': 'o3',
    'ozone': 'o3',
}

# Unit conversions: some data may need conversion
# OpenAQ typically uses µg/m³ for PM, ppb for gases
# Our calculator expects: µg/m³ for PM, ppm for CO, ppb for NO2/SO2, ppm for O3
UNIT_INFO = {
    'pm25': {'expected': 'µg/m³', 'conversion': None},
    'pm10': {'expected': 'µg/m³', 'conversion': None},
    'co': {'expected': 'ppm', 'conversion': None},  # May need mg/m³ to ppm
    'no2': {'expected': 'ppb', 'conversion': None},
    'so2': {'expected': 'ppb', 'conversion': None},
    'o3': {'expected': 'ppm', 'conversion': None},   # May need ppb to ppm
}


class OpenAQClient:
    """
    Client for fetching air quality data from OpenAQ API.
    
    Usage:
        client = OpenAQClient()
        data = client.get_latest_measurements(station_id=12345)
        pollutants = client.measurements_to_pollutants(data)
    """
    
    def __init__(self):
        """Initialize the OpenAQ client with API key from environment."""
        self.api_key = os.getenv("OPEN_AQ_API")
        self._client = None
        
        if not self.api_key:
            print("WARNING: OPEN_AQ_API not set. Live data fetching will fail.")
    
    def _get_client(self):
        """Lazy initialization of OpenAQ client."""
        if self._client is None:
            try:
                from openaq import OpenAQ
                self._client = OpenAQ(api_key=self.api_key)
            except ImportError:
                raise RuntimeError("openaq package not installed. Run: pip install openaq")
        return self._client
    
    def get_latest_measurements(self, station_id: int) -> Dict:
        """
        Fetch the latest measurements for a station.
        
        Args:
            station_id: OpenAQ location ID
        
        Returns:
            Dict with station info and measurements:
            {
                "station_id": 12345,
                "station_name": "Station Name",
                "measurements": [
                    {"parameter": "pm25", "value": 35.5, "unit": "µg/m³", "datetime": "..."},
                    ...
                ],
                "fetched_at": "2026-01-11T12:00:00Z"
            }
        
        Raises:
            Exception if API call fails
        """
        client = self._get_client()
        
        try:
            # Get location details - the response has a 'results' attribute
            location_response = client.locations.get(station_id)
            
            # Handle different response structures
            # Sometimes it's location_response directly, sometimes location_response.results[0]
            if hasattr(location_response, 'results') and location_response.results:
                location = location_response.results[0]
            elif hasattr(location_response, 'name'):
                location = location_response
            else:
                raise RuntimeError(f"Unexpected response structure from OpenAQ API")
            
            # Fetch latest sensor readings
            measurements = []
            
            # Get sensors - might be on location or need separate fetch
            sensors = getattr(location, 'sensors', None)
            
            if sensors:
                for sensor in sensors:
                    try:
                        sensor_response = client.sensors.get(sensor.id)
                        # Handle response structure
                        if hasattr(sensor_response, 'results') and sensor_response.results:
                            sensor_data = sensor_response.results[0]
                        else:
                            sensor_data = sensor_response
                        
                        latest = getattr(sensor_data, 'latest', None)
                        
                        # 'latest' can be a dict or an object - handle both
                        if latest:
                            if isinstance(latest, dict):
                                # API returns dict: {'datetime': {'utc': '...'}, 'value': 1.24, ...}
                                value = latest.get('value')
                                dt_info = latest.get('datetime', {})
                                dt_utc = dt_info.get('utc') if isinstance(dt_info, dict) else None
                            else:
                                # Object with attributes
                                value = getattr(latest, 'value', None)
                                dt_utc = latest.datetime.utc if hasattr(latest, 'datetime') and latest.datetime else None
                            
                            if value is not None:
                                measurements.append({
                                    "parameter": sensor.parameter.name.lower(),
                                    "display_name": sensor.parameter.display_name,
                                    "value": value,
                                    "unit": sensor.parameter.units,
                                    "datetime": dt_utc,
                                    "sensor_id": sensor.id
                                })
                    except Exception as e:
                        print(f"Warning: Could not fetch sensor {sensor.id}: {e}")
                        continue
            else:
                # Try fetching latest measurements directly via the measurements endpoint
                try:
                    measurements_response = client.locations.latest(station_id)
                    if hasattr(measurements_response, 'results'):
                        for m in measurements_response.results:
                            measurements.append({
                                "parameter": m.parameter.name.lower() if hasattr(m.parameter, 'name') else str(m.parameter),
                                "display_name": m.parameter.display_name if hasattr(m.parameter, 'display_name') else str(m.parameter),
                                "value": m.value,
                                "unit": m.parameter.units if hasattr(m.parameter, 'units') else '',
                                "datetime": m.datetime.utc if hasattr(m, 'datetime') and m.datetime else None,
                                "sensor_id": getattr(m, 'sensors_id', None)
                            })
                except Exception as e:
                    print(f"Warning: Could not fetch measurements via latest endpoint: {e}")
            
            return {
                "station_id": station_id,
                "station_name": getattr(location, 'name', 'Unknown'),
                "locality": getattr(location, 'locality', None),
                "coordinates": {
                    "latitude": location.coordinates.latitude if hasattr(location, 'coordinates') else None,
                    "longitude": location.coordinates.longitude if hasattr(location, 'coordinates') else None
                },
                "measurements": measurements,
                "fetched_at": datetime.utcnow().isoformat() + "Z"
            }
        
        except Exception as e:
            raise RuntimeError(f"Failed to fetch data for station {station_id}: {str(e)}")
    
    def measurements_to_pollutants(self, data: Dict) -> Dict[str, float]:
        """
        Convert OpenAQ measurements to our pollutant format for AQI calculation.
        
        Args:
            data: Result from get_latest_measurements()
        
        Returns:
            Dict mapping pollutant keys to values:
            {"pm25": 35.5, "pm10": 80.0, "no2": 45.0, ...}
        """
        pollutants = {}
        
        for measurement in data.get('measurements', []):
            param = measurement.get('parameter', '').lower()
            value = measurement.get('value')
            unit = measurement.get('unit', '')
            
            # Map to our internal parameter name
            internal_param = PARAMETER_MAPPING.get(param)
            if not internal_param or value is None:
                continue
            
            # Apply unit conversions if needed
            converted_value = self._convert_units(internal_param, value, unit)
            
            if converted_value is not None:
                pollutants[internal_param] = converted_value
        
        return pollutants
    
    def _convert_units(self, param: str, value: float, unit: str) -> Optional[float]:
        """
        Convert measurement units if needed.
        
        Most OpenAQ data is already in standard units, but some may need conversion.
        """
        unit_lower = unit.lower()
        
        # O3: if in ppb, convert to ppm (our calculator expects ppm)
        if param == 'o3' and 'ppb' in unit_lower:
            return value / 1000.0  # ppb to ppm
        
        # CO: if in mg/m³, convert to ppm (approximate at 25°C, 1 atm)
        if param == 'co' and 'mg' in unit_lower:
            return value / 1.145  # Approximate conversion
        
        # For other parameters, assume already in correct units
        return value
    
    def close(self):
        """Close the API client connection."""
        if self._client:
            self._client.close()
            self._client = None


# Singleton client for reuse
_client_instance = None

def get_openaq_client() -> OpenAQClient:
    """Get or create the singleton OpenAQ client."""
    global _client_instance
    if _client_instance is None:
        _client_instance = OpenAQClient()
    return _client_instance


def fetch_live_aqi_data(station_id: int) -> Dict:
    """
    Convenience function to fetch live data and prepare for AQI calculation.
    
    Args:
        station_id: OpenAQ location ID
    
    Returns:
        Dict with raw measurements and converted pollutant values:
        {
            "station_id": 12345,
            "station_name": "...",
            "measurements": [...],
            "pollutants": {"pm25": 35.5, ...},
            "fetched_at": "..."
        }
    """
    client = get_openaq_client()
    data = client.get_latest_measurements(station_id)
    data['pollutants'] = client.measurements_to_pollutants(data)
    return data


# For testing
if __name__ == "__main__":
    print("\n=== OpenAQ Client Test ===\n")
    
    # Test with a known Delhi station
    # R K Puram, Delhi (change ID if needed)
    test_station_id = 361378
    
    try:
        print(f"Fetching data for station ID: {test_station_id}")
        data = fetch_live_aqi_data(test_station_id)
        
        print(f"\nStation: {data['station_name']}")
        print(f"Location: {data.get('locality', 'Unknown')}")
        print(f"Fetched at: {data['fetched_at']}")
        
        print(f"\nMeasurements ({len(data['measurements'])}):")
        for m in data['measurements']:
            print(f"  - {m['display_name']}: {m['value']} {m['unit']}")
        
        print(f"\nConverted for AQI calculation:")
        for param, value in data['pollutants'].items():
            print(f"  - {param}: {value}")
        
    except Exception as e:
        print(f"Error: {e}")
