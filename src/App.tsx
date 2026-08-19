import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { AuthProvider } from './context/AuthContext'
import { CreateMerchantPage } from './pages/CreateMerchantPage'
import { CreateOfferPage } from './pages/CreateOfferPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditMerchantPage } from './pages/EditMerchantPage'
import { EditOfferPage } from './pages/EditOfferPage'
import { LoginPage } from './pages/LoginPage'
import { MerchantDetailPage } from './pages/MerchantDetailPage'
import { MerchantOffersPage } from './pages/MerchantOffersPage'
import { MerchantsPage } from './pages/MerchantsPage'
import { OfferDetailPage } from './pages/OfferDetailPage'
import { OffersPage } from './pages/OffersPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/merchants" element={<MerchantsPage />} />
              <Route path="/merchants/create" element={<CreateMerchantPage />} />
              <Route path="/merchants/:id" element={<MerchantDetailPage />} />
              <Route path="/merchants/:id/edit" element={<EditMerchantPage />} />
              <Route path="/merchants/:id/offers" element={<MerchantOffersPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/offers/create" element={<CreateOfferPage />} />
              <Route path="/offers/:id" element={<OfferDetailPage />} />
              <Route path="/offers/:id/edit" element={<EditOfferPage />} />
              <Route path="/members" element={<PlaceholderPage />} />
              <Route path="/subscriptions" element={<PlaceholderPage />} />
              <Route path="/redemptions" element={<PlaceholderPage />} />
              <Route path="/reviews" element={<PlaceholderPage />} />
              <Route path="/categories" element={<PlaceholderPage />} />
              <Route path="/admin-users" element={<PlaceholderPage />} />
              <Route path="/settings" element={<PlaceholderPage />} />
              <Route path="/audit-log" element={<PlaceholderPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
