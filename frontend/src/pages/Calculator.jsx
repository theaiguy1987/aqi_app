import { useLocation } from '../contexts/LocationContext'
import AQIResult from '../components/AQIResult'

export default function Calculator() {
  const { aqiData, loading, error, locationPermission, locationError } = useLocation()

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Hero section when no data */}
        {!aqiData && !loading && !error && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9c-1-1-2.5-1-3.5 0M5 13c-1-1-2.5-1-3.5 0" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Check Air Quality
            </h1>
            <p className="text-gray-500 mb-6">
              Real-time air quality data with health recommendations
            </p>
            
            {locationPermission === 'denied' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Location denied. Use search above.</span>
              </div>
            )}
            
            {locationError && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{locationError}</span>
              </div>
            )}

            {!locationError && locationPermission !== 'denied' && (
              <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                <div className="animate-pulse w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span>Waiting for location...</span>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="max-w-sm mx-auto py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
              <div className="relative inline-block mb-4">
                <div className="w-12 h-12 border-3 border-indigo-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-3 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <p className="text-gray-600 font-medium">Fetching air quality data...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="max-w-sm mx-auto py-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Unable to fetch data</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {aqiData && !loading && (
          <div className="max-w-lg mx-auto">
            <AQIResult data={aqiData} />
          </div>
        )}
      </div>
    </div>
  )
}
