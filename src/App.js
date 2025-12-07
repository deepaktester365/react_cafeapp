import Container from 'react-bootstrap/Container';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApiProvider from './contexts/ApiProvider';
import FlashProvider from './contexts/FlashProvider';
import UserProvider from './contexts/UserProvider';
import Header from './components/Header';
import FeedPage from './pages/FeedPage';
import MyGiftPage from './pages/MyGiftPage';

import ShoppingListPage from './pages/ShoppingListPage';
import ShoppingItemPage from './pages/ShoppingItemPage';

import SearchGiftPage from './pages/SearchGiftPage';
import ExplorePage from './pages/ExplorePage';
import UserPage from './pages/UserPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';


export default function App() {
  return (
    <Container fluid className="App">
      <BrowserRouter>
        <FlashProvider>
          <ApiProvider>
            <UserProvider>
              <Header />
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
                      <Route path="/shopping_list" element={<ShoppingListPage />} />
                      <Route path="/shopping_item/:itemid" element={<ShoppingItemPage />} />

                      <Route path="/search_gift/:userid" element={<SearchGiftPage />} />
                      <Route path="/explore/:userid" element={<ExplorePage />} />
                      <Route path="/user/:username" element={<UserPage />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </PrivateRoute>
                } />
              </Routes>
            </UserProvider>
          </ApiProvider>
        </FlashProvider>
      </BrowserRouter>
    </Container>
  );
}


