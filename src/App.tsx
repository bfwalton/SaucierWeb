import { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import type { Recipe } from './types/recipe'
import RecipeList from './RecipeList.js'

import { configureContainer, fetchRecords, isAuthenticated, authError, addAuthStateChangeListener, removeAuthStateChangeListener } from './cloudkit.ts'

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [cloudKitReady, setCloudKitReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(isAuthenticated)

  useEffect(() => {
    if (authenticated) {
      setLoading(true)
      fetchRecords()
        .then(records => {
          setRecipes(records)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error fetching recipes:', error)
          setLoading(false)
        })
    }
  }, [authenticated])

  // Listen for authentication state changes
  useEffect(() => {
    const handleAuthStateChange = (isAuth: boolean) => {
      console.info('🔄 Auth state changed:', isAuth)
      setAuthenticated(isAuth)
    }

    addAuthStateChangeListener(handleAuthStateChange)
    
    return () => {
      removeAuthStateChangeListener(handleAuthStateChange)
    }
  }, [])

  useEffect(() => {
    const initCloudKit = async () => {
      try {
        await configureContainer();
        setCloudKitReady(true);
      } catch (error) {
        console.error('Failed to initialize CloudKit:', error);
        setCloudKitReady(true); // Still show UI even if CloudKit fails
      }
    };
    
    // Wait for CloudKit JS library to load
    if (typeof (window as any).CloudKit !== 'undefined') {
      initCloudKit();
    } else {
      const checkCloudKit = setInterval(() => {
        if (typeof (window as any).CloudKit !== 'undefined') {
          clearInterval(checkCloudKit);
          initCloudKit();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkCloudKit);
        setCloudKitReady(true);
      }, 10000);
    }
  }, [])

  // CloudKit event listener for when library loads
  window.addEventListener('cloudkitloaded', function() {
    configureContainer()
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <a className="flex items-center space-x-2" href="https://www.saucier-app.com">
              <img src={logo} alt="Saucier" width="44" height="44" className="rounded-lg"></img>
              <h1 className="text-2xl font-bold text-saucier-blue">Saucier</h1>
            </a>
            <div className="flex items-center space-x-3">
              {/* <div id="apple-sign-in-button"></div> */}
              <div id="apple-sign-out-button" className="hidden"></div>
              {authenticated && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-saucier-blue rounded-full"></div>
                  <span>CloudKit Connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!cloudKitReady ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saucier-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting to CloudKit...</p>
          </div>
        ) : !authenticated ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <div className="text-4xl">⚠️</div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Login To iCloud to View your Recipes</h2>
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 text-xl">⚠️</div>
                  <div className="text-left">
                    <h3 className="font-semibold text-red-800">Error Details</h3>
                    <p className="text-sm text-red-600 mt-1">{authError}</p>
                    <p className="text-xs text-red-500 mt-2">
                      Check your API token and container configuration in CloudKit Dashboard
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">Sign in with your Apple ID to access your recipes</p>
                <div id="apple-sign-in-button" className="min-h-[44px] flex items-center justify-center">
                  {/* <div className="text-gray-400 text-sm">Loading sign-in button...</div> */}
                </div>
                {authError && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-saucier-blue hover:bg-saucier-blue-dark text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saucier-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your delicious recipes...</p>
          </div>
        ) : (
          <RecipeList recipes={recipes} />
        )}
      </main>
    </div>
  )
}

export default App
