import type { Ingredient, Instruction, Recipe } from "./types/recipe";

// Apples documentation seems to indicate that this is safe to expose to the frontend????
// Its kinda sus, not totally convinced yet that this is okay
const api_key = '5076c2ae7316056ce5ae2aa58799cb63138f47c5fe71fb68600d4f659f671361';
const container_identifier = 'iCloud.com.bfwalton.saucier'

export var userInfo: any | undefined = {}

export const configureContainer = () => {
    console.info('loading cloudkit')
    CloudKit.configure({
        locale: 'en-us',
        containers: [{
          // Change this to a container identifier you own.
          containerIdentifier: container_identifier,

          apiTokenAuth: {
            // And generate a web token through CloudKit Dashboard.
            apiToken: api_key,

            persist: true, // Sets a cookie.

            signInButton: {
              id: 'apple-sign-in-button',
              theme: 'black' // Other options: 'white', 'white-with-outline'.
            },

            signOutButton: {
              id: 'apple-sign-out-button',
              theme: 'black'
            }
          },

          environment: 'development'
        }]
      });
}

// export const demoSetUpAuth = () => {
//     const container = CloudKit.getDefaultContainer();

//     container.setUpAuth()
//         .then(value => console.log(value))
//         .catch(error => console.error(error))

//     if(userInfo) {
//         gotoAuthenticatedState(userInfo);
//     } else {
//         gotoUnauthenticatedState();
//     }
// }

export const gotoAuthenticatedState = (userInfo: any) => {
    const container = CloudKit.getDefaultContainer();

  if(userInfo.isDiscoverable) {
    this.userInfo = userInfo
  }

  container
    .whenUserSignsOut()
    .then(gotoUnauthenticatedState);
};

export const gotoUnauthenticatedState= (error) => {
    console.error(error)
    const container = CloudKit.getDefaultContainer();

    container
        .whenUserSignsIn()
        .then(gotoAuthenticatedState)
        .catch(gotoUnauthenticatedState);
    }

export const demoFetchAllRecordZones = () => {
    const container = CloudKit.getDefaultContainer();

    var privateDB = container.privateCloudDatabase;
  
    return privateDB.fetchAllRecordZones().then(function(response) {
      if(response.hasErrors) {
  
        // Handle any errors.
        throw response.errors[0];
  
      } else {
  
        // response.zones is an array of zone objects.
        return response.zones
      }
    });
  }

  export const handleQuery = (database, query) => {
    // Execute the query.
    return database.performQuery(query).then(function(response) {
        if(response.hasErrors) {
            console.error(response.errors[0]);
            return;
        }
        var records = response.records;
        var numberOfRecords = records.length;
        if (numberOfRecords === 0) {
            console.error('No matching items');
            return;
        }
        
        return records
    });
  }

  export const fetchRecords = async (): Promise<[Recipe]> => {
    const container = CloudKit.getDefaultContainer();
    const database = container.privateCloudDatabase;
    const query = { recordType: 'CD_Recipe', sortBy: [{ fieldName: 'CD_dateCreated'}] };

    const recipes = await handleQuery(database, query)

    return recipes.map(r => ({ 
      "id": r["recordName"],
      "name": r["fields"]?.["CD_name"]?.["value"]
    }))
  }

  export const fetchRecipeImages = (recipeID: string) => {
    const container = CloudKit.getDefaultContainer();
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

    return handleQuery(database, query)
  }

  export const fetchRecipeIngredients = async (recipeID: string): Promise<Ingredient[]> => {
    const container = CloudKit.getDefaultContainer();
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

    const results = await handleQuery(database, query)

    return results.map(r => ({
      "id": r["recordName"],
      "rawValue": r["fields"]?.["CD_unparsedString"]?.["value"]
    }))
  }

  export const fetchRecipeInstructions = async (recipeID: string): Promise<Instruction[]> => {
    const container = CloudKit.getDefaultContainer();
    const database = container.privateCloudDatabase;
    const query = { recordType: 'CD_Instruction', filterBy: 
        {
            "fieldName": "CD_recipe",
            "comparator": "EQUALS",
            "sortBy": {
              "fieldName": "CD_index",
              "ascending": false
            },
            "fieldValue": {
              "value": recipeID
            }
        }
    };

    const results = await handleQuery(database, query)
    
    return results
      .map(r => ({
        "id": r["recordName"],
        "rawValue": r["fields"]?.["CD_instruction"]?.["value"],
        "index": parseInt(r["fields"]?.["CD_index"]?.["value"])
      }))
    .toSorted((a: Instruction, b: Instruction) => { a.index - b.index })
  }