import {
  Customer,
  Beneficiary,
  RiskAnalysisResult,
  TransactionRecord,
  ScamAssessmentResult,
  BankMetrics,
  DemoScenario,
  TelemetryPayload,
} from '../types';

const API_BASE = '/api';

export const api = {
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customers`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomer(id: string): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer');
    return res.json();
  },

  async getBeneficiaries(customerId: string): Promise<Beneficiary[]> {
    const res = await fetch(`${API_BASE}/beneficiaries/${customerId}`);
    if (!res.ok) throw new Error('Failed to fetch beneficiaries');
    return res.json();
  },

  async addBeneficiary(data: {
    customerId: string;
    name: string;
    upiId: string;
    relationship: string;
    accountNumber?: string;
  }): Promise<Beneficiary> {
    const res = await fetch(`${API_BASE}/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add beneficiary');
    return res.json();
  },

  async analyzePayment(payload: TelemetryPayload): Promise<RiskAnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to analyze payment risk');
    return res.json();
  },

  async createTransaction(payload: TelemetryPayload & {
    forceStatus?: string;
    holdReason?: string;
  }): Promise<{ transaction: TransactionRecord; riskAnalysis: RiskAnalysisResult }> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to execute transaction');
    return res.json();
  },

  async getTransactions(customerId?: string): Promise<TransactionRecord[]> {
    const url = customerId ? `${API_BASE}/transactions?customerId=${customerId}` : `${API_BASE}/transactions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
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
    if (!res.ok) throw new Error('Failed to submit manipulation check');
    return res.json();
  },

  async analyzeMessage(messageText: string, customerId?: string): Promise<ScamAssessmentResult> {
    const res = await fetch(`${API_BASE}/analyze-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText, customerId }),
    });
    if (!res.ok) throw new Error('Failed to analyze message');
    return res.json();
  },

  async getBankStats(): Promise<BankMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch bank metrics');
    return res.json();
  },

  async getBankAlerts(filters?: { status?: string; tier?: string }): Promise<TransactionRecord[]> {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.tier) query.set('tier', filters.tier);
    const res = await fetch(`${API_BASE}/dashboard/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bank alerts');
    return res.json();
  },

  async resolveAlert(transactionId: string, decision: 'APPROVE' | 'BLOCK' | 'HOLD'): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, decision }),
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  async emergencyPause(customerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/safety/emergency-pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });
    if (!res.ok) throw new Error('Failed to execute emergency pause');
    return res.json();
  },

  async resumeSafety(customerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/safety/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });
    if (!res.ok) throw new Error('Failed to resume safety shield');
    return res.json();
  },

  async getDemoScenarios(): Promise<DemoScenario[]> {
    const res = await fetch(`${API_BASE}/demo/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch demo scenarios');
    return res.json();
  },
};
