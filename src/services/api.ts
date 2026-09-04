import {
  Customer,
  Beneficiary,
  RiskAnalysisResult,
  TransactionRecord,
  ScamAssessmentResult,
  BankMetrics,
  DemoScenario,
  TelemetryPayload,
  AlertRecord,
  DashboardStats,
  AdminDashboardStats,
  SafetySettings,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Users / Customers
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomer(id: string): Promise<Customer> {
    const res = await fetch(`${API_BASE}/profile/${id}`);
    if (!res.ok) {
      // fallback
      const list = await this.getCustomers();
      const found = list.find((c) => c.id === id || c.customerId === id);
      if (found) return found;
      throw new Error('Failed to fetch customer');
    }
    const raw = await res.json();
    return {
      id: raw.id,
      customerId: raw.customer_id,
      name: raw.name,
      age: raw.user_type?.includes('Senior') ? 68 : 45,
      persona: raw.user_type,
      avatar: raw.id === 'usr_ravi_kumar'
        ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
        : raw.id === 'usr_sunita_patel'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: raw.phone,
      accountNumber: raw.account_number,
      upiId: raw.upi_id,
      balance: raw.balance,
      habitualMaxAmount: raw.habitual_max_amount,
      safetyStatus: 'PROTECTED',
      activeHours: { start: 7, end: 21 },
      registeredDevice: raw.registered_device,
      registeredIp: raw.registered_ip,
      hasRecentScamLink: false,
      userType: raw.user_type,
      digitalExperience: raw.digital_experience,
      protectionLevel: raw.protection_level,
    };
  },

  async getUserProfile(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/profile/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    const res = await fetch(`${API_BASE}/profile/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Beneficiaries
  async getBeneficiaries(customerId: string): Promise<Beneficiary[]> {
    const res = await fetch(`${API_BASE}/users/${customerId}/beneficiaries`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.map((b: any) => ({
      id: b.id,
      customerId: b.user_id,
      userId: b.user_id,
      name: b.name,
      upiId: b.upi_id,
      accountNumber: b.account_number,
      isTrusted: Boolean(b.is_trusted),
      relationship: b.relationship,
      avatar: b.avatar,
      addedDate: b.created_at,
    }));
  },

  async addBeneficiary(data: {
    customerId: string;
    name: string;
    upiId: string;
    relationship?: string;
    accountNumber?: string;
    avatar?: string;
  }): Promise<Beneficiary> {
    const res = await fetch(`${API_BASE}/users/${data.customerId}/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        upiId: data.upiId,
        relationship: data.relationship,
        accountNumber: data.accountNumber,
        avatar: data.avatar,
      }),
    });
    if (!res.ok) throw new Error('Failed to add beneficiary');
    return res.json();
  },

  // Authoritative Risk & Transactions
  async analyzePayment(payload: TelemetryPayload): Promise<RiskAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze payment risk');
    }
    return res.json();
  },

  async analyzeTransaction(payload: {
    userId: string;
    recipient: string;
    recipientUpi: string;
    amount: number;
    purpose?: string;
    device?: string;
    location?: string;
    isKnownDevice?: boolean;
    transactionHour?: number;
    completionTimeSeconds?: number;
  }) {
    const res = await fetch(`${API_BASE}/transactions/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze transaction');
    }
    return res.json();
  },

  async confirmTransaction(
    id: string,
    options?: { pinEntered?: boolean; verifiedLegitimate?: boolean }
  ) {
    const res = await fetch(`${API_BASE}/transactions/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to confirm transaction');
    }
    return res.json();
  },

  async createTransaction(payload: TelemetryPayload & {
    forceStatus?: string;
    holdReason?: string;
  }): Promise<{ transaction: TransactionRecord; riskAnalysis: RiskAnalysisResult }> {
    const analysis = await this.analyzePayment(payload);
    // Confirm if allowed
    if (analysis.status === 'ALLOWED' && analysis.transactionId) {
      await this.confirmTransaction(analysis.transactionId);
    }
    const txn = await this.getTransactionById(analysis.transactionId || '');
    return {
      transaction: txn || {
        id: analysis.transactionId || 'TXN-LOCAL',
        amount: payload.amount,
        recipientName: payload.recipientName,
        recipientUpi: payload.recipientUpi,
        status: analysis.status || 'ALLOWED',
        riskScore: analysis.totalScore,
      } as any,
      riskAnalysis: analysis,
    };
  },

  async submitIntervention(payload: {
    customerId: string;
    transactionData: any;
    manipulationAnswer: 'YES' | 'NO' | 'NOT_SURE';
  }): Promise<{
    outcome: 'HELD' | 'VERIFIED';
    headline: string;
    message: string;
    guidance?: string[];
    transaction?: TransactionRecord;
  }> {
    const res = await fetch(`${API_BASE}/intervention`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit intervention');
    return res.json();
  },

  async getTransactions(customerId?: string): Promise<TransactionRecord[]> {
    const url = customerId ? `${API_BASE}/transactions?userId=${customerId}` : `${API_BASE}/transactions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const list = await res.json();
    return list.map((t: any) => ({
      id: t.id,
      customerId: t.user_id,
      customerName: t.user_name || 'Customer',
      recipientName: t.recipient,
      recipientUpi: t.recipient_upi,
      amount: t.amount,
      timestamp: t.created_at,
      status: t.status,
      riskScore: t.risk_score,
      riskTier: t.risk_level,
      riskFactors: (t.signals || []).map((s: any) => s.reason),
      actionTaken: t.recommended_action,
      signals: t.signals,
      purpose: t.purpose,
      device: t.device,
      location: t.location,
    }));
  },

  async getTransactionById(id: string): Promise<TransactionRecord | null> {
    const res = await fetch(`${API_BASE}/transactions/${id}`);
    if (!res.ok) return null;
    const t = await res.json();
    return {
      id: t.id,
      customerId: t.user_id,
      customerName: t.user_name,
      recipientName: t.recipient,
      recipientUpi: t.recipient_upi,
      amount: t.amount,
      timestamp: t.created_at,
      status: t.status,
      riskScore: t.risk_score,
      riskTier: t.risk_level,
      riskFactors: (t.signals || []).map((s: any) => s.reason),
      actionTaken: t.recommended_action,
      signals: t.signals,
      purpose: t.purpose,
      device: t.device,
      location: t.location,
    };
  },

  async resolveTransaction(id: string, decision: 'APPROVE' | 'BLOCK' | 'HOLD'): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    if (!res.ok) throw new Error('Failed to resolve transaction');
    return res.json();
  },

  // Scam Analyzer
  async analyzeMessage(messageText: string, customerId?: string): Promise<ScamAssessmentResult> {
    const res = await fetch(`${API_BASE}/analyze-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText, customerId }),
    });
    if (!res.ok) throw new Error('Failed to analyze message');
    return res.json();
  },

  async analyzeScam(userId: string, message: string) {
    const res = await fetch(`${API_BASE}/scams/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    });
    if (!res.ok) throw new Error('Failed to analyze scam');
    return res.json();
  },

  async getScamHistory(userId?: string) {
    const url = userId ? `${API_BASE}/scams?userId=${userId}` : `${API_BASE}/scams`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch scam history');
    return res.json();
  },

  // Alerts
  async getAlerts(userId?: string): Promise<AlertRecord[]> {
    const url = userId ? `${API_BASE}/alerts?userId=${userId}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async markAlertRead(id: string) {
    const res = await fetch(`${API_BASE}/alerts/${id}/read`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to mark alert as read');
    return res.json();
  },

  // Dashboards
  async getDashboardStats(userId?: string): Promise<DashboardStats> {
    const url = userId ? `${API_BASE}/dashboard?userId=${userId}` : `${API_BASE}/dashboard`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const res = await fetch(`${API_BASE}/admin/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async getBankStats(): Promise<BankMetrics> {
    const adminStats = await this.getAdminDashboardStats();
    return {
      preventedFraudAmount: adminStats.amountProtected || 845000,
      totalMonitoredAmount: adminStats.totalMonitoredVolume || 1250000,
      activeHoldsCount: adminStats.transactionsHeld || 0,
      scamsAnalyzedCount: adminStats.scamsDetected || 0,
      protectionRate: adminStats.protectionRate || 99.8,
      seniorAccountsProtected: adminStats.seniorAccountsProtected || 1240,
      totalTransactionsProcessed: adminStats.transactionsAnalyzed || 0,
    };
  },

  async getBankAlerts(filters?: { status?: string; tier?: string }): Promise<TransactionRecord[]> {
    const all = await this.getTransactions();
    return all.filter((t) => {
      if (filters?.status && filters.status !== 'ALL' && t.status !== filters.status) return false;
      if (filters?.tier && filters.tier !== 'ALL' && t.riskTier !== filters.tier) return false;
      return true;
    });
  },

  async resolveAlert(transactionId: string, decision: 'APPROVE' | 'BLOCK' | 'HOLD'): Promise<any> {
    return this.resolveTransaction(transactionId, decision);
  },

  // Safety Controls
  async getSafetySettings(userId: string): Promise<SafetySettings> {
    const res = await fetch(`${API_BASE}/safety/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch safety settings');
    return res.json();
  },

  async updateSafetySettings(userId: string, updates: Partial<SafetySettings>): Promise<SafetySettings> {
    const res = await fetch(`${API_BASE}/safety/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update safety settings');
    return res.json();
  },

  async emergencyPause(customerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/safety/${customerId}/pause`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute emergency pause');
    return res.json();
  },

  async resumeSafety(customerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/safety/${customerId}/resume`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to resume safety shield');
    return res.json();
  },

  // Demo Scenarios
  async getDemoScenarios(): Promise<DemoScenario[]> {
    return [
      {
        id: 'scenario_electricity_coercion',
        title: 'Electricity Bill Disconnection Scam',
        tag: 'Coercive Utility Fraud',
        customerId: 'usr_ravi_kumar',
        customerName: 'Ravi Kumar (Senior, 68)',
        recipientName: 'Electricity Officer Support',
        recipientUpi: 'quickbill982@paytm',
        amount: 80000,
        description: 'Impersonator calls claiming power will be cut in 30 mins unless ₹80,000 pending arrears are paid right now.',
        judgeNarrative: 'Demonstrates multi-factor detection: ₹80,000 exceeds habitual limit (₹5,000), new recipient, urgency keywords, off-hours timing.',
        expectedScore: 95,
        expectedTier: 'CRITICAL',
        expectedAction: 'HOLD & VERIFY',
        telemetry: {
          isKnownDevice: false,
          transactionHour: 22,
          completionTimeSeconds: 12,
          hasRecentScamAlert: true,
        },
      },
      {
        id: 'scenario_kyc_apk',
        title: 'Fake Bank KYC Expiry Notice',
        tag: 'Malicious Phishing / APK',
        customerId: 'usr_ravi_kumar',
        customerName: 'Ravi Kumar (Senior, 68)',
        recipientName: 'KYC Verification Desk',
        recipientUpi: 'sbi.yono.verify@upi',
        amount: 45000,
        description: 'SMS threatens immediate bank freeze. User opens link to download "SBI Support APK" and attempts fee transfer.',
        judgeNarrative: 'Triggers credential theft detection, high amount deviation, and protective senior citizen shield.',
        expectedScore: 85,
        expectedTier: 'HIGH',
        expectedAction: 'HOLD & VERIFY',
        telemetry: {
          isKnownDevice: true,
          transactionHour: 15,
          completionTimeSeconds: 20,
          hasRecentScamAlert: true,
        },
      },
      {
        id: 'scenario_legitimate_family',
        title: 'Routine Family Transfer to Son',
        tag: 'Legitimate Transfer',
        customerId: 'usr_ravi_kumar',
        customerName: 'Ravi Kumar (Senior, 68)',
        recipientName: 'Rohan Kumar',
        recipientUpi: 'rohan.k@okaxis',
        amount: 2500,
        description: 'Routine household allowance transfer to verified son during normal daylight hours.',
        judgeNarrative: 'Known trusted beneficiary, within habitual limits, verified phone device. Zero friction for senior citizens.',
        expectedScore: 10,
        expectedTier: 'LOW',
        expectedAction: 'ALLOW',
        telemetry: {
          isKnownDevice: true,
          transactionHour: 11,
          completionTimeSeconds: 65,
          hasRecentScamAlert: false,
        },
      },
    ];
  },
};
