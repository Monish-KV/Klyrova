import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  SearchCode,
  Users,
  Lock,
  ArrowUpRight,
  Clock,
  Smartphone,
  ChevronRight,
  AlertTriangle,
  HeartHandshake,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { currentCustomer, setCustomerTab, transactions, beneficiaries } = useApp();

  if (!currentCustomer) return null;

  const customerTransactions = transactions.filter((t) => t.customerId === currentCustomer.id);
  const activeHold = customerTransactions.find((t) => t.status === 'HELD' && t.resolution === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="customer_dashboard_view">
      {/* Active Protective Hold Notification (if any) */}
      {activeHold && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                ACTIVE PROTECTION HOLD
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                ₹{activeHold.amount.toLocaleString('en-IN')} transfer to {activeHold.recipientName} is paused safely
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeHold.holdReason || 'Flagged by GuardianPay AI for urgency coercion verification.'} Funds have not left your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCustomerTab('transactions')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Review Hold Details
          </button>
        </div>
      )}

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Savings Account Balance</span>
              <span className="font-mono text-slate-400">{currentCustomer.accountNumber}</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              ₹{currentCustomer.balance.toLocaleString('en-IN')}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-slate-400">UPI ID:</span>
              <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentCustomer.upiId}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              id="dash_send_money_btn"
              onClick={() => setCustomerTab('send')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Money Safely</span>
            </button>
          </div>
        </div>

        {/* Safety Shield Baseline Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-500">GuardianPay Protection Shield</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                ACTIVE
              </span>
            </div>
            <div className="space-y-2.5 my-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Habitual Transfer Limit:</span>
                <span className="font-bold text-blue-700 font-mono">
                  ₹{currentCustomer.habitualMaxAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Active Safe Hours:</span>
                <span className="font-bold text-slate-800">
                  {currentCustomer.activeHours.start}:00 AM – {currentCustomer.activeHours.end}:00 PM
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Registered Hardware:</span>
                <span className="font-medium text-slate-800 truncate max-w-[140px]">
                  {currentCustomer.registeredDevice}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Social Engineering Defense:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> High
            </span>
          </div>
        </div>

        {/* Quick Safety Actions Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              VULNERABILITY PREVENTION
            </span>
            <h3 className="text-base font-bold mt-1">Suspect a scam or fake call?</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Paste suspicious SMS texts, electricity bills, or WhatsApp messages into the Scam Analyzer for an immediate security check.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              id="dash_scam_analyzer_btn"
              onClick={() => setCustomerTab('scam-analyzer')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <SearchCode className="w-4 h-4" />
              <span>Launch Scam Analyzer</span>
            </button>

            <button
              id="dash_safety_center_btn"
              onClick={() => setCustomerTab('safety-center')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>Safety Center & Helpline 1930</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trusted Contacts Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Transactions Audit */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Transactions & Safety Logs</h3>
              <p className="text-xs text-slate-500">Transparent audit trail of evaluated transfers</p>
            </div>
            <button
              onClick={() => setCustomerTab('transactions')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All ({customerTransactions.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {customerTransactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No transactions recorded yet for this customer profile.
            </div>
          ) : (
            <div className="space-y-3">
              {customerTransactions.slice(0, 4).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                        txn.status === 'HELD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : txn.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {txn.status === 'HELD' ? <Lock className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{txn.recipientName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{txn.recipientUpi}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(txn.timestamp || txn.created_at || Date.now()).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-extrabold text-sm text-slate-900 block font-mono">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        txn.status === 'HELD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : txn.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {txn.status === 'HELD' ? 'HOLD & VERIFY' : txn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Trusted Beneficiaries */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Trusted Directory</h3>
                <p className="text-xs text-slate-500">Pre-verified contacts</p>
              </div>
              <button
                onClick={() => setCustomerTab('beneficiaries')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {beneficiaries.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{b.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{b.upiId}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Trusted
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setCustomerTab('beneficiaries')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              + Add New Trusted Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
