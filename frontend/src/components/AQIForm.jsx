import { useState, useEffect, useRef } from 'react'

// API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

function AQIForm({ onSubmit, loading }) {
  // State for location input
  const [locationInput, setLocationInput] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [error, setError] = useState(null)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [placesReady, setPlacesReady] = useState(false)
  
  // Refs
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Load Google Maps Places library (New API)
  useEffect(() => {
    // DIAGNOSTIC: Log API key status
    console.log('🔍 DIAGNOSTIC - Google Maps API Key Check:')
    console.log('  - Key exists:', !!GOOGLE_MAPS_API_KEY)
    console.log('  - Key length:', GOOGLE_MAPS_API_KEY?.length || 0)
    console.log('  - Key preview:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'NOT SET')
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ Google Maps API key not configured. Autocomplete will be disabled.')
      console.warn('   Check your .env file has: VITE_GOOGLE_MAPS_API_KEY=your_key_here')
      return
    }

    // Check if script already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setPlacesReady(true)
      console.log('✅ Google Maps Places API ready (already loaded)')
      return
    }

    // Load script with the new Places API
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    console.log('📡 Loading Google Maps script:', scriptUrl.replace(GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'))
    
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setPlacesReady(true)
        console.log('✅ Google Maps Places API loaded successfully')
      } else {
        console.error('❌ Google Maps loaded but Places API not available')
      }
    }
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API:', error)
      console.error('   This could mean:')
      console.error('   1. API key is invalid or expired')
      console.error('   2. API key has domain restrictions')
      console.error('   3. Places API (New) is not enabled')
      console.error('   4. Network connectivity issue')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Close predictions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowPredictions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch predictions when input changes (using new Places API)
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!locationInput || locationInput.length < 2) {
      setPredictions([])
      setIsLoadingPredictions(false)
      return
    }
    
    if (!placesReady || !window.google?.maps?.places) {
      console.warn('Places API not ready yet')
      setIsLoadingPredictions(false)
      return
    }

    setIsLoadingPredictions(true)

    // Debounce the API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log('🔍 Fetching autocomplete for:', locationInput)
        
        // Use the new AutocompleteSuggestion API
        // No type restriction - allows any location: cities, landmarks, addresses, parks, etc.
        const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: locationInput,
          // Removed includedPrimaryTypes to allow ALL location types:
          // - Cities, towns, villages
          // - Landmarks (Taj Mahal, India Gate, etc.)
          // - Addresses (123 Main St)
          // - Parks, monuments, buildings
          // - Businesses, schools, hospitals
          // - ANY geocodable location
        })

        console.log('✅ Received', suggestions?.length || 0, 'suggestions')

        if (suggestions && suggestions.length > 0) {
          const formattedPredictions = suggestions.slice(0, 5).map(suggestion => ({
            placeId: suggestion.placePrediction.placeId,
            mainText: suggestion.placePrediction.mainText?.text || '',
            secondaryText: suggestion.placePrediction.secondaryText?.text || '',
            description: suggestion.placePrediction.text?.text || '',
          }))
          setPredictions(formattedPredictions)
          setShowPredictions(true)
        } else {
          setPredictions([])
        }
        setIsLoadingPredictions(false)
      } catch (err) {
        console.error('❌ Places API error:', err)
        console.error('   Error details:', err.message || err)
        if (err.message?.includes('ApiNotActivatedMapError')) {
          console.error('   → Places API (New) is not enabled for this API key')
        } else if (err.message?.includes('RefererNotAllowedMapError')) {
          console.error('   → API key has domain restrictions. Add http://localhost:3000 to allowed referrers')
        } else if (err.message?.includes('InvalidKeyMapError')) {
          console.error('   → API key is invalid or expired')
        }
        setPredictions([])
        setIsLoadingPredictions(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [locationInput, placesReady])

  // Handle prediction selection (using new Places API)
  const handleSelectPrediction = async (prediction) => {
    setLocationInput(prediction.description)
    setShowPredictions(false)
    setPredictions([])

    try {
      const place = new window.google.maps.places.Place({
        id: prediction.placeId,
      })
      
      await place.fetchFields({ fields: ['location', 'displayName'] })
      
      if (place.location) {
        setSelectedLocation({
          name: prediction.description,
          latitude: place.location.lat(),
          longitude: place.location.lng()
        })
        setError(null)
      } else {
        setError('Could not get coordinates for this location')
      }
    } catch (err) {
      console.error('Error fetching place details:', err)
      setError('Could not get coordinates for this location')
    }
  }

  // Handle getting current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setSelectedLocation({
          name: 'Current Location',
          latitude,
          longitude
        })
        setLocationInput(`📍 Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        setGettingLocation(false)
        setUseCurrentLocation(true)
      },
      (error) => {
        setGettingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.')
            break
          case error.TIMEOUT:
            setError('Location request timed out.')
            break
          default:
            setError('An error occurred while getting your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedLocation) {
      setError('Please select a location from the suggestions or use current location')
      return
    }

    onSubmit({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      locationName: selectedLocation.name
    })
  }

  const handleInputChange = (e) => {
    setLocationInput(e.target.value)
    setSelectedLocation(null)
    setUseCurrentLocation(false)
  }

  const handleInputFocus = () => {
    // Clear input on focus for better UX
    setLocationInput('')
    setSelectedLocation(null)
    setUseCurrentLocation(false)
    if (predictions.length > 0) {
      setShowPredictions(true)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-7 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Check Air Quality</h2>
          <p className="text-sm text-gray-400">Search any location worldwide</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <span className="text-red-500 text-xs">!</span>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Location Input with Autocomplete */}
        <div ref={wrapperRef} className="relative">
          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              id="location"
              value={locationInput}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Type a city, address, or place..."
              className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-400"
              disabled={loading || gettingLocation}
              autoComplete="off"
            />
            {isLoadingPredictions && (
              <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          
          {/* Predictions dropdown */}
          {showPredictions && predictions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-64 overflow-auto">
              {predictions.map((prediction) => (
                <li
                  key={prediction.placeId}
                  onClick={() => handleSelectPrediction(prediction)}
                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="text-gray-900 font-medium truncate">
                        {prediction.mainText}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        {prediction.secondaryText}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* No Google API key message - only show as subtle hint */}
          {!GOOGLE_MAPS_API_KEY && locationInput.length >= 2 && (
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Place search unavailable. Use "Current Location" below.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={loading || gettingLocation}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all disabled:opacity-50 group"
        >
          {gettingLocation ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="font-medium">Getting location...</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="font-medium">Use My Current Location</span>
            </>
          )}
        </button>

        {/* Selected Location Indicator */}
        {selectedLocation && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm">Location Ready</span>
            </div>
            <p className="text-sm text-emerald-600 truncate" title={selectedLocation.name}>
              {selectedLocation.name}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">
              {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}°
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedLocation}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Fetching Air Quality...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Get Air Quality Index
            </span>
          )}
        </button>
      </form>

      {/* Info text */}
      <p className="mt-5 text-xs text-gray-400 text-center">
        Data updates hourly from monitoring stations worldwide
      </p>
    </div>
  )
}

export default AQIForm
