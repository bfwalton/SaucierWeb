import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import RecipeList from './RecipeList.js'

import { configureContainer, demoFetchAllRecordZones, fetchRecords } from './cloudkit.ts'

function App() {
  const [recipes, setRecipes] = useState([])

  useEffect(() => {
    // Your code here
   (async () => {
      configureContainer()
      const recipes = await fetchRecords()
      setRecipes(recipes)
    })()

  }, []);

  return (
    <>
      <div>
        <div id="apple-sign-in-button"></div>
        <div id="apple-sign-out-button"></div>
          <RecipeList recipes={recipes}></RecipeList>
      </div>
    </>
  )
}

export default App
