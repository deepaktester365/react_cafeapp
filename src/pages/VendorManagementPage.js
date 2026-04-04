import Body from "../components/Body";
import VendorManager from "../components/budget/VendorManager";

export default function VendorManagementPage() {
  return (
    <Body sidebar>
      {/* The component handles its own Container, Search bar,
        and Leaderboard UI internally!
      */}
      <VendorManager />
    </Body>
  );
}
