import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, TrendingUp, Wallet, ArrowLeftRight, User, ShieldAlert } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigate, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'plans', label: 'Invest', icon: TrendingUp },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'transactions', label: 'History', icon: ArrowLeftRight },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // If admin, add or replace with quick admin button
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-150 relative ${
                isActive
                  ? 'text-amber-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {isActive && (
                <div className="absolute -top-[1px] w-8 h-1 bg-amber-500 rounded-full shadow-[0_2px_8px_rgba(217,119,6,0.6)]" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
