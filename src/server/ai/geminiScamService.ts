import { GoogleGenAI } from '@google/genai';

export interface ScamAnalysisOutput {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categories: string[];
  reasons: string[];
  recommendedAction: string;
  source: 'GEMINI_AI' | 'LOCAL_HEURISTIC_ENGINE';
}

export function analyzeScamLocalHeuristics(message: string): ScamAnalysisOutput {
  const lower = message.toLowerCase();
  let score = 5;
  const categories: string[] = [];
  const reasons: string[] = [];

  // Keywords checks
  const isOtpPin = /(otp|pin|cvv|password|passcode|verification code|security code)/i.test(lower);
  const isUrgent = /(immediately|urgent|today|tonight|within \d+|hours|minutes|expire|blocked|suspended|seized|disconnected)/i.test(lower);
  const isBank = /(sbi|hdfc|icici|axis|bank|rbi|yono|kyc|pan card|aadhaar|account)/i.test(lower);
  const isPower = /(electricity|power|bescom|mseb|tneb|light bill|meter)/i.test(lower);
  const isRemote = /(anydesk|teamviewer|quicksupport|screen share|install apk|\.apk|download app)/i.test(lower);
  const isPoliceLegal = /(police|cbi|customs|arrest|warrant|court|narcotics|digital arrest|fir)/i.test(lower);
  const isLotteryRefund = /(lottery|won|cashback|prize|reward|refund|credit of rs|claim)/i.test(lower);
  const hasUrl = /(https?:\/\/|bit\.ly|tinyurl|\.apk|\.xyz|\.top|\.online|[0-9]{10})/i.test(lower);

  if (isOtpPin) {
    score += 35;
    categories.push('Credential / OTP Harvesting');
    reasons.push('Requests sensitive one-time password (OTP), PIN, or security codes.');
  }

  if (isUrgent) {
    score += 25;
    categories.push('Artificial Urgency Coercion');
    reasons.push('Uses manufactured time pressure or immediate threats to bypass rational thought.');
  }

  if (isBank && (lower.includes('block') || lower.includes('kyc') || lower.includes('pan'))) {
    score += 30;
    categories.push('Fake Bank KYC / Account Block Scam');
    reasons.push('Impersonates financial institution threatening account suspension for pending KYC.');
  }

  if (isPower) {
    score += 30;
    categories.push('Utility Disconnection Fraud');
    reasons.push('Threatens immediate power disconnection to trick victim into calling unofficial number.');
  }

  if (isRemote) {
    score += 35;
    categories.push('Malicious APK / Remote Screen Access');
    reasons.push('Requests installation of APK or remote-control tools (AnyDesk/TeamViewer).');
  }

  if (isPoliceLegal) {
    score += 40;
    categories.push('Coercive Impersonation / Fake Legal Threat');
    reasons.push('Threatens law enforcement or arrest to panic senior citizens.');
  }

  if (isLotteryRefund) {
    score += 20;
    categories.push('Unsolicited Prize / Advance Refund Fraud');
    reasons.push('Promises unverified monetary lottery or refund requiring payment.');
  }

  if (hasUrl) {
    score += 15;
    categories.push('Deceptive Link / Unofficial Contact');
    reasons.push('Contains unofficial hyperlinks, APK downloads, or personal mobile numbers.');
  }

  score = Math.min(100, Math.max(5, score));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let recommendedAction = 'Message appears standard. Exercise normal caution.';

  if (score >= 80) {
    riskLevel = 'CRITICAL';
    recommendedAction =
      'DO NOT ACT. Do not click any links, do not install applications, and do not call back. Report immediately to National Cyber Helpline 1930.';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
    recommendedAction =
      'HIGH RISK. Verify directly by visiting your official bank branch or dialing the official helpline listed on your bank card.';
  } else if (score >= 35) {
    riskLevel = 'MEDIUM';
    recommendedAction =
      'SUSPICIOUS. Cross-check this message with a trusted family member before taking any financial action.';
  }

  if (categories.length === 0) {
    categories.push('Routine Communication');
    reasons.push('No coercive patterns, deceptive links, or credential requests detected.');
  }

  return {
    score,
    riskLevel,
    categories,
    reasons,
    recommendedAction,
    source: 'LOCAL_HEURISTIC_ENGINE',
  };
}

export async function analyzeScamWithGemini(message: string): Promise<ScamAnalysisOutput> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.log('[AI Engine] GEMINI_API_KEY not set. Using local deterministic heuristic engine.');
    return analyzeScamLocalHeuristics(message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the GuardianPay AI Senior Fraud Specialist. Analyze the following SMS or message received by an Indian senior citizen banking customer.
Message:
"""
${message}
"""

Evaluate social engineering, psychological urgency, fake KYC, utility threats, and OTP/PIN harvesting.
Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "score": <number between 0 and 100>,
  "riskLevel": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "categories": [<array of specific scam categories, e.g. "Fake Bank KYC", "Urgency Coercion">],
  "reasons": [<array of clear, plain-language explanation bullet points for an elderly victim>],
  "recommendedAction": <string of specific defensive action to take, e.g. "DO NOT ACT. Dial 1930.">
}
Do not include markdown code fence formatting or explanations outside JSON.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out (4s)')), 4000)
    );

    const response = (await Promise.race([aiPromise, timeoutPromise])) as any;

    const text = response.text?.trim() || '';
    const cleaned = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.score === 'number' &&
      parsed.riskLevel &&
      Array.isArray(parsed.categories) &&
      Array.isArray(parsed.reasons) &&
      typeof parsed.recommendedAction === 'string'
    ) {
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        riskLevel: parsed.riskLevel,
        categories: parsed.categories,
        reasons: parsed.reasons,
        recommendedAction: parsed.recommendedAction,
        source: 'GEMINI_AI',
      };
    }

    console.warn('[AI Engine] Gemini response did not match schema. Falling back to local engine.');
    return analyzeScamLocalHeuristics(message);
  } catch (err) {
    console.warn('[AI Engine] Gemini API request failed, seamlessly falling back to local heuristics:', err);
    return analyzeScamLocalHeuristics(message);
  }
}
