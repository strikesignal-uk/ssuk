import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings } from './settings.js';

let genAI = null;
let currentKey = '';

async function getModel() {
  const settings = await getSettings();
  const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (apiKey !== currentKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    currentKey = apiKey;
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export async function aiEnhanceSignal(match, baseSignal) {
  const model = await getModel();
  if (!model) return baseSignal;

  const prompt = `You are a football (soccer) live betting analyst AI. Analyze this live match data and provide a prediction.

MATCH DATA:
- ${match.home} vs ${match.away} (${match.league})
- Minute: ${match.minute}'
- Current Score: ${match.score.home}-${match.score.away}
- xG (Expected Goals): Home ${match.xG.home}, Away ${match.xG.away}, Total ${match.xG.total}
- xG Gap (xG minus actual goals): ${match.xGGap}
- Dangerous Attacks: ${match.dangerAttacks}
- Total Shots: ${match.shots}
- Pressure Index: ${match.pressure}
- Total Goals So Far: ${match.totalGoals}

CURRENT RULE-BASED SIGNAL:
- Bet Type: ${baseSignal.betType}
- Expected Score: ${baseSignal.expectedScore}
- Confidence: ${baseSignal.confidence}
- Reason: ${baseSignal.reason}

Based on the match statistics, provide your enhanced analysis. Respond in EXACTLY this JSON format, no other text:
{
  "betType": "one of: Back Over 1.5 Goals | Back Over 2.5 Goals | Both Teams to Score | Back Under 2.5 Goals | Next Goal Home | Next Goal Away",
  "expectedScore": "X-Y",
  "confidence": "low | medium | high",
  "reason": "brief 1-2 sentence analysis",
  "aiInsight": "brief tactical insight about why this bet is likely to hit"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return baseSignal;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.betType || !parsed.confidence || !parsed.reason) return baseSignal;

    return {
      ...baseSignal,                    // ← preserve sportybet, bookingCodes, betOdds etc.
      betType: parsed.betType,
      expectedScore: parsed.expectedScore || baseSignal.expectedScore,
      confidence: parsed.confidence,
      reason: parsed.reason,
      aiInsight: parsed.aiInsight || '',
      aiEnhanced: true,
      xGGap: baseSignal.xGGap,
    };
  } catch (e) {
    console.error(`[AI] Gemini error: ${e.message}`);
    return baseSignal;
  }
}
