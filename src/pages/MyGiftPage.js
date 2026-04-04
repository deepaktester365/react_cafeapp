import Body from "../components/Body";
import GiftContainer from "../components/gifts/GiftContainer";

export default function MyGiftPage() {
  return (
    <Body sidebar>
      <GiftContainer username={null} content='mine' write={true} />
    </Body>
  );
}
