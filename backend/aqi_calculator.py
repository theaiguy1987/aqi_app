"""
AQI Calculator Module

This module calculates the Air Quality Index (AQI) based on pollutant concentrations.
Supports both US EPA and Indian NAQI (National Air Quality Index) standards.

References:
- US EPA: https://www.airnow.gov/aqi/aqi-basics/
- Indian NAQI: https://cpcb.nic.in/National-Air-Quality-Index/
- SAFAR India: https://safar.tropmet.res.in/
"""

from typing import Dict, Tuple, Optional
from enum import Enum
import random


class AQIStandard(Enum):
    """Available AQI calculation standards."""
    EPA = "epa"      # US Environmental Protection Agency
    NAQI = "naqi"    # Indian National Air Quality Index


# ============================================================
# US EPA AQI Breakpoints (2024 standards)
# Reference: Technical Assistance Document for the Reporting of Daily Air Quality
# Units: PM2.5/PM10 in μg/m³, O3 in ppm (8-hr), CO in ppm (8-hr), 
#        NO2 in ppb (1-hr), SO2 in ppb (1-hr)
# ============================================================

EPA_PM25_BREAKPOINTS = [
    (0.0, 9.0, 0, 50),        # Good
    (9.1, 35.4, 51, 100),     # Moderate
    (35.5, 55.4, 101, 150),   # Unhealthy for Sensitive Groups
    (55.5, 125.4, 151, 200),  # Unhealthy
    (125.5, 225.4, 201, 300), # Very Unhealthy
    (225.5, 325.4, 301, 500), # Hazardous
]

EPA_PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500),
]

EPA_O3_BREAKPOINTS = [  # 8-hr average, ppm
    (0.000, 0.054, 0, 50),
    (0.055, 0.070, 51, 100),
    (0.071, 0.085, 101, 150),
    (0.086, 0.105, 151, 200),
    (0.106, 0.200, 201, 300),
]

EPA_CO_BREAKPOINTS = [  # 8-hr average, ppm
    (0.0, 4.4, 0, 50),
    (4.5, 9.4, 51, 100),
    (9.5, 12.4, 101, 150),
    (12.5, 15.4, 151, 200),
    (15.5, 30.4, 201, 300),
    (30.5, 50.4, 301, 500),
]

EPA_NO2_BREAKPOINTS = [  # 1-hr average, ppb
    (0, 53, 0, 50),
    (54, 100, 51, 100),
    (101, 360, 101, 150),
    (361, 649, 151, 200),
    (650, 1249, 201, 300),
    (1250, 2049, 301, 500),
]

EPA_SO2_BREAKPOINTS = [  # 1-hr average, ppb
    (0, 35, 0, 50),
    (36, 75, 51, 100),
    (76, 185, 101, 150),
    (186, 304, 151, 200),
    (305, 604, 201, 300),
    (605, 1004, 301, 500),
]

EPA_BREAKPOINTS = {
    'pm25': EPA_PM25_BREAKPOINTS,
    'pm10': EPA_PM10_BREAKPOINTS,
    'o3': EPA_O3_BREAKPOINTS,
    'co': EPA_CO_BREAKPOINTS,
    'no2': EPA_NO2_BREAKPOINTS,
    'so2': EPA_SO2_BREAKPOINTS,
}


# ============================================================
# Indian NAQI Breakpoints (SAFAR/CPCB standards)
# Reference: Central Pollution Control Board (CPCB) India
# All concentrations are 24-hr averages except O3 (8-hr) and CO (8-hr)
# Units: PM2.5/PM10/NO2/SO2/NH3 in μg/m³, O3 in μg/m³ (8-hr), CO in mg/m³ (8-hr)
# ============================================================

NAQI_PM25_BREAKPOINTS = [  # μg/m³, 24-hr
    (0, 30, 0, 50),         # Good
    (31, 60, 51, 100),      # Satisfactory
    (61, 90, 101, 200),     # Moderate
    (91, 120, 201, 300),    # Poor
    (121, 250, 301, 400),   # Very Poor (Severe)
    (251, 500, 401, 500),   # Severe (Hazardous)
]

NAQI_PM10_BREAKPOINTS = [  # μg/m³, 24-hr
    (0, 50, 0, 50),
    (51, 100, 51, 100),
    (101, 250, 101, 200),
    (251, 350, 201, 300),
    (351, 430, 301, 400),
    (431, 600, 401, 500),
]

NAQI_O3_BREAKPOINTS = [  # μg/m³, 8-hr
    (0, 50, 0, 50),
    (51, 100, 51, 100),
    (101, 168, 101, 200),
    (169, 208, 201, 300),
    (209, 748, 301, 400),
    (749, 1000, 401, 500),
]

NAQI_CO_BREAKPOINTS = [  # mg/m³, 8-hr
    (0, 1.0, 0, 50),
    (1.1, 2.0, 51, 100),
    (2.1, 10.0, 101, 200),
    (10.1, 17.0, 201, 300),
    (17.1, 34.0, 301, 400),
    (34.1, 50.0, 401, 500),
]

NAQI_NO2_BREAKPOINTS = [  # μg/m³, 24-hr
    (0, 40, 0, 50),
    (41, 80, 51, 100),
    (81, 180, 101, 200),
    (181, 280, 201, 300),
    (281, 400, 301, 400),
    (401, 600, 401, 500),
]

NAQI_SO2_BREAKPOINTS = [  # μg/m³, 24-hr
    (0, 40, 0, 50),
    (41, 80, 51, 100),
    (81, 380, 101, 200),
    (381, 800, 201, 300),
    (801, 1600, 301, 400),
    (1601, 2400, 401, 500),
]

NAQI_NH3_BREAKPOINTS = [  # μg/m³, 24-hr - unique to Indian standard
    (0, 200, 0, 50),
    (201, 400, 51, 100),
    (401, 800, 101, 200),
    (801, 1200, 201, 300),
    (1201, 1800, 301, 400),
    (1801, 2400, 401, 500),
]

NAQI_BREAKPOINTS = {
    'pm25': NAQI_PM25_BREAKPOINTS,
    'pm10': NAQI_PM10_BREAKPOINTS,
    'o3': NAQI_O3_BREAKPOINTS,
    'co': NAQI_CO_BREAKPOINTS,
    'no2': NAQI_NO2_BREAKPOINTS,
    'so2': NAQI_SO2_BREAKPOINTS,
    'nh3': NAQI_NH3_BREAKPOINTS,
}


# ============================================================
# AQI Categories and Health Messages
# ============================================================

EPA_CATEGORIES = [
    (50, "Good", "#00e400", "Air quality is satisfactory, and air pollution poses little or no risk."),
    (100, "Moderate", "#ffff00", "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution."),
    (150, "Unhealthy for Sensitive Groups", "#ff7e00", "Members of sensitive groups may experience health effects. The general public is less likely to be affected."),
    (200, "Unhealthy", "#ff0000", "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects."),
    (300, "Very Unhealthy", "#8f3f97", "Health alert: The risk of health effects is increased for everyone."),
    (500, "Hazardous", "#7e0023", "Health warning of emergency conditions: everyone is more likely to be affected."),
]

NAQI_CATEGORIES = [
    (50, "Good", "#009966", "Minimal impact on health."),
    (100, "Satisfactory", "#ffde33", "Minor breathing discomfort to sensitive people."),
    (200, "Moderate", "#ff9933", "Breathing discomfort to people with lungs, asthma and heart diseases."),
    (300, "Poor", "#ff0000", "Breathing discomfort to most people on prolonged exposure."),
    (400, "Very Poor", "#990066", "Respiratory illness on prolonged exposure. Effect may be felt even in healthy people."),
    (500, "Severe", "#7e0023", "Affects healthy people and seriously affects those with existing diseases. Avoid outdoor activities."),
]

POLLUTANT_NAMES = {
    'pm25': 'PM2.5',
    'pm10': 'PM10',
    'co': 'CO',
    'no2': 'NO₂',
    'so2': 'SO₂',
    'o3': 'O₃',
    'nh3': 'NH₃',
}


def calculate_aqi_for_pollutant(concentration: float, breakpoints: list) -> int:
    """
    Calculate AQI for a single pollutant using the linear interpolation formula.
    
    Formula: AQI = [(I_high - I_low) / (C_high - C_low)] * (C - C_low) + I_low
    
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
            # Linear interpolation formula
            aqi = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return round(aqi)
    
    # If concentration exceeds all breakpoints, return maximum hazardous level
    return 500


def get_aqi_category(aqi: int, standard: AQIStandard = AQIStandard.EPA) -> Tuple[str, str, str]:
    """
    Get AQI category, color, and health message based on AQI value.
    
    Args:
        aqi: The AQI value
        standard: Which standard to use (EPA or NAQI)
    
    Returns:
        Tuple of (category, color, message)
    """
    categories = EPA_CATEGORIES if standard == AQIStandard.EPA else NAQI_CATEGORIES
    
    for threshold, category, color, message in categories:
        if aqi <= threshold:
            return category, color, message
    
    # Return the last category for values above 500
    return categories[-1][1], categories[-1][2], categories[-1][3]


def calculate_aqi(
    pollutants: Dict[str, float], 
    standard: AQIStandard = AQIStandard.EPA
) -> Dict:
    """
    Calculate overall AQI from multiple pollutants.
    
    The overall AQI is the maximum of individual pollutant AQIs.
    
    Args:
        pollutants: Dictionary of pollutant concentrations
                   e.g., {'pm25': 35.5, 'pm10': 150, 'o3': 0.068}
        standard: Which standard to use (EPA or NAQI)
    
    Returns:
        Dictionary containing AQI value, category, dominant pollutant, etc.
    """
    breakpoint_table = EPA_BREAKPOINTS if standard == AQIStandard.EPA else NAQI_BREAKPOINTS
    aqi_values = {}
    
    # Calculate AQI for each pollutant
    for pollutant, concentration in pollutants.items():
        if concentration is not None and pollutant in breakpoint_table:
            breakpoints = breakpoint_table[pollutant]
            aqi_value = calculate_aqi_for_pollutant(concentration, breakpoints)
            aqi_values[pollutant] = aqi_value
    
    # If no valid pollutants, generate sample data for demo
    if not aqi_values:
        sample_pm25 = random.uniform(0, 100)
        pm25_breakpoints = breakpoint_table.get('pm25', EPA_PM25_BREAKPOINTS)
        aqi_values['pm25'] = calculate_aqi_for_pollutant(sample_pm25, pm25_breakpoints)
    
    # Overall AQI is the maximum of individual AQIs
    max_aqi = max(aqi_values.values())
    dominant_pollutant = max(aqi_values, key=aqi_values.get)
    
    category, color, message = get_aqi_category(max_aqi, standard)
    
    return {
        'aqi': max_aqi,
        'category': category,
        'color': color,
        'dominant_pollutant': POLLUTANT_NAMES.get(dominant_pollutant, dominant_pollutant.upper()),
        'message': message,
        'standard': standard.value,
        'individual_aqis': {POLLUTANT_NAMES.get(k, k.upper()): v for k, v in aqi_values.items()}
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


# Backward compatibility - default to EPA standard
def get_health_message(aqi: int) -> str:
    """Get health message based on AQI value (EPA standard)."""
    _, _, message = get_aqi_category(aqi, AQIStandard.EPA)
    return message


# ============================================================
# EPA AQI to Concentration Conversion (Reverse Calculation)
# ============================================================

def epa_aqi_to_concentration(aqi: float, pollutant: str) -> Optional[float]:
    """
    Convert EPA AQI value back to estimated pollutant concentration.
    
    This is the reverse of the AQI calculation formula:
    C = [(C_high - C_low) / (I_high - I_low)] * (AQI - I_low) + C_low
    
    Args:
        aqi: The EPA AQI value
        pollutant: The pollutant type ('pm25', 'pm10', etc.)
    
    Returns:
        Estimated concentration in μg/m³ (or appropriate unit)
    """
    if aqi is None or pollutant not in EPA_BREAKPOINTS:
        return None
    
    breakpoints = EPA_BREAKPOINTS[pollutant]
    
    for c_low, c_high, i_low, i_high in breakpoints:
        if i_low <= aqi <= i_high:
            # Reverse formula
            concentration = ((c_high - c_low) / (i_high - i_low)) * (aqi - i_low) + c_low
            return round(concentration, 2)
    
    # If AQI exceeds breakpoints, estimate using the last bracket
    if aqi > breakpoints[-1][3]:
        c_low, c_high, i_low, i_high = breakpoints[-1]
        concentration = ((c_high - c_low) / (i_high - i_low)) * (aqi - i_low) + c_low
        return round(concentration, 2)
    
    return None


def calculate_naqi_from_epa_aqi(epa_aqi_values: Dict[str, float]) -> Dict:
    """
    Calculate Indian NAQI from EPA AQI values.
    
    Process:
    1. Convert EPA AQI to estimated concentration
    2. Apply Indian NAQI breakpoints to get Indian AQI
    3. Return the maximum (dominant pollutant determines overall AQI)
    
    Args:
        epa_aqi_values: Dictionary of EPA AQI values per pollutant
                       e.g., {'pm25': 150, 'pm10': 85, 'o3': 45}
    
    Returns:
        Dictionary with Indian NAQI values and category
    """
    naqi_values = {}
    concentrations = {}
    
    for pollutant, epa_aqi in epa_aqi_values.items():
        if epa_aqi is None or pollutant not in EPA_BREAKPOINTS:
            continue
        
        # Step 1: Convert EPA AQI to estimated concentration
        concentration = epa_aqi_to_concentration(epa_aqi, pollutant)
        if concentration is None:
            continue
        
        concentrations[pollutant] = concentration
        
        # Step 2: Apply Indian NAQI breakpoints
        if pollutant in NAQI_BREAKPOINTS:
            naqi_aqi = calculate_aqi_for_pollutant(concentration, NAQI_BREAKPOINTS[pollutant])
            naqi_values[pollutant] = naqi_aqi
    
    if not naqi_values:
        return {
            'naqi': None,
            'naqi_category': 'Unknown',
            'naqi_color': '#808080',
            'naqi_message': 'Unable to calculate Indian NAQI',
            'concentrations': concentrations
        }
    
    # Step 3: Overall NAQI is the maximum
    max_naqi = max(naqi_values.values())
    dominant = max(naqi_values, key=naqi_values.get)
    
    category, color, message = get_aqi_category(max_naqi, AQIStandard.NAQI)
    
    return {
        'naqi': max_naqi,
        'naqi_category': category,
        'naqi_color': color,
        'naqi_message': message,
        'naqi_dominant': POLLUTANT_NAMES.get(dominant, dominant.upper()),
        'individual_naqi': {POLLUTANT_NAMES.get(k, k.upper()): v for k, v in naqi_values.items()},
        'concentrations': {POLLUTANT_NAMES.get(k, k.upper()): f"{v} μg/m³" for k, v in concentrations.items()}
    }
