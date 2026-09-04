import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  PhoneCall,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

export const SafetyCenterView: React.FC = () => {
  const { currentCustomer, refreshData, addToast } = useApp();
  const [submitting, setSubmitting] = useState(false);

  if (!currentCustomer) return null;

  const isPaused = currentCustomer.safetyStatus === 'HOLD_ACTIVE';

  const handleEmergencyPause = async () => {
    setSubmitting(true);
    try {
      if (isPaused) {
        await api.resumeSafety(currentCustomer.id);
        addToast('Account safety shield active. Regular banking services resumed.', 'success');
      } else {
        await api.emergencyPause(currentCustomer.id);
        addToast('Emergency Safeguard Freeze Active: Outbound payments safely held.', 'warn');
      }
      await refreshData();
    } catch (err) {
      console.error('Safety toggle failed:', err);
      addToast('Action failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="safety_center_view">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              EMERGENCY SAFEGUARDS
            </span>
            <span className="text-xs text-slate-500">24/7 Digital Banking Defense</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
            Senior Safety Center & Emergency Controls
          </h2>
          <p className="text-xs text-slate-500">
            Immediate account freeze controls, official helplines, and social engineering defense guides.
          </p>
        </div>

        {/* Emergency Freeze Button */}
        <button
          onClick={handleEmergencyPause}
          disabled={submitting}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
            isPaused
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
          }`}
        >
          {isPaused ? (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Resume Normal Banking Services</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-5 h-5" />
              <span>1-Click Emergency Outbound Freeze</span>
            </>
          )}
        </button>
      </div>

      {/* Status Warning Banner */}
      {isPaused && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Safety Hold Active on Account</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Outbound digital transfers are paused to prevent fraudulent drain. You can safely receive incoming money.
              Click the button above to resume when you feel safe.
            </p>
          </div>
        </div>
      )}

      {/* Helpline Contact Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <PhoneCall className="w-4 h-4" />
              <span>GOVERNMENT OF INDIA CYBER CRIME PREVENTION HELPLINE</span>
            </div>
            <h3 className="text-2xl font-black font-heading">
              National Cyber Fraud Helpline: Dial 1930
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              If you or a senior family member has been coerced into making an unauthorized payment, dial <strong>1930</strong> immediately. Reporting within 2–4 hours allows cyber police to freeze funds at the receiving bank before fraudsters withdraw them.
            </p>
          </div>

          <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3">
            <a
              href="tel:1930"
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl text-center transition-colors shadow-xs"
            >
              Call 1930 (Toll-Free 24x7)
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>National Cyber Crime Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Senior Protection Protocol Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 font-heading">
          The 4 Golden Rules for Senior Digital Banking
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-sm font-bold text-slate-900">The "Pause & Call Family" Rule</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scammers thrive on artificial panic: *"Your electricity will be cut in 10 minutes"* or *"Police are issuing an arrest warrant"*. Always hang up and call your son, daughter, or trusted neighbor first. Real institutions will NEVER mind you verifying.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-sm font-bold text-slate-900">Never Install Screen-Sharing Apps</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If any caller directs you to install <strong>AnyDesk, TeamViewer, or QuickSupport</strong>, they are trying to see your screen and intercept your SMS OTPs. No bank official will ever ask you to install third-party software.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-sm font-bold text-slate-900">Banks Never Update KYC via SMS Links</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Messages threatening that your account or debit card is blocked due to pending KYC are 100% fake. If in doubt, walk to your local physical bank branch with your passbook. Never click APK download links.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h4 className="text-sm font-bold text-slate-900">Receiving Money NEVER Requires Entering Your UPI PIN</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your UPI PIN is ONLY entered when money is LEAVING your account. If someone claims they are sending you a refund, lottery prize, or army advance and asks for your PIN, it is a debit trap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
