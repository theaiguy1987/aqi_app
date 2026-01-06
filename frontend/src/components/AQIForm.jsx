import { useState } from 'react'

function AQIForm({ onSubmit, loading }) {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!location || !date) {
      alert('Please fill in all fields')
      return
    }

    onSubmit({
      location,
      date,
    })
  }

  const handleUseCurrentDate = () => {
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Calculate AQI
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name or coordinates"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            e.g., "New York" or "40.7128, -74.0060"
          </p>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleUseCurrentDate}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              disabled={loading}
            >
              Today
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a demonstration app. Sample pollutant data will be generated for the calculation.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate AQI'}
        </button>
      </form>
    </div>
  )
}

export default AQIForm
