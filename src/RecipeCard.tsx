import { useEffect, useRef, useState } from 'react'
import { fetchRecipeImages } from './cloudkit.ts'
import RecipeDetail from './RecipeDetail.tsx';
import type { Recipe } from './types/recipe.ts';

function RecipeCard({ recipe }: { recipe: Recipe }) {

    const [recipeImage, setRecipeImage] = useState(undefined)
    const [isExpanded, setIsExpanded] = useState(false)

    const outerCardStyle: React.CSSProperties = {
        width: "80%",
        borderRadius: "20px",
        background: "gray",
        display: "flex",
        flexDirection: 'column',
        paddingLeft: "10px",
        paddingRight: "10px",
        paddingTop: "10px",
        paddingBottom: "10px"
    };

    const cardStyle: React.CSSProperties = {
        display: "flex",
        alignContent: "center",
        alignItems: "center",
    };

    const cardImageStyle: React.CSSProperties = {
        width: "100px",
        height: "100px",
        borderRadius: "20px"
    };

    useEffect(() => {
        (async () => {
            const recipeImages = await fetchRecipeImages(recipe.id)
            if (recipeImages && recipeImages.length > 0) {
                setRecipeImage(recipeImages[0])
            }
        })()
    }, [recipe])

    const image = () => {
        if (recipeImage) {
            const base64Data = recipeImage["fields"]?.["CD_imageData"]?.["value"]
            if (base64Data) {
                return (<img style={cardImageStyle} src={'data:image/jpeg;base64,' + base64Data} />)
            }
        }

        return null
    }

    const handleClick = () => {
        setIsExpanded(!isExpanded)
        console.log("EXPANDING: "+isExpanded)
    }

    return (
        <div style={outerCardStyle}>
            <div style={cardStyle} onClick={handleClick} key={recipe["recordName"]}>
                {image()}
                {JSON.stringify(recipe.name)}
            </div>
            <div>
                { isExpanded === true ? <RecipeDetail recipe={recipe}/> : null}
            </div>
        </div>
    )
}

export default RecipeCard