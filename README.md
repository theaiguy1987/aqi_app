# 🌬️ AQI Calculator

A beginner-friendly **Air Quality Index Calculator** web application with a Python backend and React frontend.

---

## 🎯 What Does This App Do?

1. You enter a city name and date in the web page
2. The webpage sends this info to a Python server
3. Python calculates the Air Quality Index
4. The result comes back with colors (green = good, red = bad)

**Plus:** A blog section for sharing thoughts on air pollution in India!

---

## 🏗️ How It's Built

Think of this project as a **restaurant**:

| Component | Restaurant Analogy | Technology | You Know This? |
|-----------|-------------------|------------|----------------|
| **Frontend** | Dining room (what customers see) | React | ❌ New (but explained!) |
| **Backend** | Kitchen (where food is made) | Python + FastAPI | ✅ Yes! |
| **API** | Waiter (carries orders) | HTTP/JSON | 🔄 Similar to `requests` |

```
User Browser
    ↓
Frontend (React) ──sends request──► Backend (Python)
    ↑                                    │
    └────────receives result─────────────┘
```

---

## 📁 Project Structure

```
aqi_app/
├── backend/              ← Python code (YOU CAN READ THIS!)
│   ├── main.py           ← API server (like Flask)
│   └── aqi_calculator.py ← The calculation logic
│
├── frontend/             ← React code (web interface)
│   └── src/
│       ├── App.jsx       ← Main app with routing
│       ├── pages/        ← Calculator and Blog pages
│       └── components/   ← Reusable UI parts
│
├── start.bat             ← Run locally (Windows)
├── start.sh              ← Run locally (Linux/Mac)
└── deploy.sh             ← Deploy to Google Cloud
```

---

## 🚀 Quick Start

### Run Locally (One Command!)

```bash
# Windows
.\start.bat

# Linux/Mac  
./start.sh
```

**That's it!** Open your browser:
- **App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

The script automatically:
1. Creates Python virtual environment
2. Installs all dependencies
3. Starts both servers

---

## 📚 Documentation

Read these guides in order:

| # | Guide | What You'll Learn |
|---|-------|-------------------|
| 1 | **[SETUP.md](SETUP.md)** | Detailed local setup & troubleshooting |
| 2 | **[PYTHON_GUIDE.md](PYTHON_GUIDE.md)** | Understand every line of Python code |
| 3 | **[DEPLOYMENT.md](DEPLOYMENT.md)** | Deploy to Google Cloud Run |

---

## 🐍 For Python Developers

You already know Python! Here's how this project maps to what you know:

| This Project | Python Equivalent |
|-------------|-------------------|
| FastAPI | Like Flask |
| Pydantic models | Like dataclasses with validation |
| `uvicorn.run()` | Like `flask run` |
| React components | Functions that return HTML |
| `fetch()` in JS | `requests.post()` in Python |

**Start here:** Read [PYTHON_GUIDE.md](PYTHON_GUIDE.md) to understand every line of Python code!

---

## 📊 Understanding the AQI Scale

| AQI | Color | What It Means |
|-----|-------|---------------|
| 0-50 | 🟢 Green | Good - Go outside! |
| 51-100 | 🟡 Yellow | Moderate - Okay for most |
| 101-150 | 🟠 Orange | Unhealthy for sensitive groups |
| 151-200 | 🔴 Red | Unhealthy for everyone |
| 201-300 | 🟣 Purple | Very Unhealthy |
| 301+ | 🟤 Maroon | Hazardous - Stay inside! |

---

## 🔧 Making Changes

### Day-to-Day Development

```bash
# 1. Edit your code
# 2. Test locally
.\start.bat

# 3. Commit and push
git add .
git commit -m "feat: Your feature"
git push origin google-cloud-run

# 4. Deploy (in Google Cloud Shell)
./deploy.sh
```

### Key Files to Edit

| What to Change | File |
|---------------|------|
| AQI calculation logic | `backend/aqi_calculator.py` |
| API endpoints | `backend/main.py` |
| UI components | `frontend/src/components/*.jsx` |
| Blog content | `frontend/src/pages/Blog.jsx` |
| Styles | `frontend/src/index.css` |

---

## 🌐 Live URLs (After Deployment)

- **Frontend**: https://aqi-frontend-xxx.run.app
- **Backend API**: https://aqi-backend-xxx.run.app/docs

---

## ❓ Quick FAQ

**Q: Why not just use Python for everything?**
> React makes beautiful, interactive UIs easier. The Python backend handles the logic.

**Q: Do I need to learn JavaScript?**
> No! The frontend is ready to use. Focus on the Python code in `backend/`.

**Q: What's FastAPI vs Flask?**
> FastAPI is like a modern Flask - faster, with auto-documentation and data validation.

---

## 📝 License

MIT License - Feel free to use and modify!
