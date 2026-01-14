function AQIResult({ data }) {
  const { 
    aqi, 
    category, 
    color, 
    location, 
    date, 
    dominant_pollutant, 
    message, 
    measurements, 
    station_url, 
    measurement_time, 
    forecast, 
    coordinates, 
    attributions,
    // New NAQI fields
    aqi_standard,
    epa_aqi,
    epa_category,
    epa_color,
    naqi_breakdown,
    concentrations
  } = data

  const getAQIGradient = (aqi) => {
    if (aqi === null || aqi === undefined) return 'from-gray-400 to-gray-500'
    if (aqi <= 50) return 'from-emerald-400 to-emerald-600'
    if (aqi <= 100) return 'from-yellow-400 to-amber-500'
    if (aqi <= 150) return 'from-orange-400 to-orange-600'
    if (aqi <= 200) return 'from-red-500 to-red-700'
    if (aqi <= 300) return 'from-purple-500 to-purple-700'
    return 'from-rose-800 to-rose-950'
  }

  const getAQIEmoji = (aqi) => {
    if (aqi === null || aqi === undefined) return '❓'
    if (aqi <= 50) return '😊'
    if (aqi <= 100) return '🙂'
    if (aqi <= 150) return '😐'
    if (aqi <= 200) return '😷'
    if (aqi <= 300) return '🤢'
    return '☠️'
  }

  const getTextColor = (aqi) => {
    if (aqi === null || aqi === undefined) return 'text-white'
    return aqi <= 100 ? 'text-gray-900' : 'text-white'
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString()
    } catch {
      return dateStr
    }
  }

  // Filter to only show air quality pollutants (not weather data)
  const airQualityMeasurements = measurements?.filter(m => 
    ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'].includes(m.parameter)
  ) || []

  // Weather measurements
  const weatherMeasurements = measurements?.filter(m => 
    ['t', 'h', 'w', 'p'].includes(m.parameter)
  ) || []

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Main AQI Display */}
      <div className={`bg-gradient-to-br ${getAQIGradient(aqi)} p-8`}>
        <div className={`text-center ${getTextColor(aqi)}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">{getAQIEmoji(aqi)}</span>
            <div>
              <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                {aqi_standard || 'Air Quality Index'}
              </p>
              <p className="text-7xl font-black leading-none">{aqi !== null ? aqi : '--'}</p>
            </div>
          </div>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <p className="text-lg font-bold">{category}</p>
          </div>
          {/* Show EPA AQI for comparison if available */}
          {epa_aqi && epa_aqi !== aqi && (
            <div className="mt-3 text-sm opacity-80">
              <span className="font-medium">EPA (US): </span>
              <span className="font-bold">{epa_aqi}</span>
              <span className="mx-1">·</span>
              <span>{epa_category}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Station Info */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 font-medium">Monitoring Station</p>
            <p className="text-gray-900 font-semibold truncate" title={location}>{location}</p>
            {coordinates?.latitude && (
              <p className="text-xs text-gray-400 mt-0.5">
                {coordinates.latitude?.toFixed(4)}°, {coordinates.longitude?.toFixed(4)}°
              </p>
            )}
          </div>
        </div>

        {/* Dominant Pollutant & Time */}
        <div className="grid grid-cols-2 gap-3">
          {dominant_pollutant && dominant_pollutant !== 'Unknown' && (
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <p className="text-xs text-red-600 font-medium uppercase">Main Pollutant</p>
              <p className="text-lg font-bold text-red-700 uppercase">{dominant_pollutant}</p>
            </div>
          )}
          <div className={`p-3 bg-blue-50 rounded-xl text-center ${(!dominant_pollutant || dominant_pollutant === 'Unknown') ? 'col-span-2' : ''}`}>
            <p className="text-xs text-blue-600 font-medium uppercase">Updated</p>
            <p className="text-sm font-semibold text-blue-700">{measurement_time || formatDate(date)}</p>
          </div>
        </div>

        {/* Air Quality Measurements - Show NAQI values with concentrations */}
        {naqi_breakdown && Object.keys(naqi_breakdown).length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">📊</span>
              Pollutant NAQI Values
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(naqi_breakdown).map(([pollutant, value], index) => {
                const getColor = (val) => {
                  if (val <= 50) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  if (val <= 100) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  if (val <= 200) return 'bg-orange-100 text-orange-700 border-orange-200'
                  if (val <= 300) return 'bg-red-100 text-red-700 border-red-200'
                  if (val <= 400) return 'bg-purple-100 text-purple-700 border-purple-200'
                  return 'bg-rose-100 text-rose-700 border-rose-200'
                }
                const conc = concentrations?.[pollutant]
                return (
                  <div key={index} className={`p-2.5 rounded-lg border ${getColor(value)} text-center`}>
                    <p className="text-xs font-medium opacity-80">{pollutant}</p>
                    <p className="text-lg font-bold">{Math.round(value)}</p>
                    {conc && <p className="text-[10px] opacity-70 truncate" title={conc}>{conc}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Fallback: Show raw measurements if NAQI breakdown not available */}
        {(!naqi_breakdown || Object.keys(naqi_breakdown).length === 0) && airQualityMeasurements.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">📊</span>
              Pollutant Levels
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {airQualityMeasurements.map((m, index) => {
                const getColor = (val) => {
                  if (val <= 50) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  if (val <= 100) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  if (val <= 150) return 'bg-orange-100 text-orange-700 border-orange-200'
                  return 'bg-red-100 text-red-700 border-red-200'
                }
                return (
                  <div key={index} className={`p-2.5 rounded-lg border ${getColor(m.value)} text-center`}>
                    <p className="text-xs font-medium opacity-80">{m.display_name}</p>
                    <p className="text-lg font-bold">{Math.round(m.value)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Weather */}
        {weatherMeasurements.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span>🌤️</span> Current Weather
            </h3>
            <div className="flex flex-wrap gap-4">
              {weatherMeasurements.map((m, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">{m.display_name}:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {typeof m.value === 'number' ? m.value.toFixed(1) : m.value}{m.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Message */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="text-sm font-bold text-amber-800 mb-1.5 flex items-center gap-2">
            <span>⚠️</span> Health Advice
          </h3>
          <p className="text-sm text-amber-700 leading-relaxed">{message}</p>
        </div>

        {/* Forecast */}
        {forecast && (forecast.pm25 || forecast.pm10) && (
          <div className="p-4 bg-indigo-50 rounded-xl">
            <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <span>📅</span> 3-Day Forecast
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(forecast.pm25 || forecast.pm10)?.slice(0, 3).map((day, index) => (
                <div key={index} className="bg-white p-2.5 rounded-lg text-center shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(day.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xl font-bold text-indigo-600">{day.avg}</p>
                  <p className="text-xs text-gray-400">{day.min}-{day.max}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AQI Scale */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-2 text-center">AQI Scale (US EPA Standard)</p>
          <div className="flex rounded-lg overflow-hidden h-3">
            <div className="flex-1 bg-emerald-500" title="Good (0-50)"></div>
            <div className="flex-1 bg-yellow-400" title="Moderate (51-100)"></div>
            <div className="flex-1 bg-orange-500" title="USG (101-150)"></div>
            <div className="flex-1 bg-red-500" title="Unhealthy (151-200)"></div>
            <div className="flex-1 bg-purple-600" title="Very Unhealthy (201-300)"></div>
            <div className="flex-1 bg-rose-900" title="Hazardous (301+)"></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200</span>
            <span>300</span>
            <span>500</span>
          </div>
        </div>

        {/* Attribution - Required by WAQI Terms of Service */}
        <div className="pt-4 border-t border-gray-100 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Data provided by{' '}
            <a 
              href="https://waqi.info/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-500 hover:text-indigo-600 font-medium"
            >
              World Air Quality Index Project
            </a>
          </p>
          {attributions && attributions.length > 0 && (
            <div className="text-xs text-gray-400">
              <span>Sources: </span>
              {attributions.slice(0, 2).map((attr, idx) => (
                <span key={idx}>
                  {idx > 0 && ', '}
                  <a 
                    href={attr.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-indigo-500"
                  >
                    {attr.name}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AQIResult
