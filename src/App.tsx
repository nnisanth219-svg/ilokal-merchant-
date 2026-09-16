import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PermissionRoute, ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { AuthProvider } from './context/AuthContext'
import { AdminUserDetailPage } from './pages/AdminUserDetailPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryFormPage } from './pages/CategoryFormPage'
import { CreateMerchantPage } from './pages/CreateMerchantPage'
import { CreateOfferPage } from './pages/CreateOfferPage'
import { DashboardPage } from './pages/DashboardPage'
import { EditMerchantPage } from './pages/EditMerchantPage'
import { EditOfferPage } from './pages/EditOfferPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { InviteAdminPage } from './pages/InviteAdminPage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AcceptInvitePage } from './pages/AcceptInvitePage'
import { MemberDetailPage } from './pages/MemberDetailPage'
import { MembersPage } from './pages/MembersPage'
import { MerchantDetailPage } from './pages/MerchantDetailPage'
import { MerchantOffersPage } from './pages/MerchantOffersPage'
import { MerchantsPage } from './pages/MerchantsPage'
import { OfferDetailPage } from './pages/OfferDetailPage'
import { OffersPage } from './pages/OffersPage'
import { RedemptionDetailPage } from './pages/RedemptionDetailPage'
import { RedemptionsPage } from './pages/RedemptionsPage'
import { ReviewDetailPage } from './pages/ReviewDetailPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/forgot" element={<ForgotPasswordPage />} />
          <Route path="/login/reset" element={<ResetPasswordPage />} />
          <Route path="/login/accept-invite" element={<AcceptInvitePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route element={<PermissionRoute />}>
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
              <Route path="/admin-users" element={<AdminUsersPage />} />
              <Route path="/admin-users/invite" element={<InviteAdminPage />} />
              <Route path="/admin-users/:id" element={<AdminUserDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
