import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { CustomerNavigation } from './components/customer/CustomerNavigation';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { SendMoney } from './components/customer/SendMoney';
import { ScamAnalyzer } from './components/customer/ScamAnalyzer';
import { TransactionsView } from './components/customer/TransactionsView';
import { BeneficiariesView } from './components/customer/BeneficiariesView';
import { SafetyCenterView } from './components/customer/SafetyCenterView';
import { BankDashboard } from './components/bank/BankDashboard';
import { DemoScenariosView } from './components/demo/DemoScenariosView';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, customerTab, toasts, dismissToast, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Initializing GuardianPay AI Safety Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {activeView === 'CUSTOMER' && (
          <div>
            <CustomerNavigation />
            {customerTab === 'dashboard' && <CustomerDashboard />}
            {customerTab === 'send' && <SendMoney />}
            {customerTab === 'scam-analyzer' && <ScamAnalyzer />}
            {customerTab === 'transactions' && <TransactionsView />}
            {customerTab === 'beneficiaries' && <BeneficiariesView />}
            {customerTab === 'safety-center' && <SafetyCenterView />}
          </div>
        )}

        {activeView === 'BANK' && <BankDashboard />}

        {activeView === 'DEMO' && <DemoScenariosView />}
      </main>

      {/* Global Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-medium transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-white text-emerald-950 border-emerald-200 shadow-emerald-500/10'
                : toast.type === 'warn'
                ? 'bg-white text-amber-950 border-amber-200 shadow-amber-500/10'
                : toast.type === 'error'
                ? 'bg-white text-rose-950 border-rose-200 shadow-rose-500/10'
                : 'bg-white text-slate-900 border-slate-200 shadow-slate-500/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug">{toast.msg}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
