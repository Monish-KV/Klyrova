import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ScamAssessmentResult } from '../../types';
import {
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ScamAnalyzer: React.FC = () => {
  const { currentCustomer, addToast, setCustomerTab } = useApp();
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ScamAssessmentResult | null>(null);

  const sampleMessages = [
    {
      title: 'Fake SBI KYC Expiration SMS',
      category: 'Phishing SMS',
      text: 'Dear Customer, Your SBI YONO Account will be Blocked Today! Please immediately update your PAN Card by clicking http://sbi-pan-kyc.apk or call bank officer at 9845019283 to avoid permanent seizure.',
    },
    {
      title: 'Electricity Power Disconnection Panic',
      category: 'Utility Scam',
      text: 'Dear Consumer, Your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer at 8910234567.',
    },
    {
      title: 'Remote Access / AnyDesk Coercion Call',
      category: 'Social Engineering',
      text: 'Hello sir, this is Senior Manager from Customer Support. An unauthorized debit of Rs 15,000 was attempted. To reverse it right now, kindly install AnyDesk from Play Store and share the 9-digit session code immediately.',
    },
    {
      title: 'Safe Family Grocery Message',
      category: 'Legitimate Text',
      text: 'Hi Papa, please send Rs 1,450 for the pharmacy medicine order when you get time today. Love, Rohan.',
    },
  ];

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim()) {
      addToast('Please enter or select a message to analyze', 'warn');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await api.analyzeMessage(text, currentCustomer?.id);
      setReport(result);
      addToast('Security assessment completed', 'success');
    } catch (err) {
      console.error('Scam analysis failed:', err);
      addToast('Failed to analyze scam text', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (text: string) => {
    setInputText(text);
    handleAnalyze(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="scam_analyzer_view">
      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            FRAUD INTELLIGENCE ENGINE
          </span>
          <span className="text-xs text-slate-500">Google Gemini AI + Deterministic Heuristics</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
          Scam & Phishing Message Analyzer
        </h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">
          Senior citizens and digital banking users can paste suspicious SMS alerts, WhatsApp forwards, or phone call instructions below. GuardianPay AI analyzes psychological urgency, coercive manipulation tactics, deceptive links, and APK payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input & Preset Samples (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Paste Suspicious SMS or Message Text
              </label>
              <textarea
                id="scam_message_input"
                rows={5}
                placeholder="Paste the SMS, WhatsApp text, or caller instructions here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none leading-relaxed"
              />
            </div>

            <button
              id="analyze_message_btn"
              type="button"
              disabled={isAnalyzing || !inputText.trim()}
              onClick={() => handleAnalyze()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  <span>Evaluating Threat Intelligence...</span>
                </>
              ) : (
                <>
                  <SearchCode className="w-4 h-4" />
                  <span>Scan & Generate Security Report</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Real-World Demonstration Samples */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Real-World Scam Presets
              </h3>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500">
              Click any realistic attack vector below to test instant threat breakdown:
            </p>

            <div className="space-y-2">
              {sampleMessages.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample.text)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                      {sample.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {sample.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">"{sample.text}"</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Security Assessment Report (7 Cols) */}
        <div className="lg:col-span-7">
          {report ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* Report Header */}
              <div
                className={`p-6 text-white ${
                  report.riskLevel === 'CRITICAL'
                    ? 'bg-rose-900'
                    : report.riskLevel === 'HIGH'
                    ? 'bg-amber-900'
                    : report.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-900'
                    : 'bg-emerald-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 px-2.5 py-1 rounded-md">
                    STRUCTURED SECURITY ASSESSMENT
                  </span>
                  <span className="text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-md">
                    Source: {report.source === 'GEMINI_AI' ? 'Google Gemini AI 2.5' : 'Local Deterministic Rules'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-white/80">Identified Scam Classification:</span>
                    <h3 className="text-xl font-black mt-0.5">{report.scamType}</h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black">{report.riskScore}%</div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                      {report.riskLevel} RISK
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Body */}
              <div className="p-6 space-y-6">
                {/* Plain-Language Senior Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Plain-Language Assessment for Customer:
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{report.summary}</p>
                </div>

                {/* Warning Signs */}
                {report.warningSigns && report.warningSigns.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Identified Red Flags & Deceptive Patterns:</span>
                    </h4>
                    <div className="space-y-2">
                      {report.warningSigns.map((sign, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 text-xs text-rose-950 font-medium">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{sign}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protective Action Advice */}
                {report.actionAdvice && report.actionAdvice.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Recommended Protective Action:</span>
                    </h4>
                    <div className="space-y-2">
                      {report.actionAdvice.map((advice, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{advice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Immediate Helpline Action Banner */}
                <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-rose-400 font-bold">
                      <PhoneCall className="w-4 h-4" />
                      <span>National Cyber Crime Helpline (Govt of India)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Report online fraud or suspicious calls immediately. Toll-free 24x7.
                    </p>
                  </div>
                  <a
                    href="tel:1930"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors text-center shrink-0 shadow-xs"
                  >
                    Dial 1930 Helpline
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SearchCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Assessment Active</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Paste any SMS text on the left or select a 1-click test scenario to generate a comprehensive forensic report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
