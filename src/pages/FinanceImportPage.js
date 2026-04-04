import Body from "../components/Body";
import FinanceCsvImporter from "../components/budget/FinanceCsvImporter";

export default function FinanceImportPage() {
  return (
    <Body sidebar>
      {/* The component handles its own Container, Search bar,
        and Leaderboard UI internally!
      */}
      <FinanceCsvImporter />
    </Body>
  );
}
