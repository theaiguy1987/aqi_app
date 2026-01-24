import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LocationProvider } from './contexts/LocationContext'
import Navigation from './components/Navigation'
import Calculator from './pages/Calculator'
import Blog from './pages/Blog'

function App() {
  return (
    <LocationProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/blog" element={<Blog />} />
          </Routes>
        </div>
      </Router>
    </LocationProvider>
  )
}

export default App
