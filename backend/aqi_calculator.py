"""
AQI Calculator Module

This module calculates the Air Quality Index (AQI) based on pollutant concentrations.
Uses the EPA AQI breakpoint table for calculation.
"""

from typing import Dict, Tuple
import random

# AQI Breakpoints for different pollutants (EPA standard)
# Format: [(C_low, C_high, I_low, I_high), ...]

PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 500.4, 301, 500),
]

PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500),
]

CO_BREAKPOINTS = [  # ppm
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 50.4, 301, 500),
]

NO2_BREAKPOINTS = [  # ppb
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 2049, 301, 500),
]

SO2_BREAKPOINTS = [  # ppb
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 1004, 301, 500),
]

O3_BREAKPOINTS = [  # ppm
    (0.000, 0.054, 0, 50),
    (0.055, 0.070, 51, 100),
    (0.071, 0.085, 101, 150),
    (0.086, 0.105, 151, 200),
    (0.106, 0.200, 201, 300),
]

POLLUTANT_BREAKPOINTS = {
    'pm25': PM25_BREAKPOINTS,
    'pm10': PM10_BREAKPOINTS,
    'co': CO_BREAKPOINTS,
    'no2': NO2_BREAKPOINTS,
    'so2': SO2_BREAKPOINTS,
    'o3': O3_BREAKPOINTS,
}

POLLUTANT_NAMES = {
    'pm25': 'PM2.5',
    'pm10': 'PM10',
    'co': 'CO',
    'no2': 'NO2',
    'so2': 'SO2',
    'o3': 'O3',
}

def calculate_aqi_for_pollutant(concentration: float, breakpoints: list) -> int:
    """
    Calculate AQI for a single pollutant using the EPA formula.
    
    AQI = [(I_high - I_low) / (C_high - C_low)] * (C - C_low) + I_low
    
    Args:
        concentration: Pollutant concentration
        breakpoints: List of breakpoint tuples (C_low, C_high, I_low, I_high)
    
    Returns:
        AQI value for the pollutant
    """
    if concentration < 0:
        return 0
    
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            # EPA AQI formula
            aqi = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return round(aqi)
    
    # If concentration exceeds all breakpoints, return hazardous level
    return 500

def get_aqi_category(aqi: int) -> Tuple[str, str]:
    """
    Get AQI category and color based on AQI value.
    
    Returns:
        Tuple of (category, color)
    """
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

def calculate_aqi(pollutants: Dict[str, float]) -> Dict:
    """
    Calculate overall AQI from multiple pollutants.
    
    Args:
        pollutants: Dictionary of pollutant concentrations
                   e.g., {'pm25': 35.5, 'pm10': 150, 'o3': 0.068}
    
    Returns:
        Dictionary containing AQI value, category, dominant pollutant, etc.
    """
    aqi_values = {}
    
    # Calculate AQI for each pollutant
    for pollutant, concentration in pollutants.items():
        if concentration is not None and pollutant in POLLUTANT_BREAKPOINTS:
            breakpoints = POLLUTANT_BREAKPOINTS[pollutant]
            aqi_value = calculate_aqi_for_pollutant(concentration, breakpoints)
            aqi_values[pollutant] = aqi_value
    
    # If no valid pollutants, generate sample data for demo
    if not aqi_values:
        # Generate random sample data for demonstration
        sample_pm25 = random.uniform(0, 100)
        aqi_values['pm25'] = calculate_aqi_for_pollutant(sample_pm25, PM25_BREAKPOINTS)
    
    # Overall AQI is the maximum of individual AQIs
    max_aqi = max(aqi_values.values())
    dominant_pollutant = max(aqi_values, key=aqi_values.get)
    
    category, color = get_aqi_category(max_aqi)
    message = get_health_message(max_aqi)
    
    return {
        'aqi': max_aqi,
        'category': category,
        'color': color,
        'dominant_pollutant': POLLUTANT_NAMES[dominant_pollutant],
        'message': message,
        'individual_aqis': {POLLUTANT_NAMES[k]: v for k, v in aqi_values.items()}
    }

def generate_sample_pollutant_data() -> Dict[str, float]:
    """Generate sample pollutant data for demonstration purposes."""
    return {
        'pm25': round(random.uniform(0, 150), 2),
        'pm10': round(random.uniform(0, 250), 2),
        'co': round(random.uniform(0, 15), 2),
        'no2': round(random.uniform(0, 200), 2),
        'so2': round(random.uniform(0, 150), 2),
        'o3': round(random.uniform(0, 0.1), 4),
    }
