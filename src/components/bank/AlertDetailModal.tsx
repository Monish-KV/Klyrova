import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { TransactionRecord } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Smartphone,
  Clock,
  Zap,
  UserX,
  ArrowRight,
  Shield,
  PhoneCall,
  UserCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alert: TransactionRecord | null;
}

export const AlertDetailModal: React.FC<Props> = ({ isOpen, onClose, alert }) => {
  const { refreshData, addToast, customers } = useApp();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !alert) return null;

  const customer = customers.find((c) => c.id === alert.customerId);

  const handleDecision = async (decision: 'APPROVE' | 'BLOCK' | 'HOLD') => {
    setSubmitting(true);
    try {
      await api.resolveAlert(alert.id, decision);
      await refreshData();
      addToast(
        decision === 'APPROVE'
          ? `Alert ${alert.id} approved. Funds released.`
          : decision === 'BLOCK'
          ? `Alert ${alert.id} confirmed as FRAUD. Funds protected & beneficiary flagged.`
          : `Alert ${alert.id} kept on hold for senior verification.`,
        decision === 'BLOCK' ? 'warn' : 'info'
      );
      onClose();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      addToast('Resolution failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="alert_detail_modal">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Forensic Telemetry Inspector</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                  {alert.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                GuardianPay Explainable Risk & Behavioral Telemetry Log
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              alert.riskTier === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {alert.riskTier} RISK ({alert.riskScore}/100)
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Customer & Transaction Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Column */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Target Customer Profile
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={customer?.avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'}
                  alt={alert.customerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <h4 className="font-bold text-slate-900">{alert.customerName}</h4>
                  <p className="text-slate-500">{customer?.persona || 'Senior Citizen User'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Age:</span>
                  <span className="font-semibold text-slate-800">{customer?.age || 68} years (Senior)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Habitual Limit:</span>
                  <span className="font-semibold text-blue-700">₹{customer?.habitualMaxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Known Device:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">{customer?.registeredDevice}</span>
                </div>
              </div>
            </div>

            {/* Transaction Column */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Flagged Payment Request
              </span>
              <div>
                <span className="text-slate-500">Amount:</span>
                <div className="text-2xl font-black text-rose-600 font-mono">
                  ₹{alert.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-semibold text-slate-800">{alert.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination UPI:</span>
                  <span className="font-mono text-slate-700">{alert.recipientUpi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Initiated:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(alert.timestamp || alert.created_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forensic Factor Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Behavioral & Environmental Forensic Telemetry
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Device Fingerprint</span>
                </div>
                <p className="text-slate-600 text-[11px]">{alert.telemetry?.device || alert.device || 'Android Device'}</p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    alert.telemetry?.isRecognizedDevice ?? true
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {alert.telemetry?.isRecognizedDevice ?? true ? 'Recognized Device' : 'Unregistered Hardware (+20 pts)'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Behavioral Haste / Velocity</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Completed in {alert.telemetry?.velocityTimeSeconds ?? 45}s (Average: 35s)
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    alert.telemetry?.isUnusualVelocity
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {alert.telemetry?.isUnusualVelocity ? 'Coerced Rapid Pacing (+15 pts)' : 'Normal Duration'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Beneficiary Familiarity</span>
                </div>
                <p className="text-slate-600 text-[11px]">Recipient not present in customer's trusted list.</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                  Unfamiliar Recipient (+20 pts)
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-slate-800">Temporal Anomaly</span>
                </div>
                <p className="text-slate-600 text-[11px]">Initiated outside habitual daylight banking hours.</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Off-Hours Timing (+10 pts)
                </span>
              </div>
            </div>
          </div>

          {/* Active Hold Status Note */}
          {alert.holdReason && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Active Protective Reason:</span>
              </div>
              <p className="text-amber-800">{alert.holdReason}</p>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 w-full sm:w-auto"
          >
            Close Inspector
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="bank_btn_block_fraud"
              disabled={submitting}
              onClick={() => handleDecision('BLOCK')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Confirm Fraud & Block</span>
            </button>

            <button
              id="bank_btn_approve_release"
              disabled={submitting}
              onClick={() => handleDecision('APPROVE')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Release & Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
