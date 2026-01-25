import { useState } from 'react'

function AQIResult({ data }) {
  const [isPollutantsExpanded, setIsPollutantsExpanded] = useState(false)
  
  const { 
    aqi, 
    category, 
    location, 
    dominant_pollutant, 
    message, 
    measurement_time, 
    forecast, 
    pollutant_breakdown
  } = data

  // Calculate cigarette equivalent
  // Based on research: 22 µg/m³ of PM2.5 ≈ 1 cigarette per day
  const getCigaretteEquivalent = (aqiValue) => {
    if (!aqiValue || aqiValue <= 0) return 0
    
    // Rough PM2.5 estimation from AQI (simplified)
    let pm25
    if (aqiValue <= 50) {
      pm25 = (aqiValue / 50) * 12
    } else if (aqiValue <= 100) {
      pm25 = 12 + ((aqiValue - 50) / 50) * 23.4
    } else if (aqiValue <= 150) {
      pm25 = 35.4 + ((aqiValue - 100) / 50) * 20
    } else if (aqiValue <= 200) {
      pm25 = 55.4 + ((aqiValue - 150) / 50) * 70
    } else {
      pm25 = 125.4 + ((aqiValue - 200) / 100) * 100
    }
    
    return Math.round((pm25 / 22) * 10) / 10
  }

  const cigarettes = getCigaretteEquivalent(aqi)

  // Color utilities
  const getAQIColor = (aqiValue) => {
    if (aqiValue === null || aqiValue === undefined) return { bg: '#9CA3AF', text: '#fff', light: '#F3F4F6' }
    if (aqiValue <= 50) return { bg: '#10B981', text: '#fff', light: '#D1FAE5' }
    if (aqiValue <= 100) return { bg: '#F59E0B', text: '#fff', light: '#FEF3C7' }
    if (aqiValue <= 150) return { bg: '#F97316', text: '#fff', light: '#FFEDD5' }
    if (aqiValue <= 200) return { bg: '#EF4444', text: '#fff', light: '#FEE2E2' }
    if (aqiValue <= 300) return { bg: '#8B5CF6', text: '#fff', light: '#EDE9FE' }
    return { bg: '#991B1B', text: '#fff', light: '#FEE2E2' }
  }

  const getAQIEmoji = (aqiValue) => {
    if (aqiValue === null || aqiValue === undefined) return '❓'
    if (aqiValue <= 50) return '😊'
    if (aqiValue <= 100) return '🙂'
    if (aqiValue <= 150) return '😐'
    if (aqiValue <= 200) return '😷'
    if (aqiValue <= 300) return '🤢'
    return '☠️'
  }

  const colors = getAQIColor(aqi)

  // Get future forecast days only (skip today)
  const getFutureForecast = () => {
    const forecastData = forecast?.pm25 || forecast?.pm10
    if (!forecastData) return []
    
    const today = new Date().toISOString().split('T')[0]
    return forecastData
      .filter(day => day.day > today)
      .slice(0, 2)
  }

  const futureForecast = getFutureForecast()

  // Animated smoke CSS keyframes
  const smokeAnimation = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
      50% { transform: translateY(-10px) translateX(5px); opacity: 0.8; }
    }
    @keyframes smoke {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
  `

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <style>{smokeAnimation}</style>
      
      {/* Compact Header with AQI */}
      <div className="p-4 sm:p-5" style={{ backgroundColor: colors.light }}>
        <div className="flex items-center gap-4">
          {/* AQI Circle */}
          <div 
            className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.bg }}
          >
            <span className="text-3xl sm:text-4xl font-black text-white leading-none">
              {aqi !== null ? aqi : '--'}
            </span>
            <span className="text-[10px] sm:text-xs text-white/80 font-medium uppercase tracking-wide">
              AQI
            </span>
          </div>
          
          {/* Status & Location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{getAQIEmoji(aqi)}</span>
              <span className="font-bold text-gray-900">{category}</span>
            </div>
            <div className="text-gray-500 text-xs mb-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">Based on the monitoring station closest to you</span>
              </div>
              {location && (
                <div className="pl-5 text-gray-600 font-medium">
                  {location}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated: {measurement_time || 'Just now'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Cigarette Equivalent & Main Pollutant Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cigarette Equivalent */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">🚬</span>
            <div>
              <p className="text-xs text-gray-500">Daily Equivalent</p>
              <p className="font-bold text-gray-900">
                {cigarettes > 0 ? `${cigarettes.toFixed(1)} cigarettes` : '< 0.1 cigarettes'}
              </p>
            </div>
          </div>
          
          {/* Main Pollutant with Animated Smoke */}
          {dominant_pollutant && dominant_pollutant !== 'Unknown' && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="relative w-8 h-8">
                <div 
                  className="absolute inset-0 text-2xl"
                  style={{ 
                    animation: 'float 3s ease-in-out infinite',
                    filter: 'blur(1px)'
                  }}
                >
                  💨
                </div>
                <div 
                  className="absolute inset-0 text-2xl"
                  style={{ 
                    animation: 'smoke 4s ease-in-out infinite',
                    animationDelay: '0.5s'
                  }}
                >
                  💨
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Main Pollutant</p>
                <p className="font-bold text-gray-900">{dominant_pollutant}</p>
              </div>
            </div>
          )}
        </div>

        {/* Health Advice */}
        <div className="p-3 rounded-xl border-l-4" style={{ borderColor: colors.bg, backgroundColor: colors.light + '40' }}>
          <p className="text-xs font-semibold text-gray-600 mb-1">💡 Health Advice</p>
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* 2-Day Forecast */}
        {futureForecast.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📅 Forecast</p>
            <div className="grid grid-cols-2 gap-2">
              {futureForecast.map((day, index) => {
                const dayColors = getAQIColor(day.avg)
                const dayName = new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })
                const dayDate = new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                
                return (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: dayColors.light }}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: dayColors.bg }}
                    >
                      {day.avg}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{dayName}</p>
                      <p className="text-xs text-gray-500">{dayDate}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Collapsible Explore Pollutants Section */}
        {pollutant_breakdown && Object.keys(pollutant_breakdown).length > 0 && (
          <div>
            <button
              onClick={() => setIsPollutantsExpanded(!isPollutantsExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                🔍 Explore Pollutants
              </span>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform ${isPollutantsExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isPollutantsExpanded && (
              <div className="mt-2 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
                {Object.entries(pollutant_breakdown).map(([pollutant, value], index) => {
                  const pColors = getAQIColor(value)
                  return (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                      style={{ backgroundColor: pColors.light }}
                    >
                      <span className="font-medium text-gray-700">{pollutant}</span>
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: pColors.bg }}
                      >
                        {Math.round(value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact AQI Scale */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex rounded-lg overflow-hidden h-2">
          <div className="flex-1 bg-emerald-500" title="Good"></div>
          <div className="flex-1 bg-amber-500" title="Moderate"></div>
          <div className="flex-1 bg-orange-500" title="USG"></div>
          <div className="flex-1 bg-red-500" title="Unhealthy"></div>
          <div className="flex-1 bg-purple-600" title="Very Unhealthy"></div>
          <div className="flex-1 bg-rose-900" title="Hazardous"></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Good</span>
          <span>Moderate</span>
          <span>Unhealthy</span>
          <span>Hazardous</span>
        </div>
      </div>

      {/* Attribution */}
      <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Data from{' '}
          <a 
            href="https://waqi.info/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            World Air Quality Index Project
          </a>
        </p>
      </div>
    </div>
  )
}

export default AQIResult
