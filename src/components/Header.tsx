import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Wallet as WalletIcon,
  ChevronDown,
  Sparkles,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatNPR } from '../lib/utils';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const Header: React.FC = () => {
  const {
    user,
    wallet,
    isAuthenticated,
    unreadNotifications,
    navigate,
    logout,
    currentRoute,
    setActiveModal,
    refreshUserData,
  } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifs = async () => {
    setShowNotifMenu(!showNotifMenu);
    if (!showNotifMenu) {
      try {
        setLoadingNotifs(true);
        const data = await api.getNotifications();
        setNotifications(data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-24 flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo */}
        <div className="cursor-pointer" onClick={() => navigate(isAuthenticated ? 'dashboard' : 'login')}>
          <span className="sm:hidden">
            <BrandLogo size="md" variant="dark" />
          </span>
          <span className="hidden sm:block">
            <BrandLogo size="xl" variant="dark" />
          </span>
        </div>

        {/* Desktop Public Navigation (if not logged in) */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => navigate('plans')}
              className={`hover:text-slate-900 transition ${currentRoute === 'plans' ? 'text-amber-600 font-semibold' : ''}`}
            >
              Investment Plans
            </button>
            <button
              onClick={() => navigate('faq')}
              className={`hover:text-slate-900 transition ${currentRoute === 'faq' ? 'text-amber-600 font-semibold' : ''}`}
            >
              FAQ
            </button>
            <button
              onClick={() => navigate('support')}
              className={`hover:text-slate-900 transition ${currentRoute === 'support' ? 'text-amber-600 font-semibold' : ''}`}
            >
              Support
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {isAuthenticated ? (
            <>
              {/* Quick Wallet Balance Pill (Desktop) */}
              <button
                onClick={() => navigate('wallet')}
                className="hidden lg:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-500 font-medium">Available:</span>
                <span className="font-bold text-slate-900 font-display">
                  {formatNPR(wallet?.availableBalance, false)}
                </span>
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenNotifs}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-amber-500 rounded-full ring-2 ring-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 p-4 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm font-display text-slate-900">Notifications</h4>
                        {unreadNotifications > 0 && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                      {unreadNotifications > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto py-1">
                      {loadingNotifs ? (
                        <div className="py-6 text-center text-xs text-slate-400">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">No recent notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition rounded-xl ${
                              !n.read ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-900">{n.title}</span>
                              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowNotifMenu(false);
                        navigate('notifications');
                      }}
                      className="mt-3 w-full py-2 text-center text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition"
                    >
                      View all notifications →
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile Avatar Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 transition border border-slate-200/80 active:scale-95"
                >
                  <img
                    src={
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0B192C&color=D4AF37&bold=true`
                    }
                    alt={user?.fullName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400"
                  />
                  <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                    {user?.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                      <div className="font-bold text-sm text-slate-900 truncate">{user?.fullName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {user?.role === 'admin' ? '⚡ Administrator' : 'Investor'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> KYC {user?.kycStatus}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs font-medium">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" /> Profile & KYC
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('wallet');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                      >
                        <WalletIcon className="w-4 h-4 text-slate-500" /> My Wallet
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500" /> Security & Settings
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('support');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition text-left"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-500" /> Help & Support
                      </button>

                      <div className="pt-1 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition text-left font-semibold"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('register')}
                className="px-4 py-2 text-xs font-bold bg-[#0B192C] text-amber-400 hover:bg-[#07111F] shadow-sm rounded-xl transition active:scale-95"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
