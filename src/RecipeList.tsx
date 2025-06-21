import { useEffect } from 'react'
import RecipeCard from './RecipeCard'
import './App.css'
import type { Recipe } from './types/recipe'

function RecipeList({ recipes }: { recipes: Recipe[] }) {
    useEffect(() => {
        console.log(recipes)
    })

    const listStyle: React.CSSProperties = {
        display: "flex",
        gap: "10px",
        flexDirection: "column",
        alignContent: "center",
        alignItems: "center"
    };
    
    return (
    <>
        <div>
        Recipes:
        <div style={listStyle}>
            {
                recipes.slice(0, 10).map(recipe => (
                    <RecipeCard recipe={recipe} />
                ))
            }
        </div>
        </div>
    </>
    )
}

export default RecipeList
