import { useState, useRef } from 'react'

// Common country codes for international phone support
const COUNTRY_CODES = [
  { code: '+1', country: '🇺🇸 US/CA', maxLength: 10 },
  { code: '+44', country: '🇬🇧 UK', maxLength: 10 },
  { code: '+91', country: '🇮🇳 India', maxLength: 10 },
  { code: '+61', country: '🇦🇺 AU', maxLength: 9 },
  { code: '+49', country: '🇩🇪 DE', maxLength: 11 },
  { code: '+33', country: '🇫🇷 FR', maxLength: 9 },
  { code: '+81', country: '🇯🇵 JP', maxLength: 10 },
  { code: '+86', country: '🇨🇳 CN', maxLength: 11 },
  { code: '+971', country: '🇦🇪 UAE', maxLength: 9 },
  { code: '+65', country: '🇸🇬 SG', maxLength: 8 },
  { code: '+60', country: '🇲🇾 MY', maxLength: 10 },
  { code: '+966', country: '🇸🇦 SA', maxLength: 9 },
]

function AQIResult({ data }) {
  const [isPollutantsExpanded, setIsPollutantsExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState(null)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribePhone, setSubscribePhone] = useState('')
  const [subscribeCountryCode, setSubscribeCountryCode] = useState('+91')
  const [subscribeMethod, setSubscribeMethod] = useState('email')
  const [subscribeStatus, setSubscribeStatus] = useState(null)
  const shareCardRef = useRef(null)
  
  const { 
    aqi, 
    category, 
    location,  // This is actually the station name from backend
    dominant_pollutant, 
    message, 
    measurement_time, 
    forecast, 
    pollutant_breakdown,
    distance_km,
    user_coordinates,
    coordinates
  } = data

  // Get user-friendly location name (we'll use reverse geocoding result if available, or fallback)
  const userLocationName = data.user_location_name || null
  const stationName = location  // The station name from API

  // Calculate cigarette equivalent
  const getCigaretteEquivalent = (aqiValue) => {
    if (!aqiValue || aqiValue <= 0) return 0
    let pm25
    if (aqiValue <= 50) pm25 = (aqiValue / 50) * 12
    else if (aqiValue <= 100) pm25 = 12 + ((aqiValue - 50) / 50) * 23.4
    else if (aqiValue <= 150) pm25 = 35.4 + ((aqiValue - 100) / 50) * 20
    else if (aqiValue <= 200) pm25 = 55.4 + ((aqiValue - 150) / 50) * 70
    else pm25 = 125.4 + ((aqiValue - 200) / 100) * 100
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

  // Calculate data freshness
  const getDataFreshness = () => {
    if (!measurement_time) return null
    try {
      const measureDate = new Date(measurement_time)
      const now = new Date()
      const diffMs = now - measureDate
      return Math.floor(diffMs / 60000)
    } catch (e) {
      return null
    }
  }

  const freshnessMins = getDataFreshness()

  // Confidence level
  const getConfidenceLevel = () => {
    const dist = distance_km ?? null
    const fresh = freshnessMins ?? null
    const distanceOk = dist !== null && dist <= 5
    const distanceMedium = dist !== null && dist <= 15
    const freshOk = fresh !== null && fresh >= 0 && fresh < 60
    const freshMedium = fresh !== null && fresh >= 0 && fresh < 120

    if (distanceOk && freshOk) return { level: 'High', color: '#10B981', bgColor: '#D1FAE5' }
    if ((distanceOk || distanceMedium) && (freshOk || freshMedium)) return { level: 'Medium', color: '#F59E0B', bgColor: '#FEF3C7' }
    return { level: 'Low', color: '#EF4444', bgColor: '#FEE2E2' }
  }

  const confidence = getConfidenceLevel()

  // Compact action recommendations - short text with icons
  const getQuickActions = () => {
    if (aqi === null || aqi === undefined) {
      return [{ icon: '❓', label: 'No data', desc: 'Try again' }]
    }
    
    if (aqi <= 50) {
      return [
        { icon: '🏃', label: 'Exercise', desc: 'Go outside!' },
        { icon: '🪟', label: 'Ventilate', desc: 'Open windows' },
        { icon: '🌳', label: 'Enjoy', desc: 'Great air day' }
      ]
    }
    if (aqi <= 100) {
      return [
        { icon: '👀', label: 'Monitor', desc: 'Watch symptoms' },
        { icon: '🏠', label: 'Normal', desc: 'Continue activities' },
        { icon: '⚠️', label: 'Sensitive', desc: 'Limit if unwell' }
      ]
    }
    if (aqi <= 150) {
      return [
        { icon: '😷', label: 'Mask', desc: 'N95 for sensitive' },
        { icon: '🪟', label: 'Close', desc: 'Keep windows shut' },
        { icon: '🏠', label: 'Limit', desc: 'Reduce outdoor time' }
      ]
    }
    if (aqi <= 200) {
      return [
        { icon: '😷', label: 'Mask', desc: 'N95 required' },
        { icon: '🏠', label: 'Stay in', desc: 'Avoid outdoors' },
        { icon: '💨', label: 'Purifier', desc: 'Run on high' }
      ]
    }
    if (aqi <= 300) {
      return [
        { icon: '⛔', label: 'Stay in', desc: 'Avoid all outdoor' },
        { icon: '😷', label: 'N95', desc: 'Essential outside' },
        { icon: '🚗', label: 'Car', desc: 'Recirculate air' }
      ]
    }
    return [
      { icon: '🚨', label: 'Emergency', desc: 'Stay indoors' },
      { icon: '😷', label: 'N95', desc: 'Even indoors' },
      { icon: '🏥', label: 'Medical', desc: 'Seek help if needed' }
    ]
  }

  const quickActions = getQuickActions()

  // Future forecast
  const getFutureForecast = () => {
    const forecastData = forecast?.pm25 || forecast?.pm10
    if (!forecastData) return []
    const today = new Date().toISOString().split('T')[0]
    return forecastData.filter(day => day.day > today).slice(0, 2)
  }

  const futureForecast = getFutureForecast()

  // Share text
  const getShareText = () => {
    const action = quickActions[0]
    const cityName = location?.split(',')[0] || 'my area'
    return `🌬️ Air Quality in ${cityName}: AQI ${aqi} (${category})\n\n${action.icon} ${action.label}: ${action.desc}\n\nCheck yours at aqitoday.in`
  }

  // Generate share image
  const generateShareImage = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 600
    canvas.height = 400
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#1E293B')
    gradient.addColorStop(1, '#0F172A')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // AQI Circle
    ctx.beginPath()
    ctx.arc(100, 120, 50, 0, 2 * Math.PI)
    ctx.fillStyle = colors.bg
    ctx.fill()
    
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(aqi?.toString() || '--', 100, 115)
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.fillText('AQI', 100, 145)
    
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.fillText(category || 'Unknown', 170, 100)
    
    ctx.fillStyle = '#94A3B8'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText(`📍 ${location?.split(',')[0] || 'Unknown'}`, 170, 135)
    
    const now = new Date()
    ctx.fillText(`🕐 ${now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`, 170, 160)
    
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(30, 200, canvas.width - 60, 100)
    
    const action = quickActions[0]
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${action.icon} ${action.label.toUpperCase()}`, 50, 240)
    ctx.font = '18px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(action.desc, 50, 275)
    
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
          alert('Unable to generate image')
        }
        break
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({ title: `Air Quality: AQI ${aqi}`, text: shareText, url: shareUrl })
          } catch (err) { /* cancelled */ }
        }
        break
    }
    setShowShareMenu(false)
  }

  // Subscribe handler
  const handleSubscribe = async (e) => {
    e.preventDefault()
    setSubscribeStatus('loading')
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const coords = data.user_coordinates || data.coordinates || {}
      
      // For WhatsApp, combine country code with phone number
      const contactValue = subscribeMethod === 'email' 
        ? subscribeEmail 
        : `${subscribeCountryCode}${subscribePhone}`
      
      const response = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: subscribeMethod === 'whatsapp' ? 'phone' : subscribeMethod,
          contact: contactValue,
          location: location || 'Unknown',
          latitude: coords.latitude || null,
          longitude: coords.longitude || null
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setSubscribeStatus('success')
        setTimeout(() => {
          setShowSubscribeModal(false)
          setSubscribeStatus(null)
          setSubscribeEmail('')
          setSubscribePhone('')
        }, 2000)
      } else {
        setSubscribeStatus('error')
        console.error('Subscription failed:', result)
        setTimeout(() => setSubscribeStatus(null), 3000)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      setSubscribeStatus('error')
      setTimeout(() => setSubscribeStatus(null), 3000)
    }
  }

  // Feedback handler
  const handleFeedback = async (e) => {
    e.preventDefault()
    if (feedbackRating === 0) return
    
    setFeedbackStatus('loading')
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const coords = data.user_coordinates || data.coordinates || {}
      
      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          feedback: feedbackText,
          location: location || 'Unknown',
          latitude: coords.latitude || null,
          longitude: coords.longitude || null
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setFeedbackStatus('success')
        setTimeout(() => {
          setShowFeedbackModal(false)
          setFeedbackStatus(null)
          setFeedbackRating(0)
          setFeedbackText('')
        }, 2000)
      } else {
        setFeedbackStatus('error')
        console.error('Feedback failed:', result)
        setTimeout(() => setFeedbackStatus(null), 3000)
      }
    } catch (error) {
      console.error('Feedback error:', error)
      setFeedbackStatus('error')
      setTimeout(() => setFeedbackStatus(null), 3000)
    }
  }

  // CSS animations
  const animations = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.6; }
      50% { transform: translateY(-10px) translateX(5px); opacity: 0.8; }
    }
    @keyframes smoke {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
    }
    @keyframes pulse-glow-amber {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
    }
    @keyframes bell-ring {
      0%, 100% { transform: rotate(0deg); }
      10%, 30%, 50% { transform: rotate(8deg); }
      20%, 40% { transform: rotate(-8deg); }
      60% { transform: rotate(0deg); }
    }
    @keyframes star-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
  `

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <style>{animations}</style>
      
      {/* Header with AQI */}
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
              <span className="font-bold text-gray-900 text-lg">{category}</span>
            </div>
            
            {/* User Location - resolved text */}
            {userLocationName && (
              <p className="text-gray-800 text-sm font-semibold truncate">📍 Your location → {userLocationName}</p>
            )}
            
            {/* Station info - show as "Data from nearest station" */}
            {stationName && (
              <p className="text-gray-500 text-xs truncate mb-1">
                <span className="text-gray-400">Data from nearest station:</span> {stationName}
              </p>
            )}
            
            {/* Distance & Freshness */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {distance_km !== null && (
                <span>{distance_km < 1 ? `${(distance_km * 1000).toFixed(0)}m` : `${distance_km.toFixed(1)}km`} away</span>
              )}
              {distance_km !== null && freshnessMins !== null && <span>•</span>}
              {freshnessMins !== null && (
                <span>{freshnessMins < 60 ? `${freshnessMins}m` : `${Math.floor(freshnessMins / 60)}h`} old</span>
              )}
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: confidence.bgColor, color: confidence.color }}
              >
                {confidence.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Moved Up */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
        <div className="flex gap-2">
          {/* Rate App Button - Prominent & Flashing */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-all text-sm"
            style={{ animation: 'pulse-glow-amber 2s ease-in-out infinite' }}
          >
            <span style={{ animation: 'star-pulse 1.5s ease-in-out infinite', display: 'inline-block' }}>⭐</span>
            Rate
          </button>
          
          {/* Share Button */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm">
                  <span>💬</span><span className="text-gray-700">WhatsApp</span>
                </button>
                <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm">
                  <span>🐦</span><span className="text-gray-700">Twitter / X</span>
                </button>
                <button onClick={() => handleShare('image')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm">
                  <span>🖼️</span><span className="text-gray-700">Download Image</span>
                </button>
                <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm border-t border-gray-100">
                  <span>📋</span><span className="text-gray-700">Copy</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Daily Alert Button - Flashing */}
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all text-sm"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          >
            <span style={{ animation: 'bell-ring 2s ease-in-out infinite', display: 'inline-block' }}>🔔</span>
            Daily Alert
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-5 space-y-4">
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="text-2xl">🚬</span>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Daily Equal</p>
              <p className="font-bold text-gray-900 text-sm">
                {cigarettes > 0 ? `${cigarettes.toFixed(1)} cigs` : '< 0.1'}
              </p>
            </div>
          </div>
          
          {dominant_pollutant && dominant_pollutant !== 'Unknown' && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="relative w-7 h-7">
                <span className="absolute inset-0 text-2xl" style={{ animation: 'float 3s ease-in-out infinite' }}>💨</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Pollutant</p>
                <p className="font-bold text-gray-900 text-sm">{dominant_pollutant}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Clean Grid */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>⚡</span> Do This Now
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => (
              <div 
                key={index}
                className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <span className="text-2xl mb-1">{action.icon}</span>
                <p className="font-semibold text-gray-900 text-xs">{action.label}</p>
                <p className="text-[10px] text-gray-500 text-center">{action.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Health Summary - Collapsible */}
        <details className="group">
          <summary className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-transparent cursor-pointer list-none">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <span>💡</span> Health Details
            </span>
            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-2 p-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl">
            {message}
          </div>
        </details>

        {/* 2-Day Forecast */}
        {futureForecast.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📅 Next Days</p>
            <div className="grid grid-cols-2 gap-2">
              {futureForecast.map((day, index) => {
                const dayColors = getAQIColor(day.avg)
                const dayName = new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: dayColors.light }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: dayColors.bg }}>
                      {day.avg}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{dayName}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pollutant Breakdown */}
        {pollutant_breakdown && Object.keys(pollutant_breakdown).length > 0 && (
          <details className="group">
            <summary className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer list-none hover:bg-gray-100 transition-colors">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">🔍 Pollutants</span>
              <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(pollutant_breakdown).map(([pollutant, value], index) => {
                const pColors = getAQIColor(value)
                return (
                  <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: pColors.light }}>
                    <span className="text-gray-700">{pollutant}</span>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: pColors.bg }}>
                      {Math.round(value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </div>

      {/* AQI Scale */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="flex rounded-lg overflow-hidden h-1.5">
          <div className="flex-1 bg-emerald-500"></div>
          <div className="flex-1 bg-amber-500"></div>
          <div className="flex-1 bg-orange-500"></div>
          <div className="flex-1 bg-red-500"></div>
          <div className="flex-1 bg-purple-600"></div>
          <div className="flex-1 bg-rose-900"></div>
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>Good</span>
          <span>Moderate</span>
          <span>Unhealthy</span>
          <span>Hazardous</span>
        </div>
      </div>

      {/* Attribution & Feedback */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[9px] text-gray-400">
          Data: <a href="https://waqi.info/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">WAQI</a>
        </p>
        <button 
          onClick={() => setShowFeedbackModal(true)}
          className="text-[10px] text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
        >
          <span>💬</span> Send feedback
        </button>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                ⭐ Rate Your Experience
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {feedbackStatus === 'success' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🙏</span>
                </div>
                <p className="font-semibold text-gray-900">Thank you!</p>
                <p className="text-xs text-gray-500">Your feedback helps us improve</p>
              </div>
            ) : feedbackStatus === 'error' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">😕</span>
                </div>
                <p className="font-semibold text-gray-900">Oops!</p>
                <p className="text-xs text-gray-500">Something went wrong. Please try again.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedback}>
                <p className="text-gray-600 text-sm mb-4">
                  How was your experience with AQI Today?
                </p>
                
                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${
                        star <= feedbackRating ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                
                {/* Rating labels */}
                <div className="flex justify-between text-[10px] text-gray-400 mb-4 px-1">
                  <span>Poor</span>
                  <span>Amazing!</span>
                </div>
                
                {/* Feedback text */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us more (optional)..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                />
                
                <button 
                  type="submit" 
                  disabled={feedbackStatus === 'loading' || feedbackRating === 0}
                  className="w-full mt-3 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                >
                  {feedbackStatus === 'loading' ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Sending...</>
                  ) : 'Submit Feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSubscribeModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span style={{ animation: 'bell-ring 1s ease-in-out infinite' }}>🔔</span> Daily Alert
              </h3>
              <button onClick={() => setShowSubscribeModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Get 8 AM air quality updates for <span className="font-semibold">{location?.split(',')[0] || 'your area'}</span>
            </p>
            
            {subscribeStatus === 'success' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900">You're subscribed!</p>
                <p className="text-xs text-gray-500">First alert tomorrow 8 AM</p>
              </div>
            ) : subscribeStatus === 'error' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">😕</span>
                </div>
                <p className="font-semibold text-gray-900">Oops!</p>
                <p className="text-xs text-gray-500">Something went wrong. Please try again.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe}>
                <div className="flex rounded-lg bg-gray-100 p-1 mb-3">
                  <button type="button" onClick={() => setSubscribeMethod('email')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${subscribeMethod === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    📧 Email
                  </button>
                  <button type="button" onClick={() => setSubscribeMethod('whatsapp')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${subscribeMethod === 'whatsapp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    💬 WhatsApp
                  </button>
                </div>
                
                {subscribeMethod === 'email' ? (
                  <input type="email" value={subscribeEmail} onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="your@email.com" required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                ) : (
                  <div className="flex gap-2">
                    {/* International Country Code Selector */}
                    <select 
                      value={subscribeCountryCode}
                      onChange={(e) => setSubscribeCountryCode(e.target.value)}
                      className="px-2 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {COUNTRY_CODES.map(({ code, country }) => (
                        <option key={code} value={code}>{country} {code}</option>
                      ))}
                    </select>
                    <input 
                      type="tel" 
                      value={subscribePhone} 
                      onChange={(e) => {
                        const selectedCountry = COUNTRY_CODES.find(c => c.code === subscribeCountryCode)
                        const maxLen = selectedCountry?.maxLength || 15
                        setSubscribePhone(e.target.value.replace(/\D/g, '').slice(0, maxLen))
                      }}
                      placeholder="Phone number" 
                      required 
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                    />
                  </div>
                )}
                
                <button type="submit" disabled={subscribeStatus === 'loading'}
                  className="w-full mt-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                  {subscribeStatus === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Hang in there... saving your details</span>
                    </>
                  ) : 'Subscribe Free'}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">Unsubscribe anytime • Works worldwide 🌍</p>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Click outside to close share menu */}
      {showShareMenu && <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />}
    </div>
  )
}

export default AQIResult
