import { useState, useEffect } from 'react'

// API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AQIForm({ onSubmit, loading }) {
  // State for city and station selection
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  
  // Loading states
  const [loadingCities, setLoadingCities] = useState(true)
  const [loadingStations, setLoadingStations] = useState(false)
  const [error, setError] = useState(null)

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities()
  }, [])

  // Fetch stations when city changes
  useEffect(() => {
    if (selectedCity) {
      fetchStations(selectedCity)
    } else {
      setStations([])
      setSelectedStation(null)
    }
  }, [selectedCity])

  const fetchCities = async () => {
    setLoadingCities(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/cities`)
      if (!response.ok) throw new Error('Failed to fetch cities')
      const data = await response.json()
      setCities(data)
    } catch (err) {
      setError('Failed to load cities. Please try again.')
      console.error('Error fetching cities:', err)
    } finally {
      setLoadingCities(false)
    }
  }

  const fetchStations = async (city) => {
    setLoadingStations(true)
    setSelectedStation(null)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/stations/${encodeURIComponent(city)}`)
      if (!response.ok) throw new Error('Failed to fetch stations')
      const data = await response.json()
      setStations(data)
    } catch (err) {
      setError(`Failed to load stations for ${city}. Please try again.`)
      console.error('Error fetching stations:', err)
    } finally {
      setLoadingStations(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedStation) {
      alert('Please select a city and station')
      return
    }

    onSubmit({
      station_id: selectedStation.id,
      station_name: selectedStation.name,
      city: selectedCity
    })
  }

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value)
  }

  const handleStationChange = (e) => {
    const stationId = parseInt(e.target.value)
    const station = stations.find(s => s.id === stationId)
    setSelectedStation(station)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Check Air Quality
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* City Selection */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Select City
          </label>
          <select
            id="city"
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
            disabled={loading || loadingCities}
          >
            <option value="">
              {loadingCities ? 'Loading cities...' : '-- Select a city --'}
            </option>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.station_count} stations)
              </option>
            ))}
          </select>
        </div>

        {/* Station Selection */}
        <div>
          <label htmlFor="station" className="block text-sm font-medium text-gray-700 mb-2">
            Select Monitoring Station
          </label>
          <select
            id="station"
            value={selectedStation?.id || ''}
            onChange={handleStationChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
            disabled={loading || loadingStations || !selectedCity}
          >
            <option value="">
              {!selectedCity 
                ? '-- Select a city first --' 
                : loadingStations 
                  ? 'Loading stations...' 
                  : '-- Select a station --'}
            </option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.is_active ? '🟢' : '🔴'} {station.name}
              </option>
            ))}
          </select>
          {selectedCity && stations.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              🟢 = Active (recent data), 🔴 = Inactive
            </p>
          )}
        </div>

        {/* Station Details */}
        {selectedStation && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Station Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Name:</strong> {selectedStation.name}</p>
              <p><strong>Provider:</strong> {selectedStation.provider}</p>
              <p><strong>Sensors:</strong> {selectedStation.sensors.slice(0, 5).join(', ')}{selectedStation.sensors.length > 5 ? '...' : ''}</p>
              <p><strong>Status:</strong> {selectedStation.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
              {selectedStation.last_updated && (
                <p><strong>Last Update:</strong> {new Date(selectedStation.last_updated).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Real-time Data:</strong> This app fetches live air quality measurements from OpenAQ monitoring stations across India.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedStation}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Fetching Live Data...' : 'Get Air Quality Index'}
        </button>
      </form>
    </div>
  )
}

export default AQIForm
