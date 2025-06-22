# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Saucier is a React-based recipe management web application that integrates with Apple CloudKit for data storage and authentication. The app allows users to view, manage, and organize their recipes with images, ingredients, and detailed instructions.

## Common Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on the codebase

### Testing & Documentation
- `npm run storybook` - Start Storybook development server on port 6006
- `npm run build-storybook` - Build Storybook for deployment

## Architecture & Key Patterns

### CloudKit Integration
The application uses Apple CloudKit as its primary backend service:
- **Authentication**: Handled through CloudKit's web SDK with Apple Sign-in buttons
- **Data Storage**: Recipes, ingredients, instructions, and images stored in user's private CloudKit database
- **Configuration**: CloudKit container configured in `src/cloudkit.ts` with API key and container identifier

### Core Data Models
- **Recipe**: Main entity with id, name, ingredients array, and instructions array
- **Ingredient**: Contains id and rawValue (unparsed ingredient string)
- **Instruction**: Contains id, rawValue, and index for ordering
- **RecipeImage**: Stored as base64 data in CloudKit records

### Component Structure
- **App.tsx**: Root component handling CloudKit authentication state and recipe fetching
- **RecipeList.tsx**: Displays grid of recipe cards (limited to first 10 recipes)
- **RecipeCard.tsx**: Individual recipe card with thumbnail image and expandable detail view
- **RecipeDetail.tsx**: Expanded view showing ingredients list and instructions with loading states

### State Management
- Uses React hooks (useState, useEffect) for local component state
- Authentication state managed through global variables in `src/cloudkit.ts`
- No global state management library (Redux, Zustand, etc.) currently implemented

### CloudKit Data Fetching Pattern
All CloudKit operations use async/await pattern with error handling:
- `fetchRecords()` - Gets all recipes
- `fetchRecipeIngredients(recipeID)` - Gets ingredients for specific recipe
- `fetchRecipeInstructions(recipeID)` - Gets ordered instructions for specific recipe
- `fetchRecipeImages(recipeID)` - Gets base64 image data for recipe

### Styling Approach
- Inline CSS-in-JS styling used throughout components
- No CSS framework or styled-components library
- Custom CSS properties defined as React.CSSProperties objects

### File Organization
- `/src/types/` - TypeScript type definitions
- `/src/stories/` - Storybook component stories and assets
- `/src/context/` - Empty directory (likely planned for future context providers)

## Important Notes

### CloudKit Configuration
- API key is hardcoded in `src/cloudkit.ts` (marked as potentially concerning by developers)
- Currently configured for development environment
- Uses iCloud.com.bfwalton.saucier container identifier

### Authentication Flow
- App renders Apple Sign-in/Sign-out buttons on load
- CloudKit authentication state tracked via global `isAuthenticated` boolean
- Recipe list only renders when user is authenticated

### Data Loading
- Recipes load on initial authentication
- Recipe details (ingredients/instructions) load on-demand when cards are expanded
- Images fetched separately and displayed as base64 data URLs

### Browser Compatibility
- Requires CloudKit JS library to be loaded globally
- Uses modern React 19 features