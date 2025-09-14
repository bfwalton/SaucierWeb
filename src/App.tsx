import { useEffect, useMemo, useState } from 'react'
import logo from './assets/logo.png'
import type { Recipe } from './types/recipe'
import RecipeList from './RecipeList.js'

import { CloudKitAPI } from './cloudkit-api.ts'

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  const api_key = import.meta.env.VITE_CLOUDKIT_API_TOKEN;
  const environment = import.meta.env.VITE_CLOUDKIT_ENVIRONMENT;
  const container_identifier = import.meta.env.VITE_CONTAINER_IDENTIFIER;

  console.log(`Using Environment`, {
    api_key, environment, container_identifier
  })

  const [authenticated, setAuthenticated] = useState(false);
  const authError = undefined;
  const cloudKitReady = true;

  const [ckWebAuthToken, setCKWebAuthToken] = useState<string | null>();
  
  const api = useMemo(() => (
    new CloudKitAPI(
      'privateCloudDatabase',
      api_key,
      environment,
      container_identifier,
      ckWebAuthToken
    )
  ), [api_key, environment, container_identifier, ckWebAuthToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCKWebAuthToken(params.get('ckWebAuthToken'))

    if (api.isAuthenticated()) {
      setAuthenticated(api.isAuthenticated());
    }
  }, [api])

  async function triggerSignin() {
    await api.handleAuthFlow()
  }

  const loadRecipes = useMemo(() => {
    return async () => {
      try {
        setLoading(true)
        const records = await api.fetchRecipes();
        setRecipes(records);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };
  }, [api]);

  useEffect(() => {
    loadRecipes()
  }, [authenticated, loadRecipes])

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
                <button className="min-h-[44px] bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={triggerSignin}>
                  <div className="text-white-400 text-sm">Sign in with Apple</div>
                </button>
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
          <RecipeList
            recipes={recipes}
            api={api}
          />
        )}
      </main>
    </div>
  )
}

export default App;
