import { useParams } from 'react-router-dom';
import Body from "../components/Body";
import GiftContainer from "../components/gifts/GiftContainer";

export default function ExplorePage() {
  const { userid } = useParams();
  return (
    <Body sidebar>
      <GiftContainer userid={userid}/>
    </Body>
  );
}

