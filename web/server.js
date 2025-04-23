import express from "express";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import ChatSession from "./mongo/ChatSession.js";
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

console.log("....server.js loading…");

app.get("/ping", (_req, res) => res.send("pong"));

app.use(express.static(__dirname));
app.use(express.json());

const textModels = [
  { route: "compound-beta-mini", model: "compound-beta-mini" },
  {
    route: "meta-llama_llama-4-maverick-17b-128e-instruct",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct"
  },
  { route: "qwen-qwq-32b", model: "qwen-qwq-32b" },
  { route: "llama3-8b-8192", model: "llama3-8b-8192" },
  { route: "gemma2-9b-it", model: "gemma2-9b-it" },
  {
    route: "deepseek-r1-distill-llama-70b",
    model: "deepseek-r1-distill-llama-70b"
  },
  { route: "llama3-70b-8192", model: "llama3-70b-8192" },
  { route: "mistral-saba-24b", model: "mistral-saba-24b" },
  { route: "compound-beta", model: "compound-beta" },
  { route: "llama-3.1-8b-instant", model: "llama-3.1-8b-instant" },
  {
    route: "llama-3.3-70b-versatile",
    model: "llama-3.3-70b-versatile"
  },
  {
    route: "meta-llama_llama-4-scout-17b-16e-instruct",
    model: "meta-llama/llama-4-scout-17b-16e-instruct"
  }
];

function groqHandler(modelName) {
  return async (req, res) => {
    const userMessage = req.body.message;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const result = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: "user", content: userMessage }]
          })
        }
      );
      clearTimeout(timeout);
      if (!result.ok) {
        console.error(`[${modelName}] non-200 response:`, result.status, await result.text());
        return res.status(500).json({ reply: `Upstream error from ${modelName}` });
      }

      const json = await result.json();
      const content = json.choices?.[0]?.message?.content;

      if (!content) {
        console.error(`[${modelName}] bad response:`, JSON.stringify(json, null, 2));
        return res.status(500).json({ reply: `No valid response from ${modelName}` });
      }

      console.log(`[${modelName}] reply →`, content);

      // Save the chat to MongoDB
      await ChatSession.create({
        userId: req.body.userId || "tempUser",
        prompt: userMessage,
        responses: [{
          model: modelName,
          content,
        }]
      });

      // Send the successful response
      res.json({ reply: content });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`[${modelName}] timeout error:`, err);
        return res.status(504).json({ reply: `${modelName} timed out` });
      }
      console.error(`[${modelName}] error:`, err);
      res.status(500).json({ reply: `Error calling ${modelName}` });
    }
  };
}

//for future use possibly, unused as of now
app.get("/api/history/:userId", async (req, res) => {
  try {
    const chats = await ChatSession.find({ userId: req.params.userId });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

textModels.forEach(({ route, model }) =>
  app.post(`/api/chat/${route}`, groqHandler(model))
);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "0.0.0.0", () =>
  console.log(`....Server listening on http://0.0.0.0:${PORT}`)
);

function shutdown(signal) {
  console.log(`${signal} received: shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('Uncaught Exception');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('Unhandled Rejection');
});