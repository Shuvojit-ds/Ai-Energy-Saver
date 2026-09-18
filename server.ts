import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// RAG Query API: Takes user question and relevant retrieved knowledge chunks, calls Gemini 3.8 Flash
app.post("/api/rag/query", async (req, res) => {
  try {
    const { question, retrievedChunks, userContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback synthesis if no API key is provided
      return res.json({
        answer: `[Offline/No API Key Mode]: Based on the retrieved energy standards, setting your thermostat between 24°C and 26°C reduces cooling consumption by ~6% per degree. Upgrading ceiling fans to BLDC motors lowers power from 75W to 28W, yielding an estimated monthly savings of ₹150-₹220 per fan with an 8-month payback.`,
        grounded: true,
        source: "fallback-rules-engine",
      });
    }

    const contextText = (retrievedChunks || [])
      .map(
        (chunk: { id: string; title: string; text: string; source: string }, idx: number) =>
          `[Source ${idx + 1}: ${chunk.title} (${chunk.source})]\n${chunk.text}`
      )
      .join("\n\n");

    const prompt = `You are the AI Energy Saver Expert. Answer the user's energy question using strictly the retrieved knowledge base below, along with the user's appliance context.

Retrieved Knowledge Documents:
${contextText}

User's Energy Profile Context:
${userContext ? JSON.stringify(userContext, null, 2) : "Standard household profile"}

User Question:
"${question}"

Instructions:
1. Provide a direct, quantified, and actionable response.
2. Cite the specific sources (e.g. "[Source 1]", "[Source 2]") when making claims or mentioning numbers.
3. Calculate potential electricity bill savings (in ₹ or currency mentioned) whenever relevant.
4. Keep the tone professional, encouraging, and clear.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an AI Energy Auditor specialized in residential and commercial electricity efficiency, seasonal optimization, tariff mitigation, and RAG knowledge synthesis.",
      },
    });

    return res.json({
      answer: response.text || "No response generated.",
      grounded: true,
      source: "gemini-3.8-flash",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in /api/rag/query:", message);
    return res.status(500).json({
      error: message,
      fallbackAnswer:
        "Unable to reach Gemini API. Based on standard energy conservation principles: Increasing AC setpoint by 1°C saves ~6% energy, and switching to BLDC fans cuts fan electricity by 62%.",
    });
  }
});

// Agentic AI Audit Endpoint: Runs multi-step reasoning with tools
app.post("/api/agent/audit", async (req, res) => {
  try {
    const { appliances, month, electricityRate, kaggleBaseline } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Deterministic rule-based agent trace if API key is not configured
      return res.json({
        status: "success",
        plan: {
          summary: "Automated Energy Audit Plan (Offline Engine)",
          primaryCulprit: "Inverter Split AC & High Wattage Ceiling Fans",
          totalPotentialMonthlySavings: Math.round((electricityRate || 8) * 148),
          reducedMonthlyCost: Math.round((electricityRate || 8) * 380),
          roiMonths: 7.5,
          co2ReductionKg: 121.4,
          steps: [
            {
              priority: "Immediate (0 Cost)",
              action: "Set Inverter AC thermostat to 24°C instead of 18-20°C and enable 4-hour sleep timer.",
              monthlySavings: "₹650 / month",
              impact: "High",
            },
            {
              priority: "Immediate (0 Cost)",
              action: "Deactivate standby power strip for entertainment & workstation setups at night.",
              monthlySavings: "₹180 / month",
              impact: "Medium",
            },
            {
              priority: "High ROI Upgrade",
              action: "Replace 3 standard induction fans (75W) with 5-star BLDC fans (28W).",
              monthlySavings: "₹450 / month",
              impact: "High",
            },
          ],
        },
      });
    }

    const prompt = `You are an Agentic Energy Auditor executing a comprehensive energy optimization plan for a user.
Here is the current user setup:
- Selected Month: ${month}
- Electricity Rate: ₹${electricityRate || 8}/kWh
- Configured Appliances:
${JSON.stringify(appliances, null, 2)}
- Kaggle Dataset Average Household Baseline: ${kaggleBaseline?.avgKwhDay || "22.5"} kWh/day.

Analyze the profile and generate a structured JSON energy audit plan with the following fields:
{
  "summary": "Brief 2-sentence executive summary of the household's energy footprint and saving potential",
  "primaryCulprit": "The single appliance or usage pattern driving the highest unnecessary cost",
  "totalPotentialMonthlySavings": <number in ₹>,
  "reducedMonthlyCost": <number in ₹>,
  "roiMonths": <number, estimated payback period in months for recommended hardware upgrades>,
  "co2ReductionKg": <number, monthly kg of CO2 saved at 0.82kg/kWh>,
  "steps": [
    {
      "priority": "Immediate (0 Cost) | Medium Term | High ROI Upgrade",
      "action": "Specific concrete instruction",
      "monthlySavings": "e.g. ₹600 / month",
      "impact": "High | Medium | Low"
    }
  ],
  "agentNotes": "Key recommendation about seasonal habits for the current month (${month})"
}

Return ONLY valid JSON matching this schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ status: "success", plan: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in /api/agent/audit:", message);
    return res.status(500).json({ error: message });
  }
});

// Interactive Energy Chat Assistant
app.post("/api/agent/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply:
          "I am running in local mode. For optimal energy efficiency, keep your AC at 24°C, use BLDC fans, turn off vampire loads, and shift high-load appliances away from 6 PM - 10 PM peak tariff hours!",
      });
    }

    const conversationHistory = (messages || [])
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Energy Agent"}: ${m.content}`)
      .join("\n");

    const prompt = `You are the AI Energy Saver Agent, a knowledgeable, friendly, and data-driven energy consultant.
User's Household Context:
${JSON.stringify(userContext || {}, null, 2)}

Conversation history:
${conversationHistory}

Respond to the user's latest query with concise, accurate, actionable advice. Include specific numbers (kWh, ₹ cost, or % savings) where applicable.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return res.json({ reply: response.text || "I couldn't process that request." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error in /api/agent/chat:", message);
    return res.status(500).json({ error: message });
  }
});

// Vite Middleware for development vs static build for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Energy Saver server running on port ${PORT}`);
  });
}

startServer();
