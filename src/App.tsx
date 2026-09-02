import React, { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { DesktopSidebar } from './components/DesktopSidebar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/ToastContainer';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { InvestModal } from './components/InvestModal';
import { KYCModal } from './components/KYCModal';
import { LiveChatModal } from './components/LiveChatModal';

// Pages
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage').then((module) => ({ default: module.EmailVerificationPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage').then((module) => ({ default: module.InvestmentsPage })));
const PlansPage = lazy(() => import('./pages/PlansPage').then((module) => ({ default: module.PlansPage })));
const WalletPage = lazy(() => import('./pages/WalletPage').then((module) => ({ default: module.WalletPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((module) => ({ default: module.TransactionsPage })));
const ReferralsPage = lazy(() => import('./pages/ReferralsPage').then((module) => ({ default: module.ReferralsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((module) => ({ default: module.SupportPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then((module) => ({ default: module.FAQPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((module) => ({ default: module.LegalPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })));

const AppContent: React.FC = () => {
  const { currentRoute, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status" aria-label="Loading">
        <span className="h-7 w-7 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (currentRoute === 'admin-login') {
    return <AdminLoginPage />;
  }

  if (currentRoute === 'admin' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <ToastContainer />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end">
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition">
            Sign Out
          </button>
        </div>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-12">
          <AdminPage />
        </main>
      </div>
    );
  }

  // Pages that don't need sidebar / full dashboard shell
  const isAuthPage =
    currentRoute === 'login' ||
    currentRoute === 'register' ||
    currentRoute === 'email-verification' ||
    currentRoute === 'forgot-password' ||
    currentRoute === 'reset-password';

  // Render current view
  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'home':
        return <LoginPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'email-verification':
        return <EmailVerificationPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'reset-password':
        return <ResetPasswordPage />;
      case 'dashboard':
        return isAuthenticated ? <DashboardPage /> : <LoginPage />;
      case 'investments':
        return isAuthenticated ? <InvestmentsPage /> : <LoginPage />;
      case 'plans':
        return <PlansPage />;
      case 'wallet':
        return isAuthenticated ? <WalletPage /> : <LoginPage />;
      case 'transactions':
        return isAuthenticated ? <TransactionsPage /> : <LoginPage />;
      case 'referrals':
        return isAuthenticated ? <ReferralsPage /> : <LoginPage />;
      case 'profile':
        return isAuthenticated ? <ProfilePage /> : <LoginPage />;
      case 'notifications':
        return isAuthenticated ? <NotificationsPage /> : <LoginPage />;
      case 'support':
        return <SupportPage />;
      case 'settings':
        return isAuthenticated ? <SettingsPage /> : <LoginPage />;
      case 'faq':
        return <FAQPage />;
      case 'terms':
        return <LegalPage initialTab="terms" />;
      case 'privacy':
        return <LegalPage initialTab="privacy" />;
      case 'legal':
        return <LegalPage initialTab="risk" />;
      case 'admin':
        return isAuthenticated ? <AdminPage /> : <LoginPage />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Offline Status */}
      <OfflineIndicator />

      {/* Toasts */}
      <ToastContainer />

      {/* Top Header */}
      <Header />

      {/* Main Layout Area */}
      {isAuthenticated && !isAuthPage ? (
        // Authenticated App Shell with Desktop Sidebar + Content
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
          <DesktopSidebar />
          <main className="flex-1 min-w-0 pb-20 md:pb-8">
            <Suspense fallback={<PageLoading />}>{renderCurrentPage()}</Suspense>
          </main>
        </div>
      ) : (
        // Public/Landing Layout
        <main className="flex-1 w-full pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Suspense fallback={<PageLoading />}>{renderCurrentPage()}</Suspense>
          </div>
        </main>
      )}

      {/* Global Modals */}
      <DepositModal />
      <WithdrawModal />
      <InvestModal />
      <KYCModal />
      <LiveChatModal />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const PageLoading: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <span className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
  </div>
);
