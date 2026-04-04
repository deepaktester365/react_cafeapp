import Body from "../components/Body";
import GiftContainer from "../components/gifts/GiftContainer";

export default function GiftsBoughtPage() {
  return (
    <Body sidebar>
      <GiftContainer username={null} content='bought'/>
    </Body>
  );
}
