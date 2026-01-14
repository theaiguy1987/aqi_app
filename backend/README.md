# 🐍 Backend - FastAPI Server

Welcome to the Python backend! Since you know Python, **you can read and understand all of this code**.

This document explains the architecture, how FastAPI works, and walks through the key code patterns.

---

## 📁 File Overview

```
backend/
├── main.py              ← API server (endpoints live here)
├── aqi_calculator.py    ← AQI calculation logic (pure Python)
├── aqicn_client.py      ← HTTP client for AQICN API
├── requirements.txt     ← Python dependencies
├── Dockerfile           ← Container config (for deployment)
└── .env                 ← Environment variables (API keys)
```

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "main.py - API Layer"
        EP1["/health"]
        EP2["/aqi/location"]
        EP3["/search"]
        EP4["/calculate-aqi"]
    end
    
    subgraph "aqicn_client.py - Data Layer"
        FETCH[fetch_aqi_by_location]
        SEARCH[search_stations]
    end
    
    subgraph "aqi_calculator.py - Logic Layer"
        CALC[calculate_aqi]
        CAT[get_aqi_category]
    end
    
    subgraph "External"
        AQICN[AQICN API]
    end
    
    EP2 --> FETCH
    EP3 --> SEARCH
    EP4 --> CALC
    FETCH --> AQICN
    FETCH --> CAT
    SEARCH --> AQICN
    
    style EP1 fill:#4caf50
    style EP2 fill:#2196f3
    style EP3 fill:#2196f3
    style EP4 fill:#ff9800
```

### Separation of Concerns

| File | Responsibility | Depends On |
|------|---------------|------------|
| `main.py` | HTTP handling, request/response | Both other files |
| `aqicn_client.py` | External API communication | `aqi_calculator.py` |
| `aqi_calculator.py` | Pure calculation logic | Nothing (standalone) |

---

## 🚀 FastAPI Primer

FastAPI is a modern Python web framework. If you know Flask, you'll feel right at home!

### Flask vs FastAPI Comparison

```python
# Flask
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/hello', methods=['POST'])
def hello():
    data = request.get_json()
    return jsonify({'message': f"Hello, {data['name']}"})

# FastAPI (same thing!)
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class HelloRequest(BaseModel):
    name: str

@app.post('/hello')
def hello(data: HelloRequest):
    return {'message': f"Hello, {data.name}"}
```

### Key Differences

| Feature | Flask | FastAPI |
|---------|-------|---------|
| Request parsing | `request.get_json()` | Automatic via Pydantic |
| Validation | Manual | Automatic via type hints |
| Docs | Manual (Swagger separate) | Auto-generated at `/docs` |
| Async support | Limited | Built-in |
| Type hints | Optional | Encouraged |

---

## 📖 Code Walkthrough

### 1. Entry Point (`main.py`)

Let's break down the key parts:

#### Imports and Setup
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Create the app instance
app = FastAPI(
    title="AQI Calculator API",
    description="Air Quality Index calculator with real-time data",
    version="3.0.0"
)

# CORS: Allow frontend (different port) to call our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, list specific origins
    allow_methods=["*"],
    allow_headers=["*"],
)
```

> 💡 **CORS Explained**: Browsers block requests between different origins (ports count!). 
> Frontend runs on `localhost:3000`, backend on `localhost:8000`. 
> CORS middleware tells the browser "it's okay, allow this".

#### Request/Response Models (Pydantic)
```python
class LocationAQIRequest(BaseModel):
    """Request model for fetching AQI by coordinates."""
    latitude: float = Field(..., ge=-90, le=90)   # Must be between -90 and 90
    longitude: float = Field(..., ge=-180, le=180)

class LocationAQIResponse(BaseModel):
    """Response model for AQI data."""
    station_name: str
    aqi: Optional[int] = None
    category: str
    color: str
    # ... more fields
```

> 💡 **Why Pydantic?** 
> - Automatic validation (latitude must be -90 to 90)
> - Auto-generated documentation
> - Type safety
> - Clear API contracts

#### Endpoint Definition
```python
@app.post("/aqi/location", response_model=LocationAQIResponse)
async def get_aqi_by_location(request: LocationAQIRequest):
    """
    Get AQI for a specific latitude/longitude.
    Finds the nearest monitoring station.
    """
    try:
        # Call our AQICN client
        data = await fetch_aqi_by_location(
            request.latitude, 
            request.longitude
        )
        
        # Return structured response
        return LocationAQIResponse(
            station_name=data.get("station_name", "Unknown"),
            aqi=data.get("aqi"),
            category=data.get("category", "Unknown"),
            # ... map all fields
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

> 💡 **Async/Await**: FastAPI supports async functions. When waiting for external APIs, 
> the server can handle other requests instead of blocking.

---

### 2. AQICN Client (`aqicn_client.py`)

This file handles all communication with the external AQICN API.

```mermaid
sequenceDiagram
    participant Main as main.py
    participant Client as aqicn_client.py
    participant API as AQICN API

    Main->>Client: fetch_aqi_by_location(lat, lng)
    Client->>Client: Build URL with API token
    Client->>API: GET /feed/geo:lat;lng/
    API-->>Client: JSON response
    Client->>Client: Parse & transform data
    Client->>Client: Add category & message
    Client-->>Main: Structured dict
```

#### Key Function
```python
async def fetch_aqi_by_location(latitude: float, longitude: float) -> dict:
    """
    Fetch AQI data for coordinates from AQICN API.
    
    Args:
        latitude: Latitude (-90 to 90)
        longitude: Longitude (-180 to 180)
    
    Returns:
        Dict with AQI data, category, measurements, etc.
    """
    # Get API token from environment
    token = os.getenv("AQICN_API_TOKEN")
    
    # Build the API URL
    url = f"https://api.waqi.info/feed/geo:{latitude};{longitude}/?token={token}"
    
    # Make async HTTP request
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
    
    # Parse and return structured data
    return _parse_feed_response(data)
```

> 💡 **httpx vs requests**: `httpx` is like `requests` but supports async. 
> Same API: `httpx.get(url)` works just like `requests.get(url)`.

---

### 3. AQI Calculator (`aqi_calculator.py`)

Pure Python logic - no web framework code here!

```mermaid
graph LR
    subgraph "Input"
        PM25[PM2.5: 35 µg/m³]
        PM10[PM10: 50 µg/m³]
        O3[O3: 0.06 ppm]
    end
    
    subgraph "calculate_aqi()"
        LOOKUP[Look up breakpoints]
        FORMULA[Apply EPA formula]
        MAX[Find maximum]
    end
    
    subgraph "Output"
        AQI[AQI: 99]
        CAT[Category: Moderate]
        DOM[Dominant: PM2.5]
    end
    
    PM25 --> LOOKUP
    PM10 --> LOOKUP
    O3 --> LOOKUP
    LOOKUP --> FORMULA
    FORMULA --> MAX
    MAX --> AQI
    MAX --> CAT
    MAX --> DOM
```

#### The AQI Formula

The EPA uses this piecewise linear formula:

```
AQI = ((I_high - I_low) / (C_high - C_low)) × (C - C_low) + I_low
```

Where:
- `C` = Pollutant concentration
- `C_low`, `C_high` = Breakpoint concentrations
- `I_low`, `I_high` = AQI values at breakpoints

#### Code Implementation
```python
# Breakpoint tables (EPA standard)
EPA_PM25_BREAKPOINTS = [
    # (C_low, C_high, I_low, I_high)
    (0.0,    9.0,    0,   50),    # Good
    (9.1,   35.4,   51,  100),    # Moderate
    (35.5,  55.4,  101,  150),    # Unhealthy for Sensitive Groups
    (55.5, 125.4,  151,  200),    # Unhealthy
    # ... more breakpoints
]

def calculate_aqi_for_pollutant(concentration: float, breakpoints: list) -> int:
    """
    Calculate AQI for a single pollutant using EPA formula.
    """
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            # Apply the formula
            aqi = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return round(aqi)
    
    # Above highest breakpoint = Hazardous
    return breakpoints[-1][3]

def calculate_aqi(pollutants: dict, standard: AQIStandard = AQIStandard.EPA) -> dict:
    """
    Calculate overall AQI from multiple pollutants.
    
    The overall AQI is the MAXIMUM of individual pollutant AQIs.
    """
    aqi_values = {}
    
    for pollutant, concentration in pollutants.items():
        if concentration is not None:
            breakpoints = BREAKPOINT_TABLE[pollutant]
            aqi_values[pollutant] = calculate_aqi_for_pollutant(concentration, breakpoints)
    
    # Overall AQI = Maximum individual AQI
    max_aqi = max(aqi_values.values())
    dominant = max(aqi_values, key=aqi_values.get)
    
    category, color, message = get_aqi_category(max_aqi, standard)
    
    return {
        'aqi': max_aqi,
        'category': category,
        'color': color,
        'dominant_pollutant': dominant,
        'message': message
    }
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Welcome message | - |
| GET | `/health` | Health check | - |
| POST | `/aqi/location` | Get AQI by coordinates | `{latitude, longitude}` |
| GET | `/search?keyword=...` | Search stations | - |
| GET | `/aqi/station/{id}` | Get AQI for station | - |
| POST | `/calculate-aqi` | Calculate from raw data | `{pm25, pm10, ...}` |

### Try It Yourself!

1. Start the server: `python main.py`
2. Open http://localhost:8000/docs
3. Click any endpoint → "Try it out" → "Execute"

---

## 🔧 Running the Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment (create .env file)
echo "AQICN_API_TOKEN=your_token_here" > .env

# Run!
python main.py
```

Server starts at http://localhost:8000

---

## 📦 Dependencies Explained

```txt
fastapi          # Web framework
uvicorn          # ASGI server (runs FastAPI)
httpx            # Async HTTP client (like requests)
python-dotenv    # Load .env files
pydantic         # Data validation
```

> 💡 **ASGI vs WSGI**: 
> - WSGI (Flask default): Synchronous, one request at a time
> - ASGI (FastAPI/uvicorn): Async, handles many concurrent requests

---

## 🧪 Testing the API

### Using curl
```bash
# Health check
curl http://localhost:8000/health

# Get AQI for Delhi
curl -X POST http://localhost:8000/aqi/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 28.6139, "longitude": 77.2090}'
```

### Using Python
```python
import requests

# Get AQI for Delhi
response = requests.post(
    "http://localhost:8000/aqi/location",
    json={"latitude": 28.6139, "longitude": 77.2090}
)
print(response.json())
```

---

## 📚 Next Steps

1. **Read the code** - Start with `aqi_calculator.py` (pure Python)
2. **Modify an endpoint** - Add a new field to the response
3. **Add a new endpoint** - Try creating `/aqi/cities` that returns hardcoded cities
4. **Explore the frontend** - See how it calls these endpoints → [frontend/README.md](../frontend/README.md)
