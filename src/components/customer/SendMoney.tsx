import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { RiskAnalysisResult, TelemetryPayload } from '../../types';
import { PaymentAnalysisModal } from './PaymentAnalysisModal';
import {
  Send,
  Sliders,
  Smartphone,
  Clock,
  Zap,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const SendMoney: React.FC = () => {
  const { currentCustomer, beneficiaries, prefillPayment, setPrefillPayment, addToast } = useApp();

  const [recipientName, setRecipientName] = useState('');
  const [recipientUpi, setRecipientUpi] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');

  // Telemetry Simulator Controls (Judges & Interactive testing)
  const [showTelemetrySim, setShowTelemetrySim] = useState(true);
  const [isKnownDevice, setIsKnownDevice] = useState(true);
  const [transactionHour, setTransactionHour] = useState(14); // 2 PM default
  const [completionTimeSeconds, setCompletionTimeSeconds] = useState(35);
  const [hasRecentScamAlert, setHasRecentScamAlert] = useState(false);

  // Analysis & Modal state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [activePaymentPayload, setActivePaymentPayload] = useState<TelemetryPayload | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Handle prefill if directed from Demo view or Quick Pay
  useEffect(() => {
    if (prefillPayment) {
      setRecipientName(prefillPayment.recipientName || '');
      setRecipientUpi(prefillPayment.recipientUpi || '');
      setAmount(prefillPayment.amount || '');
      if (prefillPayment.telemetry) {
        setIsKnownDevice(prefillPayment.telemetry.isKnownDevice ?? true);
        setTransactionHour(prefillPayment.telemetry.transactionHour ?? 14);
        setCompletionTimeSeconds(prefillPayment.telemetry.completionTimeSeconds ?? 35);
        setHasRecentScamAlert(prefillPayment.telemetry.hasRecentScamAlert ?? false);
      }
      setPrefillPayment(null);
    }
  }, [prefillPayment, setPrefillPayment]);

  const selectQuickBeneficiary = (ben: (typeof beneficiaries)[0]) => {
    setRecipientName(ben.name);
    setRecipientUpi(ben.upiId);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      addToast('Please enter a valid transfer amount', 'warn');
      return;
    }
    if (!recipientUpi.trim()) {
      addToast('Please enter a recipient UPI ID', 'warn');
      return;
    }

    if (numAmount > currentCustomer.balance) {
      addToast(`Amount exceeds account balance of ₹${currentCustomer.balance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    setIsAnalyzing(true);
    const payload: TelemetryPayload = {
      customerId: currentCustomer.id,
      recipientName: recipientName.trim() || recipientUpi.trim(),
      recipientUpi: recipientUpi.trim(),
      amount: numAmount,
      deviceFingerprint: isKnownDevice ? currentCustomer.registeredDevice : 'Unrecognized Device Fingerprint (Chrome/Android13)',
      isKnownDevice,
      transactionHour,
      completionTimeSeconds,
      hasRecentScamAlert: hasRecentScamAlert || currentCustomer.hasRecentScamLink,
      note,
    };

    try {
      const analysis = await api.analyzePayment(payload);
      setAnalysisResult(analysis);
      setActivePaymentPayload(payload);
      setModalOpen(true);
    } catch (err) {
      console.error('Payment analysis failed:', err);
      addToast('Payment analysis server error', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setAmount('');
    setNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="send_money_view">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">Initiate Transfer</h2>
        <p className="text-xs text-slate-500">
          Transactions are monitored in real-time by GuardianPay's explainable safety telemetry engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Payment Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          {/* Quick Trusted Contacts */}
          {beneficiaries.length > 0 && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick Select Trusted Beneficiary
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectQuickBeneficiary(b)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs text-slate-700 font-medium transition-colors shrink-0"
                  >
                    <img src={b.avatar} alt={b.name} className="w-5 h-5 rounded-full object-cover" />
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleInitiatePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Name
              </label>
              <input
                id="recipient_name_input"
                type="text"
                placeholder="e.g. Rohan Sharma or Merchant Name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient UPI ID / VPA <span className="text-rose-500">*</span>
              </label>
              <input
                id="recipient_upi_input"
                type="text"
                required
                placeholder="e.g. rohan.sharma@okaxis or 9845012345@paytm"
                value={recipientUpi}
                onChange={(e) => setRecipientUpi(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Amount (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Customer Habitual Limit: <span className="font-bold text-blue-700">₹{currentCustomer?.habitualMaxAmount.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  id="transfer_amount_input"
                  type="number"
                  required
                  min="1"
                  max={currentCustomer?.balance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Rent, Grocery, Urgent bill"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                id="submit_payment_btn"
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    <span>Analyzing Multi-Factor Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Run Safety Analysis & Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Behavioral Telemetry Simulator Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Behavioral Telemetry Simulator
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Judge Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Tweak behavioral and environmental variables below to see how GuardianPay AI's explainable risk engine dynamically evaluates risk before funds leave the account.
            </p>

            <div className="space-y-4 text-xs">
              {/* Device Fingerprint Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-200 block">Device Fingerprint</span>
                    <span className="text-[10px] text-slate-400">
                      {isKnownDevice ? 'Registered Galaxy Phone' : 'Unrecognized Browser / Device (+20 pts)'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="toggle_device_sim"
                  onClick={() => setIsKnownDevice(!isKnownDevice)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    isKnownDevice
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isKnownDevice ? 'Recognized' : 'Unrecognized'}
                </button>
              </div>

              {/* Transaction Hour Slider */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-200">Time of Day</span>
                  </div>
                  <span className="font-mono font-bold text-blue-400">
                    {transactionHour}:00 ({transactionHour < 7 || transactionHour >= 21 ? 'Off-Hours (+10 pts)' : 'Active Daytime'})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={transactionHour}
                  onChange={(e) => setTransactionHour(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Midnight (0:00)</span>
                  <span>Noon (12:00)</span>
                  <span>11 PM (23:00)</span>
                </div>
              </div>

              {/* Behavioral Velocity / Haste */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-200">Behavioral Haste & Velocity</span>
                  </div>
                  <span className="font-mono font-bold text-blue-400">
                    {completionTimeSeconds}s ({completionTimeSeconds < 15 ? 'Coerced Panic (+15 pts)' : 'Normal Deliberate'})
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={completionTimeSeconds}
                  onChange={(e) => setCompletionTimeSeconds(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>5s (Panic Coercion)</span>
                  <span>30s (Average)</span>
                  <span>60s (Slow / Careful)</span>
                </div>
              </div>

              {/* Linked to Phishing / Scam Alert */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-200 block">Threat Intelligence Link</span>
                    <span className="text-[10px] text-slate-400">
                      Recent SMS / WhatsApp phishing scan in session (+10 pts)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  id="toggle_threat_link"
                  onClick={() => setHasRecentScamAlert(!hasRecentScamAlert)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    hasRecentScamAlert
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {hasRecentScamAlert ? 'Flagged (+10)' : 'None'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Payment Safety Analysis & Manipulation Modal */}
      <PaymentAnalysisModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        analysis={analysisResult}
        paymentData={activePaymentPayload}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
