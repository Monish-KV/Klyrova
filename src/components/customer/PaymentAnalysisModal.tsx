import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { RiskAnalysisResult, TelemetryPayload } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  UserX,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: RiskAnalysisResult | null;
  paymentData: TelemetryPayload | null;
  onPaymentSuccess: () => void;
}

export const PaymentAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  analysis,
  paymentData,
  onPaymentSuccess,
}) => {
  const { currentCustomer, refreshData, addToast, setCustomerTab } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [interventionResult, setInterventionResult] = useState<{
    outcome: 'HELD' | 'VERIFIED';
    headline: string;
    message: string;
    guidance?: string[];
  } | null>(null);

  if (!isOpen || !analysis || !paymentData || !currentCustomer) return null;

  const handleAnswerManipulation = async (answer: 'YES' | 'NO' | 'NOT_SURE') => {
    setSubmitting(true);
    try {
      if (answer === 'YES' || answer === 'NOT_SURE') {
        const res = await api.submitIntervention({
          customerId: currentCustomer.id,
          transactionData: paymentData,
          manipulationAnswer: answer,
        });
        setInterventionResult(res);
        await refreshData();
        addToast(
          answer === 'YES'
            ? 'Protective Hold Activated: Funds remain safe in your account.'
            : 'Payment Paused for Independent Verification.',
          'warn'
        );
      } else {
        // Answer is NO - Voluntary payment confirmed
        if (analysis.transactionId) {
          await api.confirmTransaction(analysis.transactionId, {
            pinEntered: true,
            verifiedLegitimate: true,
          });
        } else {
          await api.createTransaction({
            ...paymentData,
            forceStatus: 'COMPLETED',
          });
        }
        addToast(`Payment of ₹${paymentData.amount.toLocaleString('en-IN')} completed successfully.`, 'success');
        await refreshData();
        onPaymentSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Manipulation response failed:', err);
      addToast('Error processing response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectConfirm = async () => {
    setSubmitting(true);
    try {
      if (analysis.transactionId) {
        if (analysis.tier === 'CRITICAL' || analysis.tier === 'HIGH') {
          addToast('Protective Hold Instituted: Transaction held by safety protocol.', 'warn');
        } else {
          await api.confirmTransaction(analysis.transactionId, { pinEntered: true });
          addToast(`Payment of ₹${paymentData.amount.toLocaleString('en-IN')} sent successfully`, 'success');
        }
      } else {
        await api.createTransaction({
          ...paymentData,
          forceStatus: analysis.tier === 'CRITICAL' ? 'HELD' : 'COMPLETED',
        });
        addToast(
          analysis.tier === 'CRITICAL'
            ? 'Protective Hold Instituted'
            : `Payment of ₹${paymentData.amount.toLocaleString('en-IN')} sent successfully`,
          analysis.tier === 'CRITICAL' ? 'warn' : 'success'
        );
      }
      await refreshData();
      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to confirm transaction:', err);
      addToast('Failed to complete transaction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getTierBadge = () => {
    switch (analysis.tier) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: ShieldAlert,
          title: 'CRITICAL RISK DETECTED',
          border: 'border-rose-300',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          title: 'HIGH RISK DETECTED',
          border: 'border-amber-300',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: AlertTriangle,
          title: 'MODERATE RISK DETECTED',
          border: 'border-yellow-300',
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: ShieldCheck,
          title: 'LOW RISK (SAFE)',
          border: 'border-emerald-300',
        };
    }
  };

  const badge = getTierBadge();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      id="payment_analysis_modal"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Intervention Result View */}
        {interventionResult ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  GUARDIANPAY SAFETY HOLD INSTITUTED
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{interventionResult.headline}</h3>
                <p className="text-xs text-slate-500">Funds remain safely untouched in your bank account.</p>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 text-slate-800 text-sm leading-relaxed">
              <p>{interventionResult.message}</p>
            </div>

            {interventionResult.guidance && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recommended Next Steps:</h4>
                <ul className="space-y-2">
                  {interventionResult.guidance.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                  <span>National Cyber Crime Reporting Helpline</span>
                </div>
                <span className="text-xl font-extrabold text-white tracking-wider">Dial 1930</span>
              </div>
              <a
                href="tel:1930"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Call Helpline Now
              </a>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  onClose();
                  setCustomerTab('transactions');
                }}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                View in Audit History
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Top Bar Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Payment Safety Check</h3>
                  <p className="text-xs text-slate-400">Multi-Factor Forensic Telemetry Assessment</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                {badge.title}
              </div>
            </div>

            {/* Score & Payment Summary Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Score Dial */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div
                    className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-4 ${
                      analysis.totalScore >= 80
                        ? 'border-rose-500 text-rose-700'
                        : analysis.totalScore >= 60
                        ? 'border-amber-500 text-amber-700'
                        : analysis.totalScore >= 30
                        ? 'border-yellow-500 text-yellow-700'
                        : 'border-emerald-500 text-emerald-700'
                    }`}
                  >
                    <span className="text-xl font-black leading-none">{analysis.totalScore}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">/ 100</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calculated Risk</span>
                    <p className="text-xs font-bold text-slate-900">{analysis.action}</p>
                  </div>
                </div>

                {/* Amount & Beneficiary */}
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transfer Amount:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{paymentData.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {paymentData.recipientName} ({paymentData.recipientUpi})
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Customer Habitual Limit:</span>
                    <span className="text-blue-700 font-semibold">
                      ₹{currentCustomer.habitualMaxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Explainable Factor Breakdown */}
            <div className="p-6 space-y-4 max-h-[280px] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Telemetry Factor Evaluation (0 – 100 Scale)
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Explainable Forensic Breakdown</span>
              </div>

              <div className="space-y-2.5">
                {analysis.factors.map((factor) => (
                  <div
                    key={factor.id}
                    className={`p-3 rounded-xl border transition-all text-xs ${
                      factor.triggered
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {factor.triggered ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className={`font-bold ${factor.triggered ? 'text-rose-950' : 'text-slate-800'}`}>
                          {factor.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          factor.triggered ? 'bg-rose-200/70 text-rose-900' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        +{factor.score} / {factor.maxScore} pts
                      </span>
                    </div>
                    <p className={`text-[11px] ml-6 ${factor.triggered ? 'text-rose-800 font-medium' : 'text-slate-500'}`}>
                      {factor.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* THE CRITICAL MANIPULATION CHECK INTERVENTION */}
            {analysis.tier === 'CRITICAL' || analysis.tier === 'HIGH' ? (
              <div className="p-6 bg-amber-50/90 border-t border-amber-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      GUARDIANPAY SIGNATURE INTERVENTION
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      "Did someone ask you to make this payment urgently?"
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Scammers frequently pose as bank representatives, electricity board staff, or police officials,
                      pressuring victims to send money before they can consult friends or family.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    id="manipulation_answer_yes"
                    disabled={submitting}
                    onClick={() => handleAnswerManipulation('YES')}
                    className="flex items-center justify-center gap-2 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>YES, someone asked me</span>
                  </button>

                  <button
                    id="manipulation_answer_not_sure"
                    disabled={submitting}
                    onClick={() => handleAnswerManipulation('NOT_SURE')}
                    className="flex items-center justify-center gap-2 p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>I'M NOT SURE / Uneasy</span>
                  </button>

                  <button
                    id="manipulation_answer_no"
                    disabled={submitting}
                    onClick={() => handleAnswerManipulation('NO')}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>NO, this is voluntary</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Low / Moderate Risk confirmation */
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  id="confirm_safe_payment_btn"
                  disabled={submitting}
                  onClick={handleDirectConfirm}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <span>Authorize & Transfer ₹{paymentData.amount.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
