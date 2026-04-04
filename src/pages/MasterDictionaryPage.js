import Body from "../components/Body";
import MasterDictionary from "../components/shopping/MasterDictionary";

export default function MasterDictionaryPage() {
  return (
    <Body sidebar>
      {/* The component handles its own Container, API fetching,
        and state management internally!
      */}
      <MasterDictionary />
    </Body>
  );
}
