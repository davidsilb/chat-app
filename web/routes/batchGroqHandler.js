import mongoose from "mongoose";
import ChatSession from "../mongo/ChatSession.js";
import fetch from "node-fetch";

export async function batchGroqHandler({
  models = [],
  userMessage = "",
  userRole = "user",
  userId = null, // allow null fallback
}) {
  if (!models.length) throw new Error("No models provided.");
  if (!userMessage.trim()) throw new Error("Empty user message.");

  let finalUserId;

  try {
    finalUserId = new mongoose.Types.ObjectId(userId);
  } catch (e) {
    finalUserId = new mongoose.Types.ObjectId('000000000000000000000000'); // fallback dummy user
  }  

  const results = await Promise.allSettled(
    models.map((modelName) => singleGroqCall({ modelName, userMessage, userRole }))
  );

  const mongoDocs = [];

  results.forEach((result, idx) => {
    const modelName = models[idx];
    if (result.status === "fulfilled" && result.value.success) {
      mongoDocs.push({
        userId: finalUserId,
        prompt: userMessage,
        responses: [{
          model: modelName,
          content: result.value.content,
        }],
      });
    } else {
      console.error(`[${modelName}] failed:`, result.reason || result.value.error);
    }
  });

  if (mongoDocs.length) {
    try {
      await ChatSession.insertMany(mongoDocs);
      console.log(`Saved ${mongoDocs.length} chats to MongoDB.`);
    } catch (dbErr) {
      console.error("MongoDB insert error:", dbErr);
    }
  } else {
    console.warn("No successful responses to save.");
  }

  return mongoDocs; // Optionally return saved entries
}

async function singleGroqCall({ modelName, userMessage, userRole }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: userRole, content: userMessage },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: "No content in response." };
    }

    console.log(`[${modelName}] Success in batchGroqHandler.js`);
    return { success: true, content };
  } catch (err) {
    if (err.name === "AbortError") {
      return { success: false, error: "Timeout after 9s." };
    }
    return { success: false, error: err.message || "Unknown error." };
  }
}