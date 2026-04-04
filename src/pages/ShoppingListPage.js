import Body from "../components/Body";
import ShoppingContainer from "../components/shopping/ShoppingContainer";

export default function ShoppingListPage() {
  return (
    <Body sidebar>
      <ShoppingContainer write={true}/>
    </Body>
  );
}


