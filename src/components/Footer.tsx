import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
  ShieldCheck,
  Building,
  Mail,
  Phone,
  ChevronRight,
  ExternalLink,
  Award,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, isAuthenticated } = useAuth();

  return (
    <footer className="bg-[#0B192C] text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="space-y-3">
            <BrandLogo size="md" variant="light" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Nepal’s premier transparent fixed-yield investment platform. Empowering retail & institutional investors with automated daily returns in NPR.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400/80 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>NRB AML Compliant & Bank-Grade Security</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Investment Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('plans')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Fixed Return Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('faq')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Profit Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate(isAuthenticated ? 'referrals' : 'register')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Partner & Referral Program
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('faq')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Knowledge Base & FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Legal & Transparency
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigate('terms')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('privacy')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('legal')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Risk Disclosure Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('support')}
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" /> Customer Grievance Cell
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Corporate Office
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Level 4, Trade Tower, Putalisadak, Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>support@capitalnestnepal.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>+977 1-4428900 / 9801234567</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
