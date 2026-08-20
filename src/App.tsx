import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { AuthProvider } from './context/AuthContext'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryFormPage } from './pages/CategoryFormPage'
import { CreateMerchantPage } from './pages/CreateMerchantPage'
import { CreateOfferPage } from './pages/CreateOfferPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditMerchantPage } from './pages/EditMerchantPage'
import { EditOfferPage } from './pages/EditOfferPage'
import { LoginPage } from './pages/LoginPage'
import { MemberDetailPage } from './pages/MemberDetailPage'
import { MembersPage } from './pages/MembersPage'
import { MerchantDetailPage } from './pages/MerchantDetailPage'
import { MerchantOffersPage } from './pages/MerchantOffersPage'
import { MerchantsPage } from './pages/MerchantsPage'
import { OfferDetailPage } from './pages/OfferDetailPage'
import { OffersPage } from './pages/OffersPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RedemptionDetailPage } from './pages/RedemptionDetailPage'
import { RedemptionsPage } from './pages/RedemptionsPage'
import { ReviewDetailPage } from './pages/ReviewDetailPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'

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
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/:id" element={<MemberDetailPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
              <Route path="/redemptions" element={<RedemptionsPage />} />
              <Route path="/redemptions/:id" element={<RedemptionDetailPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/reviews/:id" element={<ReviewDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/create" element={<CategoryFormPage />} />
              <Route path="/categories/:id/edit" element={<CategoryFormPage />} />
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
