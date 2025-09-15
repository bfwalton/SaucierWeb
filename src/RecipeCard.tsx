import { useEffect, useState } from 'react'
// import { fetchRecipeImages } from './cloudkit.ts'
import type { Recipe } from './types/recipe.ts';
import type { CloudKitAPI } from './cloudkit-api.ts';

interface RecipeCardProps {
    recipe: Recipe
    api: CloudKitAPI
    onOpenModal: (recipe: Recipe) => void
    isPublicView?: boolean
}

function RecipeCard({ recipe, onOpenModal, api, isPublicView = false }: RecipeCardProps) {
    const [recipeImage, setRecipeImage] = useState<any>(undefined)
    const [imageLoading, setImageLoading] = useState(true)
    const [shareTooltip, setShareTooltip] = useState('')

    useEffect(() => {
        (async () => {
            try {
                const recipeImages = await api.fetchRecipeImages(recipe.id)
                if (recipeImages && recipeImages.length > 0) {
                    setRecipeImage(recipeImages[0])
                }
            } catch (error) {
                console.error('Error loading recipe image:', error)
            } finally {
                setImageLoading(false)
            }
        })()
    }, [api, recipe])

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

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click when clicking share button
        
        const url = new URL(window.location.origin + window.location.pathname)
        url.searchParams.set('recipeId', recipe.id)
        url.searchParams.set('database', isPublicView ? 'public' : 'private')
        
        try {
            await navigator.clipboard.writeText(url.toString())
            setShareTooltip('Copied!')
            setTimeout(() => setShareTooltip(''), 2000)
        } catch (error) {
            console.error('Failed to copy URL:', error)
            setShareTooltip('Failed to copy')
            setTimeout(() => setShareTooltip(''), 2000)
        }
    }

    const handleOpenUrl = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click when clicking URL button
        if (recipe.url) {
            window.open(recipe.url, '_blank', 'noopener,noreferrer')
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative">
            <div 
                className="cursor-pointer transform hover:scale-[1.02] transition-transform duration-200"
                onClick={handleClick}
            >
                {renderImage()}
                
                <div className="p-4">
                    <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
                            {recipe.name || 'Untitled Recipe'}
                        </h3>
                        <div className="flex items-center space-x-1">
                            {recipe.url && (
                                <button
                                    onClick={handleOpenUrl}
                                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                                    title="Open recipe URL"
                                >
                                    <svg 
                                        className="w-4 h-4 text-gray-500 group-hover:text-saucier-blue transition-colors duration-200" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                        />
                                    </svg>
                                </button>
                            )}
                            {isPublicView ? (<div className="relative">
                                <button
                                    onClick={handleShare}
                                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
                                    title="Share recipe"
                                >
                                    <svg 
                                        className="w-4 h-4 text-gray-500 group-hover:text-saucier-blue transition-colors duration-200" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
                                        />
                                    </svg>
                                </button>
                                {shareTooltip && (
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                        {shareTooltip}
                                    </div>
                                )}
                            </div>) : null}
                        </div>
                    </div>
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