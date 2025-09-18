import type { Ingredient, Instruction, Recipe } from "./types/recipe";

export type ContainerType = 'privateCloudDatabase' | 'publicCloudDatabase';
export type CloudKitEnvironment = 'development' | 'production'

export class CloudKitAPI {

    containerType: ContainerType;
    environment: CloudKitEnvironment;
    api_key: string;
    containerIdentifier: string;

    ckWebAuthToken: string | undefined | null;
    private onAuthStateChange?: (authenticated: boolean) => void;

    constructor(
        containerType: ContainerType,
        api_key: string,
        environment: CloudKitEnvironment,
        containerIdentifier: string,
        ckWebAuthToken?: string | undefined | null
    ) {
        this.containerType = containerType;
        this.api_key = api_key;
        this.environment = environment;
        this.containerIdentifier = containerIdentifier;
        this.ckWebAuthToken = ckWebAuthToken ?? localStorage.getItem("ckWebAuthToken");

        if (ckWebAuthToken) {
            localStorage.setItem("ckWebAuthToken", ckWebAuthToken);
        } 
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem("ckWebAuthToken");
    }
    
    // MARK: URL
    baseURL(): URL {
        const dbType = this.containerType === 'publicCloudDatabase' ? 'public' : 'private';
        return new URL(
            `https://api.apple-cloudkit.com/database/1/${this.environment}/${this.containerType}/${dbType}`
        );
    }

    authURL(): URL {
        return new URL(
            `https://api.apple-cloudkit.com/database/1/${this.containerIdentifier}/${this.environment}/private/users/current?ckAPIToken=${this.api_key}`
        )
    }
    
    addAuthParameters(url: URL): URL {
        url.searchParams.append('ckAPIToken', this.api_key);
        if (this.ckWebAuthToken) {
            url.searchParams.append('ckWebAuthToken', this.ckWebAuthToken);
        }

        return url
    }

    updateWebAuthToken(ckWebAuthToken: string) {
        this.ckWebAuthToken = ckWebAuthToken
        localStorage.setItem("ckWebAuthToken", ckWebAuthToken);
        this.onAuthStateChange?.(true);
    }

    setAuthStateChangeCallback(callback: (authenticated: boolean) => void) {
        this.onAuthStateChange = callback;
    }

    async handleAuthFlow() {
        const testURL = this.authURL();

        await fetch(testURL).then(async (response) => {
            const json = await response.json()
            const redirectURL = json["redirectURL"];

            // Redirect to the redirectURL
            window.location.href = redirectURL;
        })
        .catch(error => console.log(error))
    }

    fetchURL(): URL {
        const dbType = this.containerType === 'publicCloudDatabase' ? 'public' : 'private';
        const url = new URL(
            `https://api.apple-cloudkit.com/database/1/${this.containerIdentifier}/${this.environment}/${dbType}/records/query`
        )

        return this.addAuthParameters(url)
    }

    async fetchRecords(query: any, fetchAll: boolean = true): (Promise<(any[])>) {
        let records: any[] = [];

        const fetchURL = this.fetchURL();

        const body = JSON.stringify({
            "query": query
        });
        
        const response = await this.handleCloudKitRequest(fetchURL, body);

        let json = await response.json();

        if (!fetchAll) {
            return json.records;
        }

        do {
            records = records.concat(json.records);

            if (json.continuationMarker) {
                const request = await fetch(fetchURL, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "query": query,
                        "continuationMarker": json.continuationMarker
                    })
                });

                if (!request.ok) {
                    const errorText = await request.text();
                    console.error('CloudKit API Error (continuation):', request.status, errorText);
                    throw new Error(`CloudKit API continuation request failed: ${request.status} ${request.statusText}`);
                }
                
                json = await request.json();

                if (json.hasErrors) {
                    console.error('CloudKit response errors (continuation):', json.errors);
                    throw new Error(`CloudKit returned errors in continuation: ${JSON.stringify(json.errors)}`);
                }
            }
        } while(json.continuationMarker)

        return records;
    }

    async fetchRecipes(): Promise<Recipe[]> {
        const query = { 
            recordType: 'CD_Recipe',
            resultsLimit: 200,
            sortBy: [{
                fieldName: 'CD_dateCreated',
                ascending: false
            }]
        };

        const records = await this.fetchRecords(query);

        const mappedRecipes = records.map(r => {
            // Try different possible field names for the recipe name
            const possibleNameFields = ['CD_name', 'name', 'CD_title', 'title'];
            let recipeName = null;
            
            for (const fieldName of possibleNameFields) {
                if (r["fields"]?.[fieldName]?.["value"]) {
                    recipeName = r["fields"][fieldName]["value"];
                    break;
                }
            }
            
            // If no name field found, use the record ID as fallback
            if (!recipeName) {
                recipeName = `Recipe ${r["recordName"].substring(0, 8)}`;
            }
            
            return {
                "id": r["recordName"],
                "name": recipeName,
                "url": r["fields"]?.["CD_url"]?.["value"],
                "ingredients": undefined,
                "instructions": undefined
            };
        });

        return mappedRecipes;
    }

    lookupURL(): URL {
        const dbType = this.containerType === 'publicCloudDatabase' ? 'public' : 'private';
        const url = new URL(
            `https://api.apple-cloudkit.com/database/1/${this.containerIdentifier}/${this.environment}/${dbType}/records/lookup`
        )

        return this.addAuthParameters(url)
    }

    async lookup(recordID: string): Promise<any | undefined> {
        const fetchURL = this.lookupURL();

        const body = JSON.stringify({
            "records": [
                {  "recordName": recordID }
            ]
        })

        const response = await this.handleCloudKitRequest(fetchURL, body);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('CloudKit lookup error:', response.status, errorText);
            throw new Error(`CloudKit lookup failed: ${response.status} ${response.statusText}`);
        }
        
        const json = await response.json();
        
        if (json.hasErrors) {
            console.error('CloudKit lookup response errors:', json.errors);
            throw new Error(`CloudKit returned errors: ${JSON.stringify(json.errors)}`);
        }

        return json.records;
    }

    async fetchRecipeById(recipeId: string): Promise<Recipe | null> {
        // const query = { 
        //     recordType: 'CD_Recipe',
        //     filterBy: {
        //         "fieldName": "recordName",
        //         "comparator": "EQUALS",
        //         "fieldValue": {
        //             "value": recipeId
        //         }
        //     }
        // };

        const records = await this.lookup(recipeId);//this.fetchRecords(query, false);
        
        if (records.length === 0) {
            return null;
        }

        const record = records[0];
        
        // Check if the record has an error (like NOT_FOUND)
        if (record.serverErrorCode === 'NOT_FOUND' || record.reason === 'Record not found') {
            console.error(`Recipe with ID ${recipeId} not found in CloudKit`);
            return null;
        }
        
        // Try different possible field names for the recipe name
        const possibleNameFields = ['CD_name', 'name', 'CD_title', 'title'];
        let recipeName = null;
        
        for (const fieldName of possibleNameFields) {
            if (record["fields"]?.[fieldName]?.["value"]) {
                recipeName = record["fields"][fieldName]["value"];
                break;
            }
        }
        
        // If no name field found, use the record ID as fallback
        if (!recipeName) {
            recipeName = `Recipe ${record["recordName"].substring(0, 8)}`;
        }
        
        return {
            "id": record["recordName"],
            "name": recipeName,
            "url": record["fields"]?.["CD_url"]?.["value"],
            "ingredients": undefined,
            "instructions": undefined
        };
    }

    async fetchRecipeIngredients(recipeID: string): Promise<Ingredient[]> {
        const query = { recordType: 'CD_Ingredient', filterBy: 
            {
                "fieldName": "CD_recipe",
                "comparator": "EQUALS",
                "fieldValue": {
                    "value": recipeID
                }
            }
        };

        const records = await this.fetchRecords(query);

        return records.map(r => ({
            "id": r["recordName"],
            "rawValue": r["fields"]?.["CD_unparsedString"]?.["value"]
        }))
    }

    async fetchRecipeInstructions(recipeID: string): Promise<Instruction[]> {
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
    
        const records = await this.fetchRecords(query);
        
        return records
          .map(r => ({
            "id": r["recordName"],
            "rawValue": r["fields"]?.["CD_instruction"]?.["value"],
            "index": parseInt(r["fields"]?.["CD_index"]?.["value"])
          }))
          .sort((a: Instruction, b: Instruction) => a.index - b.index)
      }

    async fetchRecipeImages(recipeID: string) {
        const query = { recordType: 'CD_RecipeImage', filterBy: 
            {
                "fieldName": "CD_recipe",
                "comparator": "EQUALS",
                "fieldValue": {
                "value": recipeID
                }
            }
        };

        const records = await this.fetchRecords(query, false);
    
        return records;
    }

    async handleCloudKitRequest(url: URL, body?: string): Promise<Response> {
        // x-apple-cloudkit-web-auth-token
        const method = 'POST';
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        })

        const updatedAuthToken: string | null = response.headers.get('x-apple-cloudkit-web-auth-token');
        if (updatedAuthToken) {
            this.updateWebAuthToken(updatedAuthToken);
        } else {
            // The user appears to be logged out
            console.warn("NO WebToken Recieved, user logged out");
            this.ckWebAuthToken = undefined;
            localStorage.removeItem('ckWebAuthToken');
            this.onAuthStateChange?.(false);
        }

        return response;
    }
}