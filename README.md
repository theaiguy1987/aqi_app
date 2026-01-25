# 🌬️ AQI Calculator

A real-time **Air Quality Index** web application that helps you check air pollution levels anywhere in the world.

> **Built for learning:** This project demonstrates a full-stack web application with a Python backend and React frontend. Perfect for Python developers wanting to understand modern web development!

---

## 🎯 What Does This App Do?

1. **Automatically detects your location** (or search for any place)
2. **Get real-time air quality data** from monitoring stations worldwide
3. **See results visually** with color-coded AQI, cigarette equivalent, and health advice

```
✅ Works globally - check air quality in Delhi, Tokyo, New York, anywhere!
✅ Real-time data from World Air Quality Index Project (WAQI)
✅ Health recommendations and cigarette equivalent based on pollution levels
```

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Your Computer"
        subgraph "Frontend - React"
            UI[Web Interface<br/>localhost:3000]
            NAV[Navigation with<br/>Location Search]
            CALC[Calculator Page]
            RESULT[AQI Result Display]
            CTX[Location Context<br/>Shared State]
        end
        
        subgraph "Backend - Python"
            API[FastAPI Server<br/>localhost:8000]
            CLIENT[AQICN Client]
        end
    end
    
    subgraph "External Services"
        AQICN[AQICN API<br/>Real-time AQI Data]
        GOOGLE[Google Places API<br/>Location Autocomplete]
    end
    
    User((User)) --> NAV
    NAV --> CTX
    CTX --> CALC
    CALC --> RESULT
    CTX -->|HTTP Request| API
    API --> CLIENT
    CLIENT -->|Fetch Data| AQICN
    NAV -.->|Optional| GOOGLE
    
    style UI fill:#61dafb
    style API fill:#009688
    style AQICN fill:#ff9800
    style GOOGLE fill:#4285f4
    style CTX fill:#a855f7
```

### The Restaurant Analogy 🍽️

Think of this application like a restaurant:

| Component | Restaurant | Our App | Technology |
|-----------|------------|---------|------------|
| **Frontend** | Dining room (what customers see) | Web interface | React |
| **Navigation** | Host/Hostess (takes your order) | Location search bar | React + Google Places |
| **Context** | Kitchen ticket system | Shared state management | React Context |
| **Backend** | Kitchen (where food is prepared) | API server | Python + FastAPI |
| **External API** | Food suppliers | AQICN (air quality data) | HTTP requests |

---

## 📁 Project Structure

```
aqi_app/
├── backend/                 ← Python code (start here!)
│   ├── main.py              ← API server entry point (FastAPI)
│   ├── aqi_calculator.py    ← AQI calculation logic (EPA formula)
│   ├── aqicn_client.py      ← Fetches data from AQICN API
│   ├── requirements.txt     ← Python dependencies
│   ├── Dockerfile           ← Container config for deployment
│   └── README.md            ← Backend documentation
│
├── frontend/                ← React code
│   ├── src/
│   │   ├── main.jsx         ← Entry point (renders App)
│   │   ├── App.jsx          ← Main app with routing & context
│   │   ├── index.css        ← Global styles (Tailwind CSS)
│   │   ├── contexts/
│   │   │   └── LocationContext.jsx ← Shared state for location & AQI
│   │   ├── pages/
│   │   │   ├── Calculator.jsx ← Main AQI calculator page
│   │   │   └── Blog.jsx       ← Blog page
│   │   └── components/
│   │       ├── Navigation.jsx ← Top nav bar with location search
│   │       ├── AQIResult.jsx  ← AQI result display
│   │       └── AQIForm.jsx    ← Manual AQI input form
│   ├── package.json         ← Node.js dependencies
│   ├── Dockerfile           ← Container config for deployment
│   └── README.md            ← Frontend documentation
│
├── LOCAL_SETUP.md           ← How to run locally
├── DEPLOYMENT.md            ← Google Cloud Run deployment guide
├── start.bat / start.sh     ← One-click startup scripts
└── README.md                ← This file
```

---

## 🚀 Quick Start

```bash
# Windows
.\start.bat

# Linux/Mac
./start.sh
```

Then open http://localhost:3000

> 📖 For detailed setup instructions, see [LOCAL_SETUP.md](LOCAL_SETUP.md)

---

## ✨ Key Features

### 1. Automatic Location Detection
When you first visit the app, it automatically asks for your location permission. If granted, it fetches AQI data immediately!

```mermaid
flowchart LR
    A[Page Load] --> B{Location<br/>Permission?}
    B -->|Granted| C[Get GPS Coords]
    B -->|Denied| D[Show Search Bar]
    C --> E[Fetch AQI Data]
    D --> F[User Searches Location]
    F --> E
    E --> G[Display Results]
```

### 2. Location Search in Header
The search bar is always accessible in the navigation, making it easy to check air quality for any location at any time.

### 3. Cigarette Equivalent Display
Based on Berkeley Earth research, we calculate how many cigarettes per day the air pollution is equivalent to - making the impact more tangible.

### 4. Modern, Responsive UI
Clean design with:
- Large, readable AQI display with color coding
- Station information
- Cigarette equivalent with explanation
- Health advice
- Pollutant breakdown
- Weather conditions
- 3-day forecast

---

## ⚛️ React Primer for Python Developers

If you know Python but not React, this section is for you!

### What is React?

React is a JavaScript library for building user interfaces. Think of it as a way to create **interactive HTML** that updates automatically when data changes.

```mermaid
graph LR
    subgraph "Traditional Web - like Flask templates"
        A[User clicks button] --> B[Full page reload]
        B --> C[Server renders new HTML]
        C --> D[Browser shows new page]
    end
```

```mermaid
graph LR
    subgraph "React - Single Page App"
        E[User clicks button] --> F[JavaScript updates page]
        F --> G[Only changed parts re-render]
    end
```

### React Concepts → Python Equivalents

| React Concept | Python Equivalent | Example |
|--------------|-------------------|---------|
| **Component** | Function returning HTML | `def MyButton(): return "<button>Click</button>"` |
| **JSX** | f-strings with HTML | `f"<div>{name}</div>"` |
| **Props** | Function arguments | `def greet(name): ...` |
| **State** | Variables that trigger UI updates | No direct equivalent - closest is a class attribute |
| **`useState()`** | Creating a reactive variable | `count, setCount = useState(0)` |
| **Context** | Global variables accessible anywhere | Like Flask's `g` object |
| **`fetch()`** | `requests.get()` / `requests.post()` | Same concept! |

### Understanding React Context

Our app uses React Context to share location and AQI data across components:

```mermaid
graph TB
    subgraph "LocationContext Provider"
        CTX[Location Context]
        CTX --> |selectedLocation| NAV[Navigation]
        CTX --> |aqiData| CALC[Calculator]
        CTX --> |loading, error| CALC
        NAV --> |setSelectedLocation| CTX
    end
    
    style CTX fill:#a855f7
```

**Python equivalent (conceptually):**
```python
# Like a global state manager
class LocationContext:
    selected_location = None
    aqi_data = None
    loading = False
    error = None
    
    def fetch_aqi(self, lat, lng):
        self.loading = True
        self.aqi_data = requests.get(f"/aqi/location?lat={lat}&lng={lng}").json()
        self.loading = False

# All components can access and modify this
location_ctx = LocationContext()
```

### Side-by-Side Comparison

**Python (Flask-style thinking):**
```python
# A function that returns HTML
def greeting(name):
    return f"<h1>Hello, {name}!</h1>"

# Using it
greeting("Alice")  # Returns: <h1>Hello, Alice!</h1>
```

**React (same concept!):**
```jsx
// A component that returns HTML (JSX)
function Greeting({ name }) {
    return <h1>Hello, {name}!</h1>
}

// Using it
<Greeting name="Alice" />  // Renders: <h1>Hello, Alice!</h1>
```

### Understanding `useState` - The Key React Concept

In Python, when you change a variable, nothing happens to the display:
```python
count = 0
count = count + 1  # Variable changes, but no UI update
print(count)       # You have to explicitly print
```

In React, `useState` creates a variable that **automatically updates the UI**:
```jsx
const [count, setCount] = useState(0)  // Initial value is 0

// When user clicks button:
setCount(count + 1)  // UI automatically shows new value!
```

### Reading React Code - A Cheat Sheet

```jsx
// 1. Import statements (like Python imports)
import { useState } from 'react'
import { useLocation } from '../contexts/LocationContext'

// 2. Component definition (like a Python function)
function Calculator() {
    // 3. Use context for shared state
    const { aqiData, loading, error } = useLocation()
    
    // 4. Return JSX (HTML-like syntax)
    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
            {aqiData && <AQIResult data={aqiData} />}
        </div>
    )
}

// 5. Export (makes it available to other files)
export default Calculator
```

### The `{}` Curly Braces in JSX

In JSX (React's HTML-like syntax), curly braces `{}` mean "execute this JavaScript":

```jsx
// Similar to Python f-strings!
// Python: f"Hello, {name}"
// React:  <h1>Hello, {name}</h1>

// Conditional rendering:
{loading && <Spinner />}        // If loading is true, show Spinner
{error ? <Error /> : <Result />} // If error, show Error, else Result
```

---

## 📚 Learning Path

1. **Start with the Backend** → [backend/README.md](backend/README.md)
   - You already know Python!
   - FastAPI is similar to Flask
   - Understand how the API works

2. **Then Explore the Frontend** → [frontend/README.md](frontend/README.md)
   - Apply the React concepts above
   - See how components connect
   - Trace data flow from API to UI

3. **Run the App** → [LOCAL_SETUP.md](LOCAL_SETUP.md)
   - Get hands-on experience
   - Modify code and see changes
   - Build your understanding

---

## 🔗 Key Files to Read

| File | Why It's Important | Difficulty |
|------|-------------------|------------|
| `backend/main.py` | API endpoints - you know this! | ⭐ Easy |
| `backend/aqicn_client.py` | Fetches and formats AQI data from AQICN | ⭐ Easy |
| `backend/aqi_calculator.py` | EPA AQI calculation formula | ⭐ Easy |
| `frontend/src/contexts/LocationContext.jsx` | Shared state management & AQI fetching | ⭐⭐ Medium |
| `frontend/src/components/Navigation.jsx` | Location search with Google Places | ⭐⭐ Medium |
| `frontend/src/pages/Calculator.jsx` | Main page using context | ⭐⭐ Medium |
| `frontend/src/components/AQIResult.jsx` | UI component with cigarette equivalent | ⭐⭐ Medium |
| `frontend/src/components/AQIForm.jsx` | Manual AQI input form | ⭐⭐ Medium |

---

## 📊 Data Flow

Here's how data moves through the application when you visit the page:

```mermaid
sequenceDiagram
    participant U as User
    participant N as Navigation
    participant C as LocationContext
    participant P as Calculator Page
    participant B as Backend (Python)
    participant A as AQICN API

    U->>N: Visits page
    N->>C: Request location permission
    C->>C: navigator.geolocation
    Note over C: Auto-fetch on permission granted
    C->>B: POST /aqi/location {lat, lng}
    B->>A: GET feed for coordinates
    A-->>B: Raw AQI data
    B-->>C: JSON {aqi, category, message, ...}
    C->>P: Update aqiData state
    P->>U: Shows AQI card with results

    Note over U,N: Or user searches manually
    U->>N: Types "Delhi, India"
    N->>N: Google Places autocomplete
    U->>N: Selects location
    N->>C: setSelectedLocation({lat, lng})
    C->>B: POST /aqi/location
    B->>A: GET feed
    A-->>B: Data
    B-->>C: Response
    C->>P: Update state
    P->>U: Display results
```

---

## 🤝 Contributing

Found a bug or want to improve something? 

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use this for learning or as a starting point for your own projects!

---

## 🙏 Acknowledgments

- Air quality data from [World Air Quality Index Project](https://waqi.info/)
- Cigarette equivalent research from [Berkeley Earth](http://berkeleyearth.org/)
- Built with [FastAPI](https://fastapi.tiangolo.com/) and [React](https://react.dev/)
