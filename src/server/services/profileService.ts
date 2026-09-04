import { query, queryOne, run } from '../database/db';

export async function getUserProfile(userId: string) {
  const user = await queryOne(
    `SELECT * FROM users WHERE id = ? OR customer_id = ? LIMIT 1`,
    [userId, userId]
  );
  if (!user) return null;

  const safety = await queryOne(`SELECT * FROM safety_settings WHERE user_id = ? LIMIT 1`, [user.id]);
  const beneficiaries = await query(`SELECT * FROM beneficiaries WHERE user_id = ? ORDER BY created_at DESC`, [user.id]);

  return {
    ...user,
    safetySettings: safety || { transaction_monitoring: 1, scam_analysis: 1, high_risk_verification: 1 },
    beneficiaries,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: {
    userType?: string;
    digitalExperience?: string;
    protectionLevel?: string;
    habitualMaxAmount?: number;
    balance?: number;
  }
) {
  const user = await queryOne(`SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [userId, userId]);
  if (!user) throw new Error(`User ${userId} not found.`);

  const sets: string[] = [];
  const params: any[] = [];

  if (updates.userType !== undefined) {
    sets.push('user_type = ?');
    params.push(updates.userType);
  }
  if (updates.digitalExperience !== undefined) {
    sets.push('digital_experience = ?');
    params.push(updates.digitalExperience);
  }
  if (updates.protectionLevel !== undefined) {
    sets.push('protection_level = ?');
    params.push(updates.protectionLevel);
  }
  if (updates.habitualMaxAmount !== undefined) {
    sets.push('habitual_max_amount = ?');
    params.push(updates.habitualMaxAmount);
  }
  if (updates.balance !== undefined) {
    sets.push('balance = ?');
    params.push(updates.balance);
  }

  if (sets.length > 0) {
    params.push(user.id);
    await run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  return getUserProfile(user.id);
}

export async function getSafetySettings(userId: string) {
  const user = await queryOne(`SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [userId, userId]);
  if (!user) throw new Error(`User ${userId} not found.`);

  let safety = await queryOne(`SELECT * FROM safety_settings WHERE user_id = ? LIMIT 1`, [user.id]);
  if (!safety) {
    const now = new Date().toISOString();
    await run(
      `INSERT INTO safety_settings (id, user_id, transaction_monitoring, scam_analysis, high_risk_verification, updated_at)
       VALUES (?, ?, 1, 1, 1, ?)`,
      [`set_${user.id}`, user.id, now]
    );
    safety = await queryOne(`SELECT * FROM safety_settings WHERE user_id = ? LIMIT 1`, [user.id]);
  }

  return {
    transactionMonitoring: Boolean(safety.transaction_monitoring),
    scamAnalysis: Boolean(safety.scam_analysis),
    highRiskVerification: Boolean(safety.high_risk_verification),
    updatedAt: safety.updated_at,
  };
}

export async function updateSafetySettings(
  userId: string,
  updates: {
    transactionMonitoring?: boolean;
    scamAnalysis?: boolean;
    highRiskVerification?: boolean;
  }
) {
  const user = await queryOne(`SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [userId, userId]);
  if (!user) throw new Error(`User ${userId} not found.`);

  const sets: string[] = [];
  const params: any[] = [];

  if (updates.transactionMonitoring !== undefined) {
    sets.push('transaction_monitoring = ?');
    params.push(updates.transactionMonitoring ? 1 : 0);
  }
  if (updates.scamAnalysis !== undefined) {
    sets.push('scam_analysis = ?');
    params.push(updates.scamAnalysis ? 1 : 0);
  }
  if (updates.highRiskVerification !== undefined) {
    sets.push('high_risk_verification = ?');
    params.push(updates.highRiskVerification ? 1 : 0);
  }

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());

  params.push(user.id);
  await run(`UPDATE safety_settings SET ${sets.join(', ')} WHERE user_id = ?`, params);

  return getSafetySettings(user.id);
}

export function mapUserToCustomer(user: any) {
  const isSenior = (user.user_type || '').includes('Senior') || (user.name || '').includes('Ravi');
  const age = isSenior ? 68 : (user.id === 'usr_sunita_patel' ? 52 : 34);
  const avatar =
    user.id === 'usr_ravi_kumar'
      ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
      : user.id === 'usr_sunita_patel'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

  return {
    id: user.id,
    customerId: user.customer_id,
    customer_id: user.customer_id,
    name: user.name,
    email: user.email,
    age,
    persona: user.user_type,
    avatar,
    phone: user.phone,
    accountNumber: user.account_number,
    account_number: user.account_number,
    upiId: user.upi_id,
    upi_id: user.upi_id,
    balance: user.balance,
    habitualMaxAmount: user.habitual_max_amount,
    habitual_max_amount: user.habitual_max_amount,
    safetyStatus: 'PROTECTED',
    activeHours: { start: 7, end: 21 },
    registeredDevice: user.registered_device,
    registered_device: user.registered_device,
    registeredIp: user.registered_ip,
    registered_ip: user.registered_ip,
    hasRecentScamLink: false,
    userType: user.user_type,
    user_type: user.user_type,
    digitalExperience: user.digital_experience,
    digital_experience: user.digital_experience,
    protectionLevel: user.protection_level,
    protection_level: user.protection_level,
  };
}

export async function getAllUsers() {
  const users = await query(`SELECT * FROM users ORDER BY created_at ASC`);
  return users.map(mapUserToCustomer);
}

export async function getAllCustomers() {
  const users = await query(`SELECT * FROM users ORDER BY created_at ASC`);
  return users.map(mapUserToCustomer);
}

export async function addBeneficiary(
  userId: string,
  beneficiary: {
    name: string;
    upiId: string;
    relationship?: string;
    accountNumber?: string;
    avatar?: string;
  }
) {
  const user = await queryOne(`SELECT id FROM users WHERE id = ? OR customer_id = ? LIMIT 1`, [userId, userId]);
  if (!user) throw new Error(`User ${userId} not found.`);

  const id = `ben_${Date.now()}`;
  const now = new Date().toISOString();

  await run(
    `INSERT INTO beneficiaries (id, user_id, name, upi_id, account_number, relationship, avatar, is_trusted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      id,
      user.id,
      beneficiary.name,
      beneficiary.upiId,
      beneficiary.accountNumber || '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      beneficiary.relationship || 'Trusted Contact',
      beneficiary.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      now,
    ]
  );

  return queryOne(`SELECT * FROM beneficiaries WHERE id = ?`, [id]);
}
