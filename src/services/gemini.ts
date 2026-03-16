import { GoogleGenAI, Type } from "@google/genai";

// The API key is injected by the platform as process.env.GEMINI_API_KEY
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Fast parsing of WhatsApp messages using Gemini 3.1 Flash Lite
 */
export const parseWhatsAppMessage = async (message: string) => {
  const model = "gemini-3.1-flash-lite-preview";
  const prompt = `
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

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Verify location using Google Maps grounding with Gemini 2.5 Flash
 */
export const verifyLocation = async (city: string, district: string) => {
  const model = "gemini-2.5-flash";
  const prompt = `Verify if the district "${district}" exists in the city "${city}" in Saudi Arabia. Return the official names and coordinates if possible.`;

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleMaps: {} }]
    }
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

/**
 * AI Sales Chat using Gemini 3.1 Flash Lite for speed
 */
export const getAIChatResponse = async (message: string, products: any[]) => {
  const model = "gemini-3.1-flash-lite-preview";
  const systemInstruction = `
    أنت مساعد مبيعات ذكي لمتجر يستخدم نظام "مدى OMS".
    مهمتك هي مساعدة العملاء، الإجابة على أسئلتهم حول المنتجات، واقتراح منتجات إضافية.
    المنتجات المتوفرة: ${JSON.stringify(products)}
    كن مهذباً، ودوداً، واستخدم اللهجة السعودية البيضاء إذا أمكن.
    إذا أراد العميل الطلب، اطلب منه تزويدك بالاسم والمدينة والحي.
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: message }] }],
    config: { 
      systemInstruction,
      maxOutputTokens: 500 
    }
  });

  return response.text;
};
