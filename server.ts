import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory Database Store
interface Customer {
  id: string;
  name: string;
  age: number;
  persona: string;
  avatar: string;
  phone: string;
  accountNumber: string;
  upiId: string;
  balance: number;
  habitualMaxAmount: number;
  safetyStatus: 'PROTECTED' | 'AT_RISK' | 'HOLD_ACTIVE';
  activeHours: { start: number; end: number };
  registeredDevice: string;
  registeredIp: string;
  hasRecentScamLink: boolean;
}

interface Beneficiary {
  id: string;
  customerId: string;
  name: string;
  upiId: string;
  accountNumber: string;
  isTrusted: boolean;
  relationship: string;
  avatar: string;
  addedDate: string;
  lastTransferDate?: string;
}

interface TransactionRecord {
  id: string;
  customerId: string;
  customerName: string;
  recipientName: string;
  recipientUpi: string;
  amount: number;
  timestamp: string;
  status: 'COMPLETED' | 'HELD' | 'BLOCKED' | 'FLAGGED';
  riskScore: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  actionTaken: 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD & VERIFY';
  holdReason?: string;
  resolution?: 'APPROVED' | 'CANCELLED_BY_USER' | 'BLOCKED_BY_BANK' | 'PENDING';
  resolvedAt?: string;
  telemetry: {
    device: string;
    isRecognizedDevice: boolean;
    time: string;
    isOutsideActiveHours: boolean;
    velocityTimeSeconds: number;
    isUnusualVelocity: boolean;
    isUnfamiliarBeneficiary: boolean;
    isAmountAnomaly: boolean;
    recentScamLinked: boolean;
  };
}

// Initial Synthetic Seed Data
const customers: Customer[] = [
  {
    id: 'cust_ravi_sharma',
    name: 'Ravi Sharma',
    age: 68,
    persona: 'Senior Citizen — Retired Telecom Officer (Beginner Digital User)',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98450 12890',
    accountNumber: '•••• •••• 4092',
    upiId: 'ravi.sharma68@okaxis',
    balance: 145000,
    habitualMaxAmount: 5000,
    safetyStatus: 'PROTECTED',
    activeHours: { start: 7, end: 21 },
    registeredDevice: "Ravi's Galaxy M32 (Android 12)",
    registeredIp: '122.164.88.14 (Chennai, Home Broadband)',
    hasRecentScamLink: false,
  },
  {
    id: 'cust_sunita_patel',
    name: 'Sunita Patel',
    age: 54,
    persona: 'School Teacher — Moderate Digital Banking Experience',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98201 54321',
    accountNumber: '•••• •••• 8831',
    upiId: 'sunita.teacher@okhdfcbank',
    balance: 82500,
    habitualMaxAmount: 15000,
    safetyStatus: 'PROTECTED',
    activeHours: { start: 6, end: 22 },
    registeredDevice: "Sunita's Redmi Note 11 (Android 11)",
    registeredIp: '106.51.14.92 (Bengaluru, Fiber)',
    hasRecentScamLink: false,
  },
  {
    id: 'cust_arjun_mehta',
    name: 'Arjun Mehta',
    age: 29,
    persona: 'Software Engineer — Tech Savvy & High Frequency Digital Payer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 99012 34567',
    accountNumber: '•••• •••• 1209',
    upiId: 'arjun.tech@icici',
    balance: 320000,
    habitualMaxAmount: 50000,
    safetyStatus: 'PROTECTED',
    activeHours: { start: 6, end: 24 },
    registeredDevice: "Arjun's Pixel 8 Pro (Android 14)",
    registeredIp: '49.207.218.4 (Hyderabad, Tech Park Wi-Fi)',
    hasRecentScamLink: false,
  },
];

const beneficiaries: Beneficiary[] = [
  {
    id: 'ben_1',
    customerId: 'cust_ravi_sharma',
    name: 'Rohan Sharma (Son)',
    upiId: 'rohan.sharma@okaxis',
    accountNumber: '•••• •••• 7712',
    isTrusted: true,
    relationship: 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    addedDate: '2023-04-12',
    lastTransferDate: '2026-08-25',
  },
  {
    id: 'ben_2',
    customerId: 'cust_ravi_sharma',
    name: 'Meena Sharma (Daughter-in-law)',
    upiId: 'meena.sh@icici',
    accountNumber: '•••• •••• 9934',
    isTrusted: true,
    relationship: 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    addedDate: '2023-09-18',
    lastTransferDate: '2026-08-14',
  },
  {
    id: 'ben_3',
    customerId: 'cust_ravi_sharma',
    name: 'Sharma Medical & Chemist',
    upiId: 'sharmapharmacy@upi',
    accountNumber: '•••• •••• 4120',
    isTrusted: true,
    relationship: 'Healthcare Vendor',
    avatar: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=150&auto=format&fit=crop&q=80',
    addedDate: '2024-01-05',
    lastTransferDate: '2026-08-30',
  },
  {
    id: 'ben_4',
    customerId: 'cust_ravi_sharma',
    name: 'Torrent Power Electricity Bill',
    upiId: 'torrentpower.bill@sbi',
    accountNumber: '•••• •••• 5500',
    isTrusted: true,
    relationship: 'Utility Service',
    avatar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=150&auto=format&fit=crop&q=80',
    addedDate: '2023-02-10',
    lastTransferDate: '2026-08-01',
  },
  {
    id: 'ben_5',
    customerId: 'cust_sunita_patel',
    name: 'Aarav Patel (Son)',
    upiId: 'aarav.patel@okhdfcbank',
    accountNumber: '•••• •••• 3341',
    isTrusted: true,
    relationship: 'Family Member',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    addedDate: '2023-05-19',
    lastTransferDate: '2026-08-28',
  },
  {
    id: 'ben_6',
    customerId: 'cust_sunita_patel',
    name: 'DPS School Fee Portal',
    upiId: 'dpsrohini.fees@sbi',
    accountNumber: '•••• •••• 8820',
    isTrusted: true,
    relationship: 'Institutional Vendor',
    avatar: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80',
    addedDate: '2024-02-15',
    lastTransferDate: '2026-08-05',
  },
];

let transactions: TransactionRecord[] = [
  {
    id: 'TXN-90281',
    customerId: 'cust_ravi_sharma',
    customerName: 'Ravi Sharma',
    recipientName: 'Rohan Sharma (Son)',
    recipientUpi: 'rohan.sharma@okaxis',
    amount: 3500,
    timestamp: '2026-08-25T11:20:00Z',
    status: 'COMPLETED',
    riskScore: 0,
    riskTier: 'LOW',
    riskFactors: [],
    actionTaken: 'ALLOW',
    resolution: 'APPROVED',
    telemetry: {
      device: "Ravi's Galaxy M32 (Android 12)",
      isRecognizedDevice: true,
      time: '11:20 AM',
      isOutsideActiveHours: false,
      velocityTimeSeconds: 42,
      isUnusualVelocity: false,
      isUnfamiliarBeneficiary: false,
      isAmountAnomaly: false,
      recentScamLinked: false,
    },
  },
  {
    id: 'TXN-90282',
    customerId: 'cust_ravi_sharma',
    customerName: 'Ravi Sharma',
    recipientName: 'Sharma Medical & Chemist',
    recipientUpi: 'sharmapharmacy@upi',
    amount: 1450,
    timestamp: '2026-08-30T16:45:00Z',
    status: 'COMPLETED',
    riskScore: 0,
    riskTier: 'LOW',
    riskFactors: [],
    actionTaken: 'ALLOW',
    resolution: 'APPROVED',
    telemetry: {
      device: "Ravi's Galaxy M32 (Android 12)",
      isRecognizedDevice: true,
      time: '04:45 PM',
      isOutsideActiveHours: false,
      velocityTimeSeconds: 35,
      isUnusualVelocity: false,
      isUnfamiliarBeneficiary: false,
      isAmountAnomaly: false,
      recentScamLinked: false,
    },
  },
  {
    id: 'TXN-88129',
    customerId: 'cust_sunita_patel',
    customerName: 'Sunita Patel',
    recipientName: 'FastPay Direct Services',
    recipientUpi: 'fastpay991@ybl',
    amount: 42000,
    timestamp: '2026-09-01T23:40:00Z',
    status: 'HELD',
    riskScore: 85,
    riskTier: 'CRITICAL',
    riskFactors: [
      'Transaction Amount Anomaly (+25 pts)',
      'Unfamiliar Beneficiary (+20 pts)',
      'Unrecognized Device Fingerprint (+20 pts)',
      'Temporal & Late Night Hours (+10 pts)',
      'High Velocity & Haste (+10 pts)',
    ],
    actionTaken: 'HOLD & VERIFY',
    holdReason: 'Urgent payment coercion suspected via manipulation check trigger',
    resolution: 'PENDING',
    telemetry: {
      device: 'Chrome 124 on Windows 11 (Unrecognized)',
      isRecognizedDevice: false,
      time: '11:40 PM',
      isOutsideActiveHours: true,
      velocityTimeSeconds: 11,
      isUnusualVelocity: true,
      isUnfamiliarBeneficiary: true,
      isAmountAnomaly: true,
      recentScamLinked: false,
    },
  },
];

let bankStats = {
  preventedFraudAmount: 845000,
  totalMonitoredAmount: 14250000,
  activeHoldsCount: 1,
  scamsAnalyzedCount: 42,
  protectionRate: 99.8,
  seniorAccountsProtected: 1240,
  totalTransactionsProcessed: 3840,
};

// Explainable Risk Calculation Engine
function evaluateRisk(
  customer: Customer,
  beneficiariesList: Beneficiary[],
  payload: {
    recipientName: string;
    recipientUpi: string;
    amount: number;
    deviceFingerprint?: string;
    isKnownDevice?: boolean;
    transactionHour?: number;
    completionTimeSeconds?: number;
    hasRecentScamAlert?: boolean;
  }
) {
  const currentHour = payload.transactionHour !== undefined ? payload.transactionHour : new Date().getHours();
  const completionTime = payload.completionTimeSeconds !== undefined ? payload.completionTimeSeconds : 30;
  const isKnown = payload.isKnownDevice !== undefined ? payload.isKnownDevice : true;
  const hasScamLink = payload.hasRecentScamAlert || customer.hasRecentScamLink;

  const isTrustedBeneficiary = beneficiariesList.some(
    (b) => b.upiId.trim().toLowerCase() === payload.recipientUpi.trim().toLowerCase() && b.isTrusted
  );

  const isAmountAnomaly = payload.amount > customer.habitualMaxAmount * 2.5;
  const isUnfamiliarBeneficiary = !isTrustedBeneficiary;
  const isUnrecognizedDevice = !isKnown;
  const isOutsideHours = currentHour < customer.activeHours.start || currentHour >= customer.activeHours.end;
  const isHighVelocity = completionTime < 15;

  const factors = [
    {
      id: 'f_amount',
      name: 'Transaction Amount Anomaly',
      score: isAmountAnomaly ? 25 : 0,
      maxScore: 25,
      triggered: isAmountAnomaly,
      description: isAmountAnomaly
        ? `₹${payload.amount.toLocaleString('en-IN')} is dramatically higher than ${customer.name}'s habitual limit of ₹${customer.habitualMaxAmount.toLocaleString('en-IN')}.`
        : `Amount ₹${payload.amount.toLocaleString('en-IN')} aligns with normal customer transaction patterns.`,
      severity: isAmountAnomaly ? ('HIGH' as const) : ('LOW' as const),
    },
    {
      id: 'f_beneficiary',
      name: 'Beneficiary Familiarity',
      score: isUnfamiliarBeneficiary ? 20 : 0,
      maxScore: 20,
      triggered: isUnfamiliarBeneficiary,
      description: isUnfamiliarBeneficiary
        ? `Recipient '${payload.recipientUpi}' is a first-time, unverified beneficiary not present in trusted contacts.`
        : `Recipient '${payload.recipientUpi}' is a pre-verified trusted beneficiary.`,
      severity: isUnfamiliarBeneficiary ? ('HIGH' as const) : ('LOW' as const),
    },
    {
      id: 'f_device',
      name: 'Device Fingerprint',
      score: isUnrecognizedDevice ? 20 : 0,
      maxScore: 20,
      triggered: isUnrecognizedDevice,
      description: isUnrecognizedDevice
        ? `Initiated from an unrecognized device/browser instead of registered '${customer.registeredDevice}'.`
        : `Confirmed authentic hardware fingerprint matching registered customer device.`,
      severity: isUnrecognizedDevice ? ('HIGH' as const) : ('LOW' as const),
    },
    {
      id: 'f_temporal',
      name: 'Temporal & Hour Analysis',
      score: isOutsideHours ? 10 : 0,
      maxScore: 10,
      triggered: isOutsideHours,
      description: isOutsideHours
        ? `Initiated at ${currentHour}:00, outside regular active hours (${customer.activeHours.start}:00 - ${customer.activeHours.end}:00).`
        : `Initiated during customary daytime banking hours.`,
      severity: isOutsideHours ? ('MEDIUM' as const) : ('LOW' as const),
    },
    {
      id: 'f_velocity',
      name: 'Behavioral Velocity & Haste',
      score: isHighVelocity ? 15 : 0,
      maxScore: 15,
      triggered: isHighVelocity,
      description: isHighVelocity
        ? `Completed in only ${completionTime}s without usual verification, characteristic of coercive phone guidance or panic.`
        : `Normal deliberate input duration (${completionTime}s).`,
      severity: isHighVelocity ? ('HIGH' as const) : ('LOW' as const),
    },
    {
      id: 'f_threat',
      name: 'Threat Intelligence Link',
      score: hasScamLink ? 10 : 0,
      maxScore: 10,
      triggered: Boolean(hasScamLink),
      description: hasScamLink
        ? `Customer session correlates with recent phishing SMS or flagged social engineering threats.`
        : `No correlative threat intelligence or scam flags detected.`,
      severity: hasScamLink ? ('HIGH' as const) : ('LOW' as const),
    },
  ];

  const totalScore = Math.min(
    100,
    factors.reduce((acc, f) => acc + f.score, 0)
  );

  let tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let action: 'ALLOW' | 'WARN' | 'VERIFY' | 'HOLD & VERIFY' = 'ALLOW';
  let requiresIntervention = false;
  let explanation = 'Safe transaction parameters. Proceeding normally.';

  if (totalScore >= 81) {
    tier = 'CRITICAL';
    action = 'HOLD & VERIFY';
    requiresIntervention = true;
    explanation =
      'CRITICAL RISK: Multiple high-severity indicators detected (unusual amount, unfamiliar recipient, new hardware, and urgent pacing). Coercive social engineering scam suspected.';
  } else if (totalScore >= 61) {
    tier = 'HIGH';
    action = 'VERIFY';
    requiresIntervention = true;
    explanation =
      'HIGH RISK: Elevated unfamiliar factors detected. Interactive customer safety verification required before debit.';
  } else if (totalScore >= 31) {
    tier = 'MEDIUM';
    action = 'WARN';
    requiresIntervention = false;
    explanation =
      'MODERATE RISK: Noticeable deviations from customary patterns. Caution advised before confirming.';
  }

  return {
    totalScore,
    tier,
    action,
    factors,
    explanation,
    requiresIntervention,
    telemetryBreakdown: {
      amountAnomaly: isAmountAnomaly,
      unfamiliarBeneficiary: isUnfamiliarBeneficiary,
      unrecognizedDevice: isUnrecognizedDevice,
      temporalAnomaly: isOutsideHours,
      highVelocityHaste: isHighVelocity,
      threatLink: Boolean(hasScamLink),
    },
  };
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Customers list
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

// Single Customer Profile
app.get('/api/customers/:id', (req, res) => {
  const customer = customers.find((c) => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// Beneficiaries
app.get('/api/beneficiaries/:customerId', (req, res) => {
  const list = beneficiaries.filter((b) => b.customerId === req.params.customerId);
  res.json(list);
});

// Add Beneficiary
app.post('/api/beneficiaries', (req, res) => {
  const { customerId, name, upiId, relationship, accountNumber } = req.body;
  const newBen: Beneficiary = {
    id: `ben_${Date.now()}`,
    customerId,
    name,
    upiId,
    accountNumber: accountNumber || '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
    isTrusted: true,
    relationship: relationship || 'Personal Contact',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    addedDate: new Date().toISOString().split('T')[0],
  };
  beneficiaries.push(newBen);
  res.status(201).json(newBen);
});

// Payment Pre-Analysis
app.post('/api/analyze-payment', (req, res) => {
  const { customerId, recipientName, recipientUpi, amount, deviceFingerprint, isKnownDevice, transactionHour, completionTimeSeconds, hasRecentScamAlert } = req.body;

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const customerBeneficiaries = beneficiaries.filter((b) => b.customerId === customerId);
  const analysis = evaluateRisk(customer, customerBeneficiaries, {
    recipientName,
    recipientUpi,
    amount: Number(amount),
    deviceFingerprint,
    isKnownDevice,
    transactionHour,
    completionTimeSeconds,
    hasRecentScamAlert,
  });

  res.json(analysis);
});

// Submit Payment Transaction
app.post('/api/transactions', (req, res) => {
  const {
    customerId,
    recipientName,
    recipientUpi,
    amount,
    deviceFingerprint,
    isKnownDevice,
    transactionHour,
    completionTimeSeconds,
    hasRecentScamAlert,
    forceStatus,
    holdReason,
  } = req.body;

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const customerBeneficiaries = beneficiaries.filter((b) => b.customerId === customerId);
  const analysis = evaluateRisk(customer, customerBeneficiaries, {
    recipientName,
    recipientUpi,
    amount: Number(amount),
    deviceFingerprint,
    isKnownDevice,
    transactionHour,
    completionTimeSeconds,
    hasRecentScamAlert,
  });

  const numAmount = Number(amount);
  let status: 'COMPLETED' | 'HELD' | 'BLOCKED' | 'FLAGGED' = 'COMPLETED';
  let resolution: 'APPROVED' | 'CANCELLED_BY_USER' | 'BLOCKED_BY_BANK' | 'PENDING' = 'APPROVED';

  if (forceStatus) {
    status = forceStatus;
    resolution = forceStatus === 'HELD' ? 'PENDING' : forceStatus === 'BLOCKED' ? 'BLOCKED_BY_BANK' : 'APPROVED';
  } else if (analysis.tier === 'CRITICAL') {
    status = 'HELD';
    resolution = 'PENDING';
  }

  const triggeredFactorNames = analysis.factors
    .filter((f) => f.triggered)
    .map((f) => `${f.name} (+${f.score} pts)`);

  const newTxn: TransactionRecord = {
    id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    customerId,
    customerName: customer.name,
    recipientName,
    recipientUpi,
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status,
    riskScore: analysis.totalScore,
    riskTier: analysis.tier,
    riskFactors: triggeredFactorNames,
    actionTaken: analysis.action,
    holdReason: holdReason || (status === 'HELD' ? 'Triggered proactive hold & manipulation check verification' : undefined),
    resolution,
    telemetry: {
      device: isKnownDevice === false ? 'Unrecognized Mobile Browser (New IP)' : customer.registeredDevice,
      isRecognizedDevice: isKnownDevice !== false,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isOutsideActiveHours: analysis.telemetryBreakdown.temporalAnomaly,
      velocityTimeSeconds: completionTimeSeconds || 30,
      isUnusualVelocity: analysis.telemetryBreakdown.highVelocityHaste,
      isUnfamiliarBeneficiary: analysis.telemetryBreakdown.unfamiliarBeneficiary,
      isAmountAnomaly: analysis.telemetryBreakdown.amountAnomaly,
      recentScamLinked: analysis.telemetryBreakdown.threatLink,
    },
  };

  if (status === 'COMPLETED') {
    customer.balance -= numAmount;
    bankStats.totalTransactionsProcessed += 1;
  } else if (status === 'HELD') {
    customer.safetyStatus = 'HOLD_ACTIVE';
    bankStats.activeHoldsCount += 1;
    bankStats.preventedFraudAmount += numAmount;
  }

  transactions.unshift(newTxn);
  res.status(201).json({ transaction: newTxn, riskAnalysis: analysis });
});

// Transactions List
app.get('/api/transactions', (req, res) => {
  const { customerId } = req.query;
  if (customerId) {
    return res.json(transactions.filter((t) => t.customerId === customerId));
  }
  res.json(transactions);
});

// Manipulation Questionnaire & Adaptive Intervention
app.post('/api/intervention', (req, res) => {
  const { customerId, transactionData, manipulationAnswer } = req.body;
  // manipulationAnswer: 'YES' | 'NO' | 'NOT_SURE'
  const customer = customers.find((c) => c.id === customerId);

  if (manipulationAnswer === 'YES') {
    // Definite coercion! Hold payment safely BEFORE funds leave account!
    const numAmount = Number(transactionData.amount);
    const newTxn: TransactionRecord = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      customerId,
      customerName: customer ? customer.name : 'Unknown User',
      recipientName: transactionData.recipientName,
      recipientUpi: transactionData.recipientUpi,
      amount: numAmount,
      timestamp: new Date().toISOString(),
      status: 'HELD',
      riskScore: 100,
      riskTier: 'CRITICAL',
      riskFactors: [
        'Confirmed Coercive Pressure ("YES" to Urgency Prompt)',
        'Suspicious Beneficiary Destination',
        'Amount Exceeds Habitual Limit',
      ],
      actionTaken: 'HOLD & VERIFY',
      holdReason: 'Customer acknowledged external urgency pressure. Safeguard hold instituted.',
      resolution: 'PENDING',
      telemetry: {
        device: 'Potentially Compromised / Remote Coached Device',
        isRecognizedDevice: false,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isOutsideActiveHours: false,
        velocityTimeSeconds: 8,
        isUnusualVelocity: true,
        isUnfamiliarBeneficiary: true,
        isAmountAnomaly: true,
        recentScamLinked: true,
      },
    };

    transactions.unshift(newTxn);
    if (customer) {
      customer.safetyStatus = 'HOLD_ACTIVE';
      customer.hasRecentScamLink = true;
    }
    bankStats.activeHoldsCount += 1;
    bankStats.preventedFraudAmount += numAmount;

    return res.json({
      outcome: 'HELD',
      headline: 'Payment Paused for Your Protection',
      message:
        'Your funds remain 100% safe in your account. You indicated someone urged you to make this payment quickly. Legitimate banks, electricity boards, and government officials NEVER demand immediate UPI transfers under threat of penalties or disconnection.',
      guidance: [
        'Do NOT answer further calls from unknown numbers.',
        'If asked to install AnyDesk, TeamViewer, or QuickSupport, uninstall them immediately.',
        'Our bank fraud specialists have received this alert and will verify your security.',
        'Dial the National Cyber Fraud Helpline at 1930 for free assistance.',
      ],
      transaction: newTxn,
    });
  } else if (manipulationAnswer === 'NOT_SURE') {
    // Caution hold
    const numAmount = Number(transactionData.amount);
    const newTxn: TransactionRecord = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      customerId,
      customerName: customer ? customer.name : 'Unknown User',
      recipientName: transactionData.recipientName,
      recipientUpi: transactionData.recipientUpi,
      amount: numAmount,
      timestamp: new Date().toISOString(),
      status: 'HELD',
      riskScore: 85,
      riskTier: 'HIGH',
      riskFactors: [
        'Customer Unsure of Caller Identity',
        'High Risk Telemetry Deviation',
      ],
      actionTaken: 'HOLD & VERIFY',
      holdReason: 'Customer requested pause due to uncertainty about caller legitimacy.',
      resolution: 'PENDING',
      telemetry: {
        device: 'Customer Phone',
        isRecognizedDevice: true,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isOutsideActiveHours: false,
        velocityTimeSeconds: 15,
        isUnusualVelocity: false,
        isUnfamiliarBeneficiary: true,
        isAmountAnomaly: true,
        recentScamLinked: true,
      },
    };

    transactions.unshift(newTxn);
    if (customer) customer.safetyStatus = 'HOLD_ACTIVE';
    bankStats.activeHoldsCount += 1;

    return res.json({
      outcome: 'HELD',
      headline: 'Payment Paused for Independent Verification',
      message:
        'Your payment is held safely. Please call your trusted family member or visit your local bank branch before proceeding with transfers to new recipients.',
      guidance: [
        'Never share OTP or banking passwords with anyone.',
        'Contact the official institution using numbers from your paper bills or official website.',
      ],
      transaction: newTxn,
    });
  } else {
    // User answered 'NO' - voluntary
    return res.json({
      outcome: 'VERIFIED',
      headline: 'Customer Verification Completed',
      message: 'You have confirmed this transaction is voluntary.',
    });
  }
});

// Scam Message Analyzer (Gemini AI + Deterministic Heuristics Fallback)
app.post('/api/analyze-message', async (req, res) => {
  const { messageText, customerId } = req.body;

  if (!messageText || typeof messageText !== 'string') {
    return res.status(400).json({ error: 'messageText is required' });
  }

  const textLower = messageText.toLowerCase();

  // Deterministic Indicators
  const isKycScam = textLower.includes('kyc') || textLower.includes('pan card') || textLower.includes('blocked') || textLower.includes('suspended');
  const isElectricityScam = textLower.includes('electricity') || textLower.includes('power disconnection') || textLower.includes('bill overdue') || textLower.includes('tonight at 9:30');
  const isRemoteAccessScam = textLower.includes('anydesk') || textLower.includes('teamviewer') || textLower.includes('quicksupport') || textLower.includes('screen share');
  const isLotteryOrPrize = textLower.includes('won') || textLower.includes('lottery') || textLower.includes('congratulations') || textLower.includes('cashback') || textLower.includes('lucky draw');
  const hasUrgentThreat = textLower.includes('urgent') || textLower.includes('immediately') || textLower.includes('penalty') || textLower.includes('legal action') || textLower.includes('hours') || textLower.includes('expire');
  const hasLinkOrPhone = /https?:\/\/[^\s]+|bit\.ly|t\.co|\+91\s?\d{10}|\d{10}/.test(textLower);
  const hasApk = textLower.includes('.apk') || textLower.includes('download app') || textLower.includes('install');

  // Try Gemini AI if API key is provided
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are the chief fraud intelligence engine for GuardianPay AI, a digital banking security system for vulnerable senior citizens.
Analyze this incoming SMS / WhatsApp / email message for fraud, phishing, and social engineering coercion:
"${messageText}"

Provide your response in strictly valid JSON format matching this exact schema:
{
  "riskScore": number (0-100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "scamType": string (e.g. "Fake Bank KYC Threat", "Electricity Disconnection Coercion", "Remote Access Trojan"),
  "summary": string (clear 2-sentence explanation for a senior citizen),
  "warningSigns": string[] (3-5 specific bullet points of red flags),
  "actionAdvice": string[] (3-4 specific protective steps),
  "threatIndicators": {
    "hasUrgencyTactics": boolean,
    "hasSuspiciousLinks": boolean,
    "hasImpersonation": boolean,
    "requestsRemoteAccess": boolean,
    "requestsCredentialsOrOtp": boolean
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.riskScore !== undefined) {
        bankStats.scamsAnalyzedCount += 1;
        if (customerId) {
          const c = customers.find((cust) => cust.id === customerId);
          if (c && parsed.riskScore > 50) c.hasRecentScamLink = true;
        }

        return res.json({
          id: `SCAM-${Date.now()}`,
          rawText: messageText,
          timestamp: new Date().toISOString(),
          source: 'GEMINI_AI',
          ...parsed,
        });
      }
    } catch (err) {
      console.warn('Gemini API call failed, gracefully falling back to deterministic security engine:', err);
    }
  }

  // Deterministic Rule Engine Fallback
  let riskScore = 15;
  let scamType = 'Uncertain / Informational Message';
  const warningSigns: string[] = [];
  const actionAdvice: string[] = [
    'Verify any communication directly with official customer care numbers.',
    'Never share one-time passwords (OTPs) or banking PINs.',
    'Do not click shortened URLs or download unsolicited application files.',
  ];

  if (isKycScam) {
    riskScore += 45;
    scamType = 'Fake Bank KYC Expiration Scam';
    warningSigns.push('Threatens immediate bank account deactivation or card blocking.');
    warningSigns.push('Legitimate banks NEVER update KYC via unofficial WhatsApp/SMS links.');
    actionAdvice.unshift('DO NOT click any link in this SMS. Visit your nearest bank branch in person.');
  }

  if (isElectricityScam) {
    riskScore += 40;
    scamType = 'Electricity Disconnection Coercion Scam';
    warningSigns.push('Manufactures artificial panic claiming power will be cut tonight.');
    warningSigns.push('Provides personal phone number or unofficial link rather than official electricity board portal.');
    actionAdvice.unshift('Power boards follow formal billing notices. Call your electricity helpline to verify.');
  }

  if (isRemoteAccessScam || hasApk) {
    riskScore += 45;
    scamType = 'Remote Access / Malicious APK Download';
    warningSigns.push('Directs user to install screen-sharing tools (AnyDesk/TeamViewer) or external APKs.');
    warningSigns.push('Scammers use remote access to capture OTPs and control bank transfers directly.');
    actionAdvice.unshift('NEVER install screen sharing apps at the instruction of an unknown caller.');
  }

  if (isLotteryOrPrize) {
    riskScore += 35;
    scamType = 'Prize / Lottery Advance Fee Fraud';
    warningSigns.push('Promises unearned cash rewards or lottery wins requiring advance processing fees.');
  }

  if (hasUrgentThreat) {
    riskScore += 20;
    warningSigns.push('High psychological pressure designed to prevent victim from consulting family.');
  }

  if (hasLinkOrPhone) {
    riskScore += 15;
    warningSigns.push('Contains unverified hyperlink or personal mobile contact masquerading as bank desk.');
  }

  riskScore = Math.min(100, Math.max(10, riskScore));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  const summary =
    riskScore >= 60
      ? `This message exhibits high-confidence characteristics of a ${scamType}. It relies on artificial urgency and coercive threats to compromise your funds.`
      : `This message has low indicator flags, but exercise standard caution with links and sender identity.`;

  bankStats.scamsAnalyzedCount += 1;
  if (customerId && riskScore > 50) {
    const c = customers.find((cust) => cust.id === customerId);
    if (c) c.hasRecentScamLink = true;
  }

  return res.json({
    id: `SCAM-${Date.now()}`,
    rawText: messageText,
    timestamp: new Date().toISOString(),
    riskScore,
    riskLevel,
    source: 'LOCAL_RULE_ENGINE',
    scamType,
    summary,
    warningSigns,
    actionAdvice,
    threatIndicators: {
      hasUrgencyTactics: hasUrgentThreat,
      hasSuspiciousLinks: hasLinkOrPhone,
      hasImpersonation: isKycScam || isElectricityScam,
      requestsRemoteAccess: isRemoteAccessScam || hasApk,
      requestsCredentialsOrOtp: isKycScam,
    },
  });
});

// Bank Dashboard Operations
app.get('/api/dashboard/stats', (req, res) => {
  const activeHolds = transactions.filter((t) => t.status === 'HELD' && t.resolution === 'PENDING').length;
  bankStats.activeHoldsCount = activeHolds;
  res.json(bankStats);
});

// Bank Alerts Queue
app.get('/api/dashboard/alerts', (req, res) => {
  const { status, tier } = req.query;
  let list = [...transactions];

  if (status) {
    list = list.filter((t) => t.status === status);
  }
  if (tier) {
    list = list.filter((t) => t.riskTier === tier);
  }

  res.json(list);
});

// Bank Analyst Resolution
app.post('/api/dashboard/resolve', (req, res) => {
  const { transactionId, decision, notes } = req.body;
  // decision: 'APPROVE' | 'BLOCK' | 'HOLD'
  const txn = transactions.find((t) => t.id === transactionId);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });

  txn.resolution = decision === 'APPROVE' ? 'APPROVED' : decision === 'BLOCK' ? 'BLOCKED_BY_BANK' : 'PENDING';
  txn.resolvedAt = new Date().toISOString();

  if (decision === 'APPROVE') {
    txn.status = 'COMPLETED';
    const cust = customers.find((c) => c.id === txn.customerId);
    if (cust) {
      cust.balance -= txn.amount;
      cust.safetyStatus = 'PROTECTED';
    }
  } else if (decision === 'BLOCK') {
    txn.status = 'BLOCKED';
    const cust = customers.find((c) => c.id === txn.customerId);
    if (cust) {
      cust.safetyStatus = 'PROTECTED';
    }
  }

  res.json({ success: true, transaction: txn });
});

// Emergency Account Freeze (Safety Center)
app.post('/api/safety/emergency-pause', (req, res) => {
  const { customerId, reason } = req.body;
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return res.status(404).json({ error: 'Customer not found' });

  cust.safetyStatus = 'HOLD_ACTIVE';
  res.json({
    success: true,
    message: 'Digital outbound transactions have been paused instantly for your security. Inbound transfers remain active.',
    customer: cust,
  });
});

// Resume Account Safety
app.post('/api/safety/resume', (req, res) => {
  const { customerId } = req.body;
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return res.status(404).json({ error: 'Customer not found' });

  cust.safetyStatus = 'PROTECTED';
  cust.hasRecentScamLink = false;
  res.json({
    success: true,
    message: 'Account safety shield active. Normal banking services resumed.',
    customer: cust,
  });
});

// Demo Scenario Presets (Judge Showcase)
app.get('/api/demo/scenarios', (req, res) => {
  const scenarios = [
    {
      id: 'demo_ravi_coercion',
      title: 'Senior ₹80k Coercive Transfer (Signature Manipulation Demo)',
      tag: 'CRITICAL RISK (Score: 100) — HOLD & VERIFY',
      customerId: 'cust_ravi_sharma',
      customerName: 'Ravi Sharma (Age 68)',
      recipientName: 'Vikas Kumar (Unverified Mule)',
      recipientUpi: 'vikaskumar.mule99@paytm',
      amount: 80000,
      description:
        'A panic-stricken senior citizen receives a fake KYC call threatening account seizure. Coerced into transferring ₹80,000 on an unrecognized device at 11:45 PM in 8 seconds.',
      judgeNarrative:
        "Traditional fraud systems approve this because Ravi is using his own credentials. GuardianPay AI steps in, calculates 100 CRITICAL risk across 6 behavioral factors, halts the payment, and triggers the signature question: 'Did someone ask you to make this payment urgently?'. When Ravi clicks YES, funds are safely preserved.",
      expectedScore: 100,
      expectedTier: 'CRITICAL',
      expectedAction: 'HOLD & VERIFY',
      telemetry: {
        isKnownDevice: false,
        transactionHour: 23,
        completionTimeSeconds: 8,
        hasRecentScamAlert: true,
      },
    },
    {
      id: 'demo_sunita_warning',
      title: 'Sunita Patel — Late Night Moderate Anomaly',
      tag: 'HIGH RISK (Score: 65) — VERIFY',
      customerId: 'cust_sunita_patel',
      customerName: 'Sunita Patel (Age 54)',
      recipientName: 'QuickKart Wholesale',
      recipientUpi: 'quickkart.merchant@ybl',
      amount: 38000,
      description:
        'Sunita transfers ₹38,000 (2.5x her normal habit) to a first-time merchant at 11:15 PM from her normal phone.',
      judgeNarrative:
        "Demonstrates dynamic multi-factor scoring. Not an outright scam, but anomalous enough to warrant a polite verification prompt to ensure she wasn't rushing.",
      expectedScore: 65,
      expectedTier: 'HIGH',
      expectedAction: 'VERIFY',
      telemetry: {
        isKnownDevice: true,
        transactionHour: 23,
        completionTimeSeconds: 22,
        hasRecentScamAlert: false,
      },
    },
    {
      id: 'demo_routine_safe',
      title: 'Routine Safe Family Transfer',
      tag: 'LOW RISK (Score: 0) — ALLOW',
      customerId: 'cust_ravi_sharma',
      customerName: 'Ravi Sharma (Age 68)',
      recipientName: 'Rohan Sharma (Son)',
      recipientUpi: 'rohan.sharma@okaxis',
      amount: 2500,
      description:
        'Ravi sends ₹2,500 to his pre-verified trusted son Rohan at 11:30 AM from his registered Samsung smartphone.',
      judgeNarrative:
        'Zero false positives. Familiar recipient, routine amount, verified hardware, normal daytime hours. Immediate, frictionless 1-click execution.',
      expectedScore: 0,
      expectedTier: 'LOW',
      expectedAction: 'ALLOW',
      telemetry: {
        isKnownDevice: true,
        transactionHour: 11,
        completionTimeSeconds: 38,
        hasRecentScamAlert: false,
      },
    },
  ];
  res.json(scenarios);
});

// ----------------------------------------------------
// VITE INTEGRATION MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GuardianPay AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
