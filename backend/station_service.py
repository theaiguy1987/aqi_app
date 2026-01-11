"""
Station Service Module

This module manages air quality station data loaded from india_stations.json.
It provides functions to:
- Get list of unique cities
- Get stations in a specific city
- Find a station by ID

Key Concepts:
- Data is loaded once at module import (singleton pattern)
- Cities are extracted from station names (since locality is often null)
- Stations are indexed by city for fast lookup
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from functools import lru_cache


# Common Indian city names to look for in station names
INDIAN_CITIES = [
    "Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Bangalore",
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur",
    "Nagpur", "Patna", "Indore", "Bhopal", "Ludhiana", "Agra",
    "Varanasi", "Nashik", "Faridabad", "Ghaziabad", "Noida", "Gurgaon",
    "Gurugram", "Rajkot", "Vadodara", "Surat", "Visakhapatnam", "Vizag",
    "Coimbatore", "Madurai", "Chandigarh", "Thiruvananthapuram", "Kochi",
    "Bhubaneswar", "Ranchi", "Raipur", "Jodhpur", "Amritsar", "Jalandhar",
    "Guwahati", "Dehradun", "Jammu", "Srinagar", "Shimla", "Mangalore",
    "Mysore", "Mysuru", "Thane", "Navi Mumbai", "Durgapur", "Siliguri",
    "Tiruchirappalli", "Salem", "Hubli", "Belgaum", "Guntur", "Vijayawada",
    "Warangal", "Aurangabad", "Solapur", "Jabalpur", "Gwalior", "Meerut",
    "Aligarh", "Bareilly", "Moradabad", "Saharanpur", "Gorakhpur",
    "Bikaner", "Udaipur", "Kota", "Ajmer", "Bhilwara", "Alwar",
    "Howrah", "Asansol", "Bokaro", "Jamshedpur", "Dhanbad", "Cuttack"
]

# Compile regex patterns for efficient matching
_CITY_PATTERNS = {city: re.compile(r'\b' + re.escape(city) + r'\b', re.IGNORECASE) 
                  for city in INDIAN_CITIES}


def _extract_city_from_name(station_name: str, locality: Optional[str]) -> str:
    """
    Extract city name from station name or locality field.
    
    Strategy:
    1. If locality is provided and non-empty, use it
    2. Otherwise, search for known city names in the station name
    3. Fall back to 'Other' if no city found
    """
    # First try locality
    if locality and locality.strip() and locality.lower() != 'unknown':
        return locality.strip()
    
    # Search for city names in station name
    if station_name:
        for city, pattern in _CITY_PATTERNS.items():
            if pattern.search(station_name):
                return city
    
    return 'Other'


# Load station data at module initialization
def _load_stations() -> Dict:
    """
    Load station data from JSON file.
    
    This runs once when the module is imported.
    The data is cached in memory for fast access.
    """
    json_path = Path(__file__).parent / 'india_stations.json'
    
    if not json_path.exists():
        print(f"WARNING: Station data file not found at {json_path}")
        return {"metadata": {}, "stations": []}
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Pre-process: extract city for each station
    for station in data.get('stations', []):
        station['_city'] = _extract_city_from_name(
            station.get('name', ''),
            station.get('locality')
        )
    
    print(f"✓ Loaded {len(data.get('stations', []))} stations from {json_path.name}")
    return data


# Global station data - loaded once at startup
_STATION_DATA = _load_stations()


def get_all_cities() -> List[Dict[str, any]]:
    """
    Get list of all unique cities with station counts.
    
    Returns:
        List of dicts with city info:
        [
            {"name": "Delhi", "station_count": 42},
            {"name": "Mumbai", "station_count": 15},
            ...
        ]
    
    Cities are sorted alphabetically, with 'Other' at the end.
    """
    city_counts = {}
    
    for station in _STATION_DATA.get('stations', []):
        city = station.get('_city', 'Other')
        city_counts[city] = city_counts.get(city, 0) + 1
    
    # Sort alphabetically, but put 'Other' at the end
    cities = [
        {"name": city, "station_count": count}
        for city, count in sorted(city_counts.items())
        if city != 'Other'
    ]
    
    # Add Other at the end if it exists
    if 'Other' in city_counts:
        cities.append({"name": "Other", "station_count": city_counts['Other']})
    
    return cities


def get_stations_by_city(city_name: str) -> List[Dict]:
    """
    Get all stations in a specific city.
    
    Args:
        city_name: Name of the city (case-insensitive)
    
    Returns:
        List of station dicts with relevant info:
        [
            {
                "id": 12345,
                "name": "Station Name",
                "locality": "Delhi",
                "coordinates": {"latitude": 28.6, "longitude": 77.2},
                "sensors": ["PM2.5", "PM10", "NO2"],
                "provider": "CPCB",
                "is_active": True  # Based on recent data
            },
            ...
        ]
    
    Stations are sorted by name, with active stations first.
    """
    stations = []
    city_lower = city_name.lower()
    
    for station in _STATION_DATA.get('stations', []):
        station_city = station.get('_city', 'Other')
        
        if station_city.lower() == city_lower:
            # Check if station is active (has data in last 30 days)
            # For now, we check if datetime_last is recent
            is_active = _is_station_active(station.get('datetime_last'))
            
            # Extract sensor display names
            sensors = [s.get('display_name', s.get('parameter', 'Unknown')) 
                      for s in station.get('sensors', [])]
            
            stations.append({
                "id": station.get('id'),
                "name": station.get('name'),
                "locality": station_city,
                "coordinates": station.get('coordinates', {}),
                "sensors": sensors,
                "provider": station.get('provider', 'Unknown'),
                "owner": station.get('owner', 'Unknown'),
                "is_active": is_active,
                "last_updated": station.get('datetime_last')
            })
    
    # Sort: active stations first, then by name
    stations.sort(key=lambda s: (not s['is_active'], s['name'] or ''))
    
    return stations


def get_station_by_id(station_id: int) -> Optional[Dict]:
    """
    Find a station by its ID.
    
    Args:
        station_id: The OpenAQ location ID
    
    Returns:
        Station dict if found, None otherwise
    """
    for station in _STATION_DATA.get('stations', []):
        if station.get('id') == station_id:
            return station
    return None


def _is_station_active(datetime_last: Optional[str]) -> bool:
    """
    Check if a station is considered active based on its last data timestamp.
    
    A station is active if it has data from 2025 or later.
    (Adjust this threshold as needed)
    """
    if not datetime_last:
        return False
    
    # Simple check: if year >= 2025, consider active
    try:
        year = int(datetime_last[:4])
        return year >= 2025
    except (ValueError, TypeError):
        return False


def get_metadata() -> Dict:
    """Get metadata about the station data (total count, fetch date, etc.)"""
    return _STATION_DATA.get('metadata', {})


# For testing/debugging
if __name__ == "__main__":
    print("\n=== Station Service Test ===\n")
    
    # Test get_all_cities
    cities = get_all_cities()
    print(f"Total cities: {len(cities)}")
    print("Top 5 cities by station count:")
    for city in sorted(cities, key=lambda c: c['station_count'], reverse=True)[:5]:
        print(f"  - {city['name']}: {city['station_count']} stations")
    
    # Test get_stations_by_city
    print("\n\nStations in Delhi:")
    delhi_stations = get_stations_by_city("Delhi")
    print(f"Found {len(delhi_stations)} stations")
    for station in delhi_stations[:3]:
        status = "🟢 Active" if station['is_active'] else "🔴 Inactive"
        print(f"  - [{station['id']}] {station['name']} ({status})")
        print(f"    Sensors: {', '.join(station['sensors'][:3])}")
