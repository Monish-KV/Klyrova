import React from 'react';
import { useApp } from '../../context/AppContext';
import { DemoScenario } from '../../types';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Lock,
  PhoneCall,
  SearchCode,
} from 'lucide-react';

export const DemoScenariosView: React.FC = () => {
  const { demoScenarios, setCurrentCustomerId, setPrefillPayment, setActiveView, setCustomerTab, addToast } = useApp();

  const handleLaunchScenario = (scenario: DemoScenario) => {
    setCurrentCustomerId(scenario.customerId);
    setPrefillPayment({
      recipientName: scenario.recipientName,
      recipientUpi: scenario.recipientUpi,
      amount: scenario.amount,
      telemetry: scenario.telemetry,
    });
    setActiveView('CUSTOMER');
    setCustomerTab('send');
    addToast(`Loaded Demo: "${scenario.title}" with pre-configured telemetry.`, 'info');
  };

  const handleLaunchScamDemo = () => {
    setActiveView('CUSTOMER');
    setCustomerTab('scam-analyzer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="judge_demo_view">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            HACKATHON EVALUATION CENTER
          </span>
          <span className="text-xs text-slate-500 font-medium">Innovation Unbound @ VIT Chennai</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
          1-Click Demonstration Scenarios
        </h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">
          Use the guided showcases below to test GuardianPay AI's core paradigm shift: moving from reactive credential validation to proactive customer manipulation detection.
        </p>
      </div>

      {/* Paradigm Shift Banner for Judges */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">
          The Problem Statement & The Paradigm Shift
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <span className="text-rose-400 font-bold block mb-1">Traditional Fraud Systems:</span>
            <p className="text-slate-300 italic mb-2">"Is this transaction credential fake or stolen?"</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Fails completely when a panicked senior citizen is coerced via fake KYC or bill threats into authorizing the payment themselves on their own phone.
            </p>
          </div>

          <div className="bg-blue-950/60 p-4 rounded-xl border border-blue-800">
            <span className="text-emerald-400 font-bold block mb-1">GuardianPay AI Prevention:</span>
            <p className="text-blue-200 italic mb-2">"Is the legitimate customer being manipulated into making this payment?"</p>
            <p className="text-blue-300 text-[11px] leading-relaxed">
              Intervenes BEFORE money leaves the account. Calculates explainable multi-factor behavioral risk and prompts the signature <strong>Manipulation Check</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-slate-900">Featured Evaluation Scenarios</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoScenarios.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.expectedTier === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : s.expectedTier === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {s.expectedTier} RISK ({s.expectedScore}/100)
                  </span>
                  <span className="text-[11px] font-bold font-mono text-slate-900">
                    ₹{s.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{s.description}</p>

                {/* Judge Context Box */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1 mb-4">
                  <span className="font-bold text-slate-800 block">Why this matters:</span>
                  <p>{s.judgeNarrative}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  id={`btn_launch_demo_${s.id}`}
                  onClick={() => handleLaunchScenario(s)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch 1-Click Demo</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Extra Scam Analyzer Showcase Card */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
              BONUS INTELLIGENCE FEATURE
            </span>
            <h3 className="text-lg font-bold">Phishing & SMS Scam Message Analyzer</h3>
            <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
              Test how GuardianPay uses Google Gemini AI (with deterministic heuristics fallback) to analyze fake electricity disconnection SMS, fake SBI KYC warnings, and malicious APK payloads with actionable senior safety advice.
            </p>
          </div>

          <button
            onClick={handleLaunchScamDemo}
            className="px-6 py-3 bg-white hover:bg-blue-50 text-blue-950 rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <SearchCode className="w-4 h-4 text-blue-600" />
            <span>Open Scam Analyzer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
