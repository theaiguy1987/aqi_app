# 🐍 Backend - FastAPI Server

This is the Python backend. **You'll understand this!**

---

## 📁 Files

| File | What It Does |
|------|--------------|
| `main.py` | API server (like Flask) |
| `aqi_calculator.py` | AQI math calculation |
| `requirements.txt` | Python packages needed |
| `Dockerfile` | Container config for cloud deployment |
| `.env.example` | Environment variable template |

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
| POST | `/calculate-aqi` | Calculate AQI from pollutant data |

---

## 📖 Try the API

Visit http://localhost:8000/docs for interactive API testing!

**Example request:**
```json
POST /calculate-aqi
{
    "location": "New York",
    "date": "2026-01-10"
}
```

**Example response:**
```json
{
    "aqi": 75,
    "category": "Moderate",
    "color": "#ffff00",
    "location": "New York",
    "date": "2026-01-10",
    "dominant_pollutant": "pm25",
    "message": "Air quality is acceptable..."
}
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port (Cloud Run sets this automatically) |

---

## 📚 Learn More

See [PYTHON_GUIDE.md](../PYTHON_GUIDE.md) for a detailed explanation of every line of code!
