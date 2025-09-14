import type { Ingredient, Instruction, Recipe } from "./types/recipe";

export type ContainerType = 'privateCloudDatabase' | 'publicCloudDatabase';
export type CloudKitEnvironment = 'development' | 'production'

export class CloudKitAPI {

    containerType: ContainerType;
    environment: CloudKitEnvironment;
    api_key: string;
    containerIdentifier: string;

    ckWebAuthToken: string | undefined | null;

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
        return new URL(
            `https://api.apple-cloudkit.com/database/1/${this.environment}/${this.containerType}/private`
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
        const url = new URL(
            `https://api.apple-cloudkit.com/database/1/${this.containerIdentifier}/${this.environment}/private/records/query`
        )

        return this.addAuthParameters(url)
    }

    async fetchRecords(query: any, fetchAll: boolean = true): (Promise<(any[])>) {
        let records: any[] = [];

        const fetchURL = this.fetchURL();
        const request = await fetch(fetchURL, {
            method: "POST",
            body: JSON.stringify({
                "query": query
            })
        })

        let json = await request.json();

        if (!fetchAll) {
            return json.records;
        }

        do {
            records = records.concat(json.records);

            const request = await fetch(fetchURL, {
                method: "POST",
                body: JSON.stringify({
                    "query": query,
                    "continuationMarker": json.continuationMarker
                })
            });
            
            json = await request.json();
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

        const mappedRecipes = records.map(r => ({ 
            "id": r["recordName"],
            "name": r["fields"]?.["CD_name"]?.["value"],
            "ingredients": undefined,
            "instructions": undefined
        }));

        return mappedRecipes;
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
}