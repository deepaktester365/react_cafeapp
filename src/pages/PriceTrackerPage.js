import Body from "../components/Body";
import PriceTracker from "../components/shopping/PriceTracker";

export default function PriceTrackerPage() {
  return (
    <Body sidebar>
      {/* The component handles its own Container, Search bar,
        and Leaderboard UI internally!
      */}
      <PriceTracker />
    </Body>
  );
}
