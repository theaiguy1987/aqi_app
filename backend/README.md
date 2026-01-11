# 🐍 Backend - FastAPI Server

This is the Python backend. **You'll understand this!**

---

## 📁 Files

| File | What It Does |
|------|--------------|
| `main.py` | API server (FastAPI endpoints) |
| `aqi_calculator.py` | AQI math calculation (EPA standards) |
| `station_service.py` | Manages station data from JSON file |
| `openaq_client.py` | Fetches live data from OpenAQ API |
| `map_india_stations.py` | Utility to refresh `india_stations.json` |
| `india_stations.json` | Database of 691 Indian stations |
| `requirements.txt` | Python packages needed |
| `Dockerfile` | Container config for cloud deployment |
| `.env` | Environment variables (API keys) |

---

## 🚀 Quick Start

```bash
# From project root
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

# Run the server
python main.py
```

✅ Server runs at http://localhost:8000

---

## 🔌 API Endpoints

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| GET | `/cities` | List all 67 cities with station counts |
| GET | `/stations/{city}` | Get stations in a specific city |
| POST | `/aqi/live` | Fetch real-time AQI for a station |
| POST | `/calculate-aqi` | Calculate AQI from manual pollutant data |

---

## 📖 Try the API

Visit http://localhost:8000/docs for interactive API testing!

**Example 1: Get cities**
```bash
GET /cities
```
```json
[
    {"name": "Delhi", "station_count": 69},
    {"name": "Mumbai", "station_count": 39},
    ...
]
```

**Example 2: Get stations in Delhi**
```bash
GET /stations/Delhi
```
```json
[
    {
        "id": 235,
        "name": "Anand Vihar, New Delhi - DPCC",
        "sensors": ["PM2.5", "PM10", "NO2"],
        "is_active": true
    },
    ...
]
```

**Example 3: Get live AQI**
```json
POST /aqi/live
{"station_id": 235}
```
```json
{
    "station_id": 235,
    "station_name": "Anand Vihar, New Delhi - DPCC",
    "aqi": 156,
    "category": "Unhealthy",
    "color": "#ff0000",
    "dominant_pollutant": "PM2.5",
    "measurements": [
        {"parameter": "pm25", "value": 85.3, "unit": "µg/m³"},
        {"parameter": "pm10", "value": 142.0, "unit": "µg/m³"}
    ],
    "message": "Some members of the general public may experience health effects..."
}
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port (Cloud Run sets this automatically) |
| `OPEN_AQ_API` | - | OpenAQ API key for live data (get from openaq.org) |

---

## 📚 Learn More

See [PYTHON_GUIDE.md](../PYTHON_GUIDE.md) for a detailed explanation of every line of code!
