import Body from "../components/Body";
import AnalyticsDashboard from "../components/budget/AnalyticsDashboard";

export default function FinanceAnalyticsPage() {
  return (
    <Body sidebar>
      {/* The component handles its own Container, Search bar,
        and Leaderboard UI internally!
      */}
      <AnalyticsDashboard />
    </Body>
  );
}
