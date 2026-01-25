import { useState, useRef } from 'react'

function AQIResult({ data }) {
  const [isPollutantsExpanded, setIsPollutantsExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribePhone, setSubscribePhone] = useState('')
  const [subscribeMethod, setSubscribeMethod] = useState('email')
  const [subscribeStatus, setSubscribeStatus] = useState(null)
  const shareCardRef = useRef(null)
  
  const { 
    aqi, 
    category, 
    location, 
    dominant_pollutant, 
    message, 
    measurement_time, 
    forecast, 
    pollutant_breakdown,
    distance_km
  } = data

  // Calculate cigarette equivalent
  const getCigaretteEquivalent = (aqiValue) => {
    if (!aqiValue || aqiValue <= 0) return 0
    
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

  // Calculate data freshness in minutes
  const getDataFreshness = () => {
    if (!measurement_time) return null
    try {
      const measureDate = new Date(measurement_time)
      const now = new Date()
      const diffMs = now - measureDate
      const diffMins = Math.floor(diffMs / 60000)
      return diffMins
    } catch (e) {
      return null
    }
  }

  const freshnessMins = getDataFreshness()

  // Calculate confidence level based on distance and freshness
  // High: within 5km AND updated < 60 min
  // Medium: within 15km OR updated < 120 min  
  // Low: far (>15km) OR stale (>120 min)
  const getConfidenceLevel = () => {
    const dist = distance_km ?? null
    const fresh = freshnessMins ?? null
    
    const distanceOk = dist !== null && dist <= 5
    const distanceMedium = dist !== null && dist <= 15
    const freshOk = fresh !== null && fresh >= 0 && fresh < 60
    const freshMedium = fresh !== null && fresh >= 0 && fresh < 120

    if (distanceOk && freshOk) {
      return { level: 'High', color: '#10B981', bgColor: '#D1FAE5' }
    } else if ((distanceOk || distanceMedium) && (freshOk || freshMedium)) {
      return { level: 'Medium', color: '#F59E0B', bgColor: '#FEF3C7' }
    } else {
      return { level: 'Low', color: '#EF4444', bgColor: '#FEE2E2' }
    }
  }

  const confidence = getConfidenceLevel()

  // EPA-based action recommendations by AQI level and pollutant
  // Sources: EPA AirNow guidelines, WHO air quality guidelines
  const getActionRecommendations = () => {
    const actions = []
    
    // Handle null/undefined AQI
    if (aqi === null || aqi === undefined) {
      actions.push({
        icon: '❓',
        text: 'Unable to determine air quality recommendations at this time',
        type: 'info'
      })
      return actions
    }
    
    const isPM = dominant_pollutant?.toLowerCase().includes('pm') || 
                 dominant_pollutant === 'PM2.5' || 
                 dominant_pollutant === 'PM10'
    const isOzone = dominant_pollutant?.toLowerCase().includes('o3') || 
                    dominant_pollutant?.toLowerCase().includes('ozone')

    // Good (0-50)
    if (aqi <= 50) {
      actions.push({
        icon: '✅',
        text: 'Great day for outdoor activities',
        type: 'positive'
      })
      actions.push({
        icon: '🚴',
        text: 'Ideal conditions for exercise outside',
        type: 'positive'
      })
      actions.push({
        icon: '🪟',
        text: 'Open windows to ventilate your home',
        type: 'positive'
      })
    }
    // Moderate (51-100)
    else if (aqi <= 100) {
      actions.push({
        icon: '⚠️',
        text: 'Unusually sensitive people should consider reducing prolonged outdoor exertion',
        type: 'caution'
      })
      actions.push({
        icon: '👀',
        text: 'Watch for symptoms like coughing or shortness of breath',
        type: 'info'
      })
      actions.push({
        icon: '🏠',
        text: 'Most people can continue normal outdoor activities',
        type: 'positive'
      })
    }
    // Unhealthy for Sensitive Groups (101-150)
    else if (aqi <= 150) {
      if (isPM) {
        actions.push({
          icon: '😷',
          text: 'Sensitive groups: Consider wearing an N95/KN95 mask outdoors',
          type: 'warning'
        })
        actions.push({
          icon: '🏃',
          text: 'Sensitive groups: Reduce prolonged or heavy outdoor exertion',
          type: 'warning'
        })
      } else if (isOzone) {
        actions.push({
          icon: '⏰',
          text: 'Sensitive groups: Avoid outdoor activities during afternoon peak ozone hours',
          type: 'warning'
        })
      }
      actions.push({
        icon: '🪟',
        text: 'Keep windows closed and use air purifier if available',
        type: 'action'
      })
      actions.push({
        icon: '👶',
        text: 'Children, elderly, and those with respiratory conditions should limit outdoor time',
        type: 'warning'
      })
    }
    // Unhealthy (151-200)
    else if (aqi <= 200) {
      actions.push({
        icon: '🚫',
        text: 'Everyone should avoid prolonged outdoor exertion',
        type: 'alert'
      })
      actions.push({
        icon: '😷',
        text: 'Wear a tight-fitting N95/KN95 mask if you must go outside',
        type: 'action'
      })
      actions.push({
        icon: '🪟',
        text: 'Keep all windows and doors closed',
        type: 'action'
      })
      actions.push({
        icon: '💨',
        text: 'Run air purifier on high setting if available',
        type: 'action'
      })
    }
    // Very Unhealthy (201-300)
    else if (aqi <= 300) {
      actions.push({
        icon: '🏠',
        text: 'Stay indoors as much as possible',
        type: 'alert'
      })
      actions.push({
        icon: '🚫',
        text: 'Avoid ALL outdoor physical activity',
        type: 'alert'
      })
      actions.push({
        icon: '😷',
        text: 'N95/KN95 mask essential if going outside',
        type: 'alert'
      })
      actions.push({
        icon: '🚗',
        text: 'Keep car windows up and use recirculate mode',
        type: 'action'
      })
    }
    // Hazardous (301+)
    else {
      actions.push({
        icon: '⛔',
        text: 'Health emergency: Remain indoors',
        type: 'emergency'
      })
      actions.push({
        icon: '🚨',
        text: 'Avoid ALL outdoor activities - this is an emergency',
        type: 'emergency'
      })
      actions.push({
        icon: '😷',
        text: 'Wear N95 mask even indoors if air quality is poor inside',
        type: 'emergency'
      })
      actions.push({
        icon: '🏥',
        text: 'Seek medical attention if experiencing breathing difficulties',
        type: 'emergency'
      })
    }

    return actions.slice(0, 3) // Return top 3 actions
  }

  const actionRecommendations = getActionRecommendations()

  // Get action card styling based on type
  const getActionStyle = (type) => {
    switch (type) {
      case 'positive':
        return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }
      case 'caution':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }
      case 'info':
        return { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }
      case 'warning':
        return { bg: '#FFEDD5', border: '#F97316', text: '#9A3412' }
      case 'action':
        return { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' }
      case 'alert':
        return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }
      case 'emergency':
        return { bg: '#FEE2E2', border: '#991B1B', text: '#7F1D1D' }
      default:
        return { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151' }
    }
  }

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

  // Generate share text
  const getShareText = () => {
    const action = actionRecommendations[0]?.text || message
    const cityName = location?.split(',')[0] || 'my area'
    return `🌬️ Air Quality in ${cityName}: AQI ${aqi} (${category})\n\n💡 ${action}\n\nCheck your air quality at aqitoday.in`
  }

  // Generate share image using canvas
  const generateShareImage = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas size (Instagram story friendly)
    canvas.width = 600
    canvas.height = 400
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#1E293B')
    gradient.addColorStop(1, '#0F172A')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // AQI Circle
    const centerX = 100
    const centerY = 120
    const radius = 50
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = colors.bg
    ctx.fill()
    
    // AQI Number
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(aqi?.toString() || '--', centerX, centerY - 5)
    
    // AQI label
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.fillText('AQI', centerX, centerY + 25)
    
    // Category and Location
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.fillText(category || 'Unknown', 170, 100)
    
    ctx.fillStyle = '#94A3B8'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    const cityName = location?.split(',')[0] || 'Unknown'
    ctx.fillText(`📍 ${cityName}`, 170, 135)
    
    // Timestamp
    const now = new Date()
    const timeStr = now.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
    ctx.fillText(`🕐 ${timeStr}`, 170, 160)
    
    // Action tip box (use simple rect for broader compatibility)
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(30, 200, canvas.width - 60, 100)
    
    // Action tip
    const action = actionRecommendations[0]
    if (action) {
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
      ctx.fillText('💡 DO THIS NOW', 50, 230)
      
      ctx.font = '15px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#E2E8F0'
      
      // Word wrap the action text
      const maxWidth = canvas.width - 100
      const words = action.text.split(' ')
      let line = ''
      let y = 260
      
      for (let word of words) {
        const testLine = line + word + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), 50, y)
          line = word + ' '
          y += 22
        } else {
          line = testLine
        }
      }
      ctx.fillText(line.trim(), 50, y)
    }
    
    // Footer
    ctx.fillStyle = '#64748B'
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('aqitoday.in', canvas.width / 2, canvas.height - 30)
    
    return canvas.toDataURL('image/png')
  }

  // Share handlers
  const handleShare = async (platform) => {
    const shareText = getShareText()
    const shareUrl = 'https://aqitoday.in'
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(shareText)
        alert('Copied to clipboard!')
        break
      case 'image':
        try {
          const imageUrl = await generateShareImage()
          const link = document.createElement('a')
          link.download = `aqi-${location?.split(',')[0] || 'today'}.png`
          link.href = imageUrl
          link.click()
        } catch (err) {
          console.error('Error generating image:', err)
          alert('Unable to generate image')
        }
        break
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Air Quality: AQI ${aqi}`,
              text: shareText,
              url: shareUrl
            })
          } catch (err) {
            console.log('Share cancelled')
          }
        }
        break
    }
    setShowShareMenu(false)
  }

  // Subscribe handler
  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubscribeStatus('loading')
    
    // Store in localStorage for now (in production, send to backend)
    const subscriptions = JSON.parse(localStorage.getItem('aqiSubscriptions') || '[]')
    const newSub = {
      method: subscribeMethod,
      value: subscribeMethod === 'email' ? subscribeEmail : subscribePhone,
      location: location,
      coordinates: data.user_coordinates || data.coordinates,
      createdAt: new Date().toISOString()
    }
    subscriptions.push(newSub)
    localStorage.setItem('aqiSubscriptions', JSON.stringify(subscriptions))
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubscribeStatus('success')
    setTimeout(() => {
      setShowSubscribeModal(false)
      setSubscribeStatus(null)
      setSubscribeEmail('')
      setSubscribePhone('')
    }, 2000)
  }

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
            
            {/* Distance & Freshness Badge */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {(distance_km !== null || freshnessMins !== null) && (
                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  {distance_km !== null && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {distance_km < 1 ? `${(distance_km * 1000).toFixed(0)} m away` : `${distance_km.toFixed(1)} km away`}
                    </span>
                  )}
                  {distance_km !== null && freshnessMins !== null && <span>•</span>}
                  {freshnessMins !== null && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {freshnessMins < 60 ? `${freshnessMins} min old` : `${Math.floor(freshnessMins / 60)}h ${freshnessMins % 60}m old`}
                    </span>
                  )}
                </div>
              )}
              
              {/* Confidence Badge */}
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                style={{ backgroundColor: confidence.bgColor, color: confidence.color }}
              >
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  {confidence.level === 'High' && (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  )}
                  {confidence.level === 'Medium' && (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                  {confidence.level === 'Low' && (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                {confidence.level} confidence
              </span>
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

        {/* DO THIS NOW - Action Cards */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-base">⚡</span> Do This Now
          </p>
          <div className="space-y-2">
            {actionRecommendations.map((action, index) => {
              const style = getActionStyle(action.type)
              return (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl border-l-4"
                  style={{ 
                    backgroundColor: style.bg,
                    borderColor: style.border
                  }}
                >
                  <span className="text-lg flex-shrink-0">{action.icon}</span>
                  <p className="text-sm leading-relaxed" style={{ color: style.text }}>
                    {action.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Health Advice (from API) */}
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

        {/* Share & Subscribe Actions */}
        <div className="flex gap-2 pt-2">
          {/* Share Button */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            
            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">💬</span>
                  <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                </button>
                <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🐦</span>
                  <span className="text-sm font-medium text-gray-700">Twitter / X</span>
                </button>
                <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">📘</span>
                  <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>
                <button onClick={() => handleShare('image')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">🖼️</span>
                  <span className="text-sm font-medium text-gray-700">Download Image</span>
                </button>
                <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xl">📋</span>
                  <span className="text-sm font-medium text-gray-700">Copy Text</span>
                </button>
                {navigator.share && (
                  <button onClick={() => handleShare('native')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100">
                    <span className="text-xl">📤</span>
                    <span className="text-sm font-medium text-gray-700">More options...</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Subscribe Button */}
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Daily Alert
          </button>
        </div>
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

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🔔 Daily AQI Alert</h3>
              <button 
                onClick={() => setShowSubscribeModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Get a daily 8 AM air quality update for <span className="font-semibold">{location?.split(',')[0] || 'your location'}</span> 
            </p>
            
            {subscribeStatus === 'success' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900">You're all set!</p>
                <p className="text-sm text-gray-500 mt-1">You'll receive your first alert tomorrow at 8 AM</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe}>
                {/* Method Toggle */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setSubscribeMethod('email')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      subscribeMethod === 'email' 
                        ? 'bg-white text-gray-900 shadow' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubscribeMethod('whatsapp')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      subscribeMethod === 'whatsapp' 
                        ? 'bg-white text-gray-900 shadow' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                </div>
                
                {subscribeMethod === 'email' ? (
                  <input
                    type="email"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-100 rounded-xl text-gray-500">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={subscribePhone}
                      onChange={(e) => setSubscribePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="WhatsApp number"
                      required
                      pattern="[0-9]{10}"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {subscribeStatus === 'loading' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Subscribe for Free
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-gray-400 text-center mt-3">
                  You can unsubscribe anytime. We respect your privacy.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}

export default AQIResult
