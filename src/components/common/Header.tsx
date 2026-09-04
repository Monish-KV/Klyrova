import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  UserCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  PhoneCall,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    customers,
    currentCustomer,
    setCurrentCustomerId,
    bankMetrics,
    setCustomerTab,
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" id="main_header">
      {/* Sandbox Demo Top Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800" id="sandbox_banner">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            DEMONSTRATION SANDBOX
          </span>
          <span className="hidden sm:inline text-slate-400">
            All customer accounts, UPI endpoints & transactions are 100% synthetic for demonstration safety.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            GuardianPay Shield v2.4 Active
          </span>
          <span className="hidden md:inline">Innovation Unbound @ VIT Chennai</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('CUSTOMER')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
                  GuardianPay<span className="text-blue-600">.AI</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Senior Safety Layer
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Detect. Warn. Protect.
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold" id="view_switcher">
            <button
              id="tab_customer_portal"
              onClick={() => setActiveView('CUSTOMER')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg transition-all ${
                activeView === 'CUSTOMER'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Customer Safety</span>
            </button>

            <button
              id="tab_bank_operations"
              onClick={() => setActiveView('BANK')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg transition-all relative ${
                activeView === 'BANK'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Bank Operations</span>
              {bankMetrics && bankMetrics.activeHoldsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {bankMetrics.activeHoldsCount}
                </span>
              )}
            </button>

            <button
              id="tab_judge_demo"
              onClick={() => setActiveView('DEMO')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg transition-all ${
                activeView === 'DEMO'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline font-bold">1-Click Demos</span>
              <span className="sm:hidden font-bold">Demo</span>
            </button>
          </div>

          {/* Persona Selector (when in Customer view) */}
          <div className="flex items-center gap-3">
            {activeView === 'CUSTOMER' && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Persona:</span>
                <select
                  id="persona_dropdown"
                  value={currentCustomer?.id || ''}
                  onChange={(e) => setCurrentCustomerId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.age}y) — {c.habitualMaxAmount > 20000 ? 'Tech' : c.habitualMaxAmount > 10000 ? 'Teacher' : 'Senior'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Helpline quick link */}
            <button
              id="header_helpline_btn"
              onClick={() => {
                setActiveView('CUSTOMER');
                setCustomerTab('safety-center');
              }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              title="Cyber Fraud Helpline 1930"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              <span>1930 Helpline</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
