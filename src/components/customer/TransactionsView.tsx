import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionRecord } from '../../types';
import {
  History,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { currentCustomer, transactions } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  if (!currentCustomer) return null;

  const customerTransactions = transactions.filter((t) => t.customerId === currentCustomer.id);
  const filtered = customerTransactions.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="transactions_audit_view">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Transaction Safety Audit History
          </h2>
          <p className="text-xs text-slate-500">
            Real-time forensic telemetry logs and security hold outcomes for {currentCustomer.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 text-xs font-semibold">
            {['ALL', 'HELD', 'COMPLETED', 'BLOCKED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'HELD' ? 'Holds (Paused)' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No transactions matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((txn) => (
            <div
              key={txn.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                txn.status === 'HELD'
                  ? 'border-amber-300 bg-amber-50/20'
                  : txn.status === 'BLOCKED'
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      txn.status === 'HELD'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : txn.status === 'BLOCKED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {txn.status === 'HELD' ? <Lock className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{txn.recipientName}</h3>
                      <span className="font-mono text-xs text-slate-500">({txn.recipientUpi})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>Txn ID: {txn.id}</span>
                      <span>•</span>
                      <span>
                        {new Date(txn.timestamp || txn.created_at || Date.now()).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {txn.telemetry?.device || txn.device || 'Android Device'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center lg:items-end justify-between lg:flex-col gap-2">
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    ₹{txn.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        txn.status === 'HELD'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : txn.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {txn.status === 'HELD' ? 'HOLD & VERIFY (PAUSED)' : txn.status}
                    </span>

                    {(() => {
                      const score = txn.riskScore ?? txn.risk_score ?? 0;
                      return (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            score >= 80
                              ? 'bg-rose-100 text-rose-800'
                              : score >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : score >= 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          Risk: {score}/100
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Forensics & Hold Details */}
              <div className="pt-3 text-xs space-y-2">
                {txn.holdReason && (
                  <div className="flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold">Protective Reason:</span>
                    <span>{txn.holdReason}</span>
                  </div>
                )}

                {txn.riskFactors && txn.riskFactors.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Triggered Telemetry:</span>
                    {txn.riskFactors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
