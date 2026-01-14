import { useState } from 'react'
import AQIForm from '../components/AQIForm'
import AQIResult from '../components/AQIResult'

// API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Calculator() {
  const [aqiData, setAqiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCalculateAQI = async (formData) => {
    setLoading(true)
    setError(null)
    setAqiData(null)

    try {
      // Call the new location-based AQI endpoint
      const response = await fetch(`${API_URL}/aqi/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: formData.latitude,
          longitude: formData.longitude
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch AQI data')
      }

      const data = await response.json()
      
      // Transform data to match AQIResult component expectations
      setAqiData({
        aqi: data.aqi,
        category: data.category,
        color: data.color,
        location: data.station_name,
        date: data.fetched_at,
        dominant_pollutant: data.dominant_pollutant,
        message: data.message,
        measurements: data.measurements,
        station_url: data.station_url,
        measurement_time: data.measurement_time,
        forecast: data.forecast,
        coordinates: data.coordinates,
        attributions: data.attributions
      })
    } catch (err) {
      setError(err.message || 'An error occurred while fetching AQI data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-10">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Air Quality Index
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Check real-time air quality for any location worldwide
          </p>
        </header>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="lg:sticky lg:top-8">
              <AQIForm onSubmit={handleCalculateAQI} loading={loading} />
            </div>
            
            <div>
              {loading && (
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <p className="mt-5 text-gray-600 font-medium">Fetching air quality data...</p>
                  <p className="text-sm text-gray-400 mt-1">Finding nearest monitoring station</p>
                </div>
              )}

              {error && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-red-800 font-semibold mb-1">Unable to fetch data</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {aqiData && !loading && (
                <AQIResult data={aqiData} />
              )}

              {!aqiData && !loading && !error && (
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-700 font-semibold mb-2">Enter a location</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    Search for a city or use your current location to check air quality conditions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 text-sm">
              AQI calculated using{' '}
              <span className="font-medium text-gray-700">US EPA</span> standards
            </span>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Data provided by{' '}
            <a 
              href="https://waqi.info" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-600"
            >
              World Air Quality Index Project
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
