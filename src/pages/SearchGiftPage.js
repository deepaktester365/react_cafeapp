import { useParams } from 'react-router-dom';
import Body from "../components/Body";
import GiftList from "../components/GiftList";

export default function SearchGiftPage() {
  const { userid } = useParams();
  return (
    <Body sidebar>
      <GiftList userid={userid}/>
    </Body>
  );
}

