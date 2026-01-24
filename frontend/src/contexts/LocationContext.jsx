import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LocationContext = createContext(null)

// API URL from environment variable, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function LocationProvider({ children }) {
  // Location state
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [locationError, setLocationError] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationPermission, setLocationPermission] = useState('prompt') // 'prompt', 'granted', 'denied'
  
  // AQI data state
  const [aqiData, setAqiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch AQI data for a location
  const fetchAQI = useCallback(async (latitude, longitude) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/aqi/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to fetch AQI data')
      }

      const data = await response.json()
      
      // Mark that we have location data for this session
      sessionStorage.setItem('hasLocationData', 'true')
      
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
        attributions: data.attributions,
        aqi_standard: data.aqi_standard,
        pollutant_breakdown: data.pollutant_breakdown
      })
    } catch (err) {
      setError(err.message || 'An error occurred while fetching AQI data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle getting current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = {
          name: 'Current Location',
          latitude,
          longitude
        }
        setSelectedLocation(newLocation)
        setLocationInput(`📍 Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        setGettingLocation(false)
        setLocationPermission('granted')
        
        // Automatically fetch AQI data
        fetchAQI(latitude, longitude)
      },
      (error) => {
        setGettingLocation(false)
        setLocationPermission('denied')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enter your location manually.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('An error occurred while getting your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [fetchAQI])

  // Auto-request location on first load
  useEffect(() => {
    // Check if we've already successfully got location data in this session
    const hasLocationData = sessionStorage.getItem('hasLocationData')
    
    if (hasLocationData) {
      // We already have data, don't re-request
      return
    }

    // Check browser's permission state if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // Permission already granted, get location
          getCurrentLocation()
        } else if (result.state === 'prompt') {
          // Will prompt user - try to get location
          getCurrentLocation()
        } else {
          // Permission denied - update state so UI shows search message
          setLocationPermission('denied')
        }
      }).catch(() => {
        // Permissions API not supported, try anyway
        getCurrentLocation()
      })
    } else if (navigator.geolocation) {
      // Fallback: just try to get location
      getCurrentLocation()
    }
  }, []) // Empty dependency - run only once on mount

  // Update location from a selected place
  const updateLocation = useCallback((location) => {
    setSelectedLocation(location)
    setLocationError(null)
    if (location) {
      fetchAQI(location.latitude, location.longitude)
    }
  }, [fetchAQI])

  const value = {
    // Location state
    selectedLocation,
    setSelectedLocation: updateLocation,
    locationInput,
    setLocationInput,
    locationError,
    setLocationError,
    gettingLocation,
    locationPermission,
    getCurrentLocation,
    
    // AQI data state
    aqiData,
    loading,
    error,
    fetchAQI
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
