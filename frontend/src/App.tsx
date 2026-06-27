import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import CreateProductPage from './pages/CreateProductPage'
import ReportPage from './pages/ReportPage'
import AdminPage from './pages/AdminPage'
import OffersPage from './pages/OffersPage'
import CheckoutPage from './pages/CheckoutPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import SavedSearchesPage from './pages/SavedSearchesPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<CreateProductPage />} />
              <Route path="/products/:id/edit" element={<CreateProductPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/saved-searches" element={<SavedSearchesPage />} />
              <Route path="/dashboard" element={<SellerDashboardPage />} />
              <Route path="/checkout/:productId" element={<CheckoutPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App