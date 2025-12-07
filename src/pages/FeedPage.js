import Body from "../components/Body";
import GiftList from "../components/GiftList";

export default function FeedPage() {
  return (
    <Body sidebar>
      <GiftList userid={null} content='mine'/>
    </Body>
  );
}


