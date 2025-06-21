import { useEffect, useState } from "react";
import { fetchRecipeInstructions, fetchRecipeIngredients } from './cloudkit.ts'
import type { Ingredient, Instruction, Recipe } from "./types/recipe.ts";

function RecipeDetail({ recipe }: { recipe: Recipe }) {

    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [instructions, setInstructions] = useState<Instruction[]>([])

    const [isLoading, setIsLoading] = useState(false)

    const detailStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: 'column',
        textAlign: 'left'
    };

    useEffect(() => {
        (async () => {
            setIsLoading(true)
            const ingredients = await fetchRecipeIngredients(recipe.id)
            setIngredients(ingredients)
            const instructions = await fetchRecipeInstructions(recipe.id)
            console.log(instructions)
            setInstructions(instructions)
            setIsLoading(false)
        })();
    }, [])

    return (
        (isLoading === false) ? <div style={detailStyle}>
            <h2>Ingredients</h2>
            <ul>
                {ingredients.map(ingredient => (
                    <li key={ingredient.id}>{ ingredient.rawValue }</li>
                ))}
            </ul>
            <h2>Instructions</h2>
            <ol>
                {instructions.map(instruction => (
                    <li key={instruction.id}>{ instruction.rawValue } ({instruction.index})</li>
                ))}
            </ol>
        </div> : <p>Loading</p>
    )
}

export default RecipeDetail;