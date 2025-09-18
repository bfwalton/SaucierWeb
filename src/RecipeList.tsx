import { useState, useMemo } from 'react'
import RecipeCard from './RecipeCard'
import RecipeModal from './RecipeModal'
import SearchBar from './SearchBar'
import Pagination from './Pagination'
import type { Recipe } from './types/recipe'
import type { CloudKitAPI } from './cloudkit-api'

function RecipeList({ recipes, api, isPublicView = false, onRecipeModalOpen }: { 
  recipes: Recipe[], 
  api: CloudKitAPI, 
  isPublicView?: boolean,
  onRecipeModalOpen?: (recipe: Recipe) => void 
}) {
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    // Filter recipes based on search term
    const filteredRecipes = useMemo(() => {
        if (!searchTerm.trim()) {
            return recipes
        }
        
        const term = searchTerm.toLowerCase()
        return recipes.filter(recipe => 
            recipe.name?.toLowerCase().includes(term)
            // Note: ingredients and instructions are not loaded in the main recipe list
            // to avoid performance issues. They are loaded on-demand when viewing recipe details.
        )
    }, [recipes, searchTerm])

    // Calculate pagination
    const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage)
    const paginatedRecipes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredRecipes.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredRecipes, currentPage, itemsPerPage])

    // Reset to first page when search term changes
    const handleSearchChange = (term: string) => {
        setSearchTerm(term)
        setCurrentPage(1)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        // Scroll to top of recipe list when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleOpenModal = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setIsModalOpen(true)
        onRecipeModalOpen?.(recipe)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRecipe(null)
        // Remove URL parameters when closing modal
        const url = new URL(window.location.href)
        url.searchParams.delete('recipeId')
        url.searchParams.delete('database')
        window.history.pushState({}, '', url.toString())
    }

    if (recipes.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{backgroundColor: '#1F4A6620'}}>
                    <div className="text-4xl">🍳</div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {isPublicView ? 'No public recipes available' : 'No recipes yet'}
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                    {isPublicView 
                        ? 'There are no public recipes shared by the community yet.'
                        : 'Start building your recipe collection by adding your first recipe to your CloudKit database.'
                    }
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        {isPublicView ? 'Public Recipes' : 'Your Recipes'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} 
                        {searchTerm ? ` matching "${searchTerm}"` : (isPublicView ? ' shared by the community' : ' in your collection')}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
                <SearchBar 
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    placeholder="Search recipes by name..."
                />
            </div>

            {/* No results message */}
            {filteredRecipes.length === 0 && searchTerm ? (
                <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <div className="text-4xl">🔍</div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
                    <p className="text-gray-600 mb-4">
                        No recipes match your search for "{searchTerm}"
                    </p>
                    <button
                        onClick={() => handleSearchChange('')}
                        className="text-saucier-blue hover:text-saucier-blue-dark font-medium transition-colors duration-200"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <>
                    {/* Recipe Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onOpenModal={handleOpenModal}
                                api={api}
                                isPublicView={isPublicView}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                totalItems={filteredRecipes.length}
                                itemsPerPage={itemsPerPage}
                            />
                        </div>
                    )}
                </>
            )}
            
            <RecipeModal 
                key={selectedRecipe?.id}
                recipe={selectedRecipe} 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                api={api}
            />
        </div>
    )
}

export default RecipeList
