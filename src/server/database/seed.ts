import { queryOne, run, query } from './db';

export async function seedDatabase(): Promise<void> {
  const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    console.log('[Database] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Database] Seeding realistic synthetic demo records for hackathon evaluation...');

  const now = new Date().toISOString();
  const pastHours = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

  // 1. Seed Demo Users
  const users = [
    {
      id: 'usr_ravi_kumar',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      customer_id: 'GP1001',
      user_type: 'Digitally Inexperienced (Senior)',
      digital_experience: 'Beginner',
      protection_level: 'Enhanced',
      phone: '+91 98450 12890',
      account_number: '•••• •••• 4092',
      upi_id: 'ravi.kumar@okaxis',
      balance: 145000,
      habitual_max_amount: 5000,
      registered_device: "Ravi's Galaxy M32 (Android 12)",
      registered_ip: '122.164.88.14 (Home Broadband)',
      created_at: pastHours(720),
    },
    {
      id: 'usr_sunita_patel',
      name: 'Sunita Patel',
      email: 'sunita.patel@example.com',
      customer_id: 'GP1002',
      user_type: 'Moderate Experience (Teacher)',
      digital_experience: 'Intermediate',
      protection_level: 'Standard',
      phone: '+91 98201 54321',
      account_number: '•••• •••• 8831',
      upi_id: 'sunita.teacher@okhdfcbank',
      balance: 82500,
      habitual_max_amount: 15000,
      registered_device: "Sunita's Redmi Note 11 (Android 11)",
      registered_ip: '106.51.14.92 (Bengaluru, Fiber)',
      created_at: pastHours(600),
    },
    {
      id: 'usr_arjun_mehta',
      name: 'Arjun Mehta',
      email: 'arjun.mehta@example.com',
      customer_id: 'GP1003',
      user_type: 'Tech Savvy (Software Engineer)',
      digital_experience: 'Advanced',
      protection_level: 'Standard',
      phone: '+91 99012 34567',
      account_number: '•••• •••• 1209',
      upi_id: 'arjun.tech@icici',
      balance: 320000,
      habitual_max_amount: 50000,
      registered_device: "Arjun's Pixel 8 Pro (Android 14)",
      registered_ip: '49.207.218.4 (Tech Park Wi-Fi)',
      created_at: pastHours(400),
    },
  ];

  for (const u of users) {
    await run(
      `INSERT INTO users (id, name, email, customer_id, user_type, digital_experience, protection_level, phone, account_number, upi_id, balance, habitual_max_amount, registered_device, registered_ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.name,
        u.email,
        u.customer_id,
        u.user_type,
        u.digital_experience,
        u.protection_level,
        u.phone,
        u.account_number,
        u.upi_id,
        u.balance,
        u.habitual_max_amount,
        u.registered_device,
        u.registered_ip,
        u.created_at,
      ]
    );

    // Seed Safety Settings
    await run(
      `INSERT INTO safety_settings (id, user_id, transaction_monitoring, scam_analysis, high_risk_verification, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`set_${u.id}`, u.id, 1, 1, 1, now]
    );
  }

  // 2. Seed Trusted Beneficiaries for Ravi Kumar
  const beneficiaries = [
    {
      id: 'ben_rohan',
      user_id: 'usr_ravi_kumar',
      name: 'Rohan Kumar',
      upi_id: 'rohan.k@okaxis',
      account_number: '•••• •••• 1120',
      relationship: 'Son',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      is_trusted: 1,
      created_at: pastHours(500),
    },
    {
      id: 'ben_apollo',
      user_id: 'usr_ravi_kumar',
      name: 'Apollo Pharmacy',
      upi_id: 'apollopharmacy@icici',
      account_number: '•••• •••• 9921',
      relationship: 'Healthcare / Medicine',
      avatar: 'https://images.unsplash.com/photo-1586015555751-63c25e24c088?w=150',
      is_trusted: 1,
      created_at: pastHours(450),
    },
    {
      id: 'ben_bescom',
      user_id: 'usr_ravi_kumar',
      name: 'BESCOM Electricity Board',
      upi_id: 'bescom.billpay@sbi',
      account_number: '•••• •••• 3341',
      relationship: 'Utility Provider',
      avatar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=150',
      is_trusted: 1,
      created_at: pastHours(400),
    },
  ];

  for (const b of beneficiaries) {
    await run(
      `INSERT INTO beneficiaries (id, user_id, name, upi_id, account_number, relationship, avatar, is_trusted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.user_id, b.name, b.upi_id, b.account_number, b.relationship, b.avatar, b.is_trusted, b.created_at]
    );
  }

  // 3. Seed Synthetic Demo Transactions & Signals
  const txns = [
    {
      id: 'TXN-DEMO-1001',
      user_id: 'usr_ravi_kumar',
      recipient: 'Rohan Kumar',
      recipient_upi: 'rohan.k@okaxis',
      amount: 2500,
      purpose: 'Monthly grocery contribution',
      risk_score: 10,
      risk_level: 'LOW',
      recommended_action: 'ALLOW',
      status: 'ALLOWED',
      device: "Ravi's Galaxy M32 (Android 12)",
      location: '122.164.88.14 (Home)',
      created_at: pastHours(24),
      signals: [
        { reason: 'Known trusted beneficiary (Son)', points: 0 },
        { reason: 'Amount well within habitual limit (₹5,000)', points: 0 },
        { reason: 'Baseline transaction risk factor', points: 10 },
      ],
    },
    {
      id: 'TXN-DEMO-1002',
      user_id: 'usr_ravi_kumar',
      recipient: 'Electricity Officer Support',
      recipient_upi: 'quickbill982@paytm',
      amount: 80000,
      purpose: 'Urgent payment, send immediately, OTP verification required',
      risk_score: 95,
      risk_level: 'CRITICAL',
      recommended_action: 'HOLD',
      status: 'HELD',
      device: 'Unrecognized Chrome Browser (Linux)',
      location: '103.21.124.9 (Unknown VPN)',
      created_at: pastHours(3),
      signals: [
        { reason: 'Amount ₹80,000 dramatically exceeds habitual limit of ₹5,000', points: 30 },
        { reason: 'Unfamiliar first-time recipient not in trusted directory', points: 20 },
        { reason: 'Urgent coercive language in payment purpose ("send immediately")', points: 10 },
        { reason: 'Credential or OTP request keywords detected in purpose', points: 15 },
        { reason: 'Large payment to newly introduced recipient anomaly', points: 10 },
        { reason: 'Enhanced senior citizen protective weighting applied', points: 10 },
      ],
    },
    {
      id: 'TXN-DEMO-1003',
      user_id: 'usr_ravi_kumar',
      recipient: 'Cyber Tech Verification Desk',
      recipient_upi: 'urgent.desk@upi',
      amount: 45000,
      purpose: 'Urgent KYC reactivation verification fee',
      risk_score: 85,
      risk_level: 'HIGH',
      recommended_action: 'HOLD',
      status: 'HELD',
      device: 'Unrecognized Device Fingerprint',
      location: '106.51.14.92',
      created_at: pastHours(1),
      signals: [
        { reason: 'Amount ₹45,000 exceeds habitual limit of ₹5,000', points: 25 },
        { reason: 'Unfamiliar recipient not in trusted directory', points: 20 },
        { reason: 'Urgent keywords ("Urgent", "KYC")', points: 10 },
        { reason: 'Credential/verification request keywords in purpose', points: 15 },
        { reason: 'Senior citizen enhanced protection sensitivity (+10)', points: 10 },
      ],
    },
    {
      id: 'TXN-DEMO-1004',
      user_id: 'usr_ravi_kumar',
      recipient: 'Apollo Pharmacy',
      recipient_upi: 'apollopharmacy@icici',
      amount: 1450,
      purpose: 'Monthly prescription medicines',
      risk_score: 10,
      risk_level: 'LOW',
      recommended_action: 'ALLOW',
      status: 'ALLOWED',
      device: "Ravi's Galaxy M32 (Android 12)",
      location: '122.164.88.14 (Home)',
      created_at: pastHours(48),
      signals: [
        { reason: 'Known trusted pharmacy beneficiary', points: 0 },
        { reason: 'Within regular habitual limits', points: 0 },
      ],
    },
  ];

  for (const t of txns) {
    await run(
      `INSERT INTO transactions (id, user_id, recipient, recipient_upi, amount, purpose, risk_score, risk_level, recommended_action, status, device, location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.user_id,
        t.recipient,
        t.recipient_upi,
        t.amount,
        t.purpose,
        t.risk_score,
        t.risk_level,
        t.recommended_action,
        t.status,
        t.device,
        t.location,
        t.created_at,
      ]
    );

    let sigIndex = 1;
    for (const sig of t.signals) {
      await run(
        `INSERT INTO transaction_risk_signals (id, transaction_id, reason, points)
         VALUES (?, ?, ?, ?)`,
        [`sig_${t.id}_${sigIndex++}`, t.id, sig.reason, sig.points]
      );
    }
  }

  // 4. Seed Synthetic Scam Analyses
  const scams = [
    {
      id: 'SCAM-DEMO-101',
      user_id: 'usr_ravi_kumar',
      message: 'Dear Customer, Your SBI YONO Account will be Blocked Today! Please update your PAN Card immediately by clicking http://sbi-pan-kyc.apk or call bank officer at 9845019283 to avoid permanent seizure.',
      score: 95,
      risk_level: 'CRITICAL',
      categories: JSON.stringify(['Phishing', 'Fake Bank KYC', 'Malicious APK', 'Social Engineering']),
      reasons: JSON.stringify([
        'Manufactures artificial panic ("Account Blocked Today")',
        'Requests downloading third-party APK application',
        'Directs user to unofficial personal phone number',
        'Banks never update KYC via SMS links or APK files',
      ]),
      recommended_action: 'DO NOT ACT. Do not click links or install files. Report directly to National Cyber Helpline 1930.',
      source: 'LOCAL_HEURISTIC_ENGINE',
      created_at: pastHours(5),
    },
    {
      id: 'SCAM-DEMO-102',
      user_id: 'usr_ravi_kumar',
      message: 'Dear consumer, your electricity power will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our officer at 8910234567.',
      score: 90,
      risk_level: 'CRITICAL',
      categories: JSON.stringify(['Utility Scam', 'Urgency Coercion', 'Impersonation']),
      reasons: JSON.stringify([
        'Threatens immediate utility disconnection tonight to induce panic',
        'Provides personal mobile number instead of official BESCOM billing counter',
        'Electricity boards follow statutory paper notices, not WhatsApp threats',
      ]),
      recommended_action: 'DO NOT CALL. Check your electricity bill via official BESCOM portal or physical counter.',
      source: 'LOCAL_HEURISTIC_ENGINE',
      created_at: pastHours(12),
    },
    {
      id: 'SCAM-DEMO-103',
      user_id: 'usr_ravi_kumar',
      message: 'Hi Papa, please send Rs 2,500 for groceries when you get time today. Love, Rohan.',
      score: 5,
      risk_level: 'LOW',
      categories: JSON.stringify(['Legitimate Family Message']),
      reasons: JSON.stringify([
        'No psychological urgency or coercive threats detected',
        'No suspicious links, OTP, PIN, or banking credential requests',
        'Matches known family tone and trusted beneficiary identity',
      ]),
      recommended_action: 'Safe message. You may proceed with normal family transfer when convenient.',
      source: 'LOCAL_HEURISTIC_ENGINE',
      created_at: pastHours(26),
    },
  ];

  for (const s of scams) {
    await run(
      `INSERT INTO scam_analyses (id, user_id, message, score, risk_level, categories, reasons, recommended_action, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.user_id,
        s.message,
        s.score,
        s.risk_level,
        s.categories,
        s.reasons,
        s.recommended_action,
        s.source,
        s.created_at,
      ]
    );
  }

  // 5. Seed Synthetic Alerts
  const alerts = [
    {
      id: 'ALT-DEMO-201',
      user_id: 'usr_ravi_kumar',
      type: 'HIGH_RISK_TRANSACTION',
      title: 'Protective Safeguard Hold Active on ₹80,000',
      message: 'Transfer to "Electricity Officer Support" was held due to unfamiliar beneficiary, large sum, and coercive keywords.',
      severity: 'CRITICAL',
      related_transaction_id: 'TXN-DEMO-1002',
      related_scam_id: null,
      read: 0,
      created_at: pastHours(3),
    },
    {
      id: 'ALT-DEMO-202',
      user_id: 'usr_ravi_kumar',
      type: 'SCAM_DETECTED',
      title: 'Deceptive Phishing SMS Detected',
      message: 'Fake SBI KYC expiration SMS was scanned and identified as a Critical Risk phishing attempt.',
      severity: 'HIGH',
      related_transaction_id: null,
      related_scam_id: 'SCAM-DEMO-101',
      read: 0,
      created_at: pastHours(5),
    },
    {
      id: 'ALT-DEMO-203',
      user_id: 'usr_ravi_kumar',
      type: 'SAFETY_REMINDER',
      title: 'Senior Citizen Shield Active',
      message: 'Your account is protected under GuardianPay Enhanced Protection. Outbound transactions undergo real-time behavioral verification.',
      severity: 'LOW',
      related_transaction_id: null,
      related_scam_id: null,
      read: 1,
      created_at: pastHours(48),
    },
  ];

  for (const a of alerts) {
    await run(
      `INSERT INTO alerts (id, user_id, type, title, message, severity, related_transaction_id, related_scam_id, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.user_id, a.type, a.title, a.message, a.severity, a.related_transaction_id, a.related_scam_id, a.read, a.created_at]
    );
  }

  console.log('[Database] Seed completed successfully with realistic synthetic demo data.');
}
