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
│   ├── Calculator.jsx   ← AQI calculator page
│   └── Blog.jsx         ← Blog page
└── components/
    ├── Navigation.jsx   ← Top navigation bar
    ├── AQIForm.jsx      ← Input form
    └── AQIResult.jsx    ← Colored result display
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
| `/` | Calculator | Enter location/date, get AQI result |
| `/blog` | Blog | Articles about air pollution in India |

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
