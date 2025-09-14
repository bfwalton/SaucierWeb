import { useEffect, useState } from "react";
import { CloudKitAPI } from './cloudkit-api.ts'
import type { Ingredient, Instruction, Recipe } from "./types/recipe.ts";

function RecipeDetail({ recipe, api }: { recipe: Recipe, api: CloudKitAPI }) {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [instructions, setInstructions] = useState<Instruction[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        (async () => {
            setIsLoading(true)
            try {
                const [fetchedIngredients, fetchedInstructions] = await Promise.all([
                    api.fetchRecipeIngredients(recipe.id),
                    api.fetchRecipeInstructions(recipe.id)
                ])
                setIngredients(fetchedIngredients)
                setInstructions(fetchedInstructions)
            } catch (error) {
                console.error('Error fetching recipe details:', error)
            } finally {
                setIsLoading(false)
            }
        })()
    }, [api, recipe.id])

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mt-6"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Ingredients Section */}
            <div>
                <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">🧄</div>
                    <h3 className="text-xl font-semibold text-gray-900">Ingredients</h3>
                    {ingredients.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs rounded-full" style={{backgroundColor: '#1F4A6620', color: '#1F4A66'}}>
                            {ingredients.length}
                        </span>
                    )}
                </div>
                {ingredients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {ingredients.map((ingredient, index) => (
                            <div key={ingredient.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{backgroundColor: '#1F4A6620', color: '#1F4A66'}}>
                                    {index + 1}
                                </div>
                                <span className="text-gray-700 leading-relaxed">{ingredient.rawValue}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No ingredients listed</p>
                )}
            </div>

            {/* Instructions Section */}
            <div>
                <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">📝</div>
                    <h3 className="text-xl font-semibold text-gray-900">Instructions</h3>
                    {instructions.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {instructions.length} steps
                        </span>
                    )}
                </div>
                {instructions.length > 0 ? (
                    <div className="space-y-4">
                        {instructions.map((instruction, index) => (
                            <div key={instruction.id} className="flex space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-700 leading-relaxed">{instruction.rawValue}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No instructions provided</p>
                )}
            </div>
        </div>
    )
}

export default RecipeDetail;