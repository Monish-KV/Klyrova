import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Users, UserPlus, Send, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const BeneficiariesView: React.FC = () => {
  const { currentCustomer, beneficiaries, refreshData, setCustomerTab, setPrefillPayment, addToast } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [relationship, setRelationship] = useState('Family Member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentCustomer) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !upiId.trim()) {
      addToast('Name and UPI ID are required', 'warn');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.addBeneficiary({
        customerId: currentCustomer.id,
        name: name.trim(),
        upiId: upiId.trim(),
        relationship,
      });
      addToast(`Added ${name} as trusted beneficiary`, 'success');
      setName('');
      setUpiId('');
      setModalOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Failed to add beneficiary:', err);
      addToast('Error adding beneficiary', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendToBeneficiary = (b: (typeof beneficiaries)[0]) => {
    setPrefillPayment({
      recipientName: b.name,
      recipientUpi: b.upiId,
      amount: '',
    });
    setCustomerTab('send');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" id="beneficiaries_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Trusted Beneficiary Directory
          </h2>
          <p className="text-xs text-slate-500">
            Pre-approved contacts bypass familiarity risk factors (+0 risk pts) for smooth regular payments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beneficiaries.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={b.avatar} alt={b.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                    <span className="text-[11px] text-slate-500">{b.relationship}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Pre-Verified
                </span>
              </div>

              <div className="space-y-1 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-bold text-slate-800">{b.upiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="text-slate-600">{b.accountNumber}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Added: {b.addedDate}</span>
              <button
                onClick={() => handleSendToBeneficiary(b)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Money</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Pre-Verified Trusted Contact</h3>
            <p className="text-xs text-slate-500">
              Only add persons or merchants you have independently verified via official phone call.
            </p>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID / VPA</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh.kumar@okicici"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Family Member">Family Member</option>
                  <option value="Close Friend">Close Friend</option>
                  <option value="Healthcare / Doctor">Healthcare / Doctor</option>
                  <option value="Regular Grocery / Merchant">Regular Grocery / Merchant</option>
                  <option value="Utility Provider">Utility Provider</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Save as Trusted
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
