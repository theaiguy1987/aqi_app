function AQIResult({ data }) {
  const { aqi, category, color, location, date, dominant_pollutant, message, measurements, individual_aqis } = data

  const getAQIGradient = (aqi) => {
    if (aqi <= 50) return 'from-green-400 to-green-600'
    if (aqi <= 100) return 'from-yellow-400 to-yellow-600'
    if (aqi <= 150) return 'from-orange-400 to-orange-600'
    if (aqi <= 200) return 'from-red-400 to-red-600'
    if (aqi <= 300) return 'from-purple-400 to-purple-600'
    return 'from-red-800 to-red-900'
  }

  const getTextColor = (aqi) => {
    return aqi <= 100 ? 'text-gray-900' : 'text-white'
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div 
        className={`bg-gradient-to-r ${getAQIGradient(aqi)} p-8 text-center`}
      >
        <div className={`${getTextColor(aqi)}`}>
          <p className="text-sm font-medium opacity-90 mb-2">Air Quality Index</p>
          <p className="text-6xl font-bold mb-2">{aqi}</p>
          <p className="text-xl font-semibold">{category}</p>
        </div>
      </div>

      <div className="p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Station:</span>
            <span className="text-gray-900 font-semibold text-right">{location}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Fetched At:</span>
            <span className="text-gray-900 font-semibold">
              {formatDate(date)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Dominant Pollutant:</span>
            <span className="text-gray-900 font-semibold">{dominant_pollutant}</span>
          </div>
        </div>

        {/* Live Measurements Section */}
        {measurements && measurements.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Live Measurements:</h3>
            <div className="grid grid-cols-2 gap-2">
              {measurements.map((m, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{m.display_name}:</span>
                  <span className="text-gray-900 font-medium">{m.value.toFixed(2)} {m.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual AQIs Section */}
        {individual_aqis && Object.keys(individual_aqis).length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 AQI by Pollutant:</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(individual_aqis).map(([pollutant, value]) => (
                <div key={pollutant} className="flex justify-between text-sm">
                  <span className="text-gray-600">{pollutant}:</span>
                  <span className={`font-medium ${value > 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">⚠️ Health Implications:</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">AQI Scale Reference:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">0-50: Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-600">51-100: Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-orange-500 rounded"></div>
              <span className="text-xs text-gray-600">101-150: Unhealthy for Sensitive Groups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">151-200: Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-purple-500 rounded"></div>
              <span className="text-xs text-gray-600">201-300: Very Unhealthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-4 bg-red-900 rounded"></div>
              <span className="text-xs text-gray-600">301+: Hazardous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AQIResult
