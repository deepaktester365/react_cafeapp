import Body from "../components/Body";
import ShoppingList from "../components/ShoppingList";

export default function ShoppingListPage() {
  return (
    <Body sidebar>
      <ShoppingList write={true}/>
    </Body>
  );
}


