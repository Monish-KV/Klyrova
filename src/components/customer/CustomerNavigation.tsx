import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Send,
  ShieldCheck,
  History,
  Users,
  SearchCode,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const CustomerNavigation: React.FC = () => {
  const { customerTab, setCustomerTab, currentCustomer, customers, setCurrentCustomerId } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Safety Overview', icon: LayoutDashboard },
    { id: 'send', label: 'Send Money', icon: Send },
    { id: 'scam-analyzer', label: 'Scam Analyzer', icon: SearchCode },
    { id: 'transactions', label: 'Transaction Audit', icon: History },
    { id: 'beneficiaries', label: 'Trusted Contacts', icon: Users },
    { id: 'safety-center', label: 'Safety Center', icon: ShieldAlert },
  ] as const;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Customer Persona Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={currentCustomer?.avatar}
              alt={currentCustomer?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{currentCustomer?.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                  {currentCustomer?.age} yrs
                </span>
                {currentCustomer?.safetyStatus === 'HOLD_ACTIVE' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" /> Protective Hold Active
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Shield Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{currentCustomer?.persona}</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Balance: </span>
              <span className="font-bold text-slate-900">₹{currentCustomer?.balance.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Habitual Limit: </span>
              <span className="font-bold text-blue-700">₹{currentCustomer?.habitualMaxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[140px]">{currentCustomer?.registeredDevice}</span>
            </div>

            {/* Mobile switch persona */}
            <div className="lg:hidden ml-auto">
              <select
                value={currentCustomer?.id || ''}
                onChange={(e) => setCurrentCustomerId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    Switch: {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = customerTab === item.id;
            return (
              <button
                key={item.id}
                id={`customer_nav_${item.id}`}
                onClick={() => setCustomerTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
