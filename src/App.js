import Container from 'react-bootstrap/Container';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApiProvider from './contexts/ApiProvider';
import FlashProvider from './contexts/FlashProvider';
import UserProvider from './contexts/UserProvider';
import { ThemeProvider } from './contexts/ThemeProvider'; // <--- Import here

import FeedPage from './pages/FeedPage';
import MyGiftPage from './pages/MyGiftPage';
import GiftsBoughtPage from './pages/GiftsBoughtPage';
import SearchGiftPage from './pages/SearchGiftPage';

import ShoppingListPage from './pages/ShoppingListPage';
import ShoppingReceiptPage from './pages/ShoppingReceiptPage';

import TaskDashboardPage from './pages/TaskDashboardPage';
import TaskLogsPage from './pages/TaskLogsPage';
import TaskStatsPage from './pages/TaskStatsPage';

import BudgetPage from './pages/BudgetPage';
import AccountDetailPage from './pages/AccountDetailPage';
import BudgetDashboard from './pages/BudgetDashboard';
import LoanDashboard from './pages/LoanDashboard';
import FinanceImportPage from './pages/FinanceImportPage';
import FinanceAnalyticsPage from './pages/FinanceAnalyticsPage';
import VendorManagementPage from './pages/VendorManagementPage';

import RecipeDashboardPage from './pages/RecipeDashboardPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import MealPlannerPage from './pages/MealPlannerPage';

import MasterDictionaryPage from './pages/MasterDictionaryPage';
import PriceTrackerPage from './pages/PriceTrackerPage';

import ExplorePage from './pages/ExplorePage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';


export default function App() {
  return (
    <div className="App">
      <BrowserRouter basename="/">
        <FlashProvider>
          <ApiProvider>
            <UserProvider>
              <ThemeProvider> {/* <--- Wraps the Routes now */}
                <Routes>
                  <Route path="/login" element={
                    <PublicRoute><LoginPage /></PublicRoute>
                  } />
                  <Route path="/register" element={
                    <PublicRoute><RegistrationPage /></PublicRoute>
                  } />
                  <Route path="*" element={
                    <PrivateRoute>
                      <Routes>
                        <Route path="/" element={<FeedPage />} />

                        <Route path="/my_gift" element={<MyGiftPage />} />
                        <Route path="/gifts_bought" element={<GiftsBoughtPage />} />
                        <Route path="/search_gifts" element={<SearchGiftPage />} />

                        <Route path="/shopping_list" element={<ShoppingListPage />} />
                        <Route path="/shopping_receipts" element={<ShoppingReceiptPage />} />
                        <Route path="/grocery-dictionary" element={<MasterDictionaryPage />} />
                        <Route path="/price-tracker" element={<PriceTrackerPage />} />

                        <Route path="/my_task" element={<TaskDashboardPage />} />
                        <Route path="/log_tasks" element={<TaskLogsPage />} />
                        <Route path="/task_stats" element={<TaskStatsPage />} />

                        <Route path="/budget" element={<BudgetPage />} />
                        <Route path="/budget/dashboard" element={<BudgetDashboard />} />
                        <Route path="/budget/account/:accountId" element={<AccountDetailPage />} />
                        <Route path="/loan/dashboard" element={<LoanDashboard />} />
                        <Route path="/csv-importer" element={<FinanceImportPage />} />
                        <Route path="/budget/analytics" element={<FinanceAnalyticsPage />} />
                        <Route path="/vendors" element={<VendorManagementPage />} />

                        <Route path="/recipes" element={<RecipeDashboardPage />} />
                        <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
                        <Route path="/meals" element={<MealPlannerPage />} />

                        <Route path="/explore/:userid" element={<ExplorePage />} />
                        <Route path="/user/:username" element={<UserPage />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </PrivateRoute>
                  } />
                </Routes>
              </ThemeProvider>
            </UserProvider>
          </ApiProvider>
        </FlashProvider>
      </BrowserRouter>
    </div>
  );
}
