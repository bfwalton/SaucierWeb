import type { Ingredient, Instruction, Recipe } from "./types/recipe";

// CloudKit type declaration
declare const CloudKit: any;

// CloudKit Configuration
// Note: These values need to be configured in CloudKit Dashboard
const api_key = 'f6d6d9a419f857c100ebc56bc57af8a353348a922802fb66e066b2f8d32a4e9d';
const container_identifier = 'iCloud.com.bfwalton.saucier'

// Debug configuration
console.info('CloudKit Config:', {
  container: container_identifier,
  apiKeyLength: api_key.length,
  apiKeyPrefix: api_key.substring(0, 8) + '...'
});

export let userInfo: any | undefined = {}
export let isAuthenticated: boolean = false
export let authError: string | null = null

// State change listeners for React components
let authStateChangeListeners: Array<(isAuth: boolean) => void> = []

export const addAuthStateChangeListener = (listener: (isAuth: boolean) => void) => {
  authStateChangeListeners.push(listener)
}

export const removeAuthStateChangeListener = (listener: (isAuth: boolean) => void) => {
  authStateChangeListeners = authStateChangeListeners.filter(l => l !== listener)
}

const notifyAuthStateChange = () => {
  authStateChangeListeners.forEach(listener => listener(isAuthenticated))
}

let isConfigured = false;

export const configureContainer = (): Promise<void> => {
    if (isConfigured) {
        console.info("CloudKit already configured")
        return Promise.resolve();
    }

    console.info("Configuring CloudKit")
    authError = null;
    
    return new Promise((resolve, reject) => {
        try {
            // Check if CloudKit is available
            if (typeof CloudKit === 'undefined') {
                authError = "CloudKit SDK not loaded";
                console.error(authError);
                reject(new Error(authError));
                return;
            }

            // Validate configuration before proceeding
            if (!container_identifier || !api_key) {
                throw new Error('CloudKit container identifier or API key missing');
            }

            console.info('Configuring CloudKit container:', container_identifier);
            console.info('Current domain:', window.location.origin);
            
            (window as any).CloudKit.configure({
              locale: 'en-us',
              containers: [{
                containerIdentifier: container_identifier,
                apiTokenAuth: {
                  apiToken: api_key,
                  persist: true,
                  signInButton: {
                    id: 'apple-sign-in-button',
                    theme: 'white-with-outline'
                  },
                  signOutButton: {
                    id: 'apple-sign-out-button',
                    theme: 'white-with-outline'
                  }
                },
                environment: 'production',
                // Add CORS settings for localhost
                services: {
                  fetch: {
                    fetchURL: 'https://api.apple-cloudkit.com'
                  }
                }
              }]
            });
            
            console.info('CloudKit configuration completed');

            isConfigured = true;
            const container = (window as any).CloudKit.getDefaultContainer();

            console.info("Setting Up CloudKit Auth")
            container.setUpAuth()
              .then(function(userIdentity: any) {
                console.info("✅ CloudKit setup completed", userIdentity ? 'with user' : 'without user');
                if(userIdentity) {
                  console.info("👤 User authenticated:", userIdentity);
                  gotoAuthenticatedState(userIdentity);
                } else {
                  console.info("🔓 No user authenticated, showing sign-in");
                  gotoUnauthenticatedState();
                }
                resolve();
              })
              .catch((error: any) => {
                console.error("⚠️ CloudKit setup error:", error)
                
                // Check if this is just an authentication required error
                if (error.serverErrorCode === 'AUTHENTICATION_REQUIRED') {
                  console.info("🔐 Authentication required - showing sign in button");
                  authError = null; // Clear error since this is expected
                  gotoUnauthenticatedState();
                } else {
                  // Parse other CloudKit errors
                  const errorMessage = parseCloudKitError(error);
                  authError = errorMessage;
                  gotoUnauthenticatedState();
                }
                
                resolve(); // Don't reject, just continue with unauthenticated state
              })
        } catch (error) {
            console.error("CloudKit configuration error:", error)
            authError = `Configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            gotoUnauthenticatedState();
            resolve(); // Don't reject, just continue
        }
    });
}

function parseCloudKitError(error: any): string {
    console.error('Full CloudKit error:', error);
    
    // Check for HTTP status errors first
    if (error.status === 404) {
        return 'CloudKit container not found. Please verify your container identifier in CloudKit Dashboard.';
    }
    
    if (error.status === 401 || error.status === 403) {
        return 'CloudKit authentication failed. Please regenerate your API token in CloudKit Dashboard.';
    }
    
    if (error.status === 421) {
        return 'CloudKit configuration mismatch. Check your container identifier and API token.';
    }
    
    if (error.ckErrorCode) {
        switch (error.ckErrorCode) {
            case 'AUTHENTICATION_REQUIRED':
                return 'Authentication required - please sign in';
            case 'AUTHENTICATION_FAILED':
                return 'Authentication failed - please regenerate your API token';
            case 'NETWORK_UNAVAILABLE':
                return 'Network error - please check your connection';
            case 'SERVICE_UNAVAILABLE':
                return 'CloudKit service is temporarily unavailable';
            case 'QUOTA_EXCEEDED':
                return 'CloudKit quota exceeded';
            case 'REQUEST_RATE_LIMITED':
                return 'Too many requests - please wait and try again';
            case 'INVALID_ARGUMENTS':
                return 'Invalid API configuration - check your CloudKit setup';
            case 'NOT_FOUND':
                return 'CloudKit container or resource not found';
            default:
                return `CloudKit error: ${error.ckErrorCode} - ${error.serverErrorCode || 'Check CloudKit Dashboard'}`;
        }
    }
    
    if (error.message) {
        return `CloudKit error: ${error.message}`;
    }
    
    return 'CloudKit configuration error - please check CloudKit Dashboard';
}

export const gotoAuthenticatedState = (updatedUserInfo: any) => {
  console.info("🎉 Going to authenticated State")
  const container = (window as any).CloudKit.getDefaultContainer();

  userInfo = updatedUserInfo
  isAuthenticated = true
  authError = null

  // Notify React components of state change
  notifyAuthStateChange()

  container
    .whenUserSignsOut()
    .then(gotoUnauthenticatedState);
};

export const gotoUnauthenticatedState = () => {
  console.info("🚪 Going to unauthenticated State")
  isAuthenticated = false;
  userInfo = undefined;
  
  // Notify React components of state change
  notifyAuthStateChange()
  
  try {
    const cloudKit = (window as any).CloudKit;
    if (typeof cloudKit !== 'undefined' && isConfigured) {
      const container = cloudKit.getDefaultContainer();
      container
          .whenUserSignsIn()
          .then(gotoAuthenticatedState)
          .catch((error: any) => {
            console.error("Error waiting for sign in:", error);
          });
    }
  } catch (error) {
    console.error("Error in unauthenticated state:", error);
  }
}

  export const handleQuery = async (database: any, query: any, allRecords = false): Promise<any[]> => {
    let allRecordsArray: any[] = [];
    let cursor: any = null;
    
    do {
      const queryWithCursor: any = cursor 
        ? { ...query, cursor }
        : query;
        
      const response: any = await database.performQuery(queryWithCursor);
      
      if (response.hasErrors) {
        console.error("Query errors:", response.errors);
        return allRecords ? allRecordsArray : [];
      }
      
      const records = response.records || [];
      allRecordsArray = allRecordsArray.concat(records);
      
      cursor = response.cursor;
      
      if (!allRecords) {
        break;
      }
      
    } while (cursor && allRecords);
    
    return allRecordsArray;
  }

  export const fetchRecords = async (): Promise<Recipe[]> => {
    const container = CloudKit.getDefaultContainer();
    if (!container) {
      throw new Error('CloudKit container not available');
    }
    const database = container.privateCloudDatabase;
    const query = { 
      recordType: 'CD_Recipe',
      sortBy: [{
        fieldName: 'CD_dateCreated',
        ascending: false
      }]
    };

    const recipes = await handleQuery(database, query, true)

    const mappedRecipes = recipes.map(r => ({ 
      "id": r["recordName"],
      "name": r["fields"]?.["CD_name"]?.["value"],
      "ingredients": undefined,
      "instructions": undefined
    }));
    
    // Deduplicate by ID
    const uniqueRecipes = mappedRecipes.filter((recipe: Recipe, index: number, self: Recipe[]) => 
      index === self.findIndex((r: Recipe) => r.id === recipe.id)
    );
    
    return uniqueRecipes;
  }

  export const fetchRecipeImages = (recipeID: string) => {
    const container = CloudKit.getDefaultContainer();
    if (!container) {
      throw new Error('CloudKit container not available');
    }
    const database = container.privateCloudDatabase;
    const query = { recordType: 'CD_RecipeImage', filterBy: 
        {
            "fieldName": "CD_recipe",
            "comparator": "EQUALS",
            "fieldValue": {
              "value": recipeID
            }
        }
    };

    return handleQuery(database, query, false)
  }

  export const fetchRecipeIngredients = async (recipeID: string): Promise<Ingredient[]> => {
    const container = CloudKit.getDefaultContainer();
    if (!container) {
      throw new Error('CloudKit container not available');
    }
    const database = container.privateCloudDatabase;
    const query = { recordType: 'CD_Ingredient', filterBy: 
        {
            "fieldName": "CD_recipe",
            "comparator": "EQUALS",
            "fieldValue": {
              "value": recipeID
            }
        }
    };

    const results = await handleQuery(database, query, false)

    return results.map(r => ({
      "id": r["recordName"],
      "rawValue": r["fields"]?.["CD_unparsedString"]?.["value"]
    }))
  }

  export const fetchRecipeInstructions = async (recipeID: string): Promise<Instruction[]> => {
    const container = CloudKit.getDefaultContainer();
    if (!container) {
      throw new Error('CloudKit container not available');
    }
    const database = container.privateCloudDatabase;
    const query = { recordType: 'CD_Instruction', filterBy: 
        {
            "fieldName": "CD_recipe",
            "comparator": "EQUALS",
            "fieldValue": {
              "value": recipeID
            }
        },
        sortBy: [{
          "fieldName": "CD_index",
          "ascending": true
        }]
    };

    const results = await handleQuery(database, query, false)
    
    return results
      .map(r => ({
        "id": r["recordName"],
        "rawValue": r["fields"]?.["CD_instruction"]?.["value"],
        "index": parseInt(r["fields"]?.["CD_index"]?.["value"])
      }))
      .sort((a: Instruction, b: Instruction) => a.index - b.index)
  }