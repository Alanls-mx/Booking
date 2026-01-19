import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { BrandingProvider } from './contexts/BrandingContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { BookingPage } from './pages/BookingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAppointmentsPage } from './pages/AdminAppointmentsPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { CustomizationPage } from './pages/CustomizationPage';
import { AdminTeamPage } from './pages/AdminTeamPage';
import { AdminServicesPage } from './pages/AdminServicesPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminReviewsPage } from './pages/AdminReviewsPage';
import { AdminAboutPage } from './pages/AdminAboutPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { AboutPage } from './pages/AboutPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminLegalPages } from './pages/AdminLegalPages';
import { AdminIntegrationsPage } from './pages/AdminIntegrationsPage';
import { AdminDocsPage } from './pages/AdminDocsPage';
import { AdminLocationsPage } from './pages/AdminLocationsPage';
import { AdminPlansPage } from './pages/AdminPlansPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { SetupPage } from './pages/SetupPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { PaymentCheckoutPage } from './pages/PaymentCheckoutPage';
import api from '../api/client';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function StartupCheck() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await api.get('/setup/status');
        if (!response.data.isSetup && location.pathname !== '/setup') {
          navigate('/setup');
        }
      } catch (error) {
        console.error('Failed to check setup status', error);
      }
    };
    
    checkSetup();
  }, [navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <BrowserRouter>
          <StartupCheck />
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/payment/checkout" element={<PaymentCheckoutPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><Outlet /></ProtectedRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
              <Route path="/admin/clients" element={<AdminClientsPage />} />
              <Route path="/admin/customization" element={<CustomizationPage />} />
              <Route path="/admin/legal" element={<AdminLegalPages />} />
              <Route path="/admin/about" element={<AdminAboutPage />} />
              <Route path="/admin/integrations" element={<AdminIntegrationsPage />} />
              <Route path="/admin/docs" element={<AdminDocsPage />} />
              <Route path="/admin/locations" element={<AdminLocationsPage />} />
              <Route path="/admin/plans" element={<AdminPlansPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/team" element={<AdminTeamPage />} />
              <Route path="/admin/services" element={<AdminServicesPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </BrandingProvider>
  );
}
