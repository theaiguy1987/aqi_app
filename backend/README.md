# 🐍 Backend - FastAPI Server

This is the Python backend. You'll understand this part!

## Quick Start

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Files

| File | What It Does |
|------|--------------|
| `main.py` | API server (like Flask) |
| `aqi_calculator.py` | AQI math calculation |
| `requirements.txt` | Python packages needed |

## API Endpoints

| Method | URL | What It Does |
|--------|-----|--------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| POST | `/calculate-aqi` | Calculate AQI |

## Try It!

Visit http://localhost:8000/docs for interactive API testing.

## Learn More

See [PYTHON_GUIDE.md](../PYTHON_GUIDE.md) for detailed code explanation.
