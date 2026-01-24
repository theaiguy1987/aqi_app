import { Link, useLocation as useRouterLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useLocation } from '../contexts/LocationContext'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Debug: log if API key is available
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not configured - location search will not work')
}

export default function Navigation() {
  const routerLocation = useRouterLocation()
  const { 
    selectedLocation, 
    setSelectedLocation, 
    locationInput, 
    setLocationInput,
    locationError,
    gettingLocation,
    getCurrentLocation,
    loading 
  } = useLocation()
  
  // Local state for autocomplete
  const [predictions, setPredictions] = useState([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false)
  const [placesReady, setPlacesReady] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)
  const debounceTimerRef = useRef(null)
  
  const isActive = (path) => routerLocation.pathname === path

  // Load Google Maps Places library
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      return
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setPlacesReady(true)
      return
    }

    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps?.places) {
          setPlacesReady(true)
        }
      })
      return
    }
    
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => {
      if (window.google?.maps?.places) {
        setPlacesReady(true)
      }
    }
    document.head.appendChild(script)
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

  // Fetch predictions when input changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!locationInput || locationInput.length < 2 || locationInput.startsWith('📍')) {
      setPredictions([])
      setIsLoadingPredictions(false)
      return
    }
    
    if (!placesReady || !window.google?.maps?.places) {
      setIsLoadingPredictions(false)
      return
    }

    setIsLoadingPredictions(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Try new API first, fall back to old AutocompleteService
        let formattedPredictions = []
        
        if (window.google.maps.places.AutocompleteSuggestion) {
          // New Places API
          const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: locationInput,
          })
          if (suggestions && suggestions.length > 0) {
            formattedPredictions = suggestions.slice(0, 5).map(suggestion => ({
              placeId: suggestion.placePrediction.placeId,
              mainText: suggestion.placePrediction.mainText?.text || '',
              secondaryText: suggestion.placePrediction.secondaryText?.text || '',
              description: suggestion.placePrediction.text?.text || '',
            }))
          }
        } else if (window.google.maps.places.AutocompleteService) {
          // Fallback to old API
          const service = new window.google.maps.places.AutocompleteService()
          const results = await new Promise((resolve, reject) => {
            service.getPlacePredictions(
              { input: locationInput, types: ['(cities)'] },
              (predictions, status) => {
                if (status === 'OK' && predictions) {
                  resolve(predictions)
                } else {
                  resolve([])
                }
              }
            )
          })
          formattedPredictions = results.slice(0, 5).map(p => ({
            placeId: p.place_id,
            mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
            secondaryText: p.structured_formatting?.secondary_text || '',
            description: p.description,
          }))
        }
        
        if (formattedPredictions.length > 0) {
          setPredictions(formattedPredictions)
          setShowPredictions(true)
        } else {
          setPredictions([])
        }
        setIsLoadingPredictions(false)
      } catch (err) {
        console.error('Places API error:', err)
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

  // Handle prediction selection
  const handleSelectPrediction = async (prediction) => {
    setLocationInput(prediction.description)
    setShowPredictions(false)
    setPredictions([])
    setIsMobileSearchOpen(false)

    try {
      // Try new Place class first, fall back to PlacesService
      if (window.google.maps.places.Place) {
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
        }
      } else if (window.google.maps.places.PlacesService) {
        // Fallback to old PlacesService
        const service = new window.google.maps.places.PlacesService(document.createElement('div'))
        service.getDetails(
          { placeId: prediction.placeId, fields: ['geometry', 'name'] },
          (place, status) => {
            if (status === 'OK' && place?.geometry?.location) {
              setSelectedLocation({
                name: prediction.description,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              })
            }
          }
        )
      }
    } catch (err) {
      console.error('Error fetching place details:', err)
    }
  }

  const handleInputChange = (e) => {
    setLocationInput(e.target.value)
  }

  const handleLocationButtonClick = () => {
    getCurrentLocation()
    setIsMobileSearchOpen(false)
  }

  return (
    <nav className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50 group-hover:shadow-indigo-300/50 transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                AirQuality
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  isActive('/') 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                Calculator
              </Link>
              <Link 
                to="/blog" 
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  isActive('/blog') 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                Blog
              </Link>
            </div>
          </div>

          {/* Location Search Bar - Desktop */}
          <div ref={wrapperRef} className="hidden md:block flex-1 max-w-md mx-4 relative">
            <div className="w-full relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={locationInput}
                onChange={handleInputChange}
                onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                placeholder="Search location..."
                className="w-full pl-9 pr-24 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-400"
                disabled={loading || gettingLocation}
              />
              
              {/* Current Location Button inside input */}
              <button
                type="button"
                onClick={handleLocationButtonClick}
                disabled={loading || gettingLocation}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2 px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                title="Use my location"
              >
                {gettingLocation ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span className="hidden lg:inline">My Location</span>
              </button>
              
              {isLoadingPredictions && (
                <div className="absolute right-24 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-12 shadow-xl max-h-64 overflow-auto">
                {predictions.map((prediction) => (
                  <li
                    key={prediction.placeId}
                    onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(prediction); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleSelectPrediction(prediction); }}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors select-none"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <div className="text-gray-900 font-medium text-sm truncate">
                          {prediction.mainText}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {prediction.secondaryText}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mobile Search Button & Menu */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link 
              to={routerLocation.pathname === '/' ? '/blog' : '/'} 
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              {routerLocation.pathname === '/' ? 'Blog' : 'Calculator'}
            </Link>
          </div>

          {/* Selected Location Indicator - Desktop */}
          {selectedLocation && !loading && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700 max-w-[150px] truncate">
                {selectedLocation.name}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Search Dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={locationInput}
                onChange={handleInputChange}
                onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                placeholder="Search location..."
                className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                autoFocus
              />
              
              {/* Predictions for mobile */}
              {showPredictions && predictions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-48 overflow-auto">
                  {predictions.map((prediction) => (
                    <li
                      key={prediction.placeId}
                      onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(prediction); }}
                      onTouchEnd={(e) => { e.preventDefault(); handleSelectPrediction(prediction); }}
                      className="px-4 py-3 hover:bg-indigo-50 active:bg-indigo-100 cursor-pointer border-b border-gray-100 last:border-b-0 select-none"
                    >
                      <div className="text-gray-900 font-medium text-sm truncate">{prediction.mainText}</div>
                      <div className="text-gray-400 text-xs truncate">{prediction.secondaryText}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleLocationButtonClick}
              disabled={loading || gettingLocation}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            >
              {gettingLocation ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                  Getting location...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Use My Current Location
                </>
              )}
            </button>
            
            {locationError && (
              <p className="mt-2 text-xs text-red-500 text-center">{locationError}</p>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
