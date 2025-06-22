import { useEffect, useState } from 'react'
import { fetchRecipeImages } from './cloudkit.ts'
import type { Recipe } from './types/recipe.ts';

interface RecipeCardProps {
    recipe: Recipe
    onOpenModal: (recipe: Recipe) => void
}

function RecipeCard({ recipe, onOpenModal }: RecipeCardProps) {
    const [recipeImage, setRecipeImage] = useState<any>(undefined)
    const [imageLoading, setImageLoading] = useState(true)

    useEffect(() => {
        (async () => {
            try {
                const recipeImages = await fetchRecipeImages(recipe.id)
                if (recipeImages && recipeImages.length > 0) {
                    setRecipeImage(recipeImages[0])
                }
            } catch (error) {
                console.error('Error loading recipe image:', error)
            } finally {
                setImageLoading(false)
            }
        })()
    }, [recipe])

    const renderImage = () => {
        if (imageLoading) {
            return (
                <div className="w-full h-48 bg-gray-200 rounded-t-xl flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">
                        <div className="text-3xl">🖼️</div>
                    </div>
                </div>
            )
        }

        if (recipeImage) {
            const base64Data = recipeImage["fields"]?.["CD_imageData"]?.["value"]
            if (base64Data) {
                return (
                    <img 
                        className="w-full h-48 object-cover rounded-t-xl" 
                        src={`data:image/jpeg;base64,${base64Data}`}
                        alt={recipe.name}
                    />
                )
            }
        }

        return (
            <div className="w-full h-48 rounded-t-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #1F4A6620, #1F4A6640)'}}>
                <div className="text-4xl opacity-60">🍳</div>
            </div>
        )
    }

    const handleClick = () => {
        onOpenModal(recipe)
    }

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div 
                className="cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
                onClick={handleClick}
            >
                {renderImage()}
                
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {recipe.name || 'Untitled Recipe'}
                    </h3>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{backgroundColor: '#1F4A66'}}></span>
                        Click to view details
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RecipeCard