import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  TrendingUp,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  ArrowLeftRight,
  Users,
  Bell,
  HelpCircle,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatNPR } from '../lib/utils';

export const DesktopSidebar: React.FC = () => {
  const {
    currentRoute,
    navigate,
    user,
    wallet,
    logout,
    unreadNotifications,
    setActiveModal,
  } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'investments', label: 'My Investments', icon: Layers },
    { id: 'plans', label: 'Investment Plans', icon: TrendingUp },
    { id: 'deposit', label: 'Deposit Funds', icon: ArrowDownLeft, action: () => setActiveModal('deposit') },
    { id: 'withdraw', label: 'Withdraw Funds', icon: ArrowUpRight, action: () => setActiveModal('withdraw') },
    { id: 'wallet', label: 'Wallet & Balance', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'referrals', label: 'Refer & Earn', icon: Users, badge: '5-10%' },
  ];

  const secondaryNav = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badgeCount: unreadNotifications,
    },
    { id: 'support', label: 'Support & Help', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between h-screen sticky top-0 bg-white text-slate-700 border-r border-slate-200 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          <div className="cursor-pointer overflow-hidden" onClick={() => navigate('dashboard')}>
            <BrandLogo size={isCollapsed ? 'sm' : 'md'} variant="light" showText={!isCollapsed} />
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Balance Card (when expanded) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 mt-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold mb-1">
              <span>Available Balance</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded text-[10px]">Active</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-display tracking-tight">
              {formatNPR(wallet?.availableBalance, false)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setActiveModal('deposit')}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
              </button>
              <button
                onClick={() => setActiveModal('withdraw')}
                className="py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>
          </div>
        )}

        {/* Main Nav Items */}
        <nav className="p-3 space-y-1 mt-2">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => (item.action ? item.action() : navigate(item.id))}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

        </nav>

        {/* Secondary Navigation */}
        <div className="p-3 pt-1 space-y-1 border-t border-slate-200 mx-2 mt-2">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-950 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badgeCount && item.badgeCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        <button
          onClick={() => navigate('profile')}
          title={isCollapsed ? user?.fullName : undefined}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 transition text-left ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0F284E&color=D4AF37&bold=true`
            }
            alt={user?.fullName}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400 flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          )}
        </button>

        <button
          onClick={logout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
