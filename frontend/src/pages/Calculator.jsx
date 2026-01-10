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
      const response = await fetch(`${API_URL}/calculate-aqi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to calculate AQI')
      }

      const data = await response.json()
      setAqiData(data)
    } catch (err) {
      setError(err.message || 'An error occurred while calculating AQI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Air Quality Index Calculator
          </h1>
          <p className="text-gray-600 text-lg">
            Check the air quality in your location
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <AQIForm onSubmit={handleCalculateAQI} loading={loading} />
            </div>
            
            <div>
              {loading && (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-gray-600">Calculating AQI...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-6">
                  <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {aqiData && !loading && (
                <AQIResult data={aqiData} />
              )}

              {!aqiData && !loading && !error && (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Enter a location and date to calculate AQI</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>AQI values are calculated based on EPA standards</p>
          <p className="mt-1">For demonstration purposes, sample pollutant data is generated</p>
        </footer>
      </div>
    </div>
  )
}
