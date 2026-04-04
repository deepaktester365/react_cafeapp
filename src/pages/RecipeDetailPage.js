import { useParams } from 'react-router-dom';
import Body from "../components/Body";
import RecipeDetailContainer from "../components/recipes/RecipeDetailContainer";

export default function RecipeDetailPage() {
  const { recipeId } = useParams();

  return (
    <Body sidebar>
      <RecipeDetailContainer recipeId={recipeId} />
    </Body>
  );
}
