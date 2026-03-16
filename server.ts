import express from "express";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Clients Lazily
let genAI: GoogleGenAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// --- API Routes ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabase: !!process.env.VITE_SUPABASE_URL });
});

/**
 * AI WhatsApp Message Parser
 */
app.post("/api/ai/parse", async (req, res) => {
  const { message, merchantId } = req.body;
  if (!message || !merchantId) return res.status(400).json({ error: "Missing message or merchantId" });

  try {
    const ai = getGenAI();
    const prompt = `
      You are an AI order parser for "Mada OMS".
      Extract order details from this WhatsApp message in Arabic: "${message}"
      
      Return ONLY a JSON object with:
      {
        "customer_name": string,
        "customer_phone": string (if found),
        "city": string,
        "district": string,
        "items": [{ "product_name": string, "quantity": number }],
        "notes": string
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const extracted = JSON.parse(response.text || "{}");

    // Check credits
    const { data: merchant } = await supabase.from("merchants").select("credits").eq("id", merchantId).single();
    if (!merchant || merchant.credits < 1) {
      return res.status(403).json({ error: "Insufficient credits" });
    }

    // Deduct 1 credit
    await supabase.from("merchants").update({ credits: merchant.credits - 1 }).eq("id", merchantId);

    res.json(extracted);
  } catch (error) {
    console.error("AI Parse Error:", error);
    res.status(500).json({ error: "Failed to parse message" });
  }
});

/**
 * AI Sales Agent Chat
 */
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, products } = req.body;
  
  try {
    const ai = getGenAI();
    const systemInstruction = `
      أنت مساعد مبيعات ذكي لمتجر يستخدم نظام "مدى OMS".
      مهمتك هي مساعدة العملاء، الإجابة على أسئلتهم حول المنتجات، واقتراح منتجات إضافية.
      المنتجات المتوفرة: ${JSON.stringify(products)}
      كن مهذباً، ودوداً، واستخدم اللهجة السعودية البيضاء إذا أمكن.
      إذا أراد العميل الطلب، اطلب منه تزويدك بالاسم والمدينة والحي.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: message }] }],
      config: { 
        systemInstruction,
        maxOutputTokens: 500 
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    res.status(500).json({ error: "Failed to chat" });
  }
});

/**
 * AI Sales Insights
 */
app.post("/api/ai/insights", async (req, res) => {
  const { merchantId } = req.body;
  
  try {
    const { data: orders } = await supabase.from("orders").select("*, order_items(*)").eq("merchant_id", merchantId);
    const { data: products } = await supabase.from("products").select("*");

    const ai = getGenAI();
    const prompt = `
      Analyze this sales data for a merchant:
      Orders: ${JSON.stringify(orders)}
      Products: ${JSON.stringify(products)}
      
      Generate 3 key insights in Arabic for the merchant dashboard.
      Focus on: Best selling, stock recommendations, and revenue trends.
      Return as a JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const insights = JSON.parse(response.text || "[]");
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
