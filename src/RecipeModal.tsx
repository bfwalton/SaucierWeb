import { useEffect, useState } from 'react'
import { fetchRecipeImages } from './cloudkit.ts'
import RecipeDetail from './RecipeDetail.tsx'
import type { Recipe } from './types/recipe.ts'

interface RecipeModalProps {
  recipe: Recipe | null
  isOpen: boolean
  onClose: () => void
}

function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const [recipeImage, setRecipeImage] = useState<any>(undefined)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    if (recipe && isOpen) {
      (async () => {
        setImageLoading(true)
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
    }
  }, [recipe, isOpen])

  if (!isOpen || !recipe) {
    return null
  }

  const renderImage = () => {
    if (imageLoading) {
      return (
        <div className="w-full h-64 bg-gray-200 rounded-t-xl flex items-center justify-center">
          <div className="animate-pulse text-gray-400">
            <div className="text-4xl">🖼️</div>
          </div>
        </div>
      )
    }

    if (recipeImage) {
      const base64Data = recipeImage["fields"]?.["CD_imageData"]?.["value"]
      if (base64Data) {
        return (
          <img 
            className="w-full h-64 object-cover rounded-t-xl" 
            src={`data:image/jpeg;base64,${base64Data}`}
            alt={recipe.name}
          />
        )
      }
    }

        return (
            <div className="w-full h-64 rounded-t-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #1F4A6620, #1F4A6640)'}}>
                <div className="text-6xl opacity-60">🍳</div>
            </div>
        )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {recipe.name || 'Untitled Recipe'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {renderImage()}
            <RecipeDetail recipe={recipe} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeModal
