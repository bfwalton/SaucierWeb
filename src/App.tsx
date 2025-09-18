import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import logo from './assets/logo.png'
import type { Recipe } from './types/recipe'
import RecipeList from './RecipeList.js'
import RecipeModal from './RecipeModal'
import { TabNavigation, type TabType } from './TabNavigation'

import { CloudKitAPI } from './cloudkit-api.ts'

function App() {
  const [privateRecipes, setPrivateRecipes] = useState<Recipe[]>([])
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('public')
  const [loading, setLoading] = useState(false)
  const [privateLoading, setPrivateLoading] = useState(false)
  const [urlRecipe, setUrlRecipe] = useState<Recipe | null>(null)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [urlRecipeLoading, setUrlRecipeLoading] = useState(false)

  const api_key = import.meta.env.VITE_CLOUDKIT_API_TOKEN;
  const environment = import.meta.env.VITE_CLOUDKIT_ENVIRONMENT;
  const container_identifier = import.meta.env.VITE_CONTAINER_IDENTIFIER;

  console.log(`Using Environment`, {
    api_key, environment, container_identifier
  })

  const [authenticated, setAuthenticated] = useState(false);
  const cloudKitReady = true;

  const [ckWebAuthToken, setCKWebAuthToken] = useState<string | null>(() => {
    // Initialize token from localStorage on first render
    return localStorage.getItem('ckWebAuthToken');
  });
  
  const privateAPI = useMemo(() => {
    const api = new CloudKitAPI(
      'privateCloudDatabase',
      api_key,
      environment,
      container_identifier,
      ckWebAuthToken
    );
    
    // Set up authentication state change callback
    api.setAuthStateChangeCallback((isAuthenticated) => {
      setAuthenticated(isAuthenticated);
    });
    
    return api;
  }, [api_key, environment, container_identifier, ckWebAuthToken]);

  const publicAPI = useMemo(() => (
    new CloudKitAPI(
      'publicCloudDatabase',
      api_key,
      environment,
      container_identifier,
      ckWebAuthToken
    )
  ), [api_key, environment, container_identifier, ckWebAuthToken]);

  // Initialize auth token and authentication state once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('ckWebAuthToken');
    const ckSession = params.get('ckSession');
    
    // Remove CloudKit auth parameters from URL immediately for security
    if (urlToken || ckSession) {
      const url = new URL(window.location.href);
      url.searchParams.delete('ckWebAuthToken');
      url.searchParams.delete('ckSession');
      window.history.replaceState({}, '', url.toString());
    }
    
    if (urlToken) {
      // Update token and auth state
      setCKWebAuthToken(urlToken);
      setAuthenticated(true);
    } else {
      // Check if we have a stored token and set initial auth state
      const storedToken = localStorage.getItem('ckWebAuthToken');
      if (storedToken) {
        setAuthenticated(true);
      }
    }
  }, [])

  // Update the privateAPI token when ckWebAuthToken changes
  useEffect(() => {
    if (ckWebAuthToken) {
      privateAPI.ckWebAuthToken = ckWebAuthToken;
    }
  }, [ckWebAuthToken, privateAPI])

  const triggerSignin = useCallback(async () => {
    await privateAPI.handleAuthFlow();
  }, [privateAPI]);

  const loadPrivateRecipes = useMemo(() => {
    return async () => {
      try {
        setPrivateLoading(true)
        const records = await privateAPI.fetchRecipes();
        setPrivateRecipes(records);
        setPrivateLoading(false);
      } catch (error) {
        console.error('Error fetching private recipes:', error);
        setPrivateLoading(false);
      }
    };
  }, [privateAPI]);

  const loadPublicRecipes = useMemo(() => {
    return async () => {
      try {
        setLoading(true)
        const records = await publicAPI.fetchRecipes();
        setPublicRecipes(records);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching public recipes:', error);
        setLoading(false);
      }
    };
  }, [publicAPI]);

  // Track if we've switched to private tab to avoid infinite loops
  const hasAutoSwitchedToPrivate = useRef(false);
  
  // Load private recipes when authenticated
  useEffect(() => {
    if (authenticated) {
      loadPrivateRecipes();
    }
  }, [authenticated, loadPrivateRecipes]);
  
  // Auto-switch to private tab when user logs in
  useEffect(() => {
    if (authenticated && !hasAutoSwitchedToPrivate.current && activeTab === 'public' && !window.location.search.includes('database=public')) {
      setActiveTab('private');
      hasAutoSwitchedToPrivate.current = true;
    }
  }, [authenticated, activeTab]);
  
  // Load public recipes once on mount
  useEffect(() => {
    loadPublicRecipes();
  }, [loadPublicRecipes]);

  // Parse URL parameters once and memoize
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      recipeId: params.get('recipeId'),
      database: params.get('database') as 'private' | 'public' | null
    };
  }, []);
  
  // Handle URL parameters for direct recipe access
  useEffect(() => {
    const { recipeId, database } = urlParams;

    if (recipeId && database) {
      const fetchUrlRecipe = async () => {
        try {
          console.log(`Fetching recipe ${recipeId} from ${database} database`);
          setUrlRecipeLoading(true);
          const api = database === 'private' ? privateAPI : publicAPI;
          const recipe = await api.fetchRecipeById(recipeId);
          
          console.log('Fetched recipe:', recipe);
          
          if (recipe) {
            setUrlRecipe(recipe);
            setUrlModalOpen(true);
            setActiveTab(database);
          } else {
            console.error(`Recipe with ID ${recipeId} not found in ${database} database`);
            // Clear the URL parameters since the recipe doesn't exist
            const url = new URL(window.location.href);
            url.searchParams.delete('recipeId');
            url.searchParams.delete('database');
            window.history.replaceState({}, '', url.toString());
            // TODO: Show user-friendly error message
          }
        } catch (error) {
          console.error('Error fetching recipe from URL:', error);
        } finally {
          setUrlRecipeLoading(false);
        }
      };

      fetchUrlRecipe();
    }
  }, [urlParams, privateAPI, publicAPI])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleUrlModalClose = () => {
    setUrlModalOpen(false)
    setUrlRecipe(null)
    // Remove URL parameters when closing the modal
    const url = new URL(window.location.href)
    url.searchParams.delete('recipeId')
    url.searchParams.delete('database')
    window.history.pushState({}, '', url.toString())
  }

  const updateUrlForRecipe = (recipe: Recipe, database: 'private' | 'public') => {
    const url = new URL(window.location.href)
    url.searchParams.set('recipeId', recipe.id)
    url.searchParams.set('database', database)
    window.history.pushState({}, '', url.toString())
  }

  const currentRecipes = activeTab === 'private' ? privateRecipes : publicRecipes

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
              {!authenticated ? (
                <button 
                  onClick={triggerSignin}
                  className="bg-saucier-blue hover:bg-saucier-blue-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  Sign in with Apple
                </button>
              ) : (
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
        ) : (
          <div className="space-y-6">
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              isAuthenticated={authenticated}
            />
            
            {(loading || (activeTab === 'private' && privateLoading)) ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saucier-blue mx-auto mb-4"></div>
                <p className="text-gray-600">Loading recipes...</p>
              </div>
            ) : activeTab === 'private' && !authenticated ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                  <div className="text-4xl">🔒</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your private recipes</h3>
                <p className="text-gray-600">Please sign in with your Apple ID to access your personal recipe collection.</p>
              </div>
            ) : (
              <RecipeList
                recipes={currentRecipes}
                api={activeTab === 'private' ? privateAPI : publicAPI}
                isPublicView={activeTab === 'public'}
                onRecipeModalOpen={(recipe) => updateUrlForRecipe(recipe, activeTab)}
              />
            )}
          </div>
        )}
      </main>

      {/* URL-based Recipe Modal */}
      {urlRecipeLoading ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saucier-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipe...</p>
          </div>
        </div>
      ) : (
        <RecipeModal
          recipe={urlRecipe}
          isOpen={urlModalOpen}
          onClose={handleUrlModalClose}
          api={urlRecipe && activeTab === 'private' ? privateAPI : publicAPI}
        />
      )}
    </div>
  )
}

export default App;
