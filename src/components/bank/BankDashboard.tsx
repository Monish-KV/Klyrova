import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionRecord } from '../../types';
import { AlertDetailModal } from './AlertDetailModal';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  DollarSign,
  Users,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const BankDashboard: React.FC = () => {
  const { bankMetrics, transactions } = useApp();
  const [selectedAlert, setSelectedAlert] = useState<TransactionRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('ALL');

  const filteredAlerts = transactions.filter((t) => {
    if (filterTier === 'ALL') return true;
    if (filterTier === 'HOLDS') return t.status === 'HELD';
    return t.riskTier === filterTier;
  });

  const handleInspect = (txn: TransactionRecord) => {
    setSelectedAlert(txn);
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="bank_operations_console">
      {/* Title & Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              BANK FRAUD MONITORING CONSOLE
            </span>
            <span className="text-xs text-slate-500 font-medium">GuardianPay Central Command</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
            Safety Operations & Forensic Queue
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-factor social engineering risk scoring and hold verifications across digital banking channels.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Ingestion Live
          </span>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Prevented Fraud Amount</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            ₹{bankMetrics?.preventedFraudAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Saved before leaving customer accounts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Active Protective Holds</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {bankMetrics?.activeHoldsCount || 0}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            Pending forensic analyst review
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Senior Accounts Shielded</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {bankMetrics?.seniorAccountsProtected.toLocaleString('en-IN') || 1240}
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            Vulnerable personas actively protected
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Protection Efficacy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-heading">
            {bankMetrics?.protectionRate || 99.8}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            0 false positive account closures
          </p>
        </div>
      </div>

      {/* Alert Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Flagged Payment & Telemetry Queue</h3>
            <p className="text-xs text-slate-500">
              Click any suspicious entry to inspect device fingerprints, velocity, and manipulation checks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'ALL', label: 'All Events' },
                { id: 'HOLDS', label: 'Active Holds' },
                { id: 'CRITICAL', label: 'Critical Risk' },
                { id: 'HIGH', label: 'High Risk' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterTier(filter.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterTier === filter.id
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Customer Persona</th>
                <th className="px-5 py-3.5">Recipient UPI</th>
                <th className="px-5 py-3.5">Transfer Amount</th>
                <th className="px-5 py-3.5">Risk Score</th>
                <th className="px-5 py-3.5">System Action</th>
                <th className="px-5 py-3.5 text-right">Forensic Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No transactions matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => handleInspect(txn)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(txn.timestamp || txn.created_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{txn.customerName}</div>
                      <div className="text-[10px] text-slate-400">{txn.customerId}</div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{txn.recipientName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{txn.recipientUpi}</div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap font-mono font-extrabold text-slate-900 text-sm">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {(() => {
                        const score = txn.riskScore ?? txn.risk_score ?? 0;
                        return (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
                              score >= 80
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : score >= 60
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : score >= 30
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {score} / 100
                          </span>
                        );
                      })()}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          txn.status === 'HELD'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : txn.status === 'BLOCKED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {txn.status === 'HELD' ? <Lock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span>{txn.status === 'HELD' ? 'HOLD & VERIFY' : txn.status}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspect(txn);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Forensic Inspector Modal */}
      <AlertDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        alert={selectedAlert}
      />
    </div>
  );
};
