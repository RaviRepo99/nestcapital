import React from 'react';
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
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { PlansPage } from './pages/PlansPage';
import { WalletPage } from './pages/WalletPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';
import { SettingsPage } from './pages/SettingsPage';
import { FAQPage } from './pages/FAQPage';
import { LegalPage } from './pages/LegalPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

const AppContent: React.FC = () => {
  const { currentRoute, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status" aria-label="Loading CapitalNest">
        <div className="flex flex-col items-center gap-4">
          <img src="/capitalnest.png" alt="CapitalNest Nepal" className="w-56 max-w-[70vw] object-contain" />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Loading your secure account...
          </div>
        </div>
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
    currentRoute === 'forgot-password';

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
            {renderCurrentPage()}
          </main>
        </div>
      ) : (
        // Public/Landing Layout
        <main className="flex-1 w-full pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {renderCurrentPage()}
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
