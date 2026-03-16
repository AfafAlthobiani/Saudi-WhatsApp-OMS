import express from "express";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { OpenAI } from "openai";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import path from "path";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// --- API Routes ---

/**
 * WhatsApp Webhook Handler
 */
app.post("/api/whatsapp/webhook", async (req, res) => {
  const { Body, From } = req.body;
  
  if (!Body || !From) {
    return res.status(400).send("Missing Body or From");
  }

  console.log(`[WhatsApp] Message from ${From}: ${Body}`);

  try {
    // 1. Ensure a merchant exists (Auto-setup for demo)
    let { data: merchant } = await supabase.from("merchants").select("*").limit(1).single();
    
    if (!merchant) {
      const { data: newMerchant, error: mError } = await supabase.from("merchants").insert({
        name: "Mada Demo Store",
        vat_number: "312345678901233",
        phone_number: process.env.TWILIO_PHONE_NUMBER || "966500000000",
        address: "Riyadh, Saudi Arabia"
      }).select().single();
      
      if (mError) throw mError;
      merchant = newMerchant;
    }

    // 2. AI Parsing with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI order assistant for a Saudi merchant. 
          Extract order details from the message. 
          Respond ONLY with a JSON object:
          {
            "customer_name": string | null,
            "city": string | null,
            "district": string | null,
            "items": [{ "product_name": string, "quantity": number }]
          }`
        },
        { role: "user", content: Body }
      ],
      response_format: { type: "json_object" }
    });

    const extracted = JSON.parse(completion.choices[0].message.content || "{}");
    
    // 3. Repeat Customer Logic
    const { data: lastOrder } = await supabase
      .from("orders")
      .select("customer_name, city, district")
      .eq("customer_phone", From)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const name = extracted.customer_name || lastOrder?.customer_name || "Customer";
    const city = extracted.city || lastOrder?.city || "Riyadh";
    const district = extracted.district || lastOrder?.district || "Unknown";

    // 4. Product Validation & Stock
    let subtotal = 0;
    const itemsToInsert = [];

    for (const item of extracted.items || []) {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${item.product_name}%`) // Flexible matching
        .limit(1)
        .single();

      if (product && product.stock >= item.quantity) {
        itemsToInsert.push({
          product_id: product.id,
          quantity: item.quantity,
          price: product.price
        });
        subtotal += Number(product.price) * item.quantity;

        // Update stock
        await supabase.from("products").update({ stock: product.stock - item.quantity }).eq("id", product.id);
      }
    }

    if (itemsToInsert.length === 0) {
      await twilioClient.messages.create({
        body: `Sorry, we couldn't find those products or they are out of stock. Please check our catalog.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: From
      });
      return res.status(200).send("No items found");
    }

    // 5. Create Order
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    const { data: order, error: oError } = await supabase
      .from("orders")
      .insert({
        merchant_id: merchant.id,
        customer_name: name,
        customer_phone: From,
        city,
        district,
        status: "new",
        total_amount: total,
        vat_amount: vat
      })
      .select()
      .single();

    if (oError) throw oError;

    await supabase.from("order_items").insert(
      itemsToInsert.map(item => ({ ...item, order_id: order.id }))
    );

    // 6. Confirmation
    const msg = lastOrder 
      ? `Welcome back ${name}! Order #${order.id.slice(0,8)} received. Total: ${total.toFixed(2)} SAR (incl. VAT).`
      : `Thanks ${name}! Order #${order.id.slice(0,8)} received. Total: ${total.toFixed(2)} SAR (incl. VAT). We'll notify you when it ships.`;

    await twilioClient.messages.create({
      body: msg,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: From
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("[Webhook Error]", error);
    res.status(500).send("Internal Error");
  }
});

/**
 * Mock Shipping API
 */
app.post("/api/orders/:id/ship", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Mock Aramex/SMSA call
    const trackingNumber = `SA${Math.floor(Math.random() * 1000000000)}`;
    const labelUrl = `https://mock-shipping.com/labels/${trackingNumber}.pdf`;

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: trackingNumber,
        shipping_label_url: labelUrl
      })
      .eq("id", id)
      .select()
      .single();

    if (order) {
      // Send WhatsApp notification
      await twilioClient.messages.create({
        body: `Good news! Your order ${order.id} has been shipped. Tracking: ${trackingNumber}. Link: https://track.smsa.com/${trackingNumber}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: order.customer_phone
      });
    }

    res.json({ success: true, trackingNumber, labelUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to ship order" });
  }
});

/**
 * Daily Sales Summary Cron (Mocked as an endpoint for testing)
 */
app.get("/api/cron/daily-summary", async (req, res) => {
  // In a real app, this would be triggered by a cron job (e.g., Vercel Cron)
  // We'll calculate today's sales for all merchants
  const today = new Date().toISOString().split('T')[0];

  const { data: orders } = await supabase
    .from("orders")
    .select("*, merchants(name, phone_number)")
    .gte("created_at", today);

  // Group by merchant and send summary
  // ... logic to aggregate and send via Twilio ...

  res.json({ status: "Summary sent" });
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
