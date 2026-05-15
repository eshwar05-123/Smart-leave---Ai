import { GoogleGenerativeAI } from "@google/generative-ai";

const jsonSchemaHint = `Return ONLY valid JSON with this shape (no markdown):
{
  "generated_message": "string, professional leave email body",
  "urgency": "low" | "medium" | "high" | "critical",
  "suggested_duration_days": number,
  "hr_recommendation": "approve" | "review" | "urgent_attention",
  "suspicious_pattern": boolean,
  "suspicious_reason": "string, empty if not suspicious",
  "ai_prediction_summary": "string, one sentence forecast of impact on team"
}`;

function stripJson(text) {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return t.trim();
}

export async function analyzeLeaveRequest(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackAnalysis(payload);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });

    const prompt = `You are an HR assistant. Analyze this leave request and respond with JSON only.
Employee: ${payload.employeeName}, Department: ${payload.department}
Reason category: ${payload.reasonType}
Employee notes: ${payload.userNotes || "none"}
Requested start: ${payload.startDate}
Requested end: ${payload.endDate}
Requested duration (calendar days): ${payload.requestedDays}

${jsonSchemaHint}

Rules: Medical/Personal Emergency often warrant urgent_attention or high urgency. Exam/Travel may be approve if duration reasonable. Flag suspicious_pattern if notes contradict reason, duration extreme, or obvious gaming.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(stripJson(text));
    return normalize(parsed);
  } catch (e) {
    console.warn("Gemini analysis failed, using fallback:", e.message || e);
    return fallbackAnalysis(payload);
  }
}

function normalize(p) {
  const urgency = ["low", "medium", "high", "critical"].includes(p.urgency) ? p.urgency : "medium";
  const hr = ["approve", "review", "urgent_attention"].includes(p.hr_recommendation) ? p.hr_recommendation : "review";
  const days = Number.isFinite(Number(p.suggested_duration_days)) ? Math.max(1, Math.min(30, Math.round(Number(p.suggested_duration_days)))) : 1;
  return {
    generated_message: String(p.generated_message || "").slice(0, 4000),
    urgency,
    suggested_duration_days: days,
    hr_recommendation: hr,
    suspicious_pattern: Boolean(p.suspicious_pattern),
    suspicious_reason: String(p.suspicious_reason || "").slice(0, 500),
    ai_prediction_summary: String(p.ai_prediction_summary || "").slice(0, 500),
  };
}

function fallbackAnalysis(payload) {
  const emergency = ["Medical Emergency", "Personal Emergency"].includes(payload.reasonType);
  const urgency = emergency ? "high" : payload.reasonType === "Fever" ? "medium" : "low";
  const hr = emergency ? "urgent_attention" : payload.requestedDays <= 3 ? "approve" : "review";
  const msg = `Dear HR Team,\n\nI am writing to request leave from ${payload.startDate} to ${payload.endDate} (${payload.requestedDays} day(s)) due to ${payload.reasonType}.${payload.userNotes ? ` Additional context: ${payload.userNotes}` : ""}\n\nThank you for your consideration.\n\nSincerely,\n${payload.employeeName}`;
  return {
    generated_message: msg,
    urgency,
    suggested_duration_days: Math.min(payload.requestedDays, emergency ? 3 : 5),
    hr_recommendation: hr,
    suspicious_pattern: payload.requestedDays > 14 && !emergency,
    suspicious_reason: payload.requestedDays > 14 && !emergency ? "Long leave without emergency reason" : "",
    ai_prediction_summary: "Gemini API key not set; using rule-based analysis.",
  };
}
