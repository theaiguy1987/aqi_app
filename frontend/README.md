# ⚛️ Frontend - React App

This is the web interface. **Don't worry if you don't know React!**

---

## 📁 Files

```
src/
├── App.jsx              ← Main app with routing
├── main.jsx             ← Entry point
├── index.css            ← Styles (Tailwind CSS)
├── pages/
│   ├── Calculator.jsx   ← AQI calculator page (calls /aqi/live)
│   └── Blog.jsx         ← Blog page
└── components/
    ├── Navigation.jsx   ← Top navigation bar
    ├── AQIForm.jsx      ← City & station selector dropdowns
    └── AQIResult.jsx    ← Colored result with live measurements
```

---

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

✅ App runs at http://localhost:3000

---

## 🌐 Pages

| URL | Page | Description |
|-----|------|-------------|
| `/` | Calculator | Select city → station → get live AQI |
| `/blog` | Blog | Articles about air pollution in India |

### Calculator Flow
1. **Select City** - Dropdown shows 67 cities with station counts
2. **Select Station** - Shows stations in that city (🟢 active, 🔴 inactive)
3. **Click "Get AQI"** - Fetches real-time data from OpenAQ
4. **View Results** - AQI value, color, measurements, health advice

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | http://localhost:8000 | Backend API URL |

**Important:** Vite reads these at **build time**, not runtime!

---

## 🐍 For Python Developers

React concepts mapped to Python:

| React | Python |
|-------|--------|
| Component | Function that returns HTML |
| `useState()` | Variable that updates the UI |
| `fetch()` | `requests.post()` |
| `props` | Function arguments |
| `async/await` | Same as Python! |

**Example comparison:**

```javascript
// React
const [data, setData] = useState(null)
const response = await fetch(url)
const result = await response.json()
setData(result)
```

```python
# Python equivalent
data = None
response = requests.get(url)
result = response.json()
data = result  # (in React, setData triggers UI update)
```

---

## 📚 Learn More

- Main project: [README.md](../README.md)
- Python code explanation: [PYTHON_GUIDE.md](../PYTHON_GUIDE.md)
