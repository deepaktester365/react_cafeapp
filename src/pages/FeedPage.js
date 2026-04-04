import Body from "../components/Body";
import GiftContainer from "../components/gifts/GiftContainer";

export default function FeedPage() {
  return (
    <Body sidebar>
      <GiftContainer userid={null} content='mine'/>
    </Body>
  );
}


